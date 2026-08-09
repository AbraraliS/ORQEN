import { Request, Response } from 'express';
import { hasuraFetch, executeStep } from './_shared/executor';

export default async function handler(req: Request, res: Response) {
  try {
    const { run_id, step_run_id, approved } = req.body.input || req.body;
    
    // Auth validation
    const userId = req.headers['x-hasura-user-id'];
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    // 1. Fetch workflow run to check organization and validate user
    const runData = await hasuraFetch(`
      query GetRun($id: uuid!) {
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
              source_step_id
              target_step_id
              condition_value
            }
            organization {
              members(where: {user_id: {_eq: "${userId}"}}) {
                role
              }
            }
          }
        }
      }
    `, { id: run_id });

    const run = runData.workflow_runs_by_pk;
    if (!run) return res.status(404).json({ message: "Run not found" });
    if (run.status !== 'paused') return res.status(400).json({ message: "Run is not paused" });
    
    const member = run.workflow.organization.members[0];
    // Must be editor or owner to approve
    if (!member || (member.role !== 'owner' && member.role !== 'editor')) {
      return res.status(403).json({ message: "Forbidden: insufficient permissions to approve" });
    }

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
      mutation UpdateStepRun($id: uuid!, $status: String!, $output: jsonb) {
        update_step_runs_by_pk(pk_columns: {id: $id}, _set: {
          status: $status,
          output: $output,
          finished_at: "now()"
        }) { id }
      }
    `, {
      id: step_run_id,
      status: approved ? "success" : "failed",
      output: { approved, message: approved ? "Approved manually" : "Rejected manually" }
    });

    if (!approved) {
      // If rejected, fail the run and stop
      await hasuraFetch(`
        mutation UpdateRunFailed($id: uuid!) {
          update_workflow_runs_by_pk(pk_columns: {id: $id}, _set: {
            status: "failed",
            finished_at: "now()"
          }) { id }
        }
      `, { id: run_id });
      return res.status(200).json({ run_id, status: "failed" });
    }

    // 4. If approved, mark the run as running again and resume execution
    await hasuraFetch(`
      mutation UpdateRunRunning($id: uuid!) {
        update_workflow_runs_by_pk(pk_columns: {id: $id}, _set: {
          status: "running"
        }) { id }
      }
    `, { id: run_id });

    // Resume execution logic
    // We need to fetch all previous step_runs to populate stepRunsMap for template resolving
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

    const stepRunsMap = {};
    allStepRunsData.step_runs.forEach(sr => {
      stepRunsMap[sr.step_id] = { id: sr.id, output: sr.output };
    });

    const stepsMap = {};
    const edgesFrom = {};
    run.workflow.steps.forEach(s => {
      s.organization_id = run.workflow.organization_id;
      stepsMap[s.id] = s;
      edgesFrom[s.id] = [];
    });
    run.workflow.edges.forEach(e => {
      edgesFrom[e.source_step_id].push(e);
    });

    const queue = [];
    // The next steps are the ones following the approval gate
    const outgoingEdges = edgesFrom[stepRun.step_id] || [];
    outgoingEdges.forEach(e => {
       queue.push(e.target_step_id);
    });

    let isPaused = false;
    let anyError = false;

    // Execution loop for remaining steps
    while(queue.length > 0) {
      const currentStepId = queue.shift();
      const step = stepsMap[currentStepId];
      
      const { status, isPaused: stepPaused, result } = await executeStep(step, run_id, stepRunsMap);
      
      if (status === 'error') {
        anyError = true;
        break; // Stop execution on error
      }
      
      if (stepPaused) {
        isPaused = true;
        break; // Stop execution, it's paused again
      }
      
      const currentOutgoingEdges = edgesFrom[currentStepId] || [];
      currentOutgoingEdges.forEach(e => {
        let shouldTraverse = true;
        if (step.kind === 'conditional_branch' && e.condition_value) {
           const strResult = String(result);
           shouldTraverse = (e.condition_value === strResult);
        }
        if (shouldTraverse) {
          queue.push(e.target_step_id);
        }
      });
    }

    // Update run status
    let finalStatus = 'completed';
    if (anyError) finalStatus = 'failed';
    else if (isPaused) finalStatus = 'paused';

    await hasuraFetch(`
      mutation UpdateRunFinal($id: uuid!, $status: String!) {
        update_workflow_runs_by_pk(pk_columns: {id: $id}, _set: {
          status: $status,
          ${finalStatus !== 'paused' ? 'finished_at: "now()"' : ''}
        }) { id }
      }
    `, { id: run_id, status: finalStatus });

    return res.status(200).json({ run_id, status: finalStatus });
    
  } catch (err) {
    console.error("Approve Step Error:", err);
    return res.status(500).json({ message: err.message });
  }
}
