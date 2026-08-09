import fs from 'fs';

const HASURA_URL = 'http://localhost:8080/v1/metadata'; // Note: connecting from host, not inside docker
const ADMIN_SECRET = 'nhost-admin-secret';

const tables = [
  'organizations',
  'organization_usage',
  'organization_members',
  'workflows',
  'workflow_steps',
  'workflow_edges',
  'workflow_runs',
  'step_runs',
  'workflow_records'
];

async function applyMetadata() {
  const bulkArgs = [];

  // Track all tables
  for (const table of tables) {
    bulkArgs.push({
      type: 'pg_track_table',
      args: {
        source: 'default',
        schema: 'public',
        name: table
      }
    });
  }

  // Create Object Relationships
  const objRelations = [
    { table: 'organization_usage', name: 'organization', col: 'organization_id', refTable: 'organizations' },
    { table: 'organization_members', name: 'organization', col: 'organization_id', refTable: 'organizations' },
    { table: 'workflows', name: 'organization', col: 'organization_id', refTable: 'organizations' },
    { table: 'workflow_steps', name: 'workflow', col: 'workflow_id', refTable: 'workflows' },
    { table: 'workflow_edges', name: 'workflow', col: 'workflow_id', refTable: 'workflows' },
    { table: 'workflow_runs', name: 'organization', col: 'organization_id', refTable: 'organizations' },
    { table: 'workflow_runs', name: 'workflow', col: 'workflow_id', refTable: 'workflows' },
    { table: 'step_runs', name: 'workflow_run', col: 'workflow_run_id', refTable: 'workflow_runs' },
    { table: 'workflow_records', name: 'organization', col: 'organization_id', refTable: 'organizations' },
    { table: 'workflow_records', name: 'workflow_run', col: 'workflow_run_id', refTable: 'workflow_runs' }
  ];

  for (const rel of objRelations) {
    bulkArgs.push({
      type: 'pg_create_object_relationship',
      args: {
        table: { schema: 'public', name: rel.table },
        name: rel.name,
        source: 'default',
        using: { foreign_key_constraint_on: rel.col }
      }
    });
  }

  // Manual Object Relationship for auth.users
  bulkArgs.push({
    type: 'pg_create_object_relationship',
    args: {
      table: { schema: 'public', name: 'organization_members' },
      name: 'user',
      source: 'default',
      using: {
        manual_configuration: {
          remote_table: { schema: 'auth', name: 'users' },
          column_mapping: { user_id: 'id' }
        }
      }
    }
  });

  // Array Relationships
  const arrRelations = [
    { table: 'organizations', name: 'usage', col: 'organization_id', refTable: 'organization_usage' },
    { table: 'organizations', name: 'members', col: 'organization_id', refTable: 'organization_members' },
    { table: 'organizations', name: 'workflows', col: 'organization_id', refTable: 'workflows' },
    { table: 'workflows', name: 'steps', col: 'workflow_id', refTable: 'workflow_steps' },
    { table: 'workflows', name: 'edges', col: 'workflow_id', refTable: 'workflow_edges' },
    { table: 'workflows', name: 'runs', col: 'workflow_id', refTable: 'workflow_runs' },
    { table: 'workflow_runs', name: 'step_runs', col: 'workflow_run_id', refTable: 'step_runs' }
  ];

  for (const rel of arrRelations) {
    bulkArgs.push({
      type: rel.name === 'usage' ? 'pg_create_object_relationship' : 'pg_create_array_relationship',
      args: {
        table: { schema: 'public', name: rel.table },
        name: rel.name,
        source: 'default',
        using: {
          foreign_key_constraint_on: {
            table: { schema: 'public', name: rel.refTable },
            column: rel.col
          }
        }
      }
    });
  }

  // Permissions (Role: user)
  const orgFilter = { "members": { "user_id": { "_eq": "X-Hasura-User-Id" } } };
  const directOrgIdFilter = { "organization": { "members": { "user_id": { "_eq": "X-Hasura-User-Id" } } } };
  const workflowOrgIdFilter = { "workflow": { "organization": { "members": { "user_id": { "_eq": "X-Hasura-User-Id" } } } } };
  const workflowRunOrgIdFilter = { "workflow_run": { "organization": { "members": { "user_id": { "_eq": "X-Hasura-User-Id" } } } } };

  const permissionConfig = [
    { table: 'organizations', filter: orgFilter },
    { table: 'organization_usage', filter: directOrgIdFilter },
    { table: 'organization_members', filter: directOrgIdFilter },
    { table: 'workflows', filter: directOrgIdFilter },
    { table: 'workflow_steps', filter: workflowOrgIdFilter },
    { table: 'workflow_edges', filter: workflowOrgIdFilter },
    { table: 'workflow_runs', filter: directOrgIdFilter },
    { table: 'step_runs', filter: workflowRunOrgIdFilter },
    { table: 'workflow_records', filter: directOrgIdFilter },
  ];

  for (const config of permissionConfig) {
    const permArgs = {
      table: { schema: 'public', name: config.table },
      role: 'user',
      permission: {
        columns: '*',
        filter: config.filter,
        allow_aggregations: true
      }
    };

    bulkArgs.push({ type: 'pg_create_select_permission', args: permArgs });
    
    // Also add insert/update/delete permissions for workflows and steps (minimal setup)
    if (['workflows', 'workflow_steps', 'workflow_edges'].includes(config.table)) {
      bulkArgs.push({
        type: 'pg_create_insert_permission',
        args: {
          table: { schema: 'public', name: config.table },
          role: 'user',
          permission: {
            check: config.filter,
            set: {},
            columns: '*'
          }
        }
      });
      bulkArgs.push({
        type: 'pg_create_update_permission',
        args: {
          table: { schema: 'public', name: config.table },
          role: 'user',
          permission: {
            filter: config.filter,
            check: config.filter,
            set: {},
            columns: '*'
          }
        }
      });
      bulkArgs.push({
        type: 'pg_create_delete_permission',
        args: {
          table: { schema: 'public', name: config.table },
          role: 'user',
          permission: {
            filter: config.filter
          }
        }
      });
    }
  }

  // Define Custom Actions
  bulkArgs.push({
    type: "set_custom_types",
    args: {
      objects: [
        { name: "triggerWorkflowRunOutput", fields: [{ name: "run_id", type: "uuid!" }] },
        { name: "approveStepOutput", fields: [{ name: "message", type: "String!" }] },
        { name: "duplicateWorkflowOutput", fields: [{ name: "id", type: "uuid!" }] }
      ]
    }
  });

  bulkArgs.push({
    type: "create_action",
    args: {
      name: "triggerWorkflowRun",
      definition: {
        kind: "synchronous",
        handler: "{{NHOST_FUNCTIONS_URL}}/trigger-workflow",
        forward_client_headers: true,
        arguments: [
          { name: "workflow_id", type: "uuid!" },
          { name: "input", type: "jsonb!" }
        ],
        output_type: "triggerWorkflowRunOutput"
      }
    }
  });
  
  bulkArgs.push({
    type: "create_action_permission",
    args: {
      action: "triggerWorkflowRun",
      role: "user"
    }
  });

  bulkArgs.push({
    type: "create_action",
    args: {
      name: "approveStep",
      definition: {
        kind: "synchronous",
        handler: "{{NHOST_FUNCTIONS_URL}}/approve-step",
        forward_client_headers: true,
        arguments: [
          { name: "step_run_id", type: "uuid!" },
          { name: "decision", type: "String!" }
        ],
        output_type: "approveStepOutput"
      }
    }
  });

  bulkArgs.push({
    type: "create_action_permission",
    args: {
      action: "approveStep",
      role: "user"
    }
  });

  bulkArgs.push({
    type: "create_action",
    args: {
      name: "duplicate_workflow",
      definition: {
        kind: "synchronous",
        handler: "{{NHOST_FUNCTIONS_URL}}/duplicate-workflow",
        forward_client_headers: true,
        arguments: [
          { name: "workflow_id", type: "uuid!" },
          { name: "new_name", type: "String!" }
        ],
        output_type: "duplicateWorkflowOutput"
      }
    }
  });

  bulkArgs.push({
    type: "create_action_permission",
    args: {
      action: "duplicate_workflow",
      role: "user"
    }
  });

  const response = await fetch(HASURA_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-hasura-admin-secret': ADMIN_SECRET
    },
    body: JSON.stringify({
      type: 'bulk',
      args: bulkArgs
    })
  });

  const data = await response.json();
  if (response.ok) {
    console.log('Metadata successfully applied!');
  } else {
    console.error('Failed to apply metadata:', JSON.stringify(data, null, 2));
  }
}

applyMetadata().catch(console.error);
