/**
 * Self-play (Sami, 2/11/2026; docs/modele.md, § 8): a rule's numbers move, and a variant is kept only if it beats the version it comes
 * from and does not lose to a panel that does not move. On CodinGame, three local gains vanished on the site because the arena only
 * measured against the bot's own line: the panel is there for that. Pure, so that it is tested; scripts/selfplay.js plays the rallies.
 */

/** How far each number may go, and how far a mutation moves it at most. All hypotheses: the bounds keep a rule within what the model was fitted on. */
export const NUMBER_RANGES = Object.freeze({
  wide: [0.1, 0.65, 0.1],
  depth: [0.35, 1.15, 0.1],
  topWide: [0.1, 0.65, 0.1],
  topDepth: [0.45, 1.2, 0.1],
  topSpeed: [5, 16, 1.5],
  topBrush: [2, 16, 2],
  pushSpeed: [1.5, 6, 0.5],
  pushBrush: [-8, 0, 1],
  flatSpeed: [3, 12, 1],
  highBall: [0.1, 0.5, 0.05],
  wait: [0.1, 1.5, 0.15],
});

const clamp = (value, [low, high]) => Math.max(low, Math.min(high, value));
const MOVED = 3; // Numbers moved by a mutation, at most.

/**
 * A variant: a few numbers moved, within their bounds.
 * @param {Record<string, number>} numbers
 * @param {{next: () => number, int: (n: number) => number}} rng
 * @returns {Record<string, number>}
 */
export function mutateNumbers(numbers, rng) {
  const keys = Object.keys(NUMBER_RANGES);
  const child = { ...numbers };
  for (let moved = 1 + rng.int(MOVED); moved > 0; moved -= 1) {
    const key = keys[rng.int(keys.length)];
    const range = NUMBER_RANGES[key];
    child[key] = clamp(child[key] + (rng.next() * 2 - 1) * range[2], range);
  }
  return child;
}

/**
 * Is a variant kept? It must beat its version by more than chance, on seeds of its own, and not lose to anyone in the panel.
 * @param {{gap: {low: number}}} againstVersion its report against the version it comes from
 * @param {{part: number}[]} againstPanel its reports against the panel
 * @param {number} [floor] the least part of the points against each of the panel
 * @returns {boolean}
 */
export function isKept(againstVersion, againstPanel, floor = 0.5) {
  return againstVersion.gap.low > 0 && againstPanel.every(({ part }) => part >= floor);
}

/** The best variants of a screen, its reports in the same order. A quick screen only rejects: what it keeps must still be confirmed. */
export function bestOfScreen(variants, reports, keep) {
  return variants
    .map((numbers, i) => ({ numbers, part: reports[i].part }))
    .sort((one, other) => other.part - one.part)
    .slice(0, keep)
    .filter(({ part }) => part > 0.5);
}
