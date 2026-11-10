/**
 * Strokes of their own for the return and the third ball (Sami, 10/11/2026). Against itself, H's server wins 60 % of the points, and
 * what pays is an answer to a situation, not a fixed sequence: a top on a high return, a soft stroke on a cut one
 * (docs/recherche/autojeu.md). A rule with these numbers plays the return of service and its own third ball with them, the rest of
 * the rally with its own: self-play can then set the first strokes apart. Each starts as the rule's own number, so the rule is unchanged.
 */

/** The numbers a phase may set apart: when to attack, and how, where to and how hard to push or play soft. */
export const PHASE_KEYS = Object.freeze(["highBall", "ready", "topSpeed", "topBrush", "topDepth", "topWide", "pushSpeed", "pushBrush", "depth", "wide", "softDepth", "softWide"]);

/** Each phase, by the strokes played before it in the rally: none before the return, the service and the return before the third ball. */
export const PHASES = Object.freeze({ return: 0, third: 1 });

/** `third` and `topSpeed` give `thirdTopSpeed`. */
export const phaseKey = (phase, key) => `${phase}${key[0].toUpperCase()}${key.slice(1)}`;

/**
 * The phase numbers of a rule, each as its own number: added to a rule, they change nothing until self-play moves them.
 * @param {Record<string, number>} numbers
 * @returns {Record<string, number>}
 */
export function phaseNumbers(numbers) {
  return Object.fromEntries(Object.keys(PHASES).flatMap((phase) => PHASE_KEYS.map((key) => [phaseKey(phase, key), numbers[key]])));
}

/**
 * The numbers a phase plays with, or null if the rule has none for it.
 * @param {Record<string, number>} numbers
 * @param {string} phase
 * @returns {Record<string, number> | null}
 */
export function numbersOf(numbers, phase) {
  if (!PHASE_KEYS.every((key) => phaseKey(phase, key) in numbers)) return null;
  return { ...numbers, ...Object.fromEntries(PHASE_KEYS.map((key) => [key, numbers[phaseKey(phase, key)]])) };
}
