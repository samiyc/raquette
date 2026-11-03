import { paired } from "mcts-commun/measure.js";
import { playRally } from "./rally.js";

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
 * @param {{a: import("./types.js").Rule, b: import("./types.js").Rule, profile: any, from?: number, seeds: number, log?: any}} match
 *   `log`, to keep the rallies (src/replay-log.js): `start(seed, server)` gives a rally's log, `end(line)` takes its line
 * @returns {PairsReport}
 */
export function playPairs({ a, b, profile, from = 0, seeds, log }) {
  const players = [{ rule: a, profile }, { rule: b, profile }];
  const count = { strokes: 0, rallies: 0, limits: 0, serverPoints: 0, lostByA: {}, lostByB: {} };
  const scoresA = [];
  const scoresB = [];
  for (let seed = from; seed < from + seeds; seed += 1) {
    const play = (server) => tally(count, playKept({ seed, players, server }, log), server);
    const points = play(0) + play(1);
    scoresA.push(points);
    scoresB.push(2 - points);
  }
  const gap = paired(scoresA, scoresB);
  const played = count.rallies - count.limits;
  return {
    gap,
    part: 0.5 + gap.mean / 4,
    strokes: count.strokes / count.rallies,
    serverPart: played ? count.serverPoints / played : 0,
    limits: count.limits / count.rallies,
    lostByA: count.lostByA,
    lostByB: count.lostByB,
  };
}
