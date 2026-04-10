export default function Home() {
  return (
    <main className="min-h-screen">
      {/* Nav */}
      <nav className="fixed top-0 z-50 w-full border-b border-white/5 bg-[#0a0a0a]/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <span className="font-mono text-lg font-bold tracking-tight">
            rostr
          </span>
          <div className="flex items-center gap-6">
            <a
              href="https://github.com/nicholasbateman/rostr"
              className="text-sm text-neutral-400 transition hover:text-white"
            >
              GitHub
            </a>
            <a
              href="https://www.npmjs.com/package/rostr"
              className="text-sm text-neutral-400 transition hover:text-white"
            >
              npm
            </a>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="flex flex-col items-center justify-center px-6 pt-40 pb-24 text-center">
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-sm text-neutral-300">
          <span className="h-2 w-2 rounded-full bg-emerald-400" />
          v0.2 — now with CLI + pattern learning
        </div>
        <h1 className="max-w-3xl text-5xl font-bold leading-[1.1] tracking-tight md:text-6xl">
          One MCP server
          <br />
          <span className="text-neutral-500">instead of eight.</span>
        </h1>
        <p className="mt-6 max-w-xl text-lg text-neutral-400">
          Rostr is an intelligent MCP proxy for Cursor. It replaces hundreds of
          tool definitions with 4, learns from every workflow run, and keeps your
          context window clean.
        </p>
        <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row">
          <Terminal
            lines={["npm install -g rostr", "rostr init"]}
          />
        </div>
        <p className="mt-4 text-sm text-neutral-600">
          Works with Neon, Stripe, Vercel, GitHub, Supabase, Cloudflare, and any MCP server.
        </p>
      </section>

      {/* Before / After */}
      <section className="border-y border-white/5 bg-white/[0.02] py-24">
        <div className="mx-auto max-w-5xl px-6">
          <h2 className="mb-12 text-center text-3xl font-bold tracking-tight">
            90% less context window bloat
          </h2>
          <div className="grid gap-6 md:grid-cols-2">
            <ComparisonCard
              title="Without Rostr"
              bad
              items={[
                "8 MCP servers connected",
                "~200 tool definitions injected",
                "~4,000 tokens consumed per turn",
                "AI confused by irrelevant tools",
                "No memory between sessions",
              ]}
            />
            <ComparisonCard
              title="With Rostr"
              items={[
                "1 MCP server (Rostr)",
                "4 tool definitions total",
                "~400 tokens consumed per turn",
                "AI gets only what it needs",
                "Learns from every run",
              ]}
            />
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-24">
        <div className="mx-auto max-w-5xl px-6">
          <h2 className="mb-4 text-center text-3xl font-bold tracking-tight">
            How it works
          </h2>
          <p className="mx-auto mb-16 max-w-lg text-center text-neutral-400">
            Three steps. No cloud. No API keys. Everything runs locally.
          </p>
          <div className="grid gap-8 md:grid-cols-3">
            <Step
              num="01"
              title="Discover"
              desc="Rostr reads your .cursor/mcp.json and Cursor plugins to find every connected server automatically."
            />
            <Step
              num="02"
              title="Advise"
              desc="suggest_plan returns the optimal step sequence for any goal, with warnings from past failures."
            />
            <Step
              num="03"
              title="Learn"
              desc="log_run records outcomes, extracts patterns, and updates the .mdc playbook Cursor reads on every turn."
            />
          </div>
        </div>
      </section>

      {/* Tools */}
      <section className="border-y border-white/5 bg-white/[0.02] py-24">
        <div className="mx-auto max-w-5xl px-6">
          <h2 className="mb-12 text-center text-3xl font-bold tracking-tight">
            4 tools. That&apos;s it.
          </h2>
          <div className="grid gap-4 md:grid-cols-2">
            <ToolCard
              name="list_roster"
              when="Start of any infra task"
              what="Shows connected servers, saved workflows, and run history"
            />
            <ToolCard
              name="suggest_plan"
              when="Before multi-step work"
              what="Returns the optimal step sequence with failure warnings"
            />
            <ToolCard
              name="log_run"
              when="After completing a task"
              what="Records the outcome so Rostr learns for next time"
            />
            <ToolCard
              name="recall_playbook"
              when="Unfamiliar stack combo"
              what="Returns known patterns and success rates"
            />
          </div>
        </div>
      </section>

      {/* Pattern learning */}
      <section className="py-24">
        <div className="mx-auto max-w-5xl px-6">
          <h2 className="mb-4 text-center text-3xl font-bold tracking-tight">
            Gets smarter every run
          </h2>
          <p className="mx-auto mb-12 max-w-lg text-center text-neutral-400">
            Rostr extracts patterns automatically. No cloud, no AI calls — pure
            local rule-based learning.
          </p>
          <div className="mx-auto max-w-2xl">
            <Terminal
              title="rostr patterns"
              lines={[
                "  Learned Patterns:",
                "",
                '  [4x] run_migration fails 43% of the time',
                '  [3x] create_branch must complete before run_sql',
                '  [2x] fast failures suggest adding delays between steps',
                '  [2x] overall success rate: 60%',
              ]}
              prompt={false}
            />
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-white/5 py-24 text-center">
        <div className="mx-auto max-w-xl px-6">
          <h2 className="text-3xl font-bold tracking-tight">
            Stop drowning Cursor in tools.
          </h2>
          <p className="mt-4 text-neutral-400">
            Install Rostr in 30 seconds. No sign-up, no cloud, no API keys.
          </p>
          <div className="mt-8 flex justify-center">
            <Terminal lines={["npm install -g rostr && rostr init"]} />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 py-8">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 text-sm text-neutral-600">
          <span className="font-mono">rostr</span>
          <span>MIT License</span>
        </div>
      </footer>
    </main>
  );
}

function Terminal({
  lines,
  title,
  prompt = true,
}: {
  lines: string[];
  title?: string;
  prompt?: boolean;
}) {
  return (
    <div className="w-full max-w-lg overflow-hidden rounded-xl border border-white/10 bg-[#111] font-mono text-sm">
      {title && (
        <div className="border-b border-white/5 px-4 py-2 text-xs text-neutral-500">
          {title}
        </div>
      )}
      <div className="p-4">
        {lines.map((line, i) => (
          <div key={i} className="flex">
            {prompt && (
              <span className="mr-2 select-none text-emerald-400">$</span>
            )}
            <span className="text-neutral-200">{line}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function ComparisonCard({
  title,
  items,
  bad,
}: {
  title: string;
  items: string[];
  bad?: boolean;
}) {
  return (
    <div
      className={`rounded-xl border p-6 ${
        bad
          ? "border-red-500/20 bg-red-500/[0.03]"
          : "border-emerald-500/20 bg-emerald-500/[0.03]"
      }`}
    >
      <h3
        className={`mb-4 text-lg font-semibold ${
          bad ? "text-red-400" : "text-emerald-400"
        }`}
      >
        {title}
      </h3>
      <ul className="space-y-2">
        {items.map((item, i) => (
          <li key={i} className="flex items-start gap-2 text-sm text-neutral-300">
            <span className={`mt-0.5 ${bad ? "text-red-500" : "text-emerald-500"}`}>
              {bad ? "✗" : "✓"}
            </span>
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

function Step({
  num,
  title,
  desc,
}: {
  num: string;
  title: string;
  desc: string;
}) {
  return (
    <div className="rounded-xl border border-white/5 bg-white/[0.02] p-6">
      <span className="font-mono text-3xl font-bold text-neutral-700">
        {num}
      </span>
      <h3 className="mt-3 text-lg font-semibold">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-neutral-400">{desc}</p>
    </div>
  );
}

function ToolCard({
  name,
  when,
  what,
}: {
  name: string;
  when: string;
  what: string;
}) {
  return (
    <div className="rounded-xl border border-white/5 bg-white/[0.02] p-5">
      <code className="text-sm font-bold text-emerald-400">{name}</code>
      <p className="mt-1 text-xs text-neutral-500">{when}</p>
      <p className="mt-2 text-sm text-neutral-300">{what}</p>
    </div>
  );
}
