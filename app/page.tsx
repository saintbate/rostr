const GITHUB = "https://github.com/saintbate/rostr";
const NPM = "https://www.npmjs.com/package/rostr-mcp";

export default function Home() {
  return (
    <main className="relative min-h-screen">
      <nav className="border-b border-white/[0.06]">
        <div className="mx-auto flex max-w-3xl items-baseline justify-between gap-8 px-6 py-5">
          <a href="/" className="font-mono text-[15px] tracking-[0.08em] text-neutral-200">
            ROSTR
          </a>
          <div className="flex gap-8 font-mono text-[13px] text-neutral-500">
            <a href="#how" className="transition hover:text-neutral-300">
              how it works
            </a>
            <a href={GITHUB} className="transition hover:text-neutral-300">
              github
            </a>
            <a href={NPM} className="transition hover:text-neutral-300">
              npm
            </a>
          </div>
        </div>
      </nav>

      <header className="mx-auto max-w-3xl px-6 pb-16 pt-20 md:pt-28">
        <h1
          className="max-w-[20ch] text-[clamp(2.25rem,5vw,3.5rem)] font-semibold leading-[1.08] tracking-[-0.02em] text-neutral-100"
          style={{ fontFamily: "var(--font-newsreader), ui-serif, Georgia, serif" }}
        >
          Your Cursor has 8 MCP servers and 200+ tool definitions. The model sees all of them, every turn.
        </h1>
        <p className="mt-6 max-w-lg text-[16px] leading-relaxed text-neutral-400">
          Rostr is a local proxy that sits in front of the rest. Four tools, one
          playbook file, zero cloud dependencies. The context window gets its headroom back.
        </p>

        <div className="mt-10">
          <CodeBlock lines={["npm install -g rostr-mcp", "rostr init"]} />
          <p className="mt-3 font-mono text-[12px] text-neutral-600">
            Add <span className="text-neutral-400">rostr-mcp</span> to{" "}
            <span className="text-neutral-400">.cursor/mcp.json</span>, reload. That&apos;s it.
          </p>
        </div>
      </header>

      <section className="border-t border-white/[0.06] py-14 md:py-20">
        <div className="mx-auto max-w-3xl px-6">
          <h2 className="text-sm font-medium uppercase tracking-widest text-neutral-500">
            Before / after
          </h2>
          <div className="mt-8 grid gap-6 sm:grid-cols-2">
            <div className="space-y-3 rounded border border-white/[0.06] p-5">
              <p className="font-mono text-[11px] uppercase tracking-wider text-neutral-600">Without Rostr</p>
              <dl className="space-y-2 text-sm">
                <div className="flex justify-between gap-4"><dt className="text-neutral-500">MCP servers loaded</dt><dd className="text-neutral-300">8</dd></div>
                <div className="flex justify-between gap-4"><dt className="text-neutral-500">Tool schemas in context</dt><dd className="text-neutral-300">~200</dd></div>
                <div className="flex justify-between gap-4"><dt className="text-neutral-500">Tokens burned on tools</dt><dd className="text-neutral-300">~87k</dd></div>
                <div className="flex justify-between gap-4"><dt className="text-neutral-500">Memory across sessions</dt><dd className="text-neutral-300">none</dd></div>
              </dl>
            </div>
            <div className="space-y-3 rounded border border-orange-500/20 bg-orange-500/[0.02] p-5">
              <p className="font-mono text-[11px] uppercase tracking-wider text-orange-400/60">With Rostr</p>
              <dl className="space-y-2 text-sm">
                <div className="flex justify-between gap-4"><dt className="text-neutral-500">MCP servers loaded</dt><dd className="text-neutral-200">1</dd></div>
                <div className="flex justify-between gap-4"><dt className="text-neutral-500">Tool schemas in context</dt><dd className="text-neutral-200">4</dd></div>
                <div className="flex justify-between gap-4"><dt className="text-neutral-500">Tokens burned on tools</dt><dd className="text-neutral-200">~4k</dd></div>
                <div className="flex justify-between gap-4"><dt className="text-neutral-500">Memory across sessions</dt><dd className="text-neutral-200">.mdc playbook</dd></div>
              </dl>
            </div>
          </div>
        </div>
      </section>

      <section id="how" className="border-t border-white/[0.06] py-14 md:py-20">
        <div className="mx-auto max-w-3xl px-6">
          <h2 className="text-sm font-medium uppercase tracking-widest text-neutral-500">
            How it works
          </h2>
          <div className="mt-8 space-y-6">
            <div className="grid gap-2 sm:grid-cols-[8rem_1fr] sm:gap-6">
              <h3 className="font-mono text-[13px] text-neutral-300">Discover</h3>
              <p className="text-[15px] leading-relaxed text-neutral-500">
                Reads your <code className="text-neutral-400">.cursor/mcp.json</code> and plugin directories.
                Builds a roster of what&apos;s actually connected right now.
              </p>
            </div>
            <div className="grid gap-2 sm:grid-cols-[8rem_1fr] sm:gap-6">
              <h3 className="font-mono text-[13px] text-neutral-300">Plan</h3>
              <p className="text-[15px] leading-relaxed text-neutral-500">
                <code className="text-neutral-400">suggest_plan</code> looks at the goal, your servers, and
                your run history. Returns a sequence with warnings where things have broken before.
              </p>
            </div>
            <div className="grid gap-2 sm:grid-cols-[8rem_1fr] sm:gap-6">
              <h3 className="font-mono text-[13px] text-neutral-300">Execute</h3>
              <p className="text-[15px] leading-relaxed text-neutral-500">
                The agent still calls Neon, Stripe, GitHub directly. Rostr doesn&apos;t proxy HTTP.
                It routes attention, not packets.
              </p>
            </div>
            <div className="grid gap-2 sm:grid-cols-[8rem_1fr] sm:gap-6">
              <h3 className="font-mono text-[13px] text-neutral-300">Learn</h3>
              <p className="text-[15px] leading-relaxed text-neutral-500">
                <code className="text-neutral-400">log_run</code> records outcomes. Patterns get extracted.{" "}
                <code className="text-neutral-400">.cursor/rules/rostr.mdc</code> gets rewritten so the next
                turn starts with context.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="border-t border-white/[0.06] py-14 md:py-20">
        <div className="mx-auto max-w-3xl px-6">
          <h2 className="text-sm font-medium uppercase tracking-widest text-neutral-500">
            Tools
          </h2>
          <div className="mt-8 overflow-x-auto">
            <table className="w-full border-collapse text-left font-mono text-[13px]">
              <thead>
                <tr className="border-b border-white/[0.1] text-neutral-600">
                  <th className="pb-3 pr-6 font-normal">name</th>
                  <th className="pb-3 pr-6 font-normal">when</th>
                  <th className="pb-3 font-normal">what</th>
                </tr>
              </thead>
              <tbody className="text-neutral-300">
                {([
                  ["list_roster", "Start of a task", "Connected servers, saved workflows, recent stacks"],
                  ["suggest_plan", "Before multi-step work", "Optimal sequence with failure warnings from history"],
                  ["log_run", "After a run", "Persists outcome, extracts patterns, rewrites .mdc"],
                  ["recall_playbook", "Unfamiliar stack combo", "Known patterns and success rates for that set of servers"],
                ] as const).map(([name, when, what]) => (
                  <tr key={name} className="border-b border-white/[0.06]">
                    <td className="py-3 pr-6 align-top text-orange-400/80">{name}</td>
                    <td className="py-3 pr-6 align-top text-neutral-500">{when}</td>
                    <td className="py-3 align-top text-neutral-400">{what}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section className="border-t border-white/[0.06] py-14 md:py-20">
        <div className="mx-auto max-w-3xl px-6">
          <div className="grid gap-8 lg:grid-cols-[1fr_auto]">
            <div>
              <h2 className="text-sm font-medium uppercase tracking-widest text-neutral-500">
                Pattern learning
              </h2>
              <p className="mt-4 max-w-md text-[15px] leading-relaxed text-neutral-500">
                Every logged run gets fed through rule-based extraction. Failure rates, ordering
                dependencies, timing quirks. No model calls, no cloud. SQLite and a rules file
                that Cursor already reads.
              </p>
            </div>
            <CodeBlock
              title="rostr patterns"
              prompt={false}
              lines={[
                "run_sql fails after fast runs — space steps",
                "create_branch → run_sql works in that order",
                "Neon stack: 43% success over 7 runs",
              ]}
            />
          </div>
        </div>
      </section>

      <section className="border-t border-white/[0.06] py-14 md:py-16">
        <div className="mx-auto max-w-3xl px-6">
          <CodeBlock lines={["npm install -g rostr-mcp && rostr init"]} />
          <p className="mt-4 text-sm text-neutral-600">
            Local only. MIT licensed. No account, no API keys, no telemetry.
          </p>
        </div>
      </section>

      <footer className="border-t border-white/[0.06] py-8">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-6 font-mono text-[12px] text-neutral-600">
          <span>rostr · mit</span>
          <a href={GITHUB} className="transition hover:text-neutral-400">github</a>
        </div>
      </footer>
    </main>
  );
}

function CodeBlock({
  lines,
  title,
  prompt = true,
}: {
  lines: string[];
  title?: string;
  prompt?: boolean;
}) {
  return (
    <div className="w-full max-w-md border border-white/[0.08] bg-[#0c0c0c]">
      {title ? (
        <div className="border-b border-white/[0.06] px-4 py-2 font-mono text-[11px] uppercase tracking-wider text-neutral-600">
          {title}
        </div>
      ) : null}
      <pre className="overflow-x-auto p-4 font-mono text-[13px] leading-relaxed">
        {lines.map((line, i) => (
          <div key={i} className="flex gap-3">
            {prompt ? (
              <span className="select-none text-neutral-600">$</span>
            ) : (
              <span className="select-none w-3 shrink-0" />
            )}
            <span className="text-neutral-300">{line}</span>
          </div>
        ))}
      </pre>
    </div>
  );
}
