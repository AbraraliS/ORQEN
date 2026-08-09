import { Request, Response } from "express";
import { hasuraFetch, executeStep } from "./_shared/executor";

export default async function handler(req: Request, res: Response) {
  try {
    const body = req.body.input || req.body;
    const { workflow_id, input } = body;

    // Auth validation - Hasura forwards user info as headers when called as an Action
    const userId = req.headers["x-hasura-user-id"] as string;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    // Fetch workflow and its edges/steps to build a DAG
    const workflowData = await hasuraFetch(
      `
      query GetWorkflow($id: uuid!, $userId: uuid!) {
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
    `,
      { id: workflow_id, userId },
    );

    const workflow = workflowData.workflows_by_pk;
    if (!workflow) return res.status(404).json({ message: "Workflow not found" });

    const member = workflow.organization?.members?.[0];
    if (!member)
      return res.status(403).json({ message: "Forbidden: not a member of this organization" });

    // Insert workflow_run record
    const runRes = await hasuraFetch(
      `
      mutation InsertRun($object: workflow_runs_insert_input!) {
        insert_workflow_runs_one(object: $object) { id }
      }
    `,
      {
        object: {
          workflow_id: workflow.id,
          organization_id: workflow.organization_id,
          trigger_type: "manual",
          started_by: userId,
          status: "running",
          input: input || {},
        },
      },
    );

    const runId = runRes.insert_workflow_runs_one.id;

    // Build DAG execution context using topological sort
    const stepsMap: Record<string, any> = {};
    const edgesFrom: Record<string, any[]> = {};
    const inDegreeMap: Record<string, number> = {};

    workflow.steps.forEach((s: any) => {
      s.organization_id = workflow.organization_id;
      stepsMap[s.id] = s;
      edgesFrom[s.id] = [];
      inDegreeMap[s.id] = 0;
    });

    workflow.edges.forEach((e: any) => {
      const src = e.source;
      const tgt = e.target;
      if (!edgesFrom[src]) edgesFrom[src] = [];
      edgesFrom[src].push(e);
      inDegreeMap[tgt] = (inDegreeMap[tgt] || 0) + 1;
    });

    // Start with all nodes that have no incoming edges
    const queue: string[] = Object.keys(inDegreeMap).filter((id) => inDegreeMap[id] === 0);

    const stepRunsMap: Record<string, any> = {};

    let isPaused = false;
    let anyError = false;

    // Execution loop
    while (queue.length > 0) {
      const currentStepId = queue.shift()!;
      const step = stepsMap[currentStepId];
      if (!step) continue;

      const { status, isPaused: stepPaused, result } = await executeStep(step, runId, stepRunsMap);

      if (status === "error") {
        anyError = true;
        break;
      }

      if (stepPaused) {
        isPaused = true;
        break;
      }

      // Determine next steps based on edges
      const outgoingEdges = edgesFrom[currentStepId] || [];
      outgoingEdges.forEach((e: any) => {
        let shouldTraverse = true;
        // For conditional branches, source_handle holds 'true'/'false' branch label
        if (step.kind === "conditional_branch" && e.source_handle) {
          const strResult = String(result);
          shouldTraverse = e.source_handle === strResult;
        }

        if (shouldTraverse) {
          queue.push(e.target);
        }
      });
    }

    // Update run status
    let finalStatus = "completed";
    if (anyError) finalStatus = "failed";
    else if (isPaused) finalStatus = "paused";

    await hasuraFetch(
      `
      mutation UpdateRun($id: uuid!, $status: String!, $finishedAt: timestamptz) {
        update_workflow_runs_by_pk(pk_columns: {id: $id}, _set: {
          status: $status,
          finished_at: $finishedAt
        }) { id }
      }
    `,
      {
        id: runId,
        status: finalStatus,
        finishedAt: finalStatus !== "paused" ? new Date().toISOString() : null,
      },
    );

    return res.status(200).json({ run_id: runId, status: finalStatus });
  } catch (err: any) {
    console.error("Trigger Workflow Error:", err);
    return res.status(500).json({ message: err.message });
  }
}
