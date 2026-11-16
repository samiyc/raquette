import { mkdirSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { progress } from "mcts-commun/trace.js";
import { playOnThreads } from "./lib/pairs-pool.js";

/**
 * The robots on one scale (Sami, 16/11/2026: the letters are hard to follow). `node scripts/elo.js --seeds 1000`: every robot plays
 * every other by pairs, on the same seeds, each serving once a seed, the rules that pick their service picking it; a Bradley-Terry
 * fit on the points gives each an Elo, R0 at 1 000. A point is not a match: 100 Elo on the points is 64 % of the points, which wins
 * nearly every game of 11. The table goes to docs/elo.json.
 */
const args = process.argv.slice(2);
const option = (name, fallback) => (args.includes(name) ? args[args.indexOf(name) + 1] : fallback);
const NAMES = option("--names", "R0,R1,R2,R3,R4,R5,T,U,V,W,X,Y,Z,F,G,H,I,J,K").split(",");
const SEEDS = Number(option("--seeds", 1000));
const FROM = Number(option("--from", 50000000));
const THREADS = Number(process.env.MCTS_THREADS) || 1;
const ANCHOR = option("--anchor", "R0");
const SCALE = 400 / Math.LN10;
const FILE = fileURLToPath(new URL(`../docs/${option("--out", "elo")}.json`, import.meta.url));

/** Every pair once, the points of the first: 2 a seed. */
async function roundRobin() {
  const pairs = NAMES.flatMap((a, i) => NAMES.slice(i + 1).map((b) => [a, b]));
  const points = [];
  for (const [k, [a, b]] of pairs.entries()) {
    const { scoresA } = await playOnThreads({ names: [a, b], budget: 24, from: FROM, seeds: SEEDS, replays: false, serving: "choice" }, THREADS);
    points.push({ a, b, won: scoresA.reduce((sum, s) => sum + s, 0), of: 2 * SEEDS });
    progress("elo", k + 1, pairs.length, { unit: "paire" });
  }
  return points;
}

/** Bradley-Terry by minorization-maximization (Hunter 2004): each strength the points won over the points it could have won. */
function fit(points) {
  let strength = Object.fromEntries(NAMES.map((name) => [name, 1]));
  for (let round = 0; round < 2000; round += 1) strength = Object.fromEntries(NAMES.map((name) => [name, stepOf(name, points, strength)]));
  return strength;
}

/** One step for one robot: its points over the points its strength would win against those it played. */
function stepOf(name, points, strength) {
  let won = 0;
  let expected = 0;
  for (const { a, b, won: w, of } of points.filter((one) => one.a === name || one.b === name)) {
    won += a === name ? w : of - w;
    expected += of / (strength[name] + strength[a === name ? b : a]);
  }
  return won / expected;
}

/** An Elo for each, with its standard error from the curvature of the likelihood. */
function ratingsOf(points, strength) {
  const base = SCALE * Math.log(strength[ANCHOR]);
  return NAMES.map((name) => {
    let information = 0;
    for (const { a, b, of } of points) {
      if (a !== name && b !== name) continue;
      const p = strength[name] / (strength[name] + strength[a === name ? b : a]);
      information += of * p * (1 - p);
    }
    return { name, elo: Math.round(1000 + SCALE * Math.log(strength[name]) - base), error: Math.round(SCALE / Math.sqrt(information)) };
  }).sort((x, y) => y.elo - x.elo);
}

const points = await roundRobin();
const ratings = ratingsOf(points, fit(points));
mkdirSync(fileURLToPath(new URL("../docs/", import.meta.url)), { recursive: true });
writeFileSync(FILE, `${JSON.stringify({ seeds: SEEDS, from: FROM, anchor: ANCHOR, serving: "choice", ratings, points }, null, 1)}\n`);
for (const { name, elo, error } of ratings) console.log(`${name.padEnd(6)} ${elo} ± ${error}`);
process.exit(0);
