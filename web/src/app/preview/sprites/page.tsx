import type { Metadata } from "next";
import { V1_BIGGER, V2_THEMED, V3_AURA, V4_SVG_NAMES, V7_TAROT } from "./sprites-data";
import { WarriorPixel, SagePixel, TricksterPixel, BalancedPixel } from "./PixelSprites";
import { WarriorXL, SageXL, TricksterXL, BalancedXL } from "./PixelSpritesXL";
import { WarriorWire, SageWire, TricksterWire, BalancedWire } from "./WireframeSprites";
import { WarriorHybrid, SageHybrid, TricksterHybrid, BalancedHybrid } from "./HybridSprites";
import styles from "./sprites.module.css";

export const metadata: Metadata = {
  title: "preview / sprites",
  description: "Compare sprite-style options for the creature visuals.",
};

const PIXEL_MAP: Record<string, React.ComponentType> = {
  WARRIOR: WarriorPixel,
  SAGE: SagePixel,
  TRICKSTER: TricksterPixel,
  BALANCED: BalancedPixel,
};

const PIXEL_XL_MAP: Record<string, React.ComponentType> = {
  WARRIOR: WarriorXL,
  SAGE: SageXL,
  TRICKSTER: TricksterXL,
  BALANCED: BalancedXL,
};

const WIRE_MAP: Record<string, React.ComponentType> = {
  WARRIOR: WarriorWire,
  SAGE: SageWire,
  TRICKSTER: TricksterWire,
  BALANCED: BalancedWire,
};

const HYBRID_MAP: Record<string, React.ComponentType> = {
  WARRIOR: WarriorHybrid,
  SAGE: SageHybrid,
  TRICKSTER: TricksterHybrid,
  BALANCED: BalancedHybrid,
};

const v2ColorClass: Record<string, string> = {
  WARRIOR: "v2-warrior",
  SAGE: "v2-sage",
  TRICKSTER: "v2-trickster",
  BALANCED: "v2-balanced",
};

export default function SpritesPreviewPage() {
  return (
    <div className={styles.shell}>
      <header className={styles.intro}>
        <p className={styles.eyebrow}>// preview · sprites · 4 variants</p>
        <h1 className={styles.title}>creature sprite comparison</h1>
        <p className={styles.lede}>
          Each variant shows the four classes (Warrior · Sage · Trickster · Balanced)
          in a different visual style. Pick a favorite — I&rsquo;ll wire it into the
          terminal preview&rsquo;s battle &amp; class registry.
        </p>
      </header>

      {/* Head-to-head decision panel */}
      <section className={styles.duel}>
        <header className={styles.duelHead}>
          <span className={styles.duelTag}>// finalist · v04 vs v08 vs v09</span>
          <h2 className={styles.duelTitle}>head-to-head</h2>
          <p className={styles.duelLede}>
            You said v4 and v8 are your favorites — here they are next to each other,
            plus a hybrid (v9) that combines pixel-fill from v4 with the wireframe
            outline from v8.
          </p>
        </header>

        <div className={styles.duelGrid}>
          {/* V4 column */}
          <div className={styles.duelCol}>
            <div className={styles.duelColHead}>
              <span className={styles.duelColLabel}>v04 · pixel SVG</span>
              <span className={styles.duelColMeta}>filled · color · warm</span>
            </div>
            <div className={styles.duelStrip}>
              {V4_SVG_NAMES.map((name) => {
                const Comp = PIXEL_MAP[name];
                return (
                  <div key={name} className={styles.duelCell}>
                    {Comp ? <Comp /> : null}
                    <span className={styles.duelCellName}>{name}</span>
                  </div>
                );
              })}
            </div>
            <div className={styles.duelProsCons}>
              <span className={styles.duelPro}>warm, mascot-friendly</span>
              <span className={styles.duelPro}>each class has a body silhouette</span>
              <span className={styles.duelCon}>could read as &ldquo;kid game&rdquo;</span>
              <span className={styles.duelCon}>less &ldquo;hacker&rdquo; vibe</span>
            </div>
          </div>

          {/* V9 column — hybrid */}
          <div className={styles.duelCol}>
            <div className={styles.duelColHead}>
              <span className={styles.duelColLabel}>v09 · hybrid ★</span>
              <span className={styles.duelColMeta}>fill + outline · best of both</span>
            </div>
            <div className={styles.duelStrip}>
              {V4_SVG_NAMES.map((name) => {
                const Comp = HYBRID_MAP[name];
                return (
                  <div key={name} className={styles.duelCell}>
                    {Comp ? <Comp /> : null}
                    <span className={styles.duelCellName}>{name}</span>
                  </div>
                );
              })}
            </div>
            <div className={styles.duelProsCons}>
              <span className={styles.duelPro}>warm color + technical outline</span>
              <span className={styles.duelPro}>strong identity per class</span>
              <span className={styles.duelPro}>fits both creature + dev-tool framing</span>
              <span className={styles.duelCon}>most complex implementation</span>
            </div>
          </div>

          {/* V8 column */}
          <div className={styles.duelCol}>
            <div className={styles.duelColHead}>
              <span className={styles.duelColLabel}>v08 · wireframe</span>
              <span className={styles.duelColMeta}>line-art · neon · cool</span>
            </div>
            <div className={styles.duelStrip}>
              {V4_SVG_NAMES.map((name) => {
                const Comp = WIRE_MAP[name];
                return (
                  <div key={name} className={styles.duelCell}>
                    {Comp ? <Comp /> : null}
                    <span className={styles.duelCellName}>{name}</span>
                  </div>
                );
              })}
            </div>
            <div className={styles.duelProsCons}>
              <span className={styles.duelPro}>matches CRT/HUD aesthetic perfectly</span>
              <span className={styles.duelPro}>high-tech, professional</span>
              <span className={styles.duelCon}>cold, less &ldquo;pet you love&rdquo;</span>
              <span className={styles.duelCon}>less detail at small sizes</span>
            </div>
          </div>
        </div>
      </section>

      {/* Variant 1 */}
      <section className={`${styles.variant} ${styles.v1}`}>
        <div className={styles.variantHead}>
          <span className={styles.variantNum}>VARIANT 01</span>
          <span className={styles.variantTitle}>bigger creatures with bodies</span>
          <span className={styles.variantBlurb}>
            7-8 lines, full body, distinct silhouettes
          </span>
        </div>
        <div className={styles.classGrid}>
          {V1_BIGGER.map((c) => (
            <div key={c.name} className={styles.classBox}>
              <pre className={styles.classSprite}>{c.art}</pre>
              <div className={styles.classLabel}>{c.name}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Variant 2 */}
      <section className={`${styles.variant} ${styles.v2}`}>
        <div className={styles.variantHead}>
          <span className={styles.variantNum}>VARIANT 02</span>
          <span className={styles.variantTitle}>class-themed redesign</span>
          <span className={styles.variantBlurb}>
            iconography per class · color-coded
          </span>
        </div>
        <div className={styles.classGrid}>
          {V2_THEMED.map((c) => {
            const colorClass = v2ColorClass[c.name];
            const themedClass = colorClass ? styles[colorClass] : "";
            return (
              <div
                key={c.name}
                className={`${styles.classBox} ${themedClass ?? ""}`}
              >
                <pre className={styles.classSprite}>{c.art}</pre>
                <div className={styles.classLabel}>{c.name}</div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Variant 3 */}
      <section className={`${styles.variant} ${styles.v3}`}>
        <div className={styles.variantHead}>
          <span className={styles.variantNum}>VARIANT 03</span>
          <span className={styles.variantTitle}>minimal upgrade — sharp chars + aura</span>
          <span className={styles.variantBlurb}>
            same silhouette, refined chars, animated CSS aura ring
          </span>
        </div>
        <div className={styles.classGrid}>
          {V3_AURA.map((c) => (
            <div key={c.name} className={styles.classBox}>
              <pre className={styles.classSprite}>{c.art}</pre>
              <div className={styles.classLabel}>{c.name}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Variant 4 */}
      <section className={`${styles.variant} ${styles.v4}`}>
        <div className={styles.variantHead}>
          <span className={styles.variantNum}>VARIANT 04</span>
          <span className={styles.variantTitle}>SVG pixel sprites</span>
          <span className={styles.variantBlurb}>
            16×16 hand-drawn pixels · color · shaded · departs from ASCII
          </span>
        </div>
        <div className={styles.classGrid}>
          {V4_SVG_NAMES.map((name) => {
            const Comp = PIXEL_MAP[name];
            return (
              <div key={name} className={styles.classBox}>
                <div className={styles.classSprite}>
                  {Comp ? <Comp /> : null}
                </div>
                <div className={styles.classLabel}>{name}</div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Variant 5 */}
      <section className={`${styles.variant} ${styles.v5}`}>
        <div className={styles.variantHead}>
          <span className={styles.variantNum}>VARIANT 05</span>
          <span className={styles.variantTitle}>SVG pixel + aura ring</span>
          <span className={styles.variantBlurb}>
            variant 04 sprites with the variant 03 expanding aura overlay
          </span>
        </div>
        <div className={styles.classGrid}>
          {V4_SVG_NAMES.map((name) => {
            const Comp = PIXEL_MAP[name];
            return (
              <div key={name} className={styles.classBox}>
                <div className={styles.classSprite}>
                  {Comp ? <Comp /> : null}
                </div>
                <div className={styles.classLabel}>{name}</div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Variant 6 — 32×32 detailed SVG */}
      <section className={`${styles.variant} ${styles.v6}`}>
        <div className={styles.variantHead}>
          <span className={styles.variantNum}>VARIANT 06</span>
          <span className={styles.variantTitle}>32×32 detailed SVG sprites</span>
          <span className={styles.variantBlurb}>
            4× the canvas of v04 · proper shading layers · Pokemon Crystal-tier detail
          </span>
        </div>
        <div className={styles.classGrid}>
          {V4_SVG_NAMES.map((name) => {
            const Comp = PIXEL_XL_MAP[name];
            return (
              <div key={name} className={styles.classBox}>
                <div className={styles.classSprite}>
                  {Comp ? <Comp /> : null}
                </div>
                <div className={styles.classLabel}>{name}</div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Variant 7 — tarot card portraits */}
      <section className={`${styles.variant} ${styles.v7}`}>
        <div className={styles.variantHead}>
          <span className={styles.variantNum}>VARIANT 07</span>
          <span className={styles.variantTitle}>tarot card portraits</span>
          <span className={styles.variantBlurb}>
            ornate ASCII frames · Roman numerals · arcana flavor
          </span>
        </div>
        <div className={styles.classGrid}>
          {V7_TAROT.map((c) => (
            <div key={c.name} className={styles.classBox}>
              <div className={styles.tarotInner}>
                <div className={styles.tarotNumeral}>{c.numeral}</div>
                <pre className={styles.tarotArt}>{c.art}</pre>
                <div>
                  <div className={styles.tarotName}>{c.name}</div>
                  <div className={styles.tarotMotto}>// {c.motto}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Variant 8 — wireframe / line-art */}
      <section className={`${styles.variant} ${styles.v8}`}>
        <div className={styles.variantHead}>
          <span className={styles.variantNum}>VARIANT 08</span>
          <span className={styles.variantTitle}>wireframe line-art SVG</span>
          <span className={styles.variantBlurb}>
            outlined silhouettes · neon stroke per class · HUD/blueprint feel
          </span>
        </div>
        <div className={styles.classGrid}>
          {V4_SVG_NAMES.map((name) => {
            const Comp = WIRE_MAP[name];
            return (
              <div key={name} className={styles.classBox}>
                <div className={styles.classSprite}>
                  {Comp ? <Comp /> : null}
                </div>
                <div className={styles.classLabel}>{name}</div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Variant 9 — hybrid (also shown in head-to-head above) */}
      <section className={`${styles.variant} ${styles.v9}`}>
        <div className={styles.variantHead}>
          <span className={styles.variantNum}>VARIANT 09</span>
          <span className={styles.variantTitle}>hybrid · pixel + wireframe ★</span>
          <span className={styles.variantBlurb}>
            v04 pixel body fill · v08 outline overlay · best of both
          </span>
        </div>
        <div className={styles.classGrid}>
          {V4_SVG_NAMES.map((name) => {
            const Comp = HYBRID_MAP[name];
            return (
              <div key={name} className={styles.classBox}>
                <div className={styles.classSprite}>
                  {Comp ? <Comp /> : null}
                </div>
                <div className={styles.classLabel}>{name}</div>
              </div>
            );
          })}
        </div>
      </section>

      <div className={styles.howTo}>
        <strong>// how to pick:</strong> tell me &ldquo;variant N gefällt mir&rdquo; — then
        I&rsquo;ll redesign all 6 attacker states + 6 defender states for the
        battle, plus full sprite set for the class registry, and wire it into
        <code style={{ marginLeft: 4 }}>/preview/terminal</code>.
      </div>
    </div>
  );
}
