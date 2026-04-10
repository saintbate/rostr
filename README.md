# Rostr

Intelligent MCP proxy for Cursor. One server instead of eight — 90% less context window bloat.

## What is this?

Rostr sits between Cursor's AI and your MCP servers. Instead of 8 servers injecting ~200 tool definitions into every context window, Rostr exposes 4 tools and a lightweight playbook file. It auto-discovers your connected servers, learns patterns from every workflow run, and provides sequencing advice — all locally, no cloud, no API keys.

## Quick Start

```bash
npm install -g rostr
rostr init
```

Add to `.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "rostr": {
      "command": "npx",
      "args": ["-y", "rostr-mcp"]
    }
  }
}
```

Restart Cursor. Done.

## MCP Tools

| Tool | When Cursor uses it |
|------|-------------------|
| `list_roster` | Start of any infra task — see connected servers and saved workflows |
| `suggest_plan` | Before multi-step work — get the optimal sequence with failure warnings |
| `log_run` | After completing a task — log the outcome so Rostr learns |
| `recall_playbook` | Before unfamiliar stack combos — get known patterns and success rates |

## CLI

```bash
rostr status                        # Servers, stats, pattern count
rostr workflow list                  # Saved workflows
rostr workflow add --name "deploy"   # Add a workflow
rostr logs                           # Recent runs
rostr patterns                       # Learned patterns
rostr reset --yes                    # Clear all data
```

## How It Works

1. **Discover** — reads `.cursor/mcp.json` + plugin directories to find all your servers
2. **Advise** — `suggest_plan` returns optimal step sequences with warnings from past failures
3. **Learn** — `log_run` records outcomes, extracts patterns (failure rates, ordering dependencies, timing)
4. **Inject** — writes `.cursor/rules/rostr.mdc` with `alwaysApply: true` so Cursor reads patterns on every turn

All data stored locally in `~/.rostr/rostr.db` (SQLite).

## Repository Structure

```
rostr/
├── app/                   # Landing page (Next.js)
├── mcp-server/            # The npm package
│   └── src/
│       ├── index.ts       # MCP server entry (stdio)
│       ├── cli.ts         # CLI entry (rostr command)
│       ├── tools/         # list_roster, suggest_plan, log_run, recall_playbook
│       └── lib/           # db, config, playbook, mdc-writer
└── .cursor/
    └── rules/rostr.mdc    # Auto-generated playbook
```

## License

MIT
