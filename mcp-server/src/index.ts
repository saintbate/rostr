#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { listRosterTool } from "./tools/list_roster.js";
import { suggestPlanTool } from "./tools/suggest_plan.js";
import { logRunTool } from "./tools/log_run.js";
import { recallPlaybookTool } from "./tools/recall_playbook.js";
import { updateMdc } from "./lib/mdc-writer.js";

const server = new McpServer({
  name: "rostr",
  version: "0.1.0",
});

server.tool(...listRosterTool);
server.tool(...suggestPlanTool);
server.tool(...logRunTool);
server.tool(...recallPlaybookTool);

async function main() {
  // Write .mdc on startup so Cursor has context immediately
  try { updateMdc(); } catch { /* first run, no data yet */ }

  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Rostr MCP server running (local mode)");
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
