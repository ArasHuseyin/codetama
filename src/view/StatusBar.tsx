import React from "react";
import { Box, Text } from "ink";

interface Props {
  hooksInstalled: boolean;
  mode: "local" | "multiplayer";
}

export function StatusBar({ hooksInstalled, mode }: Props): React.ReactElement {
  return (
    <Box justifyContent="space-between" width="100%">
      <Box>
        <Text dimColor>mode: </Text>
        <Text color={mode === "multiplayer" ? "magenta" : "white"}>{mode}</Text>
        <Text dimColor>  ·  hooks: </Text>
        <Text color={hooksInstalled ? "green" : "red"}>{hooksInstalled ? "on" : "off"}</Text>
      </Box>
      <Box>
        <Text dimColor>q quit  ·  r reload</Text>
      </Box>
    </Box>
  );
}
