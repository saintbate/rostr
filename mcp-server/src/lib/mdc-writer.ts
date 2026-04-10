import * as fs from "fs";
import * as path from "path";
import { discoverServers, getProjectRoot } from "./config.js";
import { getWorkflows, getAllPatterns, getDistinctStacks, getRunStats } from "./db.js";

const MAX_PATTERNS = 5;
const MAX_WORKFLOWS = 3;

export function updateMdc(): void {
  const projectRoot = getProjectRoot();
  const rulesDir = path.join(projectRoot, ".cursor", "rules");

  if (!fs.existsSync(rulesDir)) {
    fs.mkdirSync(rulesDir, { recursive: true });
  }

  const mdcPath = path.join(rulesDir, "rostr.mdc");
  const content = generateMdc();
  fs.writeFileSync(mdcPath, content, "utf-8");
}

function generateMdc(): string {
  const servers = discoverServers().filter((s) => s.enabled);
  const workflows = getWorkflows();
  const stacks = getDistinctStacks();
  const patterns = getAllPatterns(MAX_PATTERNS);

  let body = "";

  // Stack line
  if (servers.length > 0) {
    body += `stack: ${servers.map((s) => s.name).join("+")}\n`;
  }

  // Server summary — one line
  if (servers.length > 0) {
    body += `servers: ${servers.map((s) => s.name).join(", ")}\n`;
  }

  // Top workflows — compact
  if (workflows.length > 0) {
    const top = workflows.slice(0, MAX_WORKFLOWS);
    for (const wf of top) {
      const stepStr = wf.steps.map((s) => `${s.server}.${s.tool}`).join(" → ");
      body += `wf ${wf.name}: ${stepStr}\n`;
    }
  }

  // Run stats per stack
  for (const stack of stacks.slice(0, 3)) {
    const stats = getRunStats(stack);
    if (stats.total > 0) {
      body += `${stack}: ${stats.success}/${stats.total} ok\n`;
    }
  }

  // Patterns — the most valuable part
  if (patterns.length > 0) {
    body += `\nknown patterns:\n`;
    for (const p of patterns) {
      body += `- ${p.pattern}\n`;
    }
  }

  // Add the Rostr tool guidance — keeps it tight
  body += `\nRostr tools: list_roster, suggest_plan, log_run, recall_playbook`;
  body += `\nPrefer suggest_plan over calling servers individually.`;

  const frontmatter = [
    "---",
    "description: Rostr stack playbook — patterns and sequencing for connected MCP servers",
    "alwaysApply: true",
    "---",
  ].join("\n");

  return `${frontmatter}\n${body}\n`;
}
