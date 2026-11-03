import { catchPlan } from "../forecast.js";
import { waitingX } from "../player.js";

/**
 * R0, « renvoyer au centre » (docs/modele.md, § 6): the centre of the other camp, a ball leaving at 6.5 m/s, no brush, the ball at the top of its
 * bounce or at the last instant within reach, then back to waiting. The witness every other rule and search is measured against.
 */
const CENTRE = 0.685;
export const R0_SWING = Object.freeze({ speed: 6.5, brushUp: 0, brushSide: 0 });

/** @param {import("../types.js").View} view */
export function takeToCentre(view) {
  const plan = catchPlan(view);
  if (!plan) return null;
  return {
    step: plan.step,
    goal: plan.goal,
    target: [-view.side * CENTRE, 0],
    swing: R0_SWING,
    next: [waitingX(view.side, view.profile), 0],
  };
}

export const R0 = Object.freeze({ name: "R0", decide: takeToCentre });
