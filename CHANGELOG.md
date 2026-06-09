# Changelog

## 0.2.3 (2026-06-10)

### Fixed

- **State file corruption and permanent hook crash-loop.** A crash or power
  loss mid-save could leave `~/.codetama/state.json` with zeroed content
  (observed on Windows: correct file size, all-blank bytes). Because every
  `codetama --feed` hook invocation parses the state file, a corrupt file made
  every subsequent tool call in Claude Code report a hook error — forever.
  - `saveState` now fsyncs the temp file before renaming it into place, so an
    interrupted save can no longer produce a zeroed state file.
  - Renames are retried with backoff on transient Windows errors
    (`EPERM`/`EACCES`/`EBUSY`) that occur when parallel tool calls fire
    concurrent feed hooks racing on the state file. Failed saves no longer
    leave `state.json.<pid>.tmp` files behind.
  - A corrupt state file now self-heals: `loadState` restores the newest
    parseable `state.json.<pid>.tmp` snapshot (or starts fresh if none
    exists), keeping the corrupt original as `state.json.corrupt.bak` for
    inspection.
  - `codetama --feed` no longer surfaces residual errors as hook failures;
    a feeding that cannot be persisted is skipped with a one-line stderr note.
