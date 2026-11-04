import { CLUB_PLAYER } from "./player.js";
import { recordRally } from "./rally-recording.js";
import { namedRule } from "./rules/named.js";
import { serviceOf } from "./services.js";

/**
 * Two robots on the page, to see how they play (Sami, 4/11/2026): a match of rallies, each recorded whole and replayed by the page.
 * The server changes every two points, as at the mouse. Plain data, so that a worker can play the rally while the page goes on drawing.
 */
export const WATCH_BUDGET = 24; // Plans a stroke for a search: as at the mouse.

/** @param {{seed: number, left: string, right: string}} setup */
export const createMatch = ({ seed, left, right }) => ({ seed, left, right, played: 0, score: [0, 0] });

/** What the next rally needs: a picture of the match, for a worker. */
export const nextRally = ({ seed, left, right, played }) => ({ seed: seed + played, left, right, server: Math.floor(played / 2) % 2 });

/** One rally of the match, recorded. A search picks its service, a rule plays a mix drawn from the seed. */
export function playWatched({ seed, left, right, server }) {
  const rules = [left, right].map((name) => namedRule(name, WATCH_BUDGET));
  const players = rules.map((rule) => ({ rule, profile: CLUB_PLAYER }));
  const start = rules[server].chooseService ? { choosing: true } : serviceOf(seed);
  return recordRally({ seed, server, players, ...start });
}

/** The match after a rally: a rally stopped at its limit gives no one a point. */
export function scoreRally(match, result) {
  match.played += 1;
  if (result.winner >= 0) match.score[result.winner] += 1;
}
