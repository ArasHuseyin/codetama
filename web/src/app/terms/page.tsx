export default function TermsPage() {
  return (
    <main className="space-y-6 max-w-2xl">
      <header>
        <p className="dim text-sm">/terms</p>
        <h1 className="text-3xl mt-2">terms of service</h1>
      </header>
      <section className="panel space-y-3 text-sm dim">
        <p>
          Codetama is a free game provided as-is, without warranty. By using it you agree to these
          terms.
        </p>
        <p>
          You retain all rights to your code, prompts, and creatures. We reserve the right to
          revoke tokens or accounts that abuse the service (cheating, mass spam, automation that
          inflates stats).
        </p>
        <p>
          The game is for entertainment. There is no payment, no in-game economy with real-money
          value, and no representations of fitness for any particular purpose.
        </p>
        <p>
          By using Codetama you agree not to attempt to extract data about other users beyond what
          the public APIs return.
        </p>
      </section>
    </main>
  );
}
