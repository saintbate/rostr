#!/usr/bin/env node
import { Command } from "commander";
import { discoverServers, getProjectRoot } from "./lib/config.js";
import { updateMdc } from "./lib/mdc-writer.js";
import {
  getWorkflows,
  upsertWorkflow,
  deleteWorkflow,
  getAllRuns,
  getRecentRuns,
  getAllPatterns,
  getPatterns,
  getRunStats,
  getDistinctStacks,
  getDbPath,
  resetDb,
} from "./lib/db.js";
import type { WorkflowStep } from "./types.js";
import * as fs from "fs";

const program = new Command();

program
  .name("rostr")
  .description("Intelligent MCP proxy for Cursor — CLI tools")
  .version("0.1.0");

// --- rostr init ---

program
  .command("init")
  .description("Initialize Rostr: discover servers, create DB, write .mdc")
  .action(() => {
    const servers = discoverServers();
    const enabled = servers.filter((s) => s.enabled);

    console.log("Rostr initialized\n");
    console.log(`  Project root:  ${getProjectRoot()}`);
    console.log(`  Database:      ${getDbPath()}`);
    console.log(`  Servers found: ${enabled.length}`);

    for (const s of enabled) {
      console.log(`    ${s.name} (${s.type})`);
    }

    try {
      updateMdc();
      console.log(`\n  .mdc written to ${getProjectRoot()}/.cursor/rules/rostr.mdc`);
    } catch {
      console.log("\n  .mdc write skipped (no data yet)");
    }

    console.log("\nAdd to your .cursor/mcp.json:");
    console.log(`
  {
    "mcpServers": {
      "rostr": {
        "command": "npx",
        "args": ["-y", "rostr"]
      }
    }
  }
`);
  });

// --- rostr status ---

program
  .command("status")
  .description("Show discovered servers, run stats, and pattern count")
  .action(() => {
    const servers = discoverServers();
    const enabled = servers.filter((s) => s.enabled);
    const workflows = getWorkflows();
    const stacks = getDistinctStacks();
    const patterns = getAllPatterns(100);
    const dbPath = getDbPath();
    const dbSize = fs.existsSync(dbPath)
      ? `${(fs.statSync(dbPath).size / 1024).toFixed(1)} KB`
      : "not created";

    console.log("Rostr Status\n");
    console.log(`  Servers:    ${enabled.map((s) => s.name).join(", ") || "none"}`);
    console.log(`  Workflows:  ${workflows.length}`);
    console.log(`  Patterns:   ${patterns.length}`);
    console.log(`  DB size:    ${dbSize}`);

    if (stacks.length > 0) {
      console.log("\n  Run History:");
      for (const stack of stacks) {
        const stats = getRunStats(stack);
        console.log(`    ${stack}: ${stats.total} runs (${stats.success} ok, ${stats.failure} fail, ${stats.partial} partial)`);
      }
    }
  });

// --- rostr workflow ---

const workflow = program
  .command("workflow")
  .description("Manage saved workflows");

workflow
  .command("list")
  .description("List all saved workflows")
  .action(() => {
    const workflows = getWorkflows();
    if (workflows.length === 0) {
      console.log("No workflows saved. Use `rostr workflow add` to create one.");
      return;
    }

    for (const wf of workflows) {
      const servers = [...new Set(wf.steps.map((s) => s.server))].join("+");
      console.log(`\n  ${wf.name} — ${wf.description || "no description"}`);
      console.log(`  stack: ${servers} | ${wf.steps.length} steps`);
      for (let i = 0; i < wf.steps.length; i++) {
        const s = wf.steps[i];
        const opt = s.required ? "" : " (optional)";
        console.log(`    ${i + 1}. [${s.server}] ${s.tool}${opt}`);
      }
    }
    console.log("");
  });

workflow
  .command("add")
  .description("Add a workflow from a JSON file or inline JSON")
  .requiredOption("--name <name>", "Workflow name")
  .option("--description <desc>", "Workflow description")
  .option("--file <path>", "JSON file with steps array")
  .option("--steps <json>", "Inline JSON array of steps")
  .action((opts) => {
    let steps: WorkflowStep[];

    if (opts.file) {
      try {
        const raw = fs.readFileSync(opts.file, "utf-8");
        steps = JSON.parse(raw);
      } catch (e: any) {
        console.error(`Error reading file: ${e.message}`);
        process.exit(1);
      }
    } else if (opts.steps) {
      try {
        steps = JSON.parse(opts.steps);
      } catch (e: any) {
        console.error(`Error parsing steps JSON: ${e.message}`);
        process.exit(1);
      }
    } else {
      console.error("Provide --file or --steps. Example:");
      console.error(`  rostr workflow add --name "deploy-db" --steps '[{"name":"migrate","server":"Neon","tool":"run_sql","params_template":{},"required":true}]'`);
      process.exit(1);
    }

    upsertWorkflow(opts.name, opts.description || null, steps);
    console.log(`Workflow "${opts.name}" saved (${steps.length} steps)`);

    try { updateMdc(); } catch { /* ok */ }
  });

workflow
  .command("remove <name>")
  .description("Remove a saved workflow")
  .action((name: string) => {
    const deleted = deleteWorkflow(name);
    if (deleted) {
      console.log(`Workflow "${name}" removed.`);
      try { updateMdc(); } catch { /* ok */ }
    } else {
      console.log(`Workflow "${name}" not found.`);
    }
  });

// --- rostr logs ---

program
  .command("logs")
  .description("Show recent workflow runs")
  .option("--stack <name>", "Filter by stack fingerprint (e.g. Neon+Stripe)")
  .option("--limit <n>", "Number of runs to show", "10")
  .action((opts) => {
    const limit = parseInt(opts.limit, 10);
    const runs = opts.stack
      ? getRecentRuns(opts.stack, limit)
      : getAllRuns(limit);

    if (runs.length === 0) {
      console.log("No runs logged yet.");
      return;
    }

    for (const run of runs) {
      const ok = run.steps_succeeded.length;
      const total = run.steps_attempted.length;
      const dur = run.duration_ms ? `${run.duration_ms}ms` : "n/a";
      console.log(`\n  [${run.outcome.toUpperCase()}] ${run.workflow_name} — ${ok}/${total} steps, ${dur}`);
      console.log(`  stack: ${run.stack_fingerprint} | ${run.created_at}`);
      if (run.context) console.log(`  note: ${run.context}`);
    }
    console.log("");
  });

// --- rostr patterns ---

program
  .command("patterns")
  .description("Show learned patterns")
  .option("--stack <name>", "Filter by stack fingerprint")
  .option("--limit <n>", "Number of patterns", "20")
  .action((opts) => {
    const limit = parseInt(opts.limit, 10);
    const patterns = opts.stack
      ? getPatterns(opts.stack, limit)
      : getAllPatterns(limit);

    if (patterns.length === 0) {
      console.log("No patterns learned yet. Run some workflows and log them.");
      return;
    }

    console.log(`\n  Learned Patterns${opts.stack ? ` (${opts.stack})` : ""}:\n`);
    for (const p of patterns) {
      console.log(`  [${p.observed_count}x] ${p.pattern}`);
      console.log(`         stack: ${p.stack_fingerprint} | last seen: ${p.last_seen}`);
    }
    console.log("");
  });

// --- rostr reset ---

program
  .command("reset")
  .description("Clear all Rostr data (runs, patterns, workflows)")
  .option("--yes", "Skip confirmation")
  .action((opts) => {
    if (!opts.yes) {
      console.log("This will delete ALL Rostr data (runs, patterns, workflows).");
      console.log("Run with --yes to confirm.");
      return;
    }

    resetDb();
    try { updateMdc(); } catch { /* ok */ }
    console.log("All Rostr data cleared.");
  });

program.parse();
