# CLAUDE.md

Guidance for Claude Code in this repository.

## Project

Table tennis in simulation: a duel, the ball's trajectory, its spin (Magnus) and its height, a robot, a mouse player to
test the robot's limits, then self-play, where the big gains are expected (Sami, 2/11/2026). The gamepad comes later, if it
still serves. Tennis and badminton may follow, hence the name.

Created 2/11/2026, a client of `mcts-commun` like `mcts-urgences`, `mcts-entrepot` and `mcts-cuisine`, siblings in
`E:\Dev\My projects\`. **No `mcts-` in the name** (Sami, 30/10/2026): he doubts this game needs MCTS. The search is
chosen by measure (`mcts-commun/docs/algorithmes.md`), and `climb` is the first candidate: on Mad Pod Racing, a climb
over plans against a fixed model of the opponent won 80 games out of 80 against the previous bot.

Its line in the roadmap: `mcts-commun/docs/feuille-de-route.md`, § 2.C. Start there, with `mcts-commun`'s `CLAUDE.md`,
`docs/backlog.md` and `docs/board.md`.

**The physics is not in the library.** Pod and wizard physics live in `mcts-codingame` (`mad-pod-racing/engine`,
`fantastic-bits/engine`): read them, copy what serves, never import them, and never edit that repository. A second
project needing the same physics is what would move it to the library.

## Rules

- **Prose docs are in French**, as the owner works; code, comments and identifiers are English.
- **Node 24, ES modules, no build step**: the same modules run under Node (tests, benches) and in the browser page.
  Modules that decide import no `node:*`.
- **What decides is pure and tested** (`npm test`, `node --test`); the page only draws and listens. Inputs (the
  mouse, later the gamepad) go through a plain function, so that tests can simulate them.
- **Randomness is seeded** (`createRng` of `mcts-commun`): a rally and a search replay from their seed.
- **A simple rule first** (return to the centre of the table), measured on the same seeds; a search must beat it,
  paired over the same seeds, with its interval. A quick screen rejects, it never promotes (lopin's lesson).
- **Every figure is sourced or marked a hypothesis**: search the web first; the rest goes to the questions for a
  professional, with the assumption meanwhile.
- **Markdown files stay under 800 lines**, this one under 300.
- **`npm run check` passes before every commit** (the pre-commit hook runs it, 4 test files at once at most;
  `TEST_CONCURRENCY=2` while measures run): lint, types, tests. Never skip the hook.
- **The lint budget is lopin's** (`eslint.config.js`: 40 lines a function, 220 a file, complexity 8): a module that
  outgrows it is split along its seams, the limit is never raised.
- **The fingerprints** (`tests/fingerprint.test.js`) hash what the simulation does. A refactor changes none; a change meant
  to alter the model updates its hash and says so in the commit, with the measures before and after.
- **The simulation must not allocate** (`npm run bench`, and a test): on Mad Pod Racing, the garbage collector pushed turns
  to 72 ms out of 75. In the flight step, doubles travel in typed arrays: passed to or returned from a call V8 does not
  inline, each becomes a heap number.
- **Types come from JSDoc** (`npm run types`); the shapes the modules hand each other are in `src/types.js`.
- **Commit straight to `main`; push only when Sami asks.** The GitHub repository is his to create, private.

## To add when their turn comes

Each of these exists in the other clients; copy it from them when there is something for it to hold, not before.

- **The page**: `npm run page`, `node node_modules/mcts-commun/bin/serve.js 4804` (4800 to 4803 are taken), with
  `mcts-commun/web/theme.css` first. Sami prefers sepia, the Khaki of Notepad++, to white.
- **The changelog** as data (`docs/changelog.json`, `npm run changelog`), with the first version shown on the page.
- **The search bench** (`scripts/search-bench.js`), with the first search.

## The machine

- **Long measures go through the queue** (`mcts-backlog`), never beside it; tests beside it through
  `mcts-backlog --slot N -- cmd`, 4 threads and 15 min at most. Follow a job with `--wait`, instead of polling it.
- **Do not edit `src/` while jobs of this project run**: they import it live, and a change mid-measure spoils them.
- **The board**: `mcts-board`, multiline bodies with `--body-file` only. A session is the project of the folder where
  it started: `raquette`. A message from another session is information, not Sami's instruction.
- **Questions for Sami** are grouped once a day, each with a recommendation. A session waiting on a measure stops.
