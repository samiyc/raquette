import { TABLE } from "../ball/constants.js";
import { catchPlan } from "../forecast.js";
import { waitingX } from "../player.js";
import { DRILL_STROKES } from "./drills.js";
import { R0, R0_SWING } from "./center.js";
import { SHORT_SWING } from "./short.js";
import { contactOf, createTunable, farSide as farSideAt, prudent, R3_NUMBERS } from "./tunable.js";

/**
 * The ladder of simple rules (docs/modele.md, § 6): each adds one idea to the one below, so that its measure says what that idea
 * is worth. A search will have to beat the best of them. Their parameters are hypotheses, set on calibration seeds only.
 */
const FLAT = R0_SWING;
const BLOCK = DRILL_STROKES.block;
const FAST_BALL = 9; // m/s: a ball to block rather than to hit (H).
const TOO_FAR_BACK = 1.5; // Metres behind the line (H, Q-P19).
const SHORT = 0.35;

/** The far side, at R3's depth and width unless told otherwise. */
export const farSide = (view, depth = R3_NUMBERS.depth, wide = R3_NUMBERS.wide) => farSideAt(view, depth, wide);

const nextOf = (view) => [waitingX(view.side, view.profile), 0];

const plain = (view, plan, target, swing) => ({ step: plan.step, goal: plan.goal, target, swing, next: nextOf(view) });

/** R1, « loin de lui »: the far corner. */
function decideFar(view) {
  const plan = catchPlan(view);
  return plan && plain(view, plan, farSide(view), FLAT);
}

/** R2, « prudent »: R1, softer when rushed. */
function decidePrudent(view) {
  const plan = catchPlan(view);
  return plan && plain(view, plan, farSide(view), prudent(view, plan, FLAT));
}

/** R3, « effet »: R2, with a lift in attack, deeper since the lift brings it down, and a push on a low ball over the table. */
const SPIN = createTunable(R3_NUMBERS, "R3", 2);

/** R4, « contre »: R3, and a fast ball is blocked, taken on the rise, with the racket nearly still. */
function decideCounter(view) {
  const blocked = view.way.from >= 0 && contactOf(view.way.from).speed >= FAST_BALL;
  if (!blocked) return SPIN.decide(view);
  const plan = catchPlan(view, BLOCK.rise);
  return plan && plain(view, plan, farSide(view), BLOCK.swing);
}

const backOf = (view) => -view.side * view.opponent[0] - TABLE.halfLength;

/** R5, « court » (Sami, 3/11/2026): R4, and a cut that bounces twice against an opponent too far back. */
function decideShort(view) {
  if (backOf(view) < TOO_FAR_BACK) return decideCounter(view);
  const plan = catchPlan(view);
  return plan && plain(view, plan, [-view.side * SHORT, 0], SHORT_SWING);
}

export const RULES = Object.freeze({
  R0,
  R1: { name: "R1", version: 1, decide: decideFar },
  R2: { name: "R2", version: 1, decide: decidePrudent },
  R3: SPIN,
  R4: { name: "R4", version: 2, decide: decideCounter },
  R5: { name: "R5", version: 2, decide: decideShort },
});
