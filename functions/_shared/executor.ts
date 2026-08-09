// _shared/executor.ts
// Real Execution Engine for Orqen workflows.

const HASURA_URL = (process.env.NHOST_GRAPHQL_URL || "http://graphql:8080/v1/graphql").replace(
  'https://local.graphql.local.nhost.run/v1',
  'http://graphql:8080/v1'
);
const ADMIN_SECRET = process.env.NHOST_ADMIN_SECRET || process.env.HASURA_GRAPHQL_ADMIN_SECRET;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

export async function hasuraFetch(query, variables) {
  const response = await fetch(HASURA_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-hasura-admin-secret": ADMIN_SECRET
    },
    body: JSON.stringify({ query, variables })
  });

  const data = await response.json();
  if (data.errors) {
    throw new Error("Hasura Error: " + JSON.stringify(data.errors));
  }
  return data.data;
}

export async function executeStep(step, runId, stepRunsMap) {
  const startTime = Date.now();
  let status = "success";
  let output = {};
  let errorStr = null;
  let attempt = 1;
  let isPaused = false;
  let stepRunId = null;

  try {
    // 1. Insert step_run record
    const insertRes = await hasuraFetch(`
      mutation InsertStepRun($object: step_runs_insert_input!) {
        insert_step_runs_one(object: $object) {
          id
        }
      }
    `, {
      object: {
        workflow_run_id: runId,
        step_id: String(step.id),
        step_name: step.name || step.kind,
        step_kind: step.kind,
        status: "running",
        started_at: new Date().toISOString()
      }
    });
    stepRunId = insertRes.insert_step_runs_one.id;
    stepRunsMap[step.id] = { id: stepRunId, output: null };

    // Parse config
    const config = typeof step.config === "string" ? JSON.parse(step.config) : step.config;

    // Evaluate input variables mapping
    // E.g., {{step1.output.text}} -> mapped to actual value
    function resolveTemplate(str) {
      if (typeof str !== 'string') return str;
      return str.replace(/{{([^}]+)}}/g, (_, path) => {
        const parts = path.trim().split('.');
        if (parts[0] === 'workflow' && parts[1] === 'input') {
          return "WorkflowInputPlaceholder"; // Simplified mapping for now
        }
        const sourceStepId = parts[0];
        const prevStep = stepRunsMap[sourceStepId];
        if (!prevStep || !prevStep.output) return "";
        let val = prevStep.output;
        for (let i = 1; i < parts.length; i++) {
          val = val[parts[i]];
          if (val === undefined) return "";
        }
        return val;
      });
    }

    // Execute step logic based on kind
    if (step.kind === 'llm_call') {
      const prompt = resolveTemplate(config.prompt || "");
      if (!GEMINI_API_KEY) throw new Error("GEMINI_API_KEY is not configured.");
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || "LLM failed");
      output = { text: data.candidates?.[0]?.content?.parts?.[0]?.text || "" };

    } else if (step.kind === 'http_request') {
      const url = resolveTemplate(config.url);
      const method = config.method || 'GET';
      const body = config.body ? resolveTemplate(config.body) : undefined;
      const headersStr = config.headers ? resolveTemplate(config.headers) : "{}";
      const headers = JSON.parse(headersStr);

      let success = false;
      let lastErr = null;
      // Retry mechanism (at least 1 retry as required)
      for (attempt = 1; attempt <= 2; attempt++) {
        try {
          const res = await fetch(url, { method, headers, body });
          const text = await res.text();
          let json;
          try { json = JSON.parse(text); } catch(e) { json = text; }
          output = { status: res.status, body: json };
          if (!res.ok) throw new Error(`HTTP ${res.status}: ${text}`);
          success = true;
          break;
        } catch (e) {
          lastErr = e;
        }
      }
      if (!success) throw lastErr;

    } else if (step.kind === 'conditional_branch') {
      const condition = config.condition || 'equals';
      const valueA = resolveTemplate(config.valueA || "");
      const valueB = resolveTemplate(config.valueB || "");

      let result = false;
      if (condition === 'equals') result = valueA === valueB;
      if (condition === 'not_equals') result = valueA !== valueB;
      if (condition === 'contains') result = String(valueA).includes(String(valueB));
      if (condition === 'exists') result = valueA !== "" && valueA !== null && valueA !== undefined;

      output = { result };

    } else if (step.kind === 'approval_gate') {
      isPaused = true;
      status = "paused";
      output = { message: "Waiting for manual approval" };

    } else if (step.kind === 'db_write') {
      const key = resolveTemplate(config.key || "default_key");
      const valStr = resolveTemplate(config.value || "{}");
      const val = typeof valStr === 'string' ? JSON.parse(valStr) : valStr;

      await hasuraFetch(`
        mutation WriteRecord($object: workflow_records_insert_input!) {
          insert_workflow_records_one(object: $object) { id }
        }
      `, {
        object: {
          workflow_run_id: runId,
          organization_id: step.organization_id, // we'll need to pass this or lookup
          key: key,
          value: val
        }
      });
      output = { success: true };

    } else if (step.kind === 'notify') {
      // Simulate webhook or event trigger notification insert
      output = { message: "Notification sent (simulated for now, would trigger Hasura Event Trigger)" };
    } else {
      throw new Error(`Unknown step kind: ${step.kind}`);
    }

  } catch (e) {
    status = "error";
    errorStr = e.message || String(e);
  }

  // Update step_run record
  const durationMs = Date.now() - startTime;
  stepRunsMap[step.id].output = output; // For downstream references
  stepRunsMap[step.id].result = output.result;

  if (stepRunId) {
    await hasuraFetch(`
      mutation UpdateStepRun($id: uuid!, $status: String!, $output: jsonb, $error: String, $duration: Int, $attempt: Int, $finishedAt: timestamptz) {
        update_step_runs_by_pk(pk_columns: {id: $id}, _set: {
          status: $status,
          output: $output,
          error: $error,
          duration_ms: $duration,
          attempt_count: $attempt,
          finished_at: $finishedAt
        }) { id }
      }
    `, {
      id: stepRunId,
      status: status,
      output: output,
      error: errorStr,
      duration: durationMs,
      attempt: attempt,
      finishedAt: status !== 'paused' ? new Date().toISOString() : null
    });
  }

  return { status, isPaused, result: output.result };
}
