import { getRecentRuns, upsertPattern, getRunStats } from "./db.js";
import type { Run, StepResult } from "../types.js";

export function extractPatterns(stackFingerprint: string): void {
  const runs = getRecentRuns(stackFingerprint, 30);
  if (runs.length < 2) return;

  findConsistentFailures(stackFingerprint, runs);
  findOrderingDependencies(stackFingerprint, runs);
  findTimingIssues(stackFingerprint, runs);
  findSuccessRates(stackFingerprint, runs);
}

function findConsistentFailures(stack: string, runs: Run[]): void {
  const failCounts: Record<string, number> = {};
  const totalRuns = runs.length;

  for (const run of runs) {
    for (const step of run.steps_failed) {
      const key = step.step || step.tool || "unknown";
      failCounts[key] = (failCounts[key] || 0) + 1;
    }
  }

  for (const [step, count] of Object.entries(failCounts)) {
    const rate = count / totalRuns;
    if (rate >= 0.3 && count >= 2) {
      upsertPattern(stack, `failure:${step}`, `${step} fails ${Math.round(rate * 100)}% of the time (${count}/${totalRuns} runs)`);
    }
  }
}

function findOrderingDependencies(stack: string, runs: Run[]): void {
  // When step B fails and step A didn't run or failed before it
  const successRuns = runs.filter((r) => r.outcome === "success");
  const failRuns = runs.filter((r) => r.outcome !== "success");

  if (successRuns.length === 0 || failRuns.length === 0) return;

  const successOrders = successRuns.map((r) =>
    r.steps_succeeded.map((s) => s.step || s.tool || "").filter(Boolean)
  );

  for (const failRun of failRuns) {
    for (const failedStep of failRun.steps_failed) {
      const failedName = failedStep.step || failedStep.tool || "";
      if (!failedName) continue;

      // Find which steps consistently precede this one in successful runs
      for (const order of successOrders) {
        const failIdx = order.indexOf(failedName);
        if (failIdx > 0) {
          const predecessor = order[failIdx - 1];
          const precededInFail = failRun.steps_succeeded.some(
            (s) => (s.step || s.tool) === predecessor
          );
          if (!precededInFail) {
            upsertPattern(stack, `ordering:${predecessor}->${failedName}`, `${predecessor} must complete before ${failedName}`);
          }
        }
      }
    }
  }
}

function findTimingIssues(stack: string, runs: Run[]): void {
  // Look for runs where fast duration correlates with failure
  const withDuration = runs.filter((r) => r.duration_ms != null);
  if (withDuration.length < 3) return;

  const successDurations = withDuration
    .filter((r) => r.outcome === "success")
    .map((r) => r.duration_ms!);
  const failDurations = withDuration
    .filter((r) => r.outcome !== "success")
    .map((r) => r.duration_ms!);

  if (successDurations.length === 0 || failDurations.length === 0) return;

  const avgSuccess = successDurations.reduce((a, b) => a + b, 0) / successDurations.length;
  const avgFail = failDurations.reduce((a, b) => a + b, 0) / failDurations.length;

  if (avgFail < avgSuccess * 0.5 && failDurations.length >= 2) {
    upsertPattern(stack, "timing:fast_failures", "fast failures suggest a step needs more time to propagate — add delays between dependent steps");
  }
}

function findSuccessRates(stack: string, runs: Run[]): void {
  const stats = getRunStats(stack);
  if (stats.total >= 3) {
    const rate = Math.round((stats.success / stats.total) * 100);
    if (rate < 70) {
      upsertPattern(stack, "success_rate", `overall success rate: ${rate}% (${stats.success}/${stats.total})`);
    }
  }
}
