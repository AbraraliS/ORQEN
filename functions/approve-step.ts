import { Request, Response } from 'express';
import { hasuraFetch, executeStep } from './_shared/executor';

export default async function handler(req: Request, res: Response) {
  try {
    const body = req.body.input || req.body;
    const { run_id, step_run_id, decision } = body;
    
    // Auth validation
    const userId = (req.headers['x-hasura-user-id'] as string);
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    // 1. Fetch workflow run to check organization and validate user
    const runData = await hasuraFetch(`
      query GetRun($id: uuid!, $userId: uuid!) {
        workflow_runs_by_pk(id: $id) {
          id
          status
          workflow {
            id
            organization_id
            steps {
              id
              name
              kind
              config
            }
            edges {
              id
              source
              target
              source_handle
            }
            organization {
              members(where: {user_id: {_eq: $userId}}) {
                role
              }
            }
          }
        }
      }
    `, { id: run_id, userId });

    const run = runData.workflow_runs_by_pk;
    if (!run) return res.status(404).json({ message: "Run not found" });
    if (run.status !== 'paused') return res.status(400).json({ message: "Run is not paused" });
    
    const member = run.workflow.organization?.members?.[0];
    // Must be editor or owner to approve
    if (!member || (member.role !== 'owner' && member.role !== 'editor')) {
      return res.status(403).json({ message: "Forbidden: insufficient permissions to approve" });
    }

    const approved = decision === 'approved';

    // 2. Fetch the specific step_run
    const stepRunData = await hasuraFetch(`
      query GetStepRun($id: uuid!) {
        step_runs_by_pk(id: $id) {
          id
          step_id
          status
        }
      }
    `, { id: step_run_id });
    
    const stepRun = stepRunData.step_runs_by_pk;
    if (!stepRun) return res.status(404).json({ message: "Step run not found" });
    if (stepRun.status !== 'paused') return res.status(400).json({ message: "Step is not paused" });

    // 3. Mark the approval gate step as completed or failed based on approval
    await hasuraFetch(`
      mutation UpdateStepRun($id: uuid!, $status: String!, $output: jsonb, $decision: String, $decidedBy: uuid, $finishedAt: timestamptz) {
        update_step_runs_by_pk(pk_columns: {id: $id}, _set: {
          status: $status,
          output: $output,
          approval_decision: $decision,
          approval_decided_by: $decidedBy,
          finished_at: $finishedAt
        }) { id }
      }
    `, {
      id: step_run_id,
      status: approved ? "success" : "failed",
      output: { approved, message: approved ? "Approved manually" : "Rejected manually" },
      decision: approved ? "approved" : "rejected",
      decidedBy: userId,
      finishedAt: new Date().toISOString()
    });

    if (!approved) {
      // If rejected, fail the run and stop
      await hasuraFetch(`
        mutation UpdateRunFailed($id: uuid!, $finishedAt: timestamptz) {
          update_workflow_runs_by_pk(pk_columns: {id: $id}, _set: {
            status: "failed",
            finished_at: $finishedAt
          }) { id }
        }
      `, { id: run_id, finishedAt: new Date().toISOString() });
      return res.status(200).json({ message: "Step rejected, workflow failed", status: "failed" });
    }

    // 4. If approved, mark the run as running again and resume execution
    await hasuraFetch(`
      mutation UpdateRunRunning($id: uuid!) {
        update_workflow_runs_by_pk(pk_columns: {id: $id}, _set: {
          status: "running"
        }) { id }
      }
    `, { id: run_id });

    // Resume execution — fetch previous step_runs to populate stepRunsMap
    const allStepRunsData = await hasuraFetch(`
      query GetAllStepRuns($runId: uuid!) {
        step_runs(where: {workflow_run_id: {_eq: $runId}}) {
          id
          step_id
          status
          output
        }
      }
    `, { runId: run_id });

    const stepRunsMap: Record<string, any> = {};
    allStepRunsData.step_runs.forEach((sr: any) => {
      stepRunsMap[sr.step_id] = { id: sr.id, output: sr.output };
    });

    const stepsMap: Record<string, any> = {};
    const edgesFrom: Record<string, any[]> = {};
    
    run.workflow.steps.forEach((s: any) => {
      s.organization_id = run.workflow.organization_id;
      stepsMap[s.id] = s;
      edgesFrom[s.id] = [];
    });
    run.workflow.edges.forEach((e: any) => {
      const src = e.source;
      if (!edgesFrom[src]) edgesFrom[src] = [];
      edgesFrom[src].push(e);
    });

    // Find the next steps after the approval gate
    const queue: string[] = [];
    const outgoingEdgesFromGate = edgesFrom[stepRun.step_id] || [];
    outgoingEdgesFromGate.forEach((e: any) => {
       queue.push(e.target);
    });

    let isPaused = false;
    let anyError = false;

    // Execution loop for remaining steps
    while(queue.length > 0) {
      const currentStepId = queue.shift()!;
      const step = stepsMap[currentStepId];
      if (!step) continue;
      
      const { status, isPaused: stepPaused, result } = await executeStep(step, run_id, stepRunsMap);
      
      if (status === 'error') {
        anyError = true;
        break;
      }
      
      if (stepPaused) {
        isPaused = true;
        break;
      }
      
      const currentOutgoingEdges = edgesFrom[currentStepId] || [];
      currentOutgoingEdges.forEach((e: any) => {
        let shouldTraverse = true;
        if (step.kind === 'conditional_branch' && e.source_handle) {
          shouldTraverse = (e.source_handle === String(result));
        }
        if (shouldTraverse) {
          queue.push(e.target);
        }
      });
    }

    // Update run status
    let finalStatus = 'completed';
    if (anyError) finalStatus = 'failed';
    else if (isPaused) finalStatus = 'paused';

    await hasuraFetch(`
      mutation UpdateRunFinal($id: uuid!, $status: String!, $finishedAt: timestamptz) {
        update_workflow_runs_by_pk(pk_columns: {id: $id}, _set: {
          status: $status,
          finished_at: $finishedAt
        }) { id }
      }
    `, { 
      id: run_id, 
      status: finalStatus,
      finishedAt: finalStatus !== 'paused' ? new Date().toISOString() : null
    });

    return res.status(200).json({ message: "Step approved, workflow " + finalStatus, status: finalStatus });
    
  } catch (err: any) {
    console.error("Approve Step Error:", err);
    return res.status(500).json({ message: err.message });
  }
}
