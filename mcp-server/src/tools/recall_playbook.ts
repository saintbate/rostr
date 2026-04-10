import { z } from "zod";
import { getPatterns, getRunStats } from "../lib/db.js";

export const recallPlaybookTool = [
  "recall_playbook",
  "Use before a workflow on an unfamiliar stack combination. Returns known failure points and recommended sequencing from past runs.",
  {
    servers: z.array(z.string()).describe("Server names to look up, e.g. ['neon', 'vercel']"),
  },
  async ({ servers }: { servers: string[] }) => {
    const stack = [...new Set(servers)].sort().join("+");
    const patterns = getPatterns(stack, 8);
    const stats = getRunStats(stack);

    if (patterns.length === 0 && stats.total === 0) {
      return {
        content: [{
          type: "text" as const,
          text: `no history for ${stack}. proceed with default sequencing — Rostr will learn from this run.`,
        }],
      };
    }

    let out = `playbook for ${stack} (${stats.total} runs, ${stats.success} ok):\n`;

    for (const p of patterns) {
      out += `- ${p.pattern} (seen ${p.observed_count}x)\n`;
    }

    if (patterns.length === 0 && stats.total > 0) {
      out += `no notable patterns yet — ${stats.total} runs recorded, all fairly consistent.\n`;
    }

    return { content: [{ type: "text" as const, text: out }] };
  },
] as const;
