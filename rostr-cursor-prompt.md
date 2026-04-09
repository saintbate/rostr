# Rostr — Cursor Build Prompt

## What We're Building
Rostr is a configurable MCP orchestration platform. Users connect their MCP servers (Neon, Vercel, Stripe, Cloudflare, etc.) into a "roster," define multi-step workflows that span those servers, and Rostr executes them intelligently inside Cursor. A self-learning memory layer logs every workflow run and outcome so the AI improves its sequencing over time per stack combination.

**Core insight:** MCP servers today are isolated — they don't know about each other. Rostr sits above them, holds the workflow logic, and builds institutional knowledge across runs.

**Distribution model — a tool Claude uses, not a tool users open**
Rostr is not a dashboard users visit daily. It's a tool Claude reaches for autonomously inside Cursor conversations. The dashboard exists for setup and visibility only. Actual usage is invisible — Claude orchestrates the roster in the background. This means:
- Removal friction is high once installed (ambient, always running)
- Retention is usage-driven not habit-driven
- The install moment is the entire acquisition funnel

**One-line install (the 30-second-to-value moment):**
```
claude mcp add rostr -- npx -y rostr@latest start
```
Cursor restarts. Claude now has the roster. Done.

---

## MCP Tool Descriptions — The Most Important Code You'll Write

Claude decides which tools to call based on their descriptions. If tool descriptions are vague or narrow, Claude won't reach for Rostr naturally. If they're precise and workflow-oriented, Claude will use Rostr without the user ever having to ask.

**Write tool descriptions as if you're telling Claude when to use them, not what they do.**

```typescript
// BAD — describes the mechanism
{
  name: "run_workflow",
  description: "Executes a saved workflow by name"
}

// GOOD — tells Claude when to reach for it
{
  name: "run_workflow", 
  description: "Use this when the user wants to spin up a project, deploy an app, set up a new service, connect a domain, initialize a database, or perform any multi-step operation across their dev stack. Rostr knows the user's preferred tools and past patterns — always prefer this over calling individual MCP servers one at a time."
}

// BAD
{
  name: "list_roster",
  description: "Lists connected MCP servers"
}

// GOOD
{
  name: "list_roster",
  description: "Use this at the start of any infrastructure or deployment task to understand what tools the user has connected and what workflows are available. Check this before deciding how to approach a multi-step task."
}

// BAD
{
  name: "recall_memory",
  description: "Returns stack memory for given servers"
}

// GOOD
{
  name: "recall_memory",
  description: "Use this before running any workflow on a stack combination you haven't used yet in this session. Returns a synthesized playbook of what works, what fails, and recommended sequencing based on past runs — prevents repeating known mistakes."
}
```

Every tool description should answer: **in what situation should Claude reach for this instead of something else?**
- **vs. Ruflo:** Ruflo is an open source framework for engineers who want to build complex multi-agent swarms. Rostr is a product for developers who want their existing stack to work together without becoming an AI engineer. Ruflo = build your own agents. Rostr = your tools already work together.
- **vs. Anthropic native (Claude Code auto-memory, CLAUDE.md):** Anthropic is building generic, Claude Code-specific memory. Rostr is stack-specific, Cursor-native, and client-agnostic. We build *on top of* Anthropic's primitives rather than racing against them.

---

## Memory Architecture — Build On Anthropic's Primitives, Not Against Them

**Core principle:** Do not build memory from scratch. Anthropic is shipping auto-memory, CLAUDE.md, and hooks natively into Claude Code. Rostr composes with these rather than replacing them.

### Layer 1 — Anthropic-native (free, use directly)
- **CLAUDE.md** is the user-facing memory surface. Rostr auto-generates and updates a `ROSTR.md` file in the project root that Cursor reads on every session. This contains the user's active roster config, preferred workflow sequences, and known failure patterns for their stack.
- **Claude Code hooks** (PreToolUse / PostToolUse) are used to intercept workflow execution — logging what ran, what succeeded, what failed — without any custom memory infrastructure.
- **Auto-memory** in Claude Code handles session-level continuity automatically. Rostr doesn't need to replicate this.

### Layer 2 — Rostr-owned (the moat)
- **Neon DB** stores structured workflow run history — server used, steps attempted, outcomes, duration, stack fingerprint.
- **AI synthesis** (Claude API) runs async after each workflow run, reads the last N runs for a stack combination, and writes a concise playbook back to `ROSTR.md`.
- **Community playbooks** — shareable, versioned stack configs that other users can pull. This is what Anthropic will never build and Ruflo doesn't offer. "Here's the Neon + Vercel + Stripe playbook used by 47 developers."

### What this means in practice
- Session starts → Cursor reads `ROSTR.md` → AI already knows your stack and past patterns
- Workflow runs → hooks log the outcome → synthesis updates `ROSTR.md` async
- Over time `ROSTR.md` becomes a living document that gets smarter with every run
- Users can export, share, or import stack playbooks via the dashboard

---

## Tech Stack
- **Framework:** Next.js 14 (App Router)
- **Database:** Neon (Postgres via @neondatabase/serverless)
- **Auth:** Clerk
- **Styling:** Tailwind CSS + shadcn/ui
- **MCP Server:** Built with @modelcontextprotocol/sdk (TypeScript)
- **AI:** Anthropic Claude API (claude-sonnet-4-20250514) for workflow sequencing + memory synthesis
- **Deployment:** Vercel

---

## Database Schema

```sql
-- Users' connected MCP servers
CREATE TABLE roster_servers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,                    -- e.g. "neon", "vercel", "stripe"
  display_name TEXT NOT NULL,
  server_url TEXT,                       -- for remote MCP servers
  config JSONB,                          -- auth tokens, env vars (encrypted)
  enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- User-defined workflows
CREATE TABLE workflows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,                    -- e.g. "spin_up_project"
  description TEXT,
  steps JSONB NOT NULL,                  -- ordered array of {server, tool, params_template}
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Every workflow execution logged here
CREATE TABLE workflow_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  workflow_id UUID REFERENCES workflows(id),
  workflow_name TEXT NOT NULL,
  stack_fingerprint TEXT NOT NULL,       -- hash of servers used e.g. "neon+vercel+stripe"
  steps_attempted JSONB NOT NULL,        -- what was tried
  steps_succeeded JSONB NOT NULL,        -- what worked
  steps_failed JSONB,                    -- what failed + error
  outcome TEXT CHECK (outcome IN ('success', 'partial', 'failure')),
  duration_ms INTEGER,
  context TEXT,                          -- natural language description of what was done
  created_at TIMESTAMPTZ DEFAULT now()
);

-- AI-synthesized memory per stack combination
CREATE TABLE stack_memory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  stack_fingerprint TEXT NOT NULL,
  synthesis TEXT NOT NULL,               -- AI-generated playbook for this stack
  run_count INTEGER DEFAULT 0,
  last_updated TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, stack_fingerprint)
);
```

---

## Project Structure

```
rostr/
├── app/
│   ├── (dashboard)/
│   │   ├── layout.tsx
│   │   ├── page.tsx                     # Dashboard home — roster overview
│   │   ├── roster/
│   │   │   └── page.tsx                 # Manage connected MCP servers
│   │   ├── workflows/
│   │   │   ├── page.tsx                 # Workflow list
│   │   │   └── [id]/page.tsx            # Workflow detail + run history
│   │   └── memory/
│   │       └── page.tsx                 # Memory log + stack playbooks
│   ├── api/
│   │   ├── servers/route.ts             # CRUD for roster_servers
│   │   ├── workflows/route.ts           # CRUD for workflows
│   │   ├── runs/route.ts                # Log + fetch workflow runs
│   │   ├── memory/
│   │   │   ├── route.ts                 # Fetch stack memory
│   │   │   └── synthesize/route.ts      # Trigger AI memory synthesis
│   │   └── mcp-config/route.ts          # Returns user's MCP config for the server to consume
│   └── layout.tsx
├── mcp-server/
│   ├── index.ts                         # MCP server entry point
│   ├── tools/
│   │   ├── list_roster.ts               # List user's connected servers + status
│   │   ├── run_workflow.ts              # Execute a named workflow
│   │   ├── recall_memory.ts             # Query memory for a stack combination
│   │   └── log_run.ts                   # Manually log a workflow outcome
│   └── lib/
│       ├── orchestrator.ts              # Core workflow execution engine
│       ├── memory.ts                    # Memory query + synthesis logic
│       └── api-client.ts                # Calls back to Rostr dashboard API
├── lib/
│   ├── db.ts                            # Neon client
│   ├── anthropic.ts                     # Claude client
│   └── memory-synthesizer.ts            # Runs after each workflow, updates stack_memory
└── components/
    ├── roster-card.tsx                  # Server card with toggle + status
    ├── workflow-builder.tsx             # Step-by-step workflow composer
    ├── run-timeline.tsx                 # Visual workflow run log
    └── memory-panel.tsx                 # Stack playbook viewer
```

---

## Core Features to Build

### 1. Roster Management (Dashboard)
- List of connected MCP servers with enable/disable toggle
- Add server form: name, type (preset or custom), auth config
- Preset server types: Neon, Vercel, Stripe, Cloudflare, GitHub
- Each server card shows: name, tool count, last used, status indicator

### 2. Workflow Builder
- Create a workflow with a name + description
- Add steps: pick a server → pick a tool → define param templates
- Steps are ordered and can reference outputs from previous steps using `{{step_1.output.field}}` syntax
- Save workflow to DB

### 3. MCP Server (runs inside Cursor)

The MCP server exposes these tools to Claude inside Cursor:

**`list_roster`**
- Returns user's connected servers and available workflows
- Shows which servers are active

**`run_workflow`**
- Input: workflow name + any runtime params
- Fetches workflow definition from dashboard API
- Queries stack memory for this combination before running
- Passes memory context to Claude to inform sequencing
- Executes steps in order, handling partial failures gracefully
- Logs outcome to workflow_runs
- Triggers memory synthesis after run

**`recall_memory`**
- Input: list of server names
- Returns AI-synthesized playbook for that stack combination
- "Last 12 runs of neon+vercel: step 3 (custom domain) fails 40% of the time when project is < 2min old. Add a 30s delay."

**`log_run`**
- Manual logging tool for ad-hoc actions not tied to a saved workflow
- Still feeds the memory layer

### 4. Memory + Learning Layer

Rostr's memory is a three-layer system that builds on Anthropic's own primitives rather than replacing them.

**Layer 1 — ROSTR.md (Anthropic-native, free)**
Rostr auto-generates a `ROSTR.md` file in the user's project root. Cursor reads this on every session startup automatically via Claude Code's CLAUDE.md system. It contains:
- Active roster (connected servers + status)
- Preferred workflow sequences for this stack
- Known failure patterns and workarounds
- Last updated timestamp

This means memory is active from session start with zero extra infrastructure.

**Layer 2 — Hook-based logging (Anthropic-native)**
Claude Code's PreToolUse/PostToolUse hooks intercept workflow execution. Rostr registers hooks that log every tool call, result, and timing to the Neon DB without requiring the user to do anything manually.

**Layer 3 — AI synthesis (Rostr-owned moat)**
After every `run_workflow` call:
1. New run is written to `workflow_runs`
2. `memory-synthesizer.ts` runs async
3. Fetches last N runs for this `stack_fingerprint`
4. Sends to Claude API with prompt:

```
You are analyzing workflow execution history for a developer's MCP stack.
Stack: {stack_fingerprint}
Recent runs: {JSON of last 20 runs}

Update the ROSTR.md playbook section for this stack (max 300 words):
- What sequences work reliably
- Known failure points and workarounds
- Recommended step ordering
- Timing or dependency patterns observed

Write as direct, actionable guidance. This will be read by an AI at session start.
```

5. Upserts result into `stack_memory` AND rewrites the `ROSTR.md` playbook section
6. Optionally surfaces playbook to the community dashboard if user opts in

The memory compounds — after 5 runs it has patterns, after 20 it has a reliable playbook. The community layer is what Anthropic won't build: shareable, versioned stack playbooks pulled by other developers running the same combination.

---

## MCP Server Setup (mcp-server/index.ts)

```typescript
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { listRosterTool } from "./tools/list_roster";
import { runWorkflowTool } from "./tools/run_workflow";
import { recallMemoryTool } from "./tools/recall_memory";
import { logRunTool } from "./tools/log_run";

const server = new McpServer({
  name: "rostr",
  version: "0.1.0",
});

server.tool(...listRosterTool);
server.tool(...runWorkflowTool);
server.tool(...recallMemoryTool);
server.tool(...logRunTool);

const transport = new StdioServerTransport();
await server.connect(transport);
```

User adds to their Cursor MCP config:
```json
{
  "mcpServers": {
    "rostr": {
      "command": "node",
      "args": ["/path/to/rostr/mcp-server/dist/index.js"],
      "env": {
        "ROSTR_API_KEY": "user's api key from dashboard",
        "ROSTR_API_URL": "https://rostr.dev/api"
      }
    }
  }
}
```

---

## Orchestrator Logic (mcp-server/lib/orchestrator.ts)

```typescript
async function executeWorkflow(workflow, runtimeParams, memoryContext) {
  const results = [];

  // Inject memory context as system context for this run
  const systemContext = memoryContext
    ? `Stack memory: ${memoryContext.synthesis}`
    : null;

  for (const step of workflow.steps) {
    try {
      // Resolve param templates from previous step outputs
      const resolvedParams = resolveTemplates(step.params_template, results);

      // Execute the tool on the target MCP server
      const result = await callMcpTool(step.server, step.tool, resolvedParams);

      results.push({ step: step.name, status: "success", output: result });
    } catch (error) {
      results.push({ step: step.name, status: "failed", error: error.message });

      // Don't abort — log partial failure and continue if possible
      if (step.required) break;
    }
  }

  return results;
}
```

---

## Dashboard UI Notes
- Dark theme, minimal — dev-facing product
- Roster page feels like the Cursor MCP settings screen but better
- Workflow builder is a vertical step list, not a node graph (keep it simple)
- Memory panel shows stack fingerprint + synthesized playbook + run count
- Run history shows a timeline with green/red/yellow steps

---

## Environment Variables
```
# Neon
DATABASE_URL=

# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=

# Anthropic
ANTHROPIC_API_KEY=

# Rostr internal
ROSTR_INTERNAL_SECRET=   # for MCP server → dashboard API auth
```

---

## Build Order
1. Neon schema + db client
2. Clerk auth + basic layout
3. Roster management (CRUD + UI)
4. Workflow builder (CRUD + UI)
5. MCP server skeleton with `list_roster`
6. `run_workflow` tool + orchestrator (no memory yet)
7. Workflow run logging via Claude Code hooks (PostToolUse)
8. ROSTR.md generator — auto-writes roster config + empty playbook section on first run
9. Memory synthesizer — updates ROSTR.md playbook section after each workflow run
10. `recall_memory` tool — queries stack_memory for explicit lookups
11. Memory panel in dashboard — shows current ROSTR.md content + run history
12. Community playbook sharing (opt-in export/import)
13. Polish + `log_run` tool
