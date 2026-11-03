import { RULES } from "./ladder.js";
import { createSearch } from "./search.js";

/**
 * The rules and searches by name, for the scripts and the page. A search's name says how it is set: `S` climbs, `MC` draws every plan
 * afresh, the witness; `full` tries everything, without leaving out what cannot be played; `S4` has four times the budget.
 * A name can set a search further, to measure its settings: `S-d8`, `MC-b96`.
 */
const SEARCHES = {
  S: (budget) => ({ budget }),
  MC: (budget) => ({ budget, freshEvery: 1 }),
  Sfull: (budget) => ({ budget, pruned: false }),
  MCfull: (budget) => ({ budget, freshEvery: 1, pruned: false }),
  S4: (budget) => ({ budget: budget * 4 }),
};

const SETTINGS = { b: "budget", d: "draws", h: "horizon" };

/** What a name adds to a search: `S-d8-h6-b96`, 8 draws, 6 strokes ahead, 96 plans a stroke. */
function settingsIn(parts) {
  return Object.fromEntries(parts.map((part) => [SETTINGS[part[0]], Number(part.slice(1))]));
}

/**
 * @param {string} name
 * @param {number} budget plans a stroke, for a search
 * @returns {import("../types.js").Rule}
 */
export function namedRule(name, budget) {
  const [base, ...parts] = name.split("-");
  if (SEARCHES[base]) return createSearch({ ...SEARCHES[base](budget), ...settingsIn(parts), name });
  if (RULES[name]) return RULES[name];
  throw new Error(`règle inconnue : ${name}`);
}
