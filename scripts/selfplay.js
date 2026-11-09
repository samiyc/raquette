import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { createRng } from "mcts-commun/random.js";
import { progress } from "mcts-commun/trace.js";
import { bestOfScreen, isKept, mutateNumbers } from "../src/selfplay.js";
import { TUNED } from "../src/rules/tuned.js";
import { R3_NUMBERS } from "../src/rules/tunable.js";
import { playOnThreads } from "./lib/pairs-pool.js";

/**
 * Self-play on the numbers of the attacking rule (docs/modele.md, § 8), as a job of the queue: `node scripts/selfplay.js --run a
 * --generations 40`. Each generation screens variants against the current version, then confirms the best on seeds of their own,
 * against it; a version kept reads the panel, which decides nothing (Sami, 4/11/2026). Many confirmations let a few lucky variants through, so the last version plays the panel once
 * more, on seeds no generation saw: that figure is the result. `--start V --set cover=0.3,ready=0` starts from a rule self-play already kept. The history goes to docs/selfplay/, a generation at a time, so that a
 * job stopped keeps its work.
 */
const args = process.argv.slice(2);
const option = (name, fallback) => {
  const at = args.indexOf(name);
  return at >= 0 ? args[at + 1] : fallback;
};
const run = option("--run", "a");
const GENERATIONS = Number(option("--generations", 40));
const VARIANTS = Number(option("--variants", 8));
const SCREEN = Number(option("--screen", 150));
const CONFIRM = Number(option("--confirm", 600));
const THREADS = Number(process.env.MCTS_THREADS) || 1;
const PANEL = ["R0", "R1", "R3", "U", "V", "W", "X", "Y", "Z", "F", "G"];
const CURRENT = "version";
const VARIANT = "variante";
const SERVING = "mix";
const LIMIT_SCORE = "shared"; // "againstA" gave a variant equal to its version 50 % less half the rallies at the limit: x and y kept nothing in 40 generations (6/11/2026).
const BUDGET = 24;
const FOLDER = fileURLToPath(new URL("../docs/selfplay/", import.meta.url));
const FILE = `${FOLDER}${run}.json`;
const FINAL = Number(option("--final", 2000));
const FINAL_SEARCH = Number(option("--final-search", 600)); // The search is outside the panel, and slow: a judge that no generation played.
const SEED_BASE = 2000000 + [...run].reduce((sum, c) => sum + c.charCodeAt(0), 0) * 1000000;

mkdirSync(FOLDER, { recursive: true });
const setNumbers = Object.fromEntries(String(option("--set", "")).split(",").filter(Boolean).map((pair) => pair.split("=")).map(([key, value]) => [key, Number(value)]));
const startNumbers = { ...R3_NUMBERS, ...TUNED[option("--start", "")], ...setNumbers };
const history = existsSync(FILE) ? JSON.parse(readFileSync(FILE, "utf8")) : { run, numbers: startNumbers, version: 0, maxStrokes: 20, limitScore: LIMIT_SCORE, generations: [] };

const pairs = (names, catalog, seeds, limitScore = LIMIT_SCORE) => playOnThreads({ names, budget: BUDGET, from: seeds.from, seeds: seeds.count, replays: false, serving: SERVING, catalog, limitScore }, THREADS);

/** Variant against the current version, on few seeds. */
async function screen(variants, from) {
  const reports = [];
  for (const numbers of variants) {
    const { report } = await pairs([VARIANT, CURRENT], { [VARIANT]: numbers, [CURRENT]: history.numbers }, { from, count: SCREEN });
    reports.push(report);
  }
  return bestOfScreen(variants, reports, 2);
}

/** A variant on seeds of its own, against its version. */
async function confirm(numbers, from) {
  const catalog = { [VARIANT]: numbers, [CURRENT]: history.numbers };
  return (await pairs([VARIANT, CURRENT], catalog, { from, count: CONFIRM })).report;
}

/** A version kept, against the panel: only read, to see whether the lineage goes round in circles. */
async function readPanel(numbers, from) {
  const panel = [];
  for (const name of PANEL) panel.push((await pairs([VARIANT, name], { [VARIANT]: numbers }, { from, count: CONFIRM })).report);
  return panel;
}

function note(generation, entry) {
  history.generations.push({ generation, ...entry });
  writeFileSync(FILE, `${JSON.stringify(history, null, 1)}\n`);
  progress("selfplay", generation + 1, GENERATIONS, { unit: "génération" });
}

/** The last version against the panel, on seeds of its own. */
async function finalCheck() {
  const final = {};
  const catalog = { [VARIANT]: history.numbers };
  for (const [name, count] of [...PANEL.map((one) => [one, FINAL]), ["S", FINAL_SEARCH], ["S-mV", FINAL_SEARCH], ["S-mW", FINAL_SEARCH], ["S-mY", FINAL_SEARCH]]) {
    const { report } = await pairs([VARIANT, name], catalog, { from: SEED_BASE + 900000, count }, "shared");
    final[name] = { part: Number(report.part.toFixed(3)), low: Number((0.5 + report.gap.low / 4).toFixed(3)), high: Number((0.5 + report.gap.high / 4).toFixed(3)), strokes: Number(report.strokes.toFixed(1)), limits: Number(report.limits.toFixed(3)) };
  }
  return final;
}

const summary = (against) => ({
  part: Number(against.part.toFixed(3)),
  low: Number((0.5 + against.gap.low / 4).toFixed(3)),
});

for (let generation = history.generations.length; generation < GENERATIONS; generation += 1) {
  const seeds = SEED_BASE + generation * 10000;
  const rng = createRng(seeds);
  const variants = Array.from({ length: VARIANTS }, () => mutateNumbers(history.numbers, rng));
  const best = await screen(variants, seeds);
  const tried = [];
  let kept = false;
  for (const { numbers } of best) {
    if (kept) break;
    const against = await confirm(numbers, seeds + 5000);
    tried.push(summary(against));
    if (isKept(against)) {
      tried.at(-1).panel = (await readPanel(numbers, seeds + 5000)).map(({ part }) => Number(part.toFixed(3)));
      tried.at(-1).numbers = numbers; // A lineage can wander off: the best version read on the panel may not be the last.
      history.numbers = numbers;
      history.version += 1;
      kept = true;
    }
  }
  note(generation, { kept, version: history.version, tried });
  console.error(`génération ${generation} : version ${history.version}${kept ? " (nouvelle)" : ""} ${JSON.stringify(tried)}`);
}
history.final = await finalCheck();
writeFileSync(FILE, `${JSON.stringify(history, null, 1)}
`);
console.log(JSON.stringify({ run, version: history.version, numbers: history.numbers, final: history.final }));
process.exit(0);
