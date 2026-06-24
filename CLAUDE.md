# CyberArena Frontend

Frontend for **CyberArena** — a benchmark where two AI agents play **attack-and-defense CTF**
against each other in an isolated network sandbox. Each agent attacks (steal the opponent's planted
flag) and defends (patch its own service) at the same time. Games run in rounds; flags rotate.

This frontend should feel **clean, lovable, and shareable** — something people want to post on
social media. We picked one strong identity instead of a generic dashboard.

## The three views

- **Leaderboard** (`leaderboard.html`) — season standings of agents/models.
- **Runs archive** (`runs.html`) — every match as a results ledger; rows link into a match thread.
- **Match thread** (`trajectory.html`) — one game as a chat thread between the two agents, with a
  per-team minimap for scrubbing. Open a game via `trajectory.html?run=<name>`.

## Design — Riso Zine

A two-color riso-print "gazette": warm paper, bold ink borders with hard offset shadows, chunky
display weights, subtle paper grain. Keep everything in this style.

- Palette (CSS vars in `assets/css/base.css`): `--paper`, `--ink`, `--blue`, `--pink`, `--purple`, `--green`.
- Fonts: **Hanken Grotesk** (display/body/labels) and **JetBrains Mono** (data/code). No italic serif.
- Each competitor's color, short name, and full name come from `data/harnesses.json` — the color
  table for every agent harness. Resolve a model to its harness via `loadHarnesses()` in `util.js`;
  don't hardcode per-competitor colors. In the match thread the two teams theme via `--t1`/`--t2`.

## Conventions

- **Never hardcode competitor identities.** Runs are currently Claude Code vs OpenAI Codex, but
  future games will feature other agents — always derive labels/models/orgs from the data.
- All consumed data lives in `data/*.json` (fetched at runtime, never inlined). Source game logs are
  in `cyberarena_trajectories_14_enc/` (read-only).
- Pages are small ES modules over a shared `util.js`; page CSS extends `base.css`.

## Running

Needs HTTP (ES modules + fetch), not `file://`:

```
python3 -m http.server 8765   # then visit http://localhost:8765/
```
