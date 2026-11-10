import { PHASE_KEYS, PHASES, phaseKey } from "./rules/phases.js";
import { SERVE_AIMS, SERVE_FROMS } from "./rules/serving.js";

/**
 * Self-play (Sami, 2/11/2026; docs/modele.md, § 8): a rule's numbers move, and a variant is kept only if it beats the version it comes
 * from. On CodinGame, three local gains vanished on the site because the arena only measured against the bot's own line: a panel that
 * does not move is read beside it, to see that happen. Pure, so that it is tested; scripts/selfplay.js plays the rallies.
 */

/** How far each number may go, and how far a mutation moves it at most. All hypotheses: the bounds keep a rule within what the model was fitted on. */
const BASE_RANGES = {
  wide: [0, 0.65, 0.1],
  depth: [0.35, 1.15, 0.1],
  topWide: [0, 0.65, 0.1],
  topDepth: [0.45, 1.2, 0.1],
  topSpeed: [3, 16, 1.5],
  topBrush: [2, 16, 2],
  pushSpeed: [1.5, 6, 0.5],
  pushBrush: [-8, 0, 1],
  pushVary: [0, 6, 1],
  flatSpeed: [3, 12, 1],
  highBall: [0.1, 0.5, 0.05],
  wait: [0, 1.5, 0.15],
  cover: [0, 1, 0.2],
  ready: [-1, 0.5, 0.15],
  softSpeed: [2, 9, 1],
  softBrush: [-8, 8, 2],
  softDepth: [0.5, 1.15, 0.1],
  softWide: [0, 0.65, 0.1],
  softRise: [0, 0.3, 0.05],
  killSlow: [0, 14, 2],
  killHigh: [0.1, 0.6, 0.05],
  killReady: [-0.5, 0.5, 0.1],
  killSpeed: [8, 16, 1.5],
  killBrush: [0, 16, 2],
  killWide: [0.1, 0.7, 0.1],
};

export const NUMBER_RANGES = Object.freeze({
  ...BASE_RANGES,
  // The service (src/rules/serving.js): moved only in a rule that has them.
  servePendule: [0, 4, 1],
  serveMarteau: [0, 4, 1],
  serveMou: [0, 4, 1],
  serveCoupe: [0, 4, 1],
  serveBombe: [0, 4, 1],
  serveLateral: [0, 4, 1],
  ...Object.fromEntries(SERVE_AIMS.map((key) => [key, [-0.45, 0.45, 0.1]])),
  ...Object.fromEntries(SERVE_FROMS.map((key) => [key, [-0.5, 0.5, 0.15]])),
  // The return and the third ball (src/rules/phases.js), each in the range of the number it stands for.
  ...Object.fromEntries(Object.keys(PHASES).flatMap((phase) => PHASE_KEYS.map((key) => [phaseKey(phase, key), BASE_RANGES[key]]))),
});

const clamp = (value, [low, high]) => Math.max(low, Math.min(high, value));
const MOVED = 3; // Numbers moved by a mutation, at most.

/**
 * A variant: a few numbers moved, within their bounds, among those the rule has.
 * @param {Record<string, number>} numbers
 * @param {{next: () => number, int: (n: number) => number}} rng
 * @param {RegExp | null} [focus] only the numbers whose name matches move
 * @returns {Record<string, number>}
 */
export function mutateNumbers(numbers, rng, focus = null) {
  const keys = Object.keys(NUMBER_RANGES).filter((key) => key in numbers && (!focus || focus.test(key)));
  const child = { ...numbers };
  for (let moved = 1 + rng.int(MOVED); moved > 0; moved -= 1) {
    const key = keys[rng.int(keys.length)];
    const range = NUMBER_RANGES[key];
    child[key] = clamp(child[key] + (rng.next() * 2 - 1) * range[2], range);
  }
  return child;
}

/**
 * Is a variant kept? It must beat its version by more than chance, on seeds of its own. No more than that (Sami, 4/11/2026): a floor
 * against the panel stopped any lineage from R3, which V beats by far, from moving at all. The panel is now only read, for each version
 * kept and at the end: it says whether a lineage goes round in circles.
 * @param {{gap: {low: number}}} againstVersion its report against the version it comes from
 * @returns {boolean}
 */
export function isKept(againstVersion) {
  return againstVersion.gap.low > 0;
}

/** The best variants of a screen, its reports in the same order. A quick screen only rejects: what it keeps must still be confirmed. */
export function bestOfScreen(variants, reports, keep) {
  return variants
    .map((numbers, i) => ({ numbers, part: reports[i].part }))
    .sort((one, other) => other.part - one.part)
    .slice(0, keep)
    .filter(({ part }) => part > 0.5);
}

/**
 * Is a variant kept, when a sparring partner also judges it (Sami, 10/11/2026: self-play against S-mH)? The search picks the service
 * that makes a rule miss, which no version of a lineage does. The gain is the sum of two measures, in points per seed: the variant
 * against its version, and the variant against the sparring partner less its version against it, on the same seeds. Kept if that
 * sum beats chance, its margins put together as those of two independent measures.
 * @param {{gap: {mean: number, low: number, high: number}}} againstVersion
 * @param {{mean: number, low: number, high: number}} sparringGap variant less version against the sparring partner, per seed
 * @returns {boolean}
 */
export function isKeptWithSparring(againstVersion, sparringGap) {
  const { gap } = againstVersion;
  const margin = Math.hypot((gap.high - gap.low) / 2, (sparringGap.high - sparringGap.low) / 2);
  return gap.mean + sparringGap.mean - margin > 0;
}
