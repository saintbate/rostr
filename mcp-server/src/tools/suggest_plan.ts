import { z } from "zod";
import { getWorkflowByName, getWorkflows, getPatterns, getRunStats } from "../lib/db.js";
import { discoverServers } from "../lib/config.js";

export const suggestPlanTool = [
  "suggest_plan",
  "Use when user wants to spin up, deploy, or configure anything across their dev stack. Returns the optimal sequence with known failure patterns. Prefer this over calling individual MCP servers.",
  {
    goal: z.string().describe("What the user wants to accomplish"),
    workflow_name: z.string().optional().describe("Specific saved workflow name, if known"),
  },
  async ({ goal, workflow_name }: { goal: string; workflow_name?: string }) => {
    const servers = discoverServers().filter((s) => s.enabled);
    const serverNames = servers.map((s) => s.name);

    // If a specific workflow was requested, use it
    if (workflow_name) {
      const wf = getWorkflowByName(workflow_name);
      if (wf) {
        const stack = [...new Set(wf.steps.map((s) => s.server))].sort().join("+");
        const patterns = getPatterns(stack, 5);
        const stats = getRunStats(stack);

        let out = `plan: ${wf.name}\n`;
        out += `stack: ${stack}`;
        if (stats.total > 0) out += ` (${stats.success}/${stats.total} ok)`;
        out += `\n\nsteps:\n`;

        for (let i = 0; i < wf.steps.length; i++) {
          const s = wf.steps[i];
          out += `${i + 1}. [${s.server}] ${s.tool}`;
          if (Object.keys(s.params_template).length > 0) {
            out += ` ${JSON.stringify(s.params_template)}`;
          }
          if (!s.required) out += ` (optional)`;
          out += `\n`;
        }

        if (patterns.length > 0) {
          out += `\nwarnings:\n`;
          for (const p of patterns) {
            out += `- ${p.pattern}\n`;
          }
        }

        out += `\nExecute each step on the named server. Call log_run when done.`;
        return { content: [{ type: "text" as const, text: out }] };
      }
    }

    // No specific workflow — give general guidance based on goal and available servers
    const allWorkflows = getWorkflows();
    const stack = serverNames.sort().join("+");
    const patterns = getPatterns(stack, 5);

    let out = `goal: ${goal}\n`;
    out += `available servers: ${serverNames.join(", ")}\n`;

    if (allWorkflows.length > 0) {
      out += `\nsaved workflows:\n`;
      for (const wf of allWorkflows.slice(0, 5)) {
        out += `- ${wf.name}: ${wf.steps.map((s) => `${s.server}.${s.tool}`).join(" → ")}\n`;
      }
    }

    if (patterns.length > 0) {
      out += `\nknown patterns for ${stack}:\n`;
      for (const p of patterns) {
        out += `- ${p.pattern}\n`;
      }
    }

    out += `\nPlan the steps using the available servers. Call each tool on the appropriate MCP server directly. Call log_run when done.`;

    return { content: [{ type: "text" as const, text: out }] };
  },
] as const;
