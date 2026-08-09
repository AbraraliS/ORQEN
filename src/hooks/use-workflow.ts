import { useQuery, useMutation } from "@apollo/client";
import {
  WORKFLOW_LIST_QUERY,
  WORKFLOW_DETAIL_QUERY,
  CREATE_WORKFLOW_MUTATION,
  DELETE_WORKFLOW_MUTATION,
  DUPLICATE_WORKFLOW_MUTATION,
  SAVE_WORKFLOW_MUTATION,
} from "@/lib/graphql/documents";
import type { Workflow, WorkflowStep } from "@/types/workflow";
import { v4 as uuidv4 } from "uuid";

export function useWorkflows(organizationId: string) {
  const { data, loading, error, refetch } = useQuery(WORKFLOW_LIST_QUERY, {
    variables: { organizationId },
    skip: !organizationId,
    fetchPolicy: "cache-and-network",
  });

  const [create] = useMutation(CREATE_WORKFLOW_MUTATION);
  const [duplicate] = useMutation(DUPLICATE_WORKFLOW_MUTATION);
  const [del] = useMutation(DELETE_WORKFLOW_MUTATION);

  const workflows = (data?.workflows || []) as Workflow[];

  const createWorkflow = async (name: string) => {
    await create({
      variables: {
        object: {
          organization_id: organizationId,
          name,
          description: "",
          trigger_type: "manual",
          status: "active",
        },
      },
      onCompleted: () => refetch(),
    });
  };

  const duplicateWorkflow = async (id: string) => {
    await duplicate({
      variables: { id, name: "Copy of Workflow" },
      onCompleted: () => refetch(),
    });
  };

  const deleteWorkflow = async (id: string) => {
    await del({
      variables: { id },
      onCompleted: () => refetch(),
    });
  };

  return {
    workflows,
    loading,
    error,
    createWorkflow,
    duplicateWorkflow,
    deleteWorkflow,
  };
}

export function useWorkflow(id: string) {
  const { data, loading, error, refetch } = useQuery(WORKFLOW_DETAIL_QUERY, {
    variables: { id },
    skip: !id,
  });

  const [saveMutation] = useMutation(SAVE_WORKFLOW_MUTATION);

  const workflow = data?.workflow as Workflow | null;

  const save = async (patch: Partial<Workflow>) => {
    if (!workflow) return;
    const name = patch.name ?? workflow.name;
    const triggerType = patch.triggerType ?? workflow.triggerType ?? "manual";
    const steps = (patch.steps ?? workflow.steps).map((s: WorkflowStep, idx: number) => ({
      id: s.id ?? uuidv4(),
      workflow_id: id,
      kind: s.kind,
      name: s.name,
      order: idx,
      position_x: s.positionX ?? 0,
      position_y: s.positionY ?? 0,
      config: s.config ?? {},
    }));
    const edges = (patch.edges ?? workflow.edges).map((e: Record<string, unknown>) => ({
      id: e.id ?? uuidv4(),
      workflow_id: id,
      source: e.source,
      target: e.target,
      source_handle: e.source_handle ?? e.sourceHandle,
      target_handle: e.target_handle ?? e.targetHandle,
    }));

    await saveMutation({
      variables: {
        id,
        name,
        triggerType,
        steps,
        edges,
      },
      onCompleted: () => refetch(),
    });
  };

  return {
    workflow,
    loading,
    error,
    save,
  };
}

export function stepCount(workflow: Workflow): number {
  if (!workflow || !workflow.steps) return 0;
  return workflow.steps.filter(
    (s) => !["manual", "webhook", "scheduled", "database_event"].includes(s.kind),
  ).length;
}
