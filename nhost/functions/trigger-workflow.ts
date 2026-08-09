import { Request, Response } from 'express';
import { hasuraFetch, executeStep } from './_shared/executor';

export default async function handler(req: Request, res: Response) {
  try {
    const { workflow_id, input } = req.body.input || req.body;
    
    // Auth validation
    const userId = req.headers['x-hasura-user-id'];
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    // Fetch workflow and its edges/steps to build a DAG
    const workflowData = await hasuraFetch(`
      query GetWorkflow($id: uuid!) {
        workflows_by_pk(id: $id) {
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
    `, { id: workflow_id });

    const workflow = workflowData.workflows_by_pk;
    if (!workflow) return res.status(404).json({ message: "Workflow not found" });
    
    const member = workflow.organization.members[0];
    if (!member) return res.status(403).json({ message: "Forbidden" });

    // Insert workflow_run record
    const runRes = await hasuraFetch(`
      mutation InsertRun($object: workflow_runs_insert_input!) {
        insert_workflow_runs_one(object: $object) { id }
      }
    `, {
      object: {
        workflow_id: workflow.id,
        status: 'running',
        input: input || {}
      }
    });
    
    const runId = runRes.insert_workflow_runs_one.id;
    
    // Build DAG execution context
    const stepsMap = {};
    const edgesFrom = {};
    const inDegree = {};
    
    workflow.steps.forEach(s => {
      s.organization_id = workflow.organization_id;
      stepsMap[s.id] = s;
      edgesFrom[s.id] = [];
      inDegree[s.id] = 0;
    });
    
    workflow.edges.forEach(e => {
      if (!edgesFrom[e.source_step_id]) edgesFrom[e.source_step_id] = [];
      edgesFrom[e.source_step_id].push(e);
      inDegree[e.target_step_id] = (inDegree[e.target_step_id] || 0) + 1;
    });
    
    const queue = [];
    Object.keys(inDegree).forEach(id => {
      if (inDegree[id] === 0) queue.push(id);
    });

    const stepRunsMap = {}; // store outputs for references

    let isPaused = false;
    let anyError = false;
    
    // Execution loop
    while(queue.length > 0) {
      const currentStepId = queue.shift();
      const step = stepsMap[currentStepId];
      
      const { status, isPaused: stepPaused, result } = await executeStep(step, runId, stepRunsMap);
      
      if (status === 'error') {
        anyError = true;
        break; // Stop execution on error
      }
      
      if (stepPaused) {
        isPaused = true;
        break; // Stop execution, it's paused for approval
      }
      
      // Determine next steps based on edges
      const outgoingEdges = edgesFrom[currentStepId] || [];
      outgoingEdges.forEach(e => {
        // If conditional logic applies
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
      mutation UpdateRun($id: uuid!, $status: String!) {
        update_workflow_runs_by_pk(pk_columns: {id: $id}, _set: {
          status: $status,
          ${finalStatus !== 'paused' ? 'finished_at: "now()"' : ''}
        }) { id }
      }
    `, { id: runId, status: finalStatus });

    return res.status(200).json({ run_id: runId, status: finalStatus });
    
  } catch (err) {
    console.error("Trigger Workflow Error:", err);
    return res.status(500).json({ message: err.message });
  }
}
