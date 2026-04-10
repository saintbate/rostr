import { z } from "zod";
import { insertRun, recordToolUsage } from "../lib/db.js";
import { extractPatterns } from "../lib/playbook.js";
import { updateMdc } from "../lib/mdc-writer.js";

export const logRunTool = [
  "log_run",
  "Use after completing any multi-step task across MCP servers. Logs the outcome so Rostr learns the pattern for next time.",
  {
    workflow_name: z.string().describe("Name or description of what was done"),
    servers_used: z.array(z.string()).describe("Server names involved"),
    steps: z.array(z.object({
      step: z.string(),
      server: z.string().optional(),
      tool: z.string().optional(),
      status: z.enum(["success", "failed", "skipped"]),
      error: z.string().optional(),
    })).describe("Each step attempted and its outcome"),
    outcome: z.enum(["success", "partial", "failure"]),
    duration_ms: z.number().optional(),
    context: z.string().optional().describe("Brief note on what happened"),
  },
  async (input: {
    workflow_name: string;
    servers_used: string[];
    steps: { step: string; server?: string; tool?: string; status: string; error?: string }[];
    outcome: "success" | "partial" | "failure";
    duration_ms?: number;
    context?: string;
  }) => {
    const stackFingerprint = [...new Set(input.servers_used)].sort().join("+");

    const succeeded = input.steps.filter((s) => s.status === "success");
    const failed = input.steps.filter((s) => s.status === "failed");

    const runId = insertRun({
      workflow_name: input.workflow_name,
      stack_fingerprint: stackFingerprint,
      steps_attempted: input.steps,
      steps_succeeded: succeeded,
      steps_failed: failed,
      outcome: input.outcome,
      duration_ms: input.duration_ms ?? null,
      context: input.context ?? null,
    });

    const toolNames = input.steps
      .filter((s) => s.server && s.tool)
      .map((s) => `${s.server}.${s.tool}`);

    for (const step of input.steps) {
      if (step.server && step.tool) {
        recordToolUsage(
          step.server,
          step.tool,
          step.status === "success",
          toolNames.filter((t) => t !== `${step.server}.${step.tool}`),
        );
      }
    }

    extractPatterns(stackFingerprint);

    try { updateMdc(); } catch { /* non-fatal */ }

    const out = `logged: ${input.outcome}, ${succeeded.length}/${input.steps.length} ok, stack: ${stackFingerprint}`;
    return { content: [{ type: "text" as const, text: out }] };
  },
] as const;
