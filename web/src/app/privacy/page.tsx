export default function PrivacyPage() {
  return (
    <main className="space-y-6 max-w-2xl">
      <header>
        <p className="dim text-sm">/privacy</p>
        <h1 className="text-3xl mt-2">privacy policy</h1>
      </header>
      <section className="panel space-y-3 text-sm dim">
        <p>
          Codetama collects only what is needed to run the game: your GitHub login (id, name,
          avatar) and the names + last-used timestamps of CLI tokens you generate.
        </p>
        <p>
          The local creature state stored at <code className="text-fg">~/.codetama/state.json</code>{" "}
          stays on your machine until you opt into multiplayer mode. Even then we only sync
          summary stats (level, stage, hunger, class) — we never read your prompts, file paths, or
          source code.
        </p>
        <p>
          We use no third-party trackers. Errors are logged anonymously via Sentry (you can opt
          out).
        </p>
        <p>To delete your account and all data, log in and visit your profile page.</p>
      </section>
    </main>
  );
}
