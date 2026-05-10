"use client";

import { useState } from "react";
import styles from "./pixel.module.css";

export function Menu() {
  const [copied, setCopied] = useState(false);

  function copy() {
    navigator.clipboard.writeText("npm install -g codetama").then(
      () => {
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      },
      () => {},
    );
  }

  return (
    <div className={styles.menu} role="menu">
      <button
        type="button"
        onClick={copy}
        className={`${styles.menuItem} ${copied ? styles.menuCopyDone : ""}`}
      >
        <span className={styles.menuItemCmd}>$ NPM INSTALL -G CODETAMA</span>
        <span className={styles.menuItemHint}>{copied ? "COPIED!" : "Press to copy"}</span>
      </button>
      <a href="/login" className={styles.menuItem}>
        <span className={styles.menuItemCmd}>SIGN IN WITH GITHUB</span>
        <span className={styles.menuItemHint}>Open multiplayer →</span>
      </a>
      <a href="/rules" className={styles.menuItem}>
        <span className={styles.menuItemCmd}>READ THE RULES</span>
        <span className={styles.menuItemHint}>Stages, classes, formulas →</span>
      </a>
    </div>
  );
}
