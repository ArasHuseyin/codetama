import type { Metadata } from "next";
import { Press_Start_2P, VT323 } from "next/font/google";
import { Battle } from "./Battle";
import { Menu } from "./Menu";
import { CLASSES } from "../terminal/sprites";
import styles from "./pixel.module.css";

const display = Press_Start_2P({
  subsets: ["latin"],
  weight: ["400"],
  variable: "--font-pixel-display",
  display: "swap",
});
const body = VT323({
  subsets: ["latin"],
  weight: ["400"],
  variable: "--font-pixel-body",
  display: "swap",
});

export const metadata: Metadata = {
  title: "preview / pixel",
  description: "Pixel-art / GameBoy DMG aesthetic preview.",
};

export default function PixelPreviewPage() {
  return (
    <div className={`${styles.shell} ${display.variable} ${body.variable}`}>
      <div className={styles.screen}>
        <div className={styles.headerBar}>
          <span>★ CODETAMA ★ DMG-001</span>
          <span>
            <span className={styles.headerLed} aria-hidden /> POWER
          </span>
        </div>

        {/* Hero */}
        <div className={styles.hero}>
          <h1 className={styles.title}>CODETAMA</h1>
          <p className={styles.subtitle}>
            a creature that <span className={styles.subtitleAccent}>lives</span> in your code.
          </p>
          <p className={styles.lede}>
            Hooks into Claude Code. Every prompt feeds it. Every tool you reach for shapes its
            character. Forget about it for a week and it dies. Battle other devs on a shared map.
          </p>
        </div>

        <Battle />

        <Menu />

        {/* Stats */}
        <section className={styles.stats}>
          <div className={styles.statBox}>
            <div className={styles.statValue}>04</div>
            <div className={styles.statLabel}>CLASSES</div>
          </div>
          <div className={styles.statBox}>
            <div className={styles.statValue}>16</div>
            <div className={styles.statLabel}>SKILLS</div>
          </div>
          <div className={styles.statBox}>
            <div className={styles.statValue}>01</div>
            <div className={styles.statLabel}>WORLD</div>
          </div>
          <div className={styles.statBox}>
            <div className={styles.statValue}>∞</div>
            <div className={styles.statLabel}>TILES</div>
          </div>
        </section>

        {/* Setup */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>01 BOOT SEQUENCE</h2>
          <p className={styles.sectionLede}>
            Three commands. Solo works fully offline. Multiplayer is opt-in.
          </p>
          <div className={styles.steps}>
            <div className={styles.step}>
              <div className={styles.stepNum}>STEP 01</div>
              <div className={styles.stepCmd}>npm install -g codetama</div>
              <p className={styles.stepDesc}>install the cli globally.</p>
            </div>
            <div className={styles.step}>
              <div className={styles.stepNum}>STEP 02</div>
              <div className={styles.stepCmd}>codetama --install</div>
              <p className={styles.stepDesc}>hook into claude code settings.</p>
            </div>
            <div className={styles.step}>
              <div className={styles.stepNum}>STEP 03</div>
              <div className={styles.stepCmd}>codetama --view</div>
              <p className={styles.stepDesc}>watch your creature live in a tui.</p>
            </div>
          </div>
        </section>

        {/* Class registry — Pokedex style */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>02 CLASS REGISTRY</h2>
          <p className={styles.sectionLede}>
            Stat dominance at adult stage decides which class you become.
          </p>
          <div className={styles.classes}>
            {CLASSES.map((c, i) => (
              <div key={c.name} className={styles.classCard}>
                <div className={styles.classDexId}>
                  No. {String(i + 1).padStart(3, "0")}
                </div>
                <div className={styles.classHead}>
                  <span className={styles.className}>{c.name}</span>
                  <span className={styles.classStat}>
                    <span className={styles.classSigil}>{c.sigil}</span> {c.stat}
                  </span>
                </div>
                <pre className={styles.classAscii}>{c.ascii}</pre>
                <p className={styles.classBlurb}>&ldquo;{c.blurb}&rdquo;</p>
                <div className={styles.classFoot}>
                  <span>
                    <span className={styles.classFootKey}>ELDER</span>
                    <br />
                    <span className={styles.classFootValue}>{c.elder}</span>
                  </span>
                  <span>
                    <span className={styles.classFootKey}>ULT</span>
                    <br />
                    <span className={styles.classFootValue}>{c.ult}</span>
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Feed Matrix */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>03 FEED MATRIX</h2>
          <p className={styles.sectionLede}>
            Tool calls map to stats with diminishing returns.
          </p>
          <div className={styles.feedScreen}>
            <table className={styles.feedTable}>
              <thead>
                <tr>
                  <th>TOOL</th>
                  <th>STAT</th>
                  <th>PER CALL</th>
                  <th>NOTE</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className={styles.feedTool}>BASH</td>
                  <td><span className={styles.feedKey}>STR</span></td>
                  <td className={styles.feedDelta}>+0.5/√STR</td>
                  <td className={styles.feedNote}>raises Warrior</td>
                </tr>
                <tr>
                  <td className={styles.feedTool}>READ · GREP</td>
                  <td><span className={styles.feedKey}>INT</span></td>
                  <td className={styles.feedDelta}>+0.5/√INT</td>
                  <td className={styles.feedNote}>raises Sage</td>
                </tr>
                <tr>
                  <td className={styles.feedTool}>EDIT · WRITE</td>
                  <td><span className={styles.feedKey}>DEX</span></td>
                  <td className={styles.feedDelta}>+0.5/√DEX</td>
                  <td className={styles.feedNote}>raises Trickster</td>
                </tr>
                <tr>
                  <td className={styles.feedTool}>WEBFETCH</td>
                  <td><span className={styles.feedKey}>INT</span></td>
                  <td className={styles.feedDelta}>+0.5/√INT</td>
                  <td className={styles.feedNote}>like a Sage</td>
                </tr>
                <tr>
                  <td className={styles.feedTool}>PROMPT</td>
                  <td><span className={styles.feedKey}>—</span></td>
                  <td className={styles.feedDelta}>+10 HUNGER</td>
                  <td className={styles.feedNote}>stage progress</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* Origin */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>04 ORIGIN</h2>
          <div className={styles.originBox}>
            <p className={styles.originPara}>
              Once there was <strong>promptcreatures.fun</strong>. It was great. Then it stopped
              being maintained and the link rotted. We rebuilt it from scratch — deeper class
              system, real battle engine, shared world map.
            </p>
            <p className={styles.originPara}>
              Codetama hooks into Claude Code via UserPromptSubmit and PostToolUse. Solo works
              offline. Multiplayer is opt-in via a token from your profile —{" "}
              <strong>no GitHub repo access required</strong>.
            </p>
          </div>
        </section>

        {/* Final CTA */}
        <div className={styles.endScreen}>
          <h2 className={styles.endTitle}>
            ADOPT ONE <span className={styles.endTitleAccent}>NOW</span>
          </h2>
          <p className={styles.endHint}>One command. Then forget about it.</p>
          <div className={styles.pressAToContinue}>► PRESS A TO CONTINUE</div>
        </div>
      </div>

      {/* Faux console buttons */}
      <div className={styles.console} aria-hidden>
        <div className={styles.consoleLeft}>
          <span className={styles.dpad} />
          SELECT &nbsp; START
        </div>
        <div className={styles.consoleRight}>
          B&nbsp;<span className={`${styles.button} ${styles.buttonB}`} />&nbsp; A&nbsp;
          <span className={styles.button} />
        </div>
      </div>
    </div>
  );
}
