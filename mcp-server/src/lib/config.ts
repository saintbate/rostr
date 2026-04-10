import * as fs from "fs";
import * as path from "path";
import * as os from "os";
import type { McpServerEntry, DiscoveredServer } from "../types.js";

interface CursorMcpConfig {
  mcpServers?: Record<string, McpServerEntry>;
}

function findProjectRoot(): string {
  return process.env.ROSTR_PROJECT_ROOT || process.cwd();
}

function findCursorMcpJson(): string | null {
  const projectRoot = findProjectRoot();

  // Project-level config
  const projectConfig = path.join(projectRoot, ".cursor", "mcp.json");
  if (fs.existsSync(projectConfig)) return projectConfig;

  // Home-level config
  const homeConfig = path.join(os.homedir(), ".cursor", "mcp.json");
  if (fs.existsSync(homeConfig)) return homeConfig;

  return null;
}

export function discoverServers(): DiscoveredServer[] {
  const configServers = discoverConfigServers();
  const pluginServers = discoverPluginServers();

  const seen = new Set(configServers.map((s) => s.name.toLowerCase()));
  const merged = [...configServers];
  for (const ps of pluginServers) {
    if (!seen.has(ps.name.toLowerCase())) {
      merged.push(ps);
      seen.add(ps.name.toLowerCase());
    }
  }
  return merged;
}

function discoverConfigServers(): DiscoveredServer[] {
  const configPath = findCursorMcpJson();
  if (!configPath) return [];

  try {
    const raw = fs.readFileSync(configPath, "utf-8");
    const config: CursorMcpConfig = JSON.parse(raw);
    if (!config.mcpServers) return [];

    return Object.entries(config.mcpServers)
      .filter(([name]) => name !== "rostr")
      .map(([name, entry]) => ({
        name,
        type: entry.command ? "stdio" as const : "http" as const,
        enabled: entry.disabled !== true,
      }));
  } catch {
    return [];
  }
}

function discoverPluginServers(): DiscoveredServer[] {
  const projectRoot = findProjectRoot();
  const projectKey = projectRoot.replace(/^\//, "").replace(/\//g, "-");
  const mcpsDir = path.join(os.homedir(), ".cursor", "projects", projectKey, "mcps");

  if (!fs.existsSync(mcpsDir)) return [];

  try {
    const entries = fs.readdirSync(mcpsDir, { withFileTypes: true });
    return entries
      .filter((e) => e.isDirectory() && e.name.startsWith("plugin-"))
      .map((e) => {
        const parts = e.name.split("-");
        const raw = parts.slice(2).join("-");
        const name = raw.charAt(0).toUpperCase() + raw.slice(1);
        return { name, type: "plugin" as const, enabled: true };
      });
  } catch {
    return [];
  }
}

export function getProjectRoot(): string {
  return findProjectRoot();
}

export function getRostrDir(): string {
  return path.join(os.homedir(), ".rostr");
}
