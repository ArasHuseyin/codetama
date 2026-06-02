import React, { useEffect, useState } from "react";
import { Box, Text, useApp, useInput, useStdin } from "ink";
import { isInstalled } from "../hooks/claude-code.js";
import { CreaturePanel } from "./CreaturePanel.js";
import { StatsPanel } from "./StatsPanel.js";
import { StatusBar } from "./StatusBar.js";
import { useStateReloader } from "./useStateReloader.js";

export function App(): React.ReactElement {
  const { exit } = useApp();
  const { isRawModeSupported } = useStdin();
  const { state, active, mood, error } = useStateReloader(1000);
  const [hooksInstalled, setHooksInstalled] = useState<boolean>(() => isInstalled());

  useEffect(() => {
    const handle = setInterval(() => setHooksInstalled(isInstalled()), 5000);
    return () => clearInterval(handle);
  }, []);

  return (
    <Box flexDirection="column" padding={1}>
      {isRawModeSupported ? (
        <InputHandler onQuit={exit} onReload={() => setHooksInstalled(isInstalled())} />
      ) : null}
      <Box>
        <Text bold color="cyan">Codetama</Text>
        <Text dimColor>  ·  live viewer</Text>
      </Box>
      {error || !state ? (
        <Box marginTop={1} flexDirection="column">
          <Text color="red">Could not read your creature state.</Text>
          {error ? <Text dimColor>{error}</Text> : null}
          <Text dimColor>Retrying… (press q to quit)</Text>
        </Box>
      ) : (
        <Box marginTop={1} flexDirection="row">
          <Box marginRight={2}>
            <CreaturePanel
              stage={active?.stage ?? "egg"}
              klass={active?.klass ?? null}
              mood={mood}
            />
          </Box>
          <StatsPanel state={state} active={active} mood={mood} />
        </Box>
      )}
      <Box marginTop={1}>
        <StatusBar hooksInstalled={hooksInstalled} mode="local" />
      </Box>
    </Box>
  );
}

function InputHandler({ onQuit, onReload }: { onQuit: () => void; onReload: () => void }): null {
  useInput((input) => {
    if (input === "q" || input === "Q") onQuit();
    if (input === "r" || input === "R") onReload();
  });
  return null;
}
