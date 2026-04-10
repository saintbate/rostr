import { discoverServers } from "../lib/config.js";
import { getWorkflows, getDistinctStacks, getRunStats } from "../lib/db.js";

export const listRosterTool = [
  "list_roster",
  "Use at the start of any infrastructure task to see connected servers and available workflows before deciding how to proceed.",
  async () => {
    const servers = discoverServers();
    const workflows = getWorkflows();
    const stacks = getDistinctStacks();

    const enabled = servers.filter((s) => s.enabled);

    let out = `servers: ${enabled.map((s) => s.name).join(", ") || "none"}\n`;

    if (workflows.length > 0) {
      out += `workflows:\n`;
      for (const wf of workflows) {
        const svrs = [...new Set(wf.steps.map((s) => s.server))].join("+");
        out += `- ${wf.name} (${svrs}, ${wf.steps.length} steps)\n`;
      }
    }

    if (stacks.length > 0) {
      out += `run history:\n`;
      for (const stack of stacks.slice(0, 5)) {
        const stats = getRunStats(stack);
        out += `- ${stack}: ${stats.total} runs, ${stats.success} ok, ${stats.failure} fail\n`;
      }
    }

    return { content: [{ type: "text" as const, text: out }] };
  },
] as const;
