import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "privacy",
  description: "What Codetama stores, where, and how to delete it.",
};

export default function PrivacyPage() {
  return (
    <main className="space-y-8 max-w-2xl">
      <header>
        <p className="dim text-sm">/privacy</p>
        <h1 className="text-3xl mt-2">privacy policy</h1>
        <p className="dim text-xs mt-1">Last updated: 2026-05-09</p>
      </header>

      <section className="panel space-y-3 text-sm">
        <h2 className="text-lg">tl;dr</h2>
        <ul className="dim space-y-1">
          <li>· Solo play is local-only — nothing leaves your machine.</li>
          <li>· Multiplayer stores game state + your GitHub login on our server.</li>
          <li>· We never read your prompts, files, or source code.</li>
          <li>· Delete your account anytime from <Link href="/profile" className="text-fg underline">/profile</Link>.</li>
        </ul>
      </section>

      <section className="panel space-y-3 text-sm">
        <h2 className="text-lg">what we store (multiplayer mode)</h2>
        <ul className="dim space-y-1">
          <li>· <span className="text-fg">Account:</span> GitHub user id, name, email, avatar URL — provided by GitHub OAuth when you sign in.</li>
          <li>· <span className="text-fg">CLI tokens:</span> a name you choose, a hash of the token (SHA-256, original is shown to you once and not stored), the first 12 characters as a prefix, plus created/last-used timestamps.</li>
          <li>· <span className="text-fg">Creatures:</span> name, stage, class, stats (STR/INT/DEX), hunger, prompt counters, birth/death/last-sync timestamps. No content of your prompts is stored.</li>
          <li>· <span className="text-fg">World map:</span> coordinates of tiles you own and acquisition timestamps.</li>
          <li>· <span className="text-fg">Battles:</span> opponent ids, skills used, damage rolls, outcomes, timestamps. Used for battle log + leaderboard.</li>
          <li>· <span className="text-fg">Sessions:</span> standard NextAuth session cookies + OAuth tokens issued by GitHub.</li>
        </ul>
      </section>

      <section className="panel space-y-3 text-sm">
        <h2 className="text-lg">what we do NOT store</h2>
        <ul className="dim space-y-1">
          <li>· The text of your prompts.</li>
          <li>· The contents, paths, or names of files in your projects.</li>
          <li>· Tool arguments (e.g. what you typed into Bash, what you read with Read).</li>
          <li>· Any data from Claude Code beyond a tool name (e.g. <code className="text-fg">Bash</code>, <code className="text-fg">Edit</code>) and a timestamp, sent only when you've opted into multiplayer.</li>
          <li>· Analytics, ad, or third-party tracking cookies.</li>
        </ul>
      </section>

      <section className="panel space-y-3 text-sm">
        <h2 className="text-lg">where it's stored</h2>
        <ul className="dim space-y-1">
          <li>· <span className="text-fg">Local state</span> (solo + multiplayer): <code className="text-fg">~/.codetama/state.json</code> on your machine. Plain JSON, you control it.</li>
          <li>· <span className="text-fg">Server data</span> (multiplayer only): Postgres database hosted by Neon (EU region). Web served by Vercel.</li>
        </ul>
      </section>

      <section className="panel space-y-3 text-sm">
        <h2 className="text-lg">your rights (GDPR)</h2>
        <ul className="dim space-y-1">
          <li>· <span className="text-fg">Access:</span> everything we have about you is visible on <Link href="/profile" className="text-fg underline">/profile</Link>, your <Link href="/u" className="text-fg underline">public profile</Link>, the <Link href="/map" className="text-fg underline">world map</Link>, and the <Link href="/leaderboard" className="text-fg underline">leaderboard</Link>.</li>
          <li>· <span className="text-fg">Deletion:</span> click "delete account" on /profile. Removes user, all creatures, tiles, battles, tokens, sessions, and OAuth records from our database. Cannot be undone.</li>
          <li>· <span className="text-fg">Export:</span> your local state.json is portable. For server data, request a dump via the contact below.</li>
          <li>· <span className="text-fg">Object / restrict:</span> stop multiplayer anytime by running <code className="text-fg">codetama --local</code> or revoking your CLI token.</li>
        </ul>
      </section>

      <section className="panel-tight text-sm dim">
        <p>
          Questions or data requests:{" "}
          <Link href="mailto:hello@codetama.com" className="text-fg">hello@codetama.com</Link>
        </p>
      </section>
    </main>
  );
}
