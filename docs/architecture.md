# Architecture — Orqen

Orqen is a visual AI workflow builder and execution engine built on top of Next.js App Router and Nhost (PostgreSQL, GraphQL, and serverless functions).

## Frontend Architecture

- **Framework:** Next.js (App Router)
- **UI:** Tailwind CSS, shadcn/ui, Lucide React
- **Canvas Engine:** React Flow (`@xyflow/react`)
- **Data Fetching:** Apollo Client for GraphQL, integrating with Nhost.

## Backend Architecture

- **Database:** PostgreSQL (via Hasura)
- **API:** Hasura GraphQL engine
- **Authentication:** Nhost Auth (JWT based)
- **Functions:** Node.js serverless functions (Nhost Functions)

### Execution Engine

The core execution engine is shared between manual triggers, webhooks, and approval resumptions. It resides in `functions/_shared/executor.ts` and iterates sequentially based on the workflow's graph defined by React Flow.

- **Trigger:** Initiates a `workflow_run` and passes control to the executor.
- **LLM:** Uses the Gemini API for generative AI step execution.
- **HTTP:** Uses native `fetch` to integrate with external systems.
- **Conditional:** Evaluates expressions based on upstream step outputs and directs control flow.
- **Approval:** Marks the run as `paused` and persists state. When approved, resumes downstream execution via the shared executor.
- **DB Write / Notify:** Dedicated step types for internal application integration and notifications.

### Security Layers

- **Hasura Row-Level Permissions / Authorization Filters:** Restrict data access strictly by organization ID and user membership roles.
- **Role Permissions:** Viewer (read-only), Editor (create, edit, run, approve), Owner (all permissions + manage members).
- **Function Authentication:** Nhost functions explicitly require the `authorization` header to resolve membership and authorize actions before utilizing the backend administrative privileges (`x-hasura-admin-secret`).
