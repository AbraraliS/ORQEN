import { useQuery, useMutation } from "@apollo/client";
import {
  RUN_LIST_QUERY,
  RUN_DETAIL_QUERY,
  START_RUN_MUTATION,
  DECIDE_APPROVAL_MUTATION,
} from "@/lib/graphql/documents";

export function useRuns(organizationId: string) {
  const { data, loading, error } = useQuery(RUN_LIST_QUERY, {
    variables: { organizationId },
    skip: !organizationId,
    fetchPolicy: "cache-and-network",
  });

  return {
    runs: data?.workflow_runs || [],
    loading,
    error,
  };
}

export function useWorkflowRun(runId: string) {
  const { data, loading, error, refetch } = useQuery(RUN_DETAIL_QUERY, {
    variables: { id: runId },
    skip: !runId,
  });

  const [decideApprovalMutation] = useMutation(DECIDE_APPROVAL_MUTATION);

  return {
    run: data?.workflow_run || null,
    loading,
    error,
    decideApproval: async (
      stepRunId: string,
      decision: "approved" | "rejected",
      decidedBy: string,
    ) => {
      await decideApprovalMutation({
        variables: { stepRunId, decision },
        onCompleted: () => refetch(),
      });
    },
  };
}

export function useStartRun() {
  const [start, { loading }] = useMutation(START_RUN_MUTATION);

  return {
    startRun: async (workflowId: string, input: Record<string, unknown>, startedBy: string) => {
      const res = await start({
        variables: { workflowId, input },
      });
      const triggerRes = res.data?.triggerWorkflowRun;
      if (triggerRes?.run_id) {
        return { id: triggerRes.run_id, shortId: triggerRes.run_id.substring(0, 8) };
      }
      return null;
    },
    starting: loading,
  };
}
