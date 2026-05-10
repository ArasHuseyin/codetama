"use client";

import { useState } from "react";
import styles from "./neonterm.module.css";

export function CopyCommand({ command }: { command: string }) {
  const [copied, setCopied] = useState(false);

  function copy() {
    navigator.clipboard.writeText(command).then(
      () => {
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      },
      () => {},
    );
  }

  return (
    <div className={styles.cmdBox} role="group" aria-label="Install command">
      <span className={styles.cmdPrompt} aria-hidden>$</span>
      <code className={styles.cmdText}>{command}</code>
      <button
        type="button"
        onClick={copy}
        className={`${styles.copyBtn} ${copied ? styles.copyBtnDone : ""}`}
        aria-label={copied ? "Copied" : "Copy install command"}
      >
        {copied ? "✓ copied" : "copy"}
      </button>
    </div>
  );
}
