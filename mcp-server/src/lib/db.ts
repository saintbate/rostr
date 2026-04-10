import Database from "better-sqlite3";
import { randomUUID } from "crypto";
import * as path from "path";
import * as fs from "fs";
import * as os from "os";
import type { Run, StepResult, Pattern, ToolUsage, Workflow, WorkflowStep } from "../types.js";

const ROSTR_DIR = path.join(os.homedir(), ".rostr");
const DB_PATH = path.join(ROSTR_DIR, "rostr.db");

let _db: Database.Database | null = null;

function ensureDir() {
  if (!fs.existsSync(ROSTR_DIR)) {
    fs.mkdirSync(ROSTR_DIR, { recursive: true });
  }
}

function getDb(): Database.Database {
  if (_db) return _db;
  ensureDir();
  _db = new Database(DB_PATH);
  _db.pragma("journal_mode = WAL");
  _db.pragma("foreign_keys = ON");
  migrate(_db);
  return _db;
}

function migrate(db: Database.Database) {
  // v0.1.1: patterns table gained pattern_key column — rebuild if missing
  const patternCols = db.prepare("PRAGMA table_info(patterns)").all() as any[];
  if (patternCols.length > 0 && !patternCols.some((c: any) => c.name === "pattern_key")) {
    db.exec("DROP TABLE patterns");
  }

  db.exec(`
    CREATE TABLE IF NOT EXISTS runs (
      id TEXT PRIMARY KEY,
      workflow_name TEXT NOT NULL,
      stack_fingerprint TEXT NOT NULL,
      steps_attempted TEXT NOT NULL,
      steps_succeeded TEXT NOT NULL,
      steps_failed TEXT,
      outcome TEXT NOT NULL CHECK (outcome IN ('success', 'partial', 'failure')),
      duration_ms INTEGER,
      context TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS patterns (
      id TEXT PRIMARY KEY,
      stack_fingerprint TEXT NOT NULL,
      pattern_key TEXT NOT NULL,
      pattern TEXT NOT NULL,
      observed_count INTEGER DEFAULT 1,
      last_seen TEXT DEFAULT (datetime('now')),
      UNIQUE(stack_fingerprint, pattern_key)
    );

    CREATE TABLE IF NOT EXISTS tool_usage (
      id TEXT PRIMARY KEY,
      server TEXT NOT NULL,
      tool TEXT NOT NULL,
      task_type TEXT NOT NULL DEFAULT 'general',
      co_used_with TEXT NOT NULL DEFAULT '[]',
      success_count INTEGER DEFAULT 0,
      fail_count INTEGER DEFAULT 0,
      UNIQUE(server, tool, task_type)
    );

    CREATE TABLE IF NOT EXISTS workflows (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL UNIQUE,
      description TEXT,
      steps TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_runs_stack ON runs(stack_fingerprint);
    CREATE INDEX IF NOT EXISTS idx_runs_created ON runs(created_at);
    CREATE INDEX IF NOT EXISTS idx_patterns_stack ON patterns(stack_fingerprint);
    CREATE INDEX IF NOT EXISTS idx_tool_usage_server ON tool_usage(server, tool);
  `);
}

// --- Runs ---

export function insertRun(run: Omit<Run, "id" | "created_at">): string {
  const db = getDb();
  const id = randomUUID();
  db.prepare(`
    INSERT INTO runs (id, workflow_name, stack_fingerprint, steps_attempted, steps_succeeded, steps_failed, outcome, duration_ms, context)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id,
    run.workflow_name,
    run.stack_fingerprint,
    JSON.stringify(run.steps_attempted),
    JSON.stringify(run.steps_succeeded),
    JSON.stringify(run.steps_failed),
    run.outcome,
    run.duration_ms,
    run.context,
  );
  return id;
}

export function getRecentRuns(stackFingerprint: string, limit = 20): Run[] {
  const db = getDb();
  const rows = db.prepare(`
    SELECT * FROM runs WHERE stack_fingerprint = ? ORDER BY created_at DESC LIMIT ?
  `).all(stackFingerprint, limit) as any[];

  return rows.map((r) => ({
    ...r,
    steps_attempted: JSON.parse(r.steps_attempted),
    steps_succeeded: JSON.parse(r.steps_succeeded),
    steps_failed: r.steps_failed ? JSON.parse(r.steps_failed) : [],
  }));
}

export function getAllRuns(limit = 50): Run[] {
  const db = getDb();
  const rows = db.prepare(`
    SELECT * FROM runs ORDER BY created_at DESC LIMIT ?
  `).all(limit) as any[];

  return rows.map((r) => ({
    ...r,
    steps_attempted: JSON.parse(r.steps_attempted),
    steps_succeeded: JSON.parse(r.steps_succeeded),
    steps_failed: r.steps_failed ? JSON.parse(r.steps_failed) : [],
  }));
}

// --- Patterns ---

export function upsertPattern(stackFingerprint: string, patternKey: string, pattern: string): void {
  const db = getDb();
  const id = randomUUID();
  db.prepare(`
    INSERT INTO patterns (id, stack_fingerprint, pattern_key, pattern, observed_count, last_seen)
    VALUES (?, ?, ?, ?, 1, datetime('now'))
    ON CONFLICT(stack_fingerprint, pattern_key) DO UPDATE SET
      pattern = excluded.pattern,
      observed_count = observed_count + 1,
      last_seen = datetime('now')
  `).run(id, stackFingerprint, patternKey, pattern);
}

export function getPatterns(stackFingerprint: string, limit = 10): Pattern[] {
  const db = getDb();
  return db.prepare(`
    SELECT * FROM patterns WHERE stack_fingerprint = ? ORDER BY observed_count DESC, last_seen DESC LIMIT ?
  `).all(stackFingerprint, limit) as Pattern[];
}

export function getAllPatterns(limit = 20): Pattern[] {
  const db = getDb();
  return db.prepare(`
    SELECT * FROM patterns ORDER BY observed_count DESC, last_seen DESC LIMIT ?
  `).all(limit) as Pattern[];
}

// --- Tool Usage ---

export function recordToolUsage(
  server: string,
  tool: string,
  success: boolean,
  coUsedWith: string[] = [],
  taskType = "general"
): void {
  const db = getDb();
  const id = randomUUID();
  const col = success ? "success_count" : "fail_count";
  db.prepare(`
    INSERT INTO tool_usage (id, server, tool, task_type, co_used_with, success_count, fail_count)
    VALUES (?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(server, tool, task_type) DO UPDATE SET
      ${col} = ${col} + 1,
      co_used_with = ?
  `).run(
    id, server, tool, taskType, JSON.stringify(coUsedWith),
    success ? 1 : 0, success ? 0 : 1,
    JSON.stringify(coUsedWith),
  );
}

export function getToolUsageForStack(servers: string[]): ToolUsage[] {
  const db = getDb();
  const placeholders = servers.map(() => "?").join(",");
  return db.prepare(`
    SELECT * FROM tool_usage WHERE server IN (${placeholders}) ORDER BY (success_count + fail_count) DESC
  `).all(...servers) as ToolUsage[];
}

// --- Workflows ---

export function upsertWorkflow(name: string, description: string | null, steps: WorkflowStep[]): string {
  const db = getDb();
  const id = randomUUID();
  db.prepare(`
    INSERT INTO workflows (id, name, description, steps)
    VALUES (?, ?, ?, ?)
    ON CONFLICT(name) DO UPDATE SET
      description = excluded.description,
      steps = excluded.steps
  `).run(id, name, description, JSON.stringify(steps));
  return id;
}

export function getWorkflows(): Workflow[] {
  const db = getDb();
  const rows = db.prepare(`SELECT * FROM workflows ORDER BY created_at DESC`).all() as any[];
  return rows.map((r) => ({ ...r, steps: JSON.parse(r.steps) }));
}

export function deleteWorkflow(name: string): boolean {
  const db = getDb();
  const result = db.prepare("DELETE FROM workflows WHERE name = ?").run(name);
  return result.changes > 0;
}

export function getWorkflowByName(name: string): Workflow | null {
  const db = getDb();
  const row = db.prepare(`SELECT * FROM workflows WHERE name = ?`).get(name) as any | undefined;
  if (!row) return null;
  return { ...row, steps: JSON.parse(row.steps) };
}

// --- Stats ---

export function getRunStats(stackFingerprint: string): { total: number; success: number; partial: number; failure: number } {
  const db = getDb();
  const row = db.prepare(`
    SELECT
      COUNT(*) as total,
      SUM(CASE WHEN outcome = 'success' THEN 1 ELSE 0 END) as success,
      SUM(CASE WHEN outcome = 'partial' THEN 1 ELSE 0 END) as partial,
      SUM(CASE WHEN outcome = 'failure' THEN 1 ELSE 0 END) as failure
    FROM runs WHERE stack_fingerprint = ?
  `).get(stackFingerprint) as any;
  return { total: row.total || 0, success: row.success || 0, partial: row.partial || 0, failure: row.failure || 0 };
}

export function getDistinctStacks(): string[] {
  const db = getDb();
  const rows = db.prepare(`SELECT DISTINCT stack_fingerprint FROM runs ORDER BY stack_fingerprint`).all() as any[];
  return rows.map((r) => r.stack_fingerprint);
}

export function getDbPath(): string {
  return DB_PATH;
}

export function resetDb(): void {
  const db = getDb();
  db.exec("DELETE FROM runs; DELETE FROM patterns; DELETE FROM tool_usage; DELETE FROM workflows;");
}
