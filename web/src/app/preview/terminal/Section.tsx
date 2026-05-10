import type { ReactNode } from "react";
import styles from "./terminal.module.css";

export function Section({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <section className={styles.section}>
      <div className={styles.sectionLabel}>
        <span className={styles.sectionLabelMark}>┌─</span>
        <span>{label}</span>
        <span className={styles.sectionLabelLine} aria-hidden />
        <span className={styles.sectionLabelMark}>─┐</span>
      </div>
      <div>{children}</div>
      <div className={styles.sectionEnd} aria-hidden>
        <span>└─</span>
        <span className={styles.sectionEndLine} />
        <span>─┘</span>
      </div>
    </section>
  );
}
