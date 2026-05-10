import type { Metadata } from "next";
import { Major_Mono_Display, Inter, JetBrains_Mono } from "next/font/google";
import { Battle } from "./Battle";
import { CopyCommand } from "./CopyCommand";
import { CLASSES } from "../terminal/sprites";
import styles from "./cyberpunk.module.css";

const display = Major_Mono_Display({
  subsets: ["latin"],
  weight: ["400"],
  variable: "--font-cyb-display",
  display: "swap",
});
const body = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-cyb-body",
  display: "swap",
});
const mono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-cyb-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "preview / cyberpunk",
  description: "Cyberpunk neon aesthetic preview.",
};

export default function CyberpunkPreviewPage() {
  return (
    <div className={`${styles.shell} ${display.variable} ${body.variable} ${mono.variable}`}>
      {/* HUD bar */}
      <div className={styles.hud}>
        <span className={styles.hudLeft}>
          <span className={styles.hudDot} aria-hidden />
          <span className={styles.hudPink}>NET://</span> codetama.live
        </span>
        <span className={styles.hudRight}>
          <span className={styles.hudCyan}>v0.2.0</span> &nbsp;//&nbsp; sec.online
        </span>
      </div>

      {/* Hero */}
      <section className={styles.hero}>
        <div className={styles.titleStack}>
          <span className={styles.preTitle}>
            <span className={styles.preTitleBracket}>{"<"}</span>
            tamagotchi · for · claude · code
            <span className={styles.preTitleBracket}>{"/>"}</span>
          </span>

          <h1 className={styles.title}>
            <span className={styles.titleLine1}>a creature</span>
            <span className={styles.titleLine2}>that lives</span>
            <span className={styles.titleLine1}>in your code.</span>
          </h1>

          <p className={styles.lede}>
            Hooks into Claude Code. Every prompt feeds it. Every tool you reach for shapes its
            character. Forget about it for a week and it dies. Battle other devs over{" "}
            <strong>tiles on a shared map</strong>.
          </p>
        </div>

        <Battle />
      </section>

      {/* Actions */}
      <div className={styles.actions}>
        <CopyCommand command="npm install -g codetama" />
        <a className={styles.btnGhost} href="/login">
          <span>// auth.github</span>
          <span aria-hidden>→</span>
        </a>
      </div>

      {/* Stats */}
      <section className={styles.stats}>
        <div className={styles.statCell}>
          <div className={`${styles.statValue} ${styles.statValuePink}`}>04</div>
          <div className={styles.statLabel}>classes</div>
        </div>
        <div className={styles.statCell}>
          <div className={styles.statValue}>16</div>
          <div className={styles.statLabel}>skills</div>
        </div>
        <div className={styles.statCell}>
          <div className={`${styles.statValue} ${styles.statValueCyan}`}>01</div>
          <div className={styles.statLabel}>shared world</div>
        </div>
        <div className={styles.statCell}>
          <div className={styles.statValue}>∞</div>
          <div className={styles.statLabel}>tiles to claim</div>
        </div>
      </section>

      {/* Setup */}
      <section className={styles.section}>
        <div className={styles.sectionHead}>
          <span className={styles.sectionHeadBracket}>{"<<"}</span>
          <span>module · 01 · setup</span>
          <span className={styles.sectionHeadLine} aria-hidden />
          <span className={styles.sectionHeadBracket}>{">>"}</span>
        </div>
        <h2 className={styles.sectionTitle}>
          three commands.{" "}
          <span className={styles.sectionTitleAccent}>you&apos;re live.</span>
        </h2>
        <p className={styles.sectionLede}>
          solo runs fully offline. multiplayer is opt-in via a token from your profile —
          no github repo access required, ever.
        </p>
        <div className={styles.steps}>
          <div className={styles.step}>
            <div className={styles.stepNum}>01</div>
            <code className={styles.stepCmd}>npm install -g codetama</code>
            <p className={styles.stepDesc}>install the cli globally from npm.</p>
          </div>
          <div className={styles.step}>
            <div className={styles.stepNum}>02</div>
            <code className={styles.stepCmd}>codetama --install</code>
            <p className={styles.stepDesc}>idempotent hook into Claude Code settings.</p>
          </div>
          <div className={styles.step}>
            <div className={styles.stepNum}>03</div>
            <code className={styles.stepCmd}>codetama --view</code>
            <p className={styles.stepDesc}>watch your creature live in a tui.</p>
          </div>
        </div>
      </section>

      {/* Classes */}
      <section className={styles.section}>
        <div className={styles.sectionHead}>
          <span className={styles.sectionHeadBracket}>{"<<"}</span>
          <span>module · 02 · class registry</span>
          <span className={styles.sectionHeadLine} aria-hidden />
          <span className={styles.sectionHeadBracket}>{">>"}</span>
        </div>
        <h2 className={styles.sectionTitle}>
          your stats decide{" "}
          <span className={styles.sectionTitleAccent}>who it becomes.</span>
        </h2>
        <p className={styles.sectionLede}>
          when the creature reaches adult stage, the dominant stat — bash, read, or edit —
          locks in its class. balanced stats unlock the druid path.
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
              <p className={styles.classBlurb}>// {c.blurb}</p>
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

      {/* Feed Matrix */}
      <section className={styles.section}>
        <div className={styles.sectionHead}>
          <span className={styles.sectionHeadBracket}>{"<<"}</span>
          <span>module · 03 · feed matrix</span>
          <span className={styles.sectionHeadLine} aria-hidden />
          <span className={styles.sectionHeadBracket}>{">>"}</span>
        </div>
        <h2 className={styles.sectionTitle}>
          what you do with claude becomes{" "}
          <span className={styles.sectionTitleAccent}>who it is.</span>
        </h2>
        <p className={styles.sectionLede}>
          each tool call adds to a fractional buffer that feeds one stat — diminishing
          returns kick in fast. reaching lv 100 takes 10× the work of reaching lv 10.
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
                <td className={styles.feedNote}>// raises Warrior</td>
              </tr>
              <tr>
                <td className={styles.feedTool}>Read · Grep · Glob</td>
                <td><span className={styles.feedKey}>INT</span></td>
                <td className={styles.feedDelta}>+0.5/√int</td>
                <td className={styles.feedNote}>// raises Sage</td>
              </tr>
              <tr>
                <td className={styles.feedTool}>Edit · Write · MultiEdit</td>
                <td><span className={styles.feedKey}>DEX</span></td>
                <td className={styles.feedDelta}>+0.5/√dex</td>
                <td className={styles.feedNote}>// raises Trickster</td>
              </tr>
              <tr>
                <td className={styles.feedTool}>WebFetch · WebSearch</td>
                <td><span className={styles.feedKey}>INT</span></td>
                <td className={styles.feedDelta}>+0.5/√int</td>
                <td className={styles.feedNote}>// researches like a Sage</td>
              </tr>
              <tr>
                <td className={styles.feedTool}>UserPromptSubmit</td>
                <td><span className={styles.feedKey}>—</span></td>
                <td className={styles.feedDelta}>+10 hunger</td>
                <td className={styles.feedNote}>// advances stage progress</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* Origin */}
      <section className={styles.section}>
        <div className={styles.sectionHead}>
          <span className={styles.sectionHeadBracket}>{"<<"}</span>
          <span>module · 04 · origin</span>
          <span className={styles.sectionHeadLine} aria-hidden />
          <span className={styles.sectionHeadBracket}>{">>"}</span>
        </div>
        <h2 className={styles.sectionTitle}>
          why this <span className={styles.sectionTitleAccent}>exists.</span>
        </h2>
        <div className={styles.origin}>
          <p className={styles.originPara}>
            once there was <strong>promptcreatures.fun</strong>. it was great. then it stopped
            being maintained and the link rotted. we rebuilt it from scratch — with a deeper
            class system, a real battle engine, and a shared world map you can claim tiles on.
          </p>
          <p className={styles.originPara}>
            codetama hooks into claude code via{" "}
            <code style={{ color: "var(--c-cyan)", textShadow: "0 0 6px rgba(0, 229, 255, 0.4)" }}>
              UserPromptSubmit
            </code>{" "}
            and{" "}
            <code style={{ color: "var(--c-cyan)", textShadow: "0 0 6px rgba(0, 229, 255, 0.4)" }}>
              PostToolUse
            </code>. solo works offline. multiplayer is opt-in via a token from your profile —
            no github repo access required.
          </p>
          <aside className={styles.originAside}>
            it&apos;s a tamagotchi. it lives, it grows, it dies if you ignore it. and it has
            opinions about your tool usage.
          </aside>
        </div>
      </section>

      {/* Final CTA */}
      <section className={styles.finalCta}>
        <h2 className={styles.finalCtaTitle}>
          <span className={styles.finalCtaTitleA}>adopt one. </span>
          <span className={styles.finalCtaTitleB}>now.</span>
        </h2>
        <p className={styles.finalCtaBody}>
          one command. then forget about it — it&apos;ll live in your code.
        </p>
        <div className={styles.finalCtaActions}>
          <a className={styles.btnPrimary} href="#top">
            // npm i -g codetama
          </a>
          <a className={styles.btnGhost} href="/login">
            <span>auth.github</span>
            <span aria-hidden>→</span>
          </a>
        </div>
      </section>
    </div>
  );
}
