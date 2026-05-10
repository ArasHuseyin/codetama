import type { Metadata } from "next";
import { Fraunces, Inter, JetBrains_Mono } from "next/font/google";
import { Battle } from "./Battle";
import { CopyCommand } from "./CopyCommand";
import { CLASSES } from "../terminal/sprites";
import styles from "./hybrid.module.css";

const fraunces = Fraunces({
  subsets: ["latin"],
  weight: ["300", "400", "500"],
  style: ["normal", "italic"],
  variable: "--font-serif",
  display: "swap",
});
const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-sans",
  display: "swap",
});
const mono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "preview / hybrid",
  description: "Hybrid: terminal motif + modern editorial layout.",
};

export default function HybridPreviewPage() {
  return (
    <div className={`${styles.shell} ${fraunces.variable} ${inter.variable} ${mono.variable}`}>
      {/* Hero */}
      <section className={styles.hero}>
        <div className={styles.heroIntro}>
          <span className={styles.eyebrow}>
            <span className={styles.eyebrowDot} aria-hidden />
            tamagotchi for claude code
          </span>

          <h1 className={styles.title}>
            A creature that <span className={styles.titleAccent}>lives</span> in your code.
          </h1>

          <p className={styles.lede}>
            Codetama grows as you use Claude Code. Every prompt feeds it. Every tool you reach
            for shapes its character. Forget about it for a week and it dies.
          </p>

          <div className={styles.actions}>
            <CopyCommand command="npm install -g codetama" />
            <a className={styles.btnSecondary} href="/login">
              <span>Sign in with GitHub</span>
              <span aria-hidden>→</span>
            </a>
          </div>
        </div>

        <Battle />
      </section>

      {/* Stats */}
      <section className={styles.stats} aria-label="At a glance">
        <div className={styles.statCell}>
          <div className={styles.statValue}>
            <span className={styles.statValueAccent}>4</span>
          </div>
          <div className={styles.statLabel}>classes</div>
        </div>
        <div className={styles.statCell}>
          <div className={styles.statValue}>16</div>
          <div className={styles.statLabel}>skills</div>
        </div>
        <div className={styles.statCell}>
          <div className={styles.statValue}>
            <span className={styles.statValueAccent}>1</span>
          </div>
          <div className={styles.statLabel}>shared world</div>
        </div>
        <div className={styles.statCell}>
          <div className={styles.statValue}>∞</div>
          <div className={styles.statLabel}>tiles to claim</div>
        </div>
      </section>

      {/* Setup */}
      <section className={styles.section}>
        <div className={styles.sectionLabel}>
          <span>01 · setup</span>
          <span className={styles.sectionLabelLine} aria-hidden />
        </div>
        <h2 className={styles.sectionHead}>
          Three commands and you&rsquo;re <span className={styles.sectionHeadAccent}>live.</span>
        </h2>
        <p className={styles.sectionLede}>
          Solo works fully offline. Multiplayer is opt-in via a token from your profile —
          no GitHub repo access required, ever.
        </p>
        <div className={styles.steps}>
          <div className={styles.step}>
            <div className={styles.stepNum}>01</div>
            <code className={styles.stepCmd}>npm install -g codetama</code>
            <p className={styles.stepDesc}>install the cli globally from the npm registry.</p>
          </div>
          <div className={styles.step}>
            <div className={styles.stepNum}>02</div>
            <code className={styles.stepCmd}>codetama --install</code>
            <p className={styles.stepDesc}>idempotent hook into Claude Code&rsquo;s settings.json.</p>
          </div>
          <div className={styles.step}>
            <div className={styles.stepNum}>03</div>
            <code className={styles.stepCmd}>codetama --view</code>
            <p className={styles.stepDesc}>watch your creature live in a tui as you code.</p>
          </div>
        </div>
      </section>

      {/* Classes */}
      <section className={styles.section}>
        <div className={styles.sectionLabel}>
          <span>02 · class registry</span>
          <span className={styles.sectionLabelLine} aria-hidden />
        </div>
        <h2 className={styles.sectionHead}>
          Your stats decide <span className={styles.sectionHeadAccent}>who it becomes.</span>
        </h2>
        <p className={styles.sectionLede}>
          When the creature reaches Adult stage, the dominant stat — Bash, Read, or Edit —
          locks in its class. Balanced stats unlock the Druid path.
        </p>
        <div className={styles.classes}>
          {CLASSES.map((c) => (
            <div key={c.name} className={styles.classCard}>
              <div className={styles.classHead}>
                <span className={styles.className}>{c.name.toLowerCase()}</span>
                <span className={styles.classStat}>
                  <span className={styles.classSigil}>{c.sigil}</span> {c.stat}
                </span>
              </div>
              <pre className={styles.classAscii}>{c.ascii}</pre>
              <p className={styles.classBlurb}>{c.blurb}</p>
              <div className={styles.classFoot}>
                <span>
                  <span className={styles.classFootKey}>elder </span>
                  <span className={styles.classFootValue}>{c.elder}</span>
                </span>
                <span>
                  <span className={styles.classFootKey}>ult </span>
                  <span className={styles.classFootValue}>{c.ult}</span>
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Feeding */}
      <section className={styles.section}>
        <div className={styles.sectionLabel}>
          <span>03 · feed matrix</span>
          <span className={styles.sectionLabelLine} aria-hidden />
        </div>
        <h2 className={styles.sectionHead}>
          What you do with Claude becomes <span className={styles.sectionHeadAccent}>who it is.</span>
        </h2>
        <p className={styles.sectionLede}>
          Each tool call adds to a fractional buffer that feeds one stat — diminishing
          returns kick in fast. Reaching LV 100 takes 10× the work of reaching LV 10.
        </p>
        <div className={styles.feed}>
          <table className={styles.feedTable}>
            <thead>
              <tr>
                <th>tool</th>
                <th>fed stat</th>
                <th>per call</th>
                <th>note</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className={styles.feedTool}>Bash</td>
                <td><span className={styles.feedKey}>STR</span></td>
                <td className={styles.feedDelta}>+0.5/√str</td>
                <td className={styles.feedNote}>raises Warrior</td>
              </tr>
              <tr>
                <td className={styles.feedTool}>Read · Grep · Glob</td>
                <td><span className={styles.feedKey}>INT</span></td>
                <td className={styles.feedDelta}>+0.5/√int</td>
                <td className={styles.feedNote}>raises Sage</td>
              </tr>
              <tr>
                <td className={styles.feedTool}>Edit · Write · MultiEdit</td>
                <td><span className={styles.feedKey}>DEX</span></td>
                <td className={styles.feedDelta}>+0.5/√dex</td>
                <td className={styles.feedNote}>raises Trickster</td>
              </tr>
              <tr>
                <td className={styles.feedTool}>WebFetch · WebSearch</td>
                <td><span className={styles.feedKey}>INT</span></td>
                <td className={styles.feedDelta}>+0.5/√int</td>
                <td className={styles.feedNote}>researches like a Sage</td>
              </tr>
              <tr>
                <td className={styles.feedTool}>UserPromptSubmit</td>
                <td><span className={styles.feedKey}>—</span></td>
                <td className={styles.feedDelta}>+10 hunger</td>
                <td className={styles.feedNote}>advances stage progress</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* Origin */}
      <section className={styles.section}>
        <div className={styles.sectionLabel}>
          <span>04 · origin</span>
          <span className={styles.sectionLabelLine} aria-hidden />
        </div>
        <h2 className={styles.sectionHead}>
          Why this <span className={styles.sectionHeadAccent}>exists.</span>
        </h2>
        <div className={styles.origin}>
          <div className={styles.originDropcap}>O</div>
          <div className={styles.originBody}>
            <p className={styles.originPara}>
              nce there was <strong>promptcreatures.fun</strong>. It was great. Then it stopped
              being maintained and the link rotted. We rebuilt it from scratch, with a deeper
              class system, a real battle engine, and a shared world map you can claim tiles on.
            </p>
            <p className={styles.originPara}>
              Codetama hooks into Claude Code via{" "}
              <code style={{ fontFamily: "var(--font-mono)", fontSize: "0.9em" }}>
                UserPromptSubmit
              </code>{" "}
              and{" "}
              <code style={{ fontFamily: "var(--font-mono)", fontSize: "0.9em" }}>
                PostToolUse
              </code>. Solo works offline. Multiplayer is opt-in via a token from your profile —
              no GitHub repo access required.
            </p>
            <aside className={styles.originAside}>
              It&rsquo;s a tamagotchi. It lives, it grows, it dies if you ignore it. And it has
              opinions about your tool usage.
            </aside>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className={styles.finalCta}>
        <h2 className={styles.finalCtaTitle}>
          Adopt one <span className={styles.finalCtaTitleAccent}>now.</span>
        </h2>
        <p className={styles.finalCtaBody}>
          One command. Then forget about it — it&rsquo;ll live in your code.
        </p>
        <div className={styles.finalCtaActions}>
          <a className={styles.btnPrimary} href="#top">
            npm install -g codetama
          </a>
          <a className={styles.btnSecondary} href="/login">
            Sign in with GitHub
          </a>
        </div>
      </section>
    </div>
  );
}
