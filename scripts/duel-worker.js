import { parentPort, workerData } from "node:worker_threads";
import { playSeeds } from "../src/pairs.js";
import { CLUB_PLAYER } from "../src/player.js";
import { createRallyLog } from "../src/replay-log.js";
import { namedRule } from "../src/rules/named.js";

/** One thread of `scripts/duel.js`: it plays the batches of seeds it is given. */
const { names, budget, replays, serving, catalog } = workerData;
const [a, b] = names.map((name) => namedRule(name, budget, catalog));

parentPort.on("message", ({ index, from, seeds }) => {
  const lines = [];
  const log = replays ? { start: (seed, server) => createRallyLog({ seed, server }), end: (line) => lines.push(line) } : undefined;
  const part = playSeeds({ a, b, profile: CLUB_PLAYER, from, seeds, log, serving });
  parentPort.postMessage({ index, part: { ...part, lines } });
});
