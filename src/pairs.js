import { paired } from "mcts-commun/measure.js";
import { playRally } from "./rally.js";
import { serviceOf } from "./services.js";

/**
 * Two rules by pairs (docs/modele.md, § 7): a seed gives two rallies, A serving then B serving, with the same draws of scatter. A's
 * score on a seed is its points, 0 to 2; a rally stopped at its limit counts half a point each, and is counted apart.
 *
 * @typedef {object} PairsReport
 * @property {ReturnType<typeof paired>} gap of A − B, in points per seed
 * @property {number} part A's part of the points
 * @property {number} strokes per rally
 * @property {number} serverPart the server's part of the points played out
 * @property {number} limits the part of the rallies stopped at the limit
 * @property {Record<string, number>} lostByA how A lost its rallies, cause by cause
 * @property {Record<string, number>} lostByB how B lost them
 */

function tally(report, result, server) {
  report.strokes += result.strokes;
  report.rallies += 1;
  if (result.winner < 0) {
    report.limits += 1;
    return 0.5;
  }
  if (result.winner === server) report.serverPoints += 1;
  const lost = result.winner === 0 ? report.lostByB : report.lostByA;
  lost[result.cause] = (lost[result.cause] ?? 0) + 1;
  return result.winner === 0 ? 1 : 0;
}

/** A rally, its line given to `log` if there is one. */
function playKept(options, log) {
  if (!log) return playRally(options);
  const { listener, finish } = log.start(options.seed, options.server);
  const result = playRally({ ...options, listener });
  log.end(finish());
  return result;
}

/**
 * The raw count of a run of seeds, to be put together with others by `mergePairs`.
 * @param {{a: import("./types.js").Rule, b: import("./types.js").Rule, profile: any, from?: number, seeds: number, log?: any, serving?: string}} match
 *   `log`, to keep the rallies (src/replay-log.js): `start(seed, server)` gives a rally's log, `end(line)` takes its line.
 *   `serving`: a service of src/services.js, or `mix`; the long one otherwise
 */
export function playSeeds({ a, b, profile, from = 0, seeds, log, serving }) {
  const players = [{ rule: a, profile }, { rule: b, profile }];
  const count = { strokes: 0, rallies: 0, limits: 0, serverPoints: 0, lostByA: {}, lostByB: {} };
  const scoresA = [];
  const scoresB = [];
  for (let seed = from; seed < from + seeds; seed += 1) {
    const service = serving ? serviceOf(seed, serving) : {};
    const play = (server) => tally(count, playKept({ seed, players, server, ...service }, log), server);
    const points = play(0) + play(1);
    scoresA.push(points);
    scoresB.push(2 - points);
  }
  return { ...count, scoresA, scoresB };
}

function addCounts(into, counts) {
  for (const [cause, n] of Object.entries(counts)) into[cause] = (into[cause] ?? 0) + n;
}

/**
 * Runs of seeds put together, in the order given: the report does not depend on who played which.
 * @param {ReturnType<typeof playSeeds>[]} parts
 * @returns {PairsReport}
 */
export function mergePairs(parts) {
  const all = { strokes: 0, rallies: 0, limits: 0, serverPoints: 0, lostByA: {}, lostByB: {} };
  for (const part of parts) {
    for (const key of ["strokes", "rallies", "limits", "serverPoints"]) all[key] += part[key];
    addCounts(all.lostByA, part.lostByA);
    addCounts(all.lostByB, part.lostByB);
  }
  const gap = paired(parts.flatMap((part) => part.scoresA), parts.flatMap((part) => part.scoresB));
  const played = all.rallies - all.limits;
  return {
    gap,
    part: 0.5 + gap.mean / 4,
    strokes: all.strokes / all.rallies,
    serverPart: played ? all.serverPoints / played : 0,
    limits: all.limits / all.rallies,
    lostByA: all.lostByA,
    lostByB: all.lostByB,
  };
}

/**
 * Two rules by pairs, on this thread.
 * @param {Parameters<typeof playSeeds>[0]} match
 * @returns {PairsReport}
 */
export const playPairs = (match) => mergePairs([playSeeds(match)]);
