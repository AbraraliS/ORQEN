# Orqen — AI Workflow Orchestration

Orqen is a powerful, visual, and extensible AI workflow orchestration platform. It provides a node-based interface to design, automate, and execute multi-step workflows featuring AI generation, manual approval gates, conditional branching, HTTP requests, and more. 

Orqen is built as a complete full-stack application backed by Nhost (PostgreSQL, Hasura GraphQL, Serverless Functions, and Authentication) and Next.js.

## Core Features

- **Visual Workflow Builder:** A drag-and-drop React Flow canvas to design node-based DAG (Directed Acyclic Graph) workflows.
- **Robust Execution Engine:** A fully realized state machine built with Nhost serverless functions and Hasura Actions that orchestrates execution, persists state step-by-step, and strictly handles failure routing.
- **Manual Approval Gates:** Allows a workflow to safely pause execution in the cloud. It waits for an Editor or Owner to approve or reject the step from the dashboard before resuming the state machine.
- **AI Integration:** First-class support for executing generative AI tasks using Gemini (LLM node).
- **Conditional Branching:** Native support for True/False edge routing based on step outputs.
- **Role-Based Access Control (RBAC):** Organization-level permissions securely isolating Owner, Editor, and Viewer roles using Hasura Row-Level Security (RLS) policies.
- **Real-Time Monitoring:** Uses Hasura GraphQL Subscriptions via Apollo Client to stream workflow execution progress directly to the UI.

## Tech Stack & Architecture

- **Frontend:** Next.js (App Router), React, Tailwind CSS, shadcn/ui, React Flow.
- **Data Layer:** Apollo Client with GraphQL subscriptions (ws/wss).
- **Backend (Nhost):**
  - **Database:** PostgreSQL for robust ACID-compliant state storage.
  - **API:** Hasura GraphQL engine automatically exposing the database via secure GraphQL operations.
  - **Authentication:** Nhost Auth (JWT) integrated with Next.js and Hasura.
  - **Compute:** Nhost Serverless Functions (Node.js/Express) triggered via Hasura Custom Actions.

## The Execution Engine

Unlike simple client-side simulators, Orqen features a true backend execution engine:
1. **Triggering:** A workflow is initiated via a Hasura Action (`triggerWorkflowRun`) which invokes the `/trigger-workflow` serverless function.
2. **DAG Construction:** The function constructs a topological execution plan from the workflow's nodes and edges.
3. **Step Execution (`executor.ts`):** Each step executes in sequence or conditionally. State is persistently logged to `step_runs` and `workflow_runs` tables.
4. **Resumption:** If an `approval_gate` is reached, the engine suspends the execution and marks the run as `paused`. A subsequent `approveStep` Hasura Action resumes the workflow execution from where it left off by querying previous outputs.

### Supported Node Types
- **Trigger:** Entry point of the workflow (Manual, Webhook, Schedule).
- **LLM:** Prompts Gemini AI with structured outputs.
- **HTTP Request:** Executes outbound REST API calls.
- **Conditional Branch:** Evaluates a condition and routes execution down `true` or `false` paths.
- **Approval Gate:** Pauses execution until manual intervention.
- **Database Write:** Stores outputs securely into the database.
- **Notification:** Sends alerts (email, slack, etc).

## Getting Started

### 1. Prerequisites
- [Docker](https://www.docker.com/) (Required for local Nhost environment)
- [Nhost CLI](https://docs.nhost.io/cli) (Installed globally or used via `npx nhost`)
- Node.js (v20+)
- A Gemini API Key (from Google AI Studio)

### 2. Environment Setup

Copy the environment template and populate it:
```bash
cp .env.example .env.local
cp .env.example .env
```

Ensure your `.env` and `.env.local` files contain your Gemini API key:
```env
GEMINI_API_KEY=your_actual_api_key_here
```

### 3. Start the Backend (Nhost)

Start the complete backend infrastructure locally (Postgres, Hasura, Auth, Storage, Functions):
```bash
npx nhost up
```
*(This may take a few minutes the first time as it downloads the docker images.)*

### 4. Apply Hasura Metadata

To configure Hasura permissions, relationships, and Actions, run the setup script:
```bash
node setup-metadata.mjs
```

### 5. Start the Frontend

Install dependencies and start the Next.js development server:
```bash
npm install
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

## Database Schema Highlights

- `organizations`: Multi-tenant organization support.
- `organization_members`: Maps users to orgs with defined roles (`owner`, `editor`, `viewer`).
- `organization_usage`: Tracks quota limits per organization.
- `workflows`: Metadata for workflows.
- `workflow_steps` & `workflow_edges`: Normalized storage for React Flow node/edge graphs.
- `workflow_runs`: High-level tracking of a single workflow execution.
- `step_runs`: Atomic tracking of each individual step's status, input, output, duration, and error messages.

## Security & Permissions

Orqen heavily leverages Hasura Row-Level Security (RLS). Users are issued JWTs containing their `x-hasura-user-id`. 

Hasura permissions ensure:
- Users can only read data belonging to organizations where they are a member.
- Only users with the `editor` or `owner` role can mutate workflows or approve paused steps.
- Serverless functions perform a secondary verification of the user's role before executing privileged operations.

## Environment Variables Configuration
- `.env.local`: Used by Next.js frontend (contains `NEXT_PUBLIC_NHOST_SUBDOMAIN`).
- `.env`: Used by Nhost functions runtime (contains `GEMINI_API_KEY` for backend execution).
- `.nhost/docker-compose.yaml`: Automatically configures the local Nhost services.

## Project Structure

```
├── .nhost/                # Local Nhost docker-compose and configuration
├── functions/             # Serverless backend compute (Node.js/Express)
│   ├── _shared/           # Core execution engine (executor.ts, step-executor.ts)
│   ├── approve-step.ts    # Hasura Action handler for manual approvals
│   └── trigger-workflow.ts# Hasura Action handler for workflow initiation
├── nhost/
│   └── migrations/        # PostgreSQL schema migrations
├── src/
│   ├── app/               # Next.js App Router pages
│   ├── components/        # React components (UI, workflow builder)
│   ├── hooks/             # Apollo GraphQL hooks (useWorkflow, useWorkflowRun)
│   ├── lib/               # Utilities, Auth contexts, GraphQL Documents
│   └── types/             # TypeScript interfaces
├── setup-metadata.mjs     # Script to seed Hasura with tracking, RLS, and Actions
└── .env.example           # Environment template
```


