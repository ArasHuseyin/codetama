export default function RulesPage() {
  return (
    <main className="space-y-12">
      <header>
        <p className="dim text-sm">/rules</p>
        <h1 className="text-3xl mt-2">how the game works</h1>
      </header>

      <Section title="🥚 stages">
        <table className="w-full text-sm">
          <thead className="dim">
            <tr>
              <th className="text-left py-2">transition</th>
              <th className="text-left py-2">prompts</th>
              <th className="text-left py-2">notes</th>
            </tr>
          </thead>
          <tbody className="text-fg">
            <Row a="Egg → Baby (first)" b="6" c="bonus" />
            <Row a="Egg → Baby (subsequent)" b="5" c="veteran rebate" />
            <Row a="Baby → Adult" b="20" c="class is locked in" />
            <Row a="Adult → Elder" b="30" c="subform unlocks" />
            <Row a="Elder → Egg" b="40" c="retire & respawn" />
          </tbody>
        </table>
      </Section>

      <Section title="🍖 feeding">
        <ul className="space-y-1 text-sm dim">
          <li>· prompt → +10 hunger</li>
          <li>· Bash → +4 hunger, +1 STR</li>
          <li>· Read / Grep / Glob → +4 hunger, +1 INT</li>
          <li>· Edit / Write → +4 hunger, +1 DEX</li>
          <li>· WebFetch / WebSearch → +4 hunger, +1 INT</li>
          <li>· decay: <span className="text-fg">−3 hunger / hour</span></li>
          <li>· death: 7 days at 0 hunger straight</li>
        </ul>
      </Section>

      <Section title="🧬 classes (4)">
        <p className="text-sm dim">
          Determined automatically when entering Adult stage from your stat distribution. Tie rule:{" "}
          <code className="text-fg">max(stats) ≤ 1.25 × min(stats)</code> → Balanced.
        </p>
        <div className="grid sm:grid-cols-2 gap-3 text-sm">
          <ClassRow name="Warrior" stat="STR" elder="Warlord" />
          <ClassRow name="Sage" stat="INT" elder="Archmage" />
          <ClassRow name="Trickster" stat="DEX" elder="Shadow" />
          <ClassRow name="Balanced" stat="even split" elder="Druid" />
        </div>
      </Section>

      <Section title="⚔️ battles">
        <p className="text-sm dim">
          Defender strikes first. Skill-based, turn-based, no element counters — depth comes from
          cooldown timing and disruption.
        </p>
        <ul className="text-sm space-y-1 dim">
          <li>· max HP = <span className="text-fg">100 + STR×5 + LV×10</span></li>
          <li>· crit chance = <span className="text-fg">min(50, 5 + DEX/4)%</span> · crit ×2</li>
          <li>· damage = <span className="text-fg">skill.base × stat_factor × (1 − target.DEX/100)</span></li>
          <li>· battle energy: 5 / day, regenerates 1 every 4h</li>
        </ul>
      </Section>

      <Section title="🗺️ world map">
        <p className="text-sm dim">
          You hold one or more bases on a shared grid. You can attack/capture any tile within 2
          king-steps of any tile you own — same as moving a chess king twice. Multiplayer launches
          in a later sprint.
        </p>
      </Section>
    </main>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="panel space-y-3">
      <h2 className="text-lg">{title}</h2>
      {children}
    </section>
  );
}

function Row({ a, b, c }: { a: string; b: string; c: string }) {
  return (
    <tr className="border-t border-fgMuted">
      <td className="py-2">{a}</td>
      <td className="py-2 text-fg">{b}</td>
      <td className="py-2 dim">{c}</td>
    </tr>
  );
}

function ClassRow({ name, stat, elder }: { name: string; stat: string; elder: string }) {
  return (
    <div className="border border-fgMuted px-3 py-2">
      <div className="flex justify-between">
        <span className="text-fg">{name}</span>
        <span className="dim">{stat}</span>
      </div>
      <div className="text-xs muted">elder: {elder}</div>
    </div>
  );
}
