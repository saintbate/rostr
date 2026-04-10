export interface McpServerEntry {
  name: string;
  command?: string;
  args?: string[];
  url?: string;
  env?: Record<string, string>;
  disabled?: boolean;
}

export interface DiscoveredServer {
  name: string;
  type: "stdio" | "http" | "plugin";
  enabled: boolean;
}

export interface Run {
  id: string;
  workflow_name: string;
  stack_fingerprint: string;
  steps_attempted: StepResult[];
  steps_succeeded: StepResult[];
  steps_failed: StepResult[];
  outcome: "success" | "partial" | "failure";
  duration_ms: number | null;
  context: string | null;
  created_at: string;
}

export interface StepResult {
  step: string;
  server?: string;
  tool?: string;
  status?: "success" | "failed" | "skipped";
  error?: string;
}

export interface Pattern {
  id: string;
  stack_fingerprint: string;
  pattern_key: string;
  pattern: string;
  observed_count: number;
  last_seen: string;
}

export interface ToolUsage {
  server: string;
  tool: string;
  task_type: string;
  co_used_with: string; // JSON array of tool identifiers
  success_count: number;
  fail_count: number;
}

export interface Workflow {
  id: string;
  name: string;
  description: string | null;
  steps: WorkflowStep[];
  created_at: string;
}

export interface WorkflowStep {
  name: string;
  server: string;
  tool: string;
  params_template: Record<string, string>;
  required: boolean;
}
