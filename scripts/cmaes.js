import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { createCmaes } from "mcts-commun/cmaes.js";
import { progress } from "mcts-commun/trace.js";
import { phaseKey, phaseNumbers, PHASE_KEYS } from "../src/rules/phases.js";
import { R3_NUMBERS } from "../src/rules/tunable.js";
import { TUNED } from "../src/rules/tuned.js";
import { NUMBER_RANGES } from "../src/selfplay.js";
import { createRulePool } from "./lib/rule-pool.js";

/**
 * CMA-ES on the numbers of play of the attacking rule (Sami, 16/11/2026: is it better than our self-play, and with more budget?).
 * `node scripts/cmaes.js --run c1 --start I --generations 150`: each gene is a number of R3_NUMBERS brought to [0, 1] by its range
 * (src/selfplay.js), the service stays the start's. Each generation, every plan plays every opponent of `--opponents` on the same
 * `--seeds` seeds, new each generation; its score is its mean share of the points, less a penalty out of the ranges. Every
 * `--check-every` generations, the mean of the strategy, its best guess, plays I and k2 on seeds fixed for every run and every
 * checkpoint: the curve of the result against the seeds played. k2 serves otherwise than I and is no opponent of the search: it says
 * whether the gain holds off what was tuned on. `--controls I,k2,W` sets those judges, and `--phases return` adds the numbers of the
 * return of service (src/rules/phases.js) to the genes (`--phases return,third`: and of the third ball), each starting as the start has it, or as its own number. The history and the state go to docs/selfplay/cmaes-<run>.json at each generation, so
 * that a job stopped goes on from there.
 */
const args = process.argv.slice(2);
const option = (name, fallback) => (args.includes(name) ? args[args.indexOf(name) + 1] : fallback);
const run = option("--run", "c1");
const GENERATIONS = Number(option("--generations", 150));
const SEEDS = Number(option("--seeds", 200));
const OPPONENTS = option("--opponents", "I,H,G").split(",");
const SIGMA = Number(option("--sigma", 0.1));
const POPULATION = option("--population", "") ? Number(option("--population", "")) : undefined;
const CHECK_EVERY = Number(option("--check-every", 10));
const CHECK_SEEDS = Number(option("--check-seeds", 1000));
const CONTROLS = option("--controls", "I,k2").split(",");
const PHASED = option("--phases", "").split(",").filter(Boolean);
const THREADS = Number(process.env.MCTS_THREADS) || 6;
const SERVING = "choice";
const CHECK_FROM = 60000000; // The same for every run: the checkpoints of two runs, and of the self-play lineage, compare seed for seed.
const SEED_BASE = 70000000 + [...run].reduce((sum, c) => sum + c.charCodeAt(0), 0) * 1000000;

const FOLDER = fileURLToPath(new URL("../docs/selfplay/", import.meta.url));
const FILE = `${FOLDER}cmaes-${run}.json`;
/** A rule not in src/rules/tuned.js, by the numbers a lineage or a run kept: `k2` from docs/selfplay/k2.json, `f2a` from cmaes-f2a.json. */
const kept = (name) => [`${FOLDER}${name}.json`, `${FOLDER}cmaes-${name}.json`].filter((file) => existsSync(file)).map((file) => JSON.parse(readFileSync(file, "utf8")).numbers)[0];
const START = option("--start", "I");
const catalog = Object.fromEntries([...new Set(["k2", ...OPPONENTS, ...CONTROLS])].filter((name) => !TUNED[name] && kept(name)).map((name) => [name, kept(name)]));
const own = { ...R3_NUMBERS, ...(TUNED[START] ?? kept(START)) };
const PHASED_KEYS = new Set(PHASED.flatMap((phase) => PHASE_KEYS.map((key) => phaseKey(phase, key))));
const phased = Object.fromEntries(Object.entries(phaseNumbers(own)).filter(([key]) => PHASED_KEYS.has(key)));
const start = { ...phased, ...own };
const KEYS = [...Object.keys(R3_NUMBERS), ...Object.keys(phased)].filter((key) => NUMBER_RANGES[key]);
const encode = (key, value) => (value - NUMBER_RANGES[key][0]) / (NUMBER_RANGES[key][1] - NUMBER_RANGES[key][0]);
const clamp01 = (g) => Math.max(0, Math.min(1, g));
/** The rule's numbers for a plan: each gene put back in its range, the rest as the start has it. */
const decode = (plan) => ({ ...start, ...Object.fromEntries(KEYS.map((key, i) => [key, NUMBER_RANGES[key][0] + clamp01(plan[i]) * (NUMBER_RANGES[key][1] - NUMBER_RANGES[key][0])])) });
/** How far out of the ranges a plan goes: a gene clamped would leave the strategy free to drift out. */
const outside = (plan) => Array.from(plan).reduce((sum, g) => sum + (g - clamp01(g)) ** 2, 0);
const mean = (values) => values.reduce((sum, v) => sum + v, 0) / values.length;

mkdirSync(FOLDER, { recursive: true });
const history = existsSync(FILE) ? JSON.parse(readFileSync(FILE, "utf8")) : { run, start: START, keys: KEYS, opponents: OPPONENTS, controls: CONTROLS, seeds: SEEDS, sigma: SIGMA, played: 0, generations: [], checks: [] };
const es = createCmaes({ genes: KEYS.length, mean: KEYS.map((key) => encode(key, start[key])), sigma: SIGMA, population: POPULATION, seed: SEED_BASE, ...(history.state && { from: history.state }) });
const pool = createRulePool(THREADS, catalog);

/** The scores of a population: each plan against each opponent, on the same seeds. */
async function scoresOf(population, from) {
  const requests = population.flatMap((plan) => OPPONENTS.map((against) => ({ numbers: decode(plan), against, from, seeds: SEEDS, serving: SERVING })));
  const points = await pool.play(requests);
  history.played += requests.length * SEEDS;
  return population.map((plan, k) => mean(OPPONENTS.map((_, j) => mean(points[k * OPPONENTS.length + j]) / 2)) - outside(plan));
}

/** The mean of the strategy against the controls, on the fixed seeds. */
async function check(generation) {
  const numbers = decode(es.mean);
  const points = await pool.play(CONTROLS.map((against) => ({ numbers, against, from: CHECK_FROM, seeds: CHECK_SEEDS, serving: SERVING })));
  const shares = Object.fromEntries(CONTROLS.map((name, k) => [name, Number((mean(points[k]) / 2).toFixed(4))]));
  const entry = { generation, played: history.played, ...shares, sigma: Number(es.sigma.toFixed(4)) };
  history.checks.push(entry);
  const text = CONTROLS.map((name) => `contre ${name} ${(100 * shares[name]).toFixed(1)} %`).join(", ");
  console.error(`contrôle ${generation} : ${history.played} graines jouées, ${text}, pas ${entry.sigma}`);
}

const save = () => writeFileSync(FILE, `${JSON.stringify({ ...history, state: es.snapshot(), numbers: decode(es.mean) }, null, 1)}\n`);
if (history.checks.length === 0) await check(0);
for (let generation = history.generations.length; generation < GENERATIONS; generation += 1) {
  const population = es.ask().map((plan) => Float64Array.from(plan));
  const scores = await scoresOf(population, SEED_BASE + generation * 1000);
  es.tell(scores);
  history.generations.push({ generation, played: history.played, best: Number(Math.max(...scores).toFixed(4)), average: Number(mean(scores).toFixed(4)), sigma: Number(es.sigma.toFixed(4)) });
  if ((generation + 1) % CHECK_EVERY === 0) await check(generation + 1);
  save();
  progress("cmaes", generation + 1, GENERATIONS, { unit: "génération" });
}
save();
console.log(JSON.stringify({ run, played: history.played, checks: history.checks, numbers: decode(es.mean) }));
await pool.close();
process.exit(0);
