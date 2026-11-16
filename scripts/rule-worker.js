import { parentPort, workerData } from "node:worker_threads";
import { playSeeds } from "../src/pairs.js";
import { CLUB_PLAYER } from "../src/player.js";
import { namedRule } from "../src/rules/named.js";
import { createTunable } from "../src/rules/tunable.js";

/**
 * One thread of scripts/lib/rule-pool.js: it stays up, and plays a tunable rule given by its numbers against a named one, on the
 * seeds it is handed. The opponents are built once.
 */
const { catalog = {} } = workerData ?? {};
const opponents = new Map();
const opponentOf = (name) => {
  if (!opponents.has(name)) opponents.set(name, namedRule(name, 24, catalog));
  return opponents.get(name);
};

parentPort.on("message", ({ task, numbers, against, from, seeds, serving }) => {
  const a = createTunable(numbers, "candidat");
  const { scoresA } = playSeeds({ a, b: opponentOf(against), profile: CLUB_PLAYER, from, seeds, serving });
  parentPort.postMessage({ task, scoresA });
});
