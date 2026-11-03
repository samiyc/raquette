import { TABLE } from "../ball/constants.js";
import { catchPlan } from "../forecast.js";
import { SERVICES } from "../rally.js";

/**
 * The strokes of a training drill, each with one aim and one way of taking the ball (Sami, 3/11/2026; docs/modele.md, § 6). A
 * drill is no rule to beat: it says whether the model looks like table tennis, since everyone knows what these rallies look
 * like. Every value is a hypothesis, set on these duels (docs/recherche/chiffres.md, § 8).
 *
 * @typedef {object} DrillStroke
 * @property {string} label
 * @property {number} depth how far past the net the ball is sent, metres
 * @property {import("../types.js").Swing} swing
 * @property {number} [rise] metres above the table, for a ball taken on the rise; otherwise at the top of its bounce
 * @property {number} back where the player waits, metres behind its line
 */

/** @type {Readonly<Record<string, DrillStroke>>} */
export const DRILL_STROKES = Object.freeze({
  push: { label: "Poussette", depth: 0.9, swing: { speed: 3, brushUp: -2, brushSide: 0 }, rise: 0.2, back: 0.2 },
  top: { label: "Top", depth: 0.95, swing: { speed: 10, brushUp: 10, brushSide: 0 }, back: 0.7 },
  block: { label: "Bloc", depth: 0.9, swing: { speed: 6, brushUp: 0, brushSide: 0 }, rise: 0.2, back: 0.2 },
});

/**
 * @param {DrillStroke} stroke
 * @returns {import("../types.js").Rule}
 */
export function drillRule(stroke) {
  return {
    name: stroke.label,
    decide(view) {
      const plan = catchPlan(view, stroke.rise);
      if (!plan) return null;
      return {
        step: plan.step,
        goal: plan.goal,
        target: [-view.side * stroke.depth, 0],
        swing: stroke.swing,
        next: [view.side * (TABLE.halfLength + stroke.back), 0],
      };
    },
  };
}

/** Two players for a duel: each waits where its stroke is played from. */
export function drillPlayers(first, second, profile) {
  return [first, second].map((stroke) => ({ rule: drillRule(stroke), profile: { ...profile, waitBehindLine: stroke.back } }));
}

/** The duels the page offers, and the tests hold (Sami, 3/11/2026): each starts with the service that suits it. */
export const DUELS = Object.freeze({
  topBlock: { label: "Top contre bloc", first: DRILL_STROKES.top, second: DRILL_STROKES.block, service: SERVICES.long },
  pushes: { label: "Poussette contre poussette", first: DRILL_STROKES.push, second: DRILL_STROKES.push, service: SERVICES.shortCut },
});
