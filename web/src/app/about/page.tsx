import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "about",
  description: "What Codetama is, why it exists, and who built it.",
};

export default function AboutPage() {
  return (
    <main className="space-y-8 max-w-2xl">
      <header>
        <p className="dim text-sm">/about</p>
        <h1 className="text-3xl mt-2">about codetama</h1>
      </header>

      <section className="panel space-y-3 text-sm">
        <p>
          Codetama is a tamagotchi for developers. Your digital creature grows as you use{" "}
          <Link href="https://www.anthropic.com/claude-code">Claude Code</Link>. Every prompt is food. Every tool you reach for shapes
          its character. Forget about it for a week and it dies.
        </p>
        <p>
          It's inspired by{" "}
          <Link href="https://www.promptcreatures.fun/">prompt creatures</Link>, which is no longer
          maintained. We rebuilt it from scratch with a deeper class system, a real battle engine,
          and a shared world map.
        </p>
      </section>

      <section className="panel space-y-3 text-sm">
        <h2 className="text-lg">how it works</h2>
        <ul className="dim space-y-1">
          <li>· CLI binary <code className="text-fg">codetama</code> hooks into Claude Code's <code className="text-fg">UserPromptSubmit</code> + <code className="text-fg">PostToolUse</code></li>
          <li>· Each prompt feeds the active creature; tool calls grow stats (Bash → STR, Read → INT, Edit → DEX)</li>
          <li>· At Adult stage your stat distribution decides the class: Warrior / Sage / Trickster / Balanced</li>
          <li>· Multiplayer is opt-in via a Codetama CLI token from your profile page — no GitHub repo access required</li>
        </ul>
      </section>

      <section className="panel space-y-3 text-sm">
        <h2 className="text-lg">GitHub sign-in</h2>
        <ul className="dim space-y-1">
          <li>· GitHub OAuth is used only as a stable account identity.</li>
          <li>· Codetama never asks for your GitHub password.</li>
          <li>· Codetama does not request repository access.</li>
          <li>· CLI sync tokens are Codetama-only tokens, not GitHub credentials.</li>
        </ul>
      </section>

      <section className="panel space-y-3 text-sm">
        <h2 className="text-lg">stack</h2>
        <ul className="dim space-y-1">
          <li>· CLI: Node 20+, TypeScript, Ink (TUI)</li>
          <li>· Web: Next.js 15, App Router, Tailwind</li>
          <li>· Auth: NextAuth.js + GitHub OAuth</li>
          <li>· DB: Postgres (Neon), Drizzle ORM</li>
          <li>· Open source · MIT</li>
        </ul>
      </section>

      <section className="panel-tight text-sm dim">
        <p>
          contribute / report bugs:{" "}
          <Link href="https://github.com/ArasHuseyin/codetama">github.com/ArasHuseyin/codetama</Link>
        </p>
      </section>
    </main>
  );
}
