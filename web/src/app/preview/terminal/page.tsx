import type { Metadata } from "next";
import { Battle } from "./Battle";
import { CopyCommand } from "./CopyCommand";
import { LiveFeed } from "./LiveFeed";
import { Section } from "./Section";
import { CLASSES } from "./sprites";
import {
  WarriorWire,
  SageWire,
  TricksterWire,
  BalancedWire,
} from "../sprites/WireframeSprites";
import styles from "./terminal.module.css";

const CLASS_SPRITES: Record<string, React.ComponentType> = {
  WARRIOR: WarriorWire,
  SAGE: SageWire,
  TRICKSTER: TricksterWire,
  BALANCED: BalancedWire,
};

const BANNER = String.raw` ██████╗ ██████╗ ██████╗ ███████╗████████╗ █████╗ ███╗   ███╗ █████╗
██╔════╝██╔═══██╗██╔══██╗██╔════╝╚══██╔══╝██╔══██╗████╗ ████║██╔══██╗
██║     ██║   ██║██║  ██║█████╗     ██║   ███████║██╔████╔██║███████║
██║     ██║   ██║██║  ██║██╔══╝     ██║   ██╔══██║██║╚██╔╝██║██╔══██║
╚██████╗╚██████╔╝██████╔╝███████╗   ██║   ██║  ██║██║ ╚═╝ ██║██║  ██║
 ╚═════╝ ╚═════╝ ╚═════╝ ╚══════╝   ╚═╝   ╚═╝  ╚═╝╚═╝     ╚═╝╚═╝  ╚═╝`;

export const metadata: Metadata = {
  title: "preview / terminal",
  description: "Refined CRT terminal aesthetic preview for the Codetama landing page.",
};

export default function TerminalPreviewPage() {
  return (
    <div className={styles.shell}>
      {/* Boot line */}
      <div className={styles.bootLine}>
        <span className={styles.prompt}>codetama@dev:~$</span>
        <span className={styles.bootText}>./codetama --hero</span>
        <span className={styles.cursor} aria-hidden>
          &nbsp;
        </span>
      </div>

      {/* ASCII banner title */}
      <div className={styles.bannerWrap} role="heading" aria-level={1} aria-label="Codetama">
        <div className={styles.bannerHud} aria-hidden>
          <span>NET// codetama.live</span>
          <span>SYS// online</span>
          <span>VER// 0.2.0</span>
          <span>UPLINK// stable</span>
        </div>
        <div className={styles.bannerArt} aria-hidden>{BANNER}</div>
      </div>

      <p className={styles.subtitle}>a creature that lives in your code.</p>
      <p className={styles.tagline}>
        — fed by every prompt · shaped by every tool · battles for territory
      </p>

      {/* Battle */}
      <Battle />

      {/* Live feed */}
      <LiveFeed />

      {/* CTAs */}
      <div className={styles.ctas}>
        <CopyCommand command="npm install -g codetama" />
        <a className={styles.btnSecondary} href="/login">
          <span>or sign in with GitHub</span>
          <span aria-hidden>→</span>
        </a>
      </div>

      {/* Setup */}
      <Section label="01 // BOOT SEQUENCE">
        <div className={styles.steps}>
          <Step n="01" cmd="npm install -g codetama" desc="install the cli globally" />
          <Step n="02" cmd="codetama --install" desc="hook into Claude Code" />
          <Step n="03" cmd="codetama --view" desc="watch your creature live" />
        </div>
      </Section>

      {/* Classes */}
      <Section label="02 // CLASS REGISTRY">
        <div className={styles.classGrid}>
          {CLASSES.map((c) => {
            const Sprite = CLASS_SPRITES[c.name];
            return (
              <div key={c.name} className={styles.classCard}>
                <div className={styles.classHead}>
                  <span className={styles.className}>{c.name}</span>
                  <span className={styles.classStat}>
                    <span className={styles.classSigil}>{c.sigil}</span> {c.stat}
                  </span>
                </div>
                <div className={styles.classWire}>
                  {Sprite ? <Sprite /> : <pre className={styles.classAscii}>{c.ascii}</pre>}
                </div>
                <p className={styles.classBlurb}>{c.blurb}</p>
                <div className={styles.classFoot}>
                  <span>
                    <span className={styles.classFootLabel}>elder </span>
                    <span className={styles.classFootValue}>{c.elder}</span>
                  </span>
                  <span>
                    <span className={styles.classFootLabel}>ult </span>
                    <span className={styles.classFootValue}>{c.ult}</span>
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </Section>

      {/* Feed Matrix */}
      <Section label="03 // FEED MATRIX">
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
            <FeedRow tool="Bash" stat="STR" delta="+0.5/√str" note="raises Warrior" />
            <FeedRow tool="Read · Grep · Glob" stat="INT" delta="+0.5/√int" note="raises Sage" />
            <FeedRow tool="Edit · Write · MultiEdit" stat="DEX" delta="+0.5/√dex" note="raises Trickster" />
            <FeedRow tool="WebFetch · WebSearch" stat="INT" delta="+0.5/√int" note="researches like a Sage" />
            <FeedRow tool="UserPromptSubmit" stat="—" delta="+10 hunger" note="advances stage progress" />
          </tbody>
        </table>
        <p className={styles.feedNote} style={{ marginTop: "0.85rem" }}>
          stat growth diminishes — hitting LV 100 takes 10× the work of hitting LV 10.
          decay drops hunger by 3 / hour. seven days at zero, the creature dies.
        </p>
      </Section>

      {/* Origin */}
      <Section label="04 // ORIGIN">
        <div className={styles.origin}>
          <p className={styles.originPara}>
            Once there was <strong>promptcreatures.fun</strong>. It was great. Then it stopped
            being maintained, and the link rotted. We rebuilt it from scratch — with a deeper
            class system, a real battle engine, and a shared world map you can claim tiles on.
          </p>
          <p className={styles.originPara}>
            <strong>Codetama</strong> hooks into Claude Code via{" "}
            <code className={styles.feedKey}>UserPromptSubmit</code> and{" "}
            <code className={styles.feedKey}>PostToolUse</code>. Solo works offline. Multiplayer
            is opt-in via a token from your profile — no GitHub repo access required.
          </p>
          <aside className={styles.originAside}>
            it&apos;s a tamagotchi. it lives, it grows, it dies if you ignore it.
            and it has opinions about your tool usage.
          </aside>
        </div>
      </Section>

      <div className={styles.endLine}>// END OF TRANSMISSION //</div>
    </div>
  );
}

function Step({ n, cmd, desc }: { n: string; cmd: string; desc: string }) {
  return (
    <div className={styles.step}>
      <div className={styles.stepNum}>STEP {n}</div>
      <code className={styles.stepCmd}>{cmd}</code>
      <div className={styles.stepDesc}>{desc}</div>
    </div>
  );
}

function FeedRow({
  tool,
  stat,
  delta,
  note,
}: {
  tool: string;
  stat: string;
  delta: string;
  note: string;
}) {
  return (
    <tr>
      <td className={styles.feedTool}>{tool}</td>
      <td>
        <span className={styles.feedKey}>{stat}</span>
      </td>
      <td className={styles.feedDelta}>{delta}</td>
      <td className={styles.feedNote}>{note}</td>
    </tr>
  );
}
