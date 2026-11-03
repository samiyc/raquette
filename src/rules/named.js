import { RULES } from "./ladder.js";
import { createSearch } from "./search.js";

/**
 * The rules and searches by name, for the scripts and the page. A search's name says how it is set: `S` climbs, `MC` draws every plan
 * afresh, the witness; `full` tries everything, without leaving out what cannot be played; `S4` has four times the budget.
 */
const SEARCHES = {
  S: (budget) => ({ budget }),
  MC: (budget) => ({ budget, freshEvery: 1 }),
  Sfull: (budget) => ({ budget, pruned: false }),
  MCfull: (budget) => ({ budget, freshEvery: 1, pruned: false }),
  S4: (budget) => ({ budget: budget * 4 }),
};

/**
 * @param {string} name
 * @param {number} budget plans a stroke, for a search
 * @returns {import("../types.js").Rule}
 */
export function namedRule(name, budget) {
  if (SEARCHES[name]) return createSearch({ ...SEARCHES[name](budget), name });
  if (RULES[name]) return RULES[name];
  throw new Error(`règle inconnue : ${name}`);
}
