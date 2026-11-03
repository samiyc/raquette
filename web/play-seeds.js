/**
 * The seed of a game (Sami's replays, 3/11/2026: 38 points on three seeds, so the same draws of scatter for him and for the robot,
 * and most of the points he won came from draws that had already come up). The seed stays in each replay, which still plays it again.
 */

/** A seed for a page just loaded. */
export const freshSeed = (now = Date.now()) => now % 1000000;

/**
 * The seed of a new game: the one asked for, or the next one if the box still shows the last game's.
 * @param {number} asked what the box says
 * @param {{seed: number, played: number} | null | undefined} last the last game
 */
export const seedOfNewGame = (asked, last) => (last && asked === last.seed ? asked + last.played : asked);
