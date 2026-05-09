import Link from "next/link";

const HERO_ART = String.raw`
   ___,                                    /\_/\
  /o o\__       .-~~~-.                   ( o.^ )      ___
 ( =T= )_)    /  o o  \                    > ^ <     /o o\
  \___//    |   <>     |                   |_|_|    ( ==  )
   |||       \  '-'   /                                \___/
  / | \       '~~~~~'                                  /| |\

  WARRIOR     SAGE              TRICKSTER             BALANCED
`;

export default function HomePage() {
  return (
    <main className="space-y-12">
      <section className="space-y-6">
        <div>
          <p className="dim text-sm">v0.1 · early access</p>
          <h1 className="text-4xl mt-2">A creature that lives in your code.</h1>
          <p className="mt-4 max-w-2xl text-fgDim">
            Codetama is a tamagotchi for developers. It grows as you use{" "}
            <span className="text-fg">Claude Code</span>. Every prompt feeds it. Every tool you
            reach for shapes its character. Forget about it for a week and it dies.
          </p>
        </div>

        <pre className="ascii panel-tight overflow-x-auto text-fg text-xs">{HERO_ART}</pre>

        <div className="flex flex-wrap gap-4">
          <Link href="/profile" className="btn">
            <span className="dim">$</span> get started
          </Link>
          <Link href="/rules" className="btn">
            read the rules
          </Link>
        </div>
      </section>

      <section className="grid md:grid-cols-3 gap-6">
        <Card title="01 · install" body="npm install -g codetama" />
        <Card title="02 · hook into Claude Code" body="codetama --install" />
        <Card title="03 · see your creature" body="codetama --view" />
      </section>

      <section className="panel space-y-4">
        <h2 className="text-xl">how feeding works</h2>
        <ul className="dim space-y-1 text-sm">
          <li>· Every prompt to Claude → +10 hunger</li>
          <li>· <span className="text-fg">Bash</span> → +1 STR</li>
          <li>· <span className="text-fg">Read</span> / Grep / Glob → +1 INT</li>
          <li>· <span className="text-fg">Edit</span> / Write → +1 DEX</li>
          <li>· Hunger decays 3 / hour. 0 hunger for 7 days = death.</li>
        </ul>
        <p className="text-sm">
          At adult stage, your stat distribution decides the class:
          <span className="text-fg"> Warrior</span> ·
          <span className="text-fg"> Sage</span> ·
          <span className="text-fg"> Trickster</span> ·
          <span className="text-fg"> Balanced</span>.
        </p>
      </section>

      <section className="panel-tight">
        <p className="text-sm">
          <span className="dim">tip:</span> multiplayer (world map, battles, base capture) is coming
          soon. solo works completely offline today.
        </p>
      </section>
    </main>
  );
}

function Card({ title, body }: { title: string; body: string }) {
  return (
    <div className="panel space-y-2">
      <h3 className="text-sm dim">{title}</h3>
      <code className="block text-fg">{body}</code>
    </div>
  );
}
