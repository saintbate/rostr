# Rostr

Intelligent MCP proxy for Cursor. One server instead of eight — 90% less context window bloat.

Rostr sits between Cursor's AI and your MCP servers. It auto-discovers your connected servers, learns patterns from every workflow run, and provides optimized sequencing advice — all through 4 lightweight tools instead of flooding the context window with hundreds of tool definitions.

## Install

```bash
npm install -g rostr-mcp
rostr init
```

## Cursor Setup

Add Rostr to your `.cursor/mcp.json`:

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

Restart Cursor. Rostr will auto-discover your other MCP servers (Neon, Stripe, Vercel, etc.) and write a `.cursor/rules/rostr.mdc` playbook that Cursor reads on every interaction.

## How It Works

```
┌─────────────┐    ┌───────────┐    ┌─────────────────────┐
│  Cursor AI  │───▶│   Rostr   │───▶│  .cursor/rules/     │
│  (4 tools)  │    │  (local)  │    │  rostr.mdc          │
└─────────────┘    └─────┬─────┘    └─────────────────────┘
                         │
                   ┌─────▼─────┐
                   │  ~/.rostr │
                   │  SQLite   │
                   └───────────┘
```

1. **Discover** — Rostr reads `.cursor/mcp.json` and plugin directories to find your servers
2. **Advise** — `suggest_plan` returns the optimal step sequence with warnings from past failures
3. **Learn** — `log_run` records outcomes, extracts patterns, updates the `.mdc` playbook
4. **Recall** — `recall_playbook` returns failure patterns and success rates for any stack combination

## MCP Tools

| Tool | When Cursor uses it |
|------|-------------------|
| `list_roster` | Start of any infra task — see connected servers and saved workflows |
| `suggest_plan` | Before multi-step work — get the optimal sequence with failure warnings |
| `log_run` | After completing a task — log the outcome so Rostr learns |
| `recall_playbook` | Before unfamiliar stack combos — get known patterns and success rates |

## CLI Commands

```bash
rostr init                          # Discover servers, create DB, write .mdc
rostr status                        # Show servers, stats, pattern count
rostr workflow list                  # List saved workflows
rostr workflow add --name "deploy"   # Add a workflow (--file or --steps)
rostr workflow remove "deploy"       # Remove a workflow
rostr logs                           # Recent runs (--stack, --limit)
rostr patterns                       # Learned patterns (--stack, --limit)
rostr reset --yes                    # Clear all data
```

## Pattern Learning

Rostr extracts patterns automatically after each logged run:

- **Failure rates** — "run_migration fails 43% of the time"
- **Ordering** — "create_branch must complete before run_sql"
- **Timing** — "fast failures suggest adding delays between steps"
- **Success rates** — "overall success rate: 60%"

Patterns are stored locally in `~/.rostr/rostr.db` and surfaced in the `.mdc` playbook and through `suggest_plan` / `recall_playbook`.

## Token Efficiency

Without Rostr, 8 MCP servers expose ~200 tool definitions to the AI, consuming thousands of context tokens on every interaction. Rostr replaces all of that with 4 tools and a lightweight `.mdc` rule file, keeping pattern context under 200 tokens.

## License

MIT
