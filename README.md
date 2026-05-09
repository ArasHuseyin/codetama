# Codetama

> A creature that lives in your code.

```
   .-""-.        .---.        ___,         .-~~~-.        /\_/\         ___
  /  .-. \      ( o o )      /o o\__      /  o o  \      ( o.^ )       /o o\
 |  / o \ |      \_-_/      ( =T= )_)    |   <>    |      > ^ <       ( ==  )
 |  \___/ |      /   \       \___//       \  '-'  /       |_|_|        \___/
  \      /     '-----'        |||           '~~~~'                      /| |\
   '----'                    / | \           | |
    Egg          Baby        Warrior         Sage         Trickster   Balanced
```

Codetama is a tamagotchi for developers. As you use [Claude Code](https://www.anthropic.com/claude-code), your digital creature grows. Every prompt is food. Every tool you reach for shapes its character. Forget about it for a week and it dies.

[**codetama.com**](https://codetama.com) · [Rules](https://codetama.com/rules) · [World Map](https://codetama.com/map) · [Leaderboard](https://codetama.com/leaderboard)

---

## Quickstart

```sh
npm install -g codetama
codetama --install
codetama --view
```

That's it. Send prompts to Claude Code and watch your creature grow. Want multiplayer? `codetama --register` after generating a token at codetama.com/profile.

## Mechanics

### Stages
| Egg → Baby | Baby → Adult | Adult → Elder | Elder peak |
|---|---|---|---|
| 6 prompts (5 for veterans) | 20 prompts | 30 prompts | 40 prompts |

When an Elder reaches its peak it doesn't retire — it locks at Elder forever, keeps gaining stats from tools, and a fresh egg appears alongside it. Long-term players accumulate a roster of seasoned Elders.

### Feeding
| Action | Effect on **active** | Effect on **all** living |
|---|---|---|
| Prompt to Claude | +1 stage progress | +10 hunger |
| `Bash` tool call | — | +1 STR, +4 hunger |
| `Read` / `Grep` / `Glob` | — | +1 INT, +4 hunger |
| `Edit` / `Write` | — | +1 DEX, +4 hunger |
| `WebFetch` / `WebSearch` | — | +1 INT, +4 hunger |
| Idle | — | −3 hunger / hour |
| 0 hunger for 7 days | death | death |

### Classes
At Baby → Adult, your stat distribution picks one automatically:
- **STR dominant** → Warrior → Warlord (Elder)
- **INT dominant** → Sage → Archmage
- **DEX dominant** → Trickster → Shadow
- **balanced** (`max ≤ 1.25 × min`) → Balanced → Druid

Each class has 4 skills (3 from Adult, 1 Ultimate unlocked at Elder).

### Battles & World Map
Once you opt into multiplayer, you spawn on a shared infinite grid via square-spiral placement. Click any tile within 2 king-steps of one of your bases to challenge that player. Win → capture the tile. 5 battle attempts/day, 1-hour cooldown per matchup.

## Develop

This is a monorepo with two parts:

```
.
├── src/                    # CLI (Node + TypeScript + Ink)
├── tests/                  # CLI tests (vitest)
└── web/                    # Next.js app (web + API)
    └── src/
        ├── app/            # routes
        ├── db/             # drizzle schema + client
        └── lib/            # battle, sync, reachability, …
```

### CLI

```sh
npm install
npm test
npm run build
npm link               # makes `codetama` global
```

State lives at `~/.codetama/state.json`. Set `CODETAMA_STATE_FILE` to override (useful for tests).

### Web

```sh
cd web && npm install
cp .env.example .env
# fill in DATABASE_URL, AUTH_GITHUB_ID, AUTH_GITHUB_SECRET, AUTH_SECRET
npm run db:generate && npm run db:migrate
npm run dev            # http://localhost:3000
```

Detailed setup: [`/about`](https://codetama.com/about) on the live site or `web/.env.example`.

## Status

| Sprint | Scope | Status |
|---|---|---|
| 0 | Repo scaffolding + naming | ✓ |
| 1 | Solo CLI MVP | ✓ |
| 2 | TUI live viewer with animations | ✓ |
| 3 | Web landing + GitHub OAuth + tokens | ✓ |
| 4 | Multiplayer sync (CLI ↔ server) | ✓ |
| 5 | World map + spiral spawn | ✓ |
| 6 | Battle system + skills + cooldowns | ✓ |
| 7 | Tile capture + leaderboard | ✓ |
| 8 | Anti-cheat + polish + launch prep | ✓ |

## Contribute

Issues and PRs welcome. The code is intentionally small enough to read end-to-end in an afternoon — start with `src/types.ts` (CLI), `web/src/lib/battle-engine.ts` (combat), `web/src/db/schema.ts` (data shape).

## License

MIT — see [LICENSE](./LICENSE).
