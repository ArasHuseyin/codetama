import React from "react";
import { render } from "ink";
import { App } from "../view/App.js";

export function runView(): void {
  const { waitUntilExit } = render(<App />, { exitOnCtrlC: true });
  void waitUntilExit().then(() => {
    process.exit(0);
  });
}
