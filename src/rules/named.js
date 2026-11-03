import { RULES } from "./ladder.js";
import { createSearch } from "./search.js";
import { TUNED } from "./tuned.js";
import { createTunable } from "./tunable.js";

/**
 * The rules and searches by name, for the scripts and the page. A search's name says how it is set: `S` climbs, `MC` draws every plan
 * afresh, the witness; `full` tries everything, without leaving out what cannot be played; `S4` has four times the budget.
 * `Smix` does not pick its service. A name can set a search further, to measure its settings: `S-d16`, `MC-b96`, or say which rule
 * it takes the opponent for: `S-mT`. `T` and its likes are the rules self-play kept (src/rules/tuned.js).
 */
const SEARCHES = {
  S: (budget) => ({ budget }),
  MC: (budget) => ({ budget, freshEvery: 1 }),
  Sfull: (budget) => ({ budget, pruned: false }),
  MCfull: (budget) => ({ budget, freshEvery: 1, pruned: false }),
  S4: (budget) => ({ budget: budget * 4 }),
  Smix: (budget) => ({ budget, serves: false }),
};

const SETTINGS = { b: "budget", d: "draws", h: "horizon" };

/** One part of a name: a rule for the model, a number for the rest. */
const settingOf = (part) => (part[0] === "m" ? ["model", namedRule(part.slice(1))] : [SETTINGS[part[0]], Number(part.slice(1))]);

/** What a name adds to a search: `S-d8-h6-b96`, 8 draws, 6 strokes ahead, 96 plans a stroke. */
const settingsIn = (parts) => Object.fromEntries(parts.map(settingOf));

/**
 * @param {string} name
 * @param {number} budget plans a stroke, for a search
 * @param {Record<string, any>} [catalog] rules with their numbers (src/rules/tunable.js), for self-play
 * @returns {import("../types.js").Rule}
 */
export function namedRule(name, budget = 0, catalog = {}) {
  const numbers = catalog[name] ?? TUNED[name];
  if (numbers) return createTunable(numbers, name);
  const [base, ...parts] = name.split("-");
  if (SEARCHES[base]) return createSearch({ ...SEARCHES[base](budget), ...settingsIn(parts), name });
  if (RULES[name]) return RULES[name];
  throw new Error(`règle inconnue : ${name}`);
}
