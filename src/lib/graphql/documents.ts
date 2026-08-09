import { gql } from "@apollo/client";

/**
 * Hasura-facing GraphQL documents.
 *
 * These are the only place where the app's data contract is defined.
 */

export const WORKFLOW_LIST_QUERY = gql`
  query WorkflowList($organizationId: uuid!) {
    workflows(
      where: { organization_id: { _eq: $organizationId } }
      order_by: { updated_at: desc }
    ) {
      id
      organization_id
      name
      description
      status
      trigger_type
      created_at
      updated_at
      last_run_at
      last_run_status
      steps_aggregate {
        aggregate {
          count
        }
      }
    }
  }
`;

export const WORKFLOW_DETAIL_QUERY = gql`
  query WorkflowDetail($id: uuid!) {
    workflow: workflows_by_pk(id: $id) {
      id
      organization_id
      name
      description
      status
      trigger_type
      created_at
      updated_at
      last_run_at
      last_run_status
      steps(order_by: { order: asc }) {
        id
        workflow_id
        kind
        name
        order
        position_x
        position_y
        config
      }
      edges {
        id
        workflow_id
        source
        target
        source_handle
        target_handle
      }
    }
  }
`;

export const SAVE_WORKFLOW_MUTATION = gql`
  mutation SaveWorkflow(
    $id: uuid!
    $name: String!
    $triggerType: String!
    $steps: [workflow_steps_insert_input!]!
    $edges: [workflow_edges_insert_input!]!
  ) {
    update_workflows_by_pk(
      pk_columns: { id: $id }
      _set: { name: $name, trigger_type: $triggerType }
    ) {
      id
      updated_at
    }
    delete_workflow_steps(where: { workflow_id: { _eq: $id } }) {
      affected_rows
    }
    delete_workflow_edges(where: { workflow_id: { _eq: $id } }) {
      affected_rows
    }
    insert_workflow_steps(objects: $steps) {
      affected_rows
    }
    insert_workflow_edges(objects: $edges) {
      affected_rows
    }
  }
`;

export const CREATE_WORKFLOW_MUTATION = gql`
  mutation CreateWorkflow($object: workflows_insert_input!) {
    insert_workflows_one(object: $object) {
      id
    }
  }
`;

export const DELETE_WORKFLOW_MUTATION = gql`
  mutation DeleteWorkflow($id: uuid!) {
    delete_workflows_by_pk(id: $id) {
      id
    }
  }
`;

export const DUPLICATE_WORKFLOW_MUTATION = gql`
  mutation DuplicateWorkflow($id: uuid!, $name: String!) {
    duplicate_workflow(args: { workflow_id: $id, new_name: $name }) {
      id
    }
  }
`;

export const START_RUN_MUTATION = gql`
  mutation StartWorkflowRun($workflowId: uuid!, $input: jsonb!) {
    triggerWorkflowRun(workflow_id: $workflowId, input: $input) {
      run_id
    }
  }
`;

export const RUN_LIST_QUERY = gql`
  query RunList($organizationId: uuid!, $limit: Int = 50) {
    workflow_runs(
      where: { organization_id: { _eq: $organizationId } }
      order_by: { started_at: desc }
      limit: $limit
    ) {
      id
      status
      trigger_type
      started_at
      finished_at
      duration_ms
      started_by
      workflow {
        id
        name
      }
    }
  }
`;

export const RUN_DETAIL_QUERY = gql`
  query RunDetail($id: uuid!) {
    workflow_run: workflow_runs_by_pk(id: $id) {
      id
      status
      trigger_type
      started_at
      finished_at
      duration_ms
      started_by
      input
      workflow {
        id
        name
        trigger_type
      }
      step_runs(order_by: { created_at: asc }) {
        id
        step_id
        step_name
        step_kind
        status
        input
        output
        error
        attempt_count
        duration_ms
        started_at
        finished_at
        approval_required_role
        approval_reason
        approval_decision
        approval_decided_by
      }
    }
  }
`;

/** Live run + step updates. Hasura streams these over websockets. */
export const WORKFLOW_RUN_SUBSCRIPTION = gql`
  subscription WorkflowRun($runId: uuid!) {
    workflow_runs_by_pk(id: $runId) {
      id
      status
      started_at
      finished_at
      duration_ms
      step_runs(order_by: { created_at: asc }) {
        id
        step_id
        step_name
        step_kind
        status
        input
        output
        error
        attempt_count
        duration_ms
        started_at
        finished_at
        approval_required_role
        approval_reason
        approval_decision
        approval_decided_by
      }
    }
  }
`;

export const DECIDE_APPROVAL_MUTATION = gql`
  mutation DecideApproval($stepRunId: uuid!, $decision: String!) {
    approveStep(step_run_id: $stepRunId, decision: $decision) {
      message
    }
  }
`;

export const ORGANIZATIONS_QUERY = gql`
  query Organizations {
    organizations(order_by: { name: asc }) {
      id
      name
      slug
      plan
      usage {
        runs_used
        runs_quota
        period_end
      }
      members {
        user_id
        role
      }
    }
  }
`;

export const MEMBERS_QUERY = gql`
  query Members($organizationId: uuid!) {
    organization_members(where: { organization_id: { _eq: $organizationId } }) {
      id
      role
      joined_at
      user {
        id
        display_name
        email
        last_seen
      }
    }
  }
`;
