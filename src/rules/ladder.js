import { BALL_SIZE, TABLE, VX, VY, VZ, X, Z } from "../ball/constants.js";
import { aim } from "../aim.js";
import { catchPlan, frames } from "../forecast.js";
import { BY, waitingX } from "../player.js";
import { DRILL_STROKES } from "./drills.js";
import { R0, R0_SWING } from "./center.js";
import { SHORT_SWING } from "./short.js";

/**
 * The ladder of simple rules (docs/modele.md, § 6): each adds one idea to the one below, so that its measure says what that idea
 * is worth. A search will have to beat the best of them. Their parameters are hypotheses, set on calibration seeds only.
 */
const FLAT = R0_SWING;
const PUSH = DRILL_STROKES.push.swing;
const TOP = DRILL_STROKES.top.swing;
const BLOCK = DRILL_STROKES.block;
const WIDE = 0.5; // Metres from the middle line, 26 cm in from the side (H, Q-P11).
const DEPTH = 0.685; // The middle of the camp: going deeper costs more faults than it brings on a flat ball (docs/recherche/chiffres.md, § 8).
const TOP_WIDE = 0.45;
const TOP_DEPTH = 0.9;
const RUSHED = 0.15; // Seconds: under this, a prudent player hits softer (Q-P6).
const SOFT = 0.7;
const HIGH_BALL = 0.25; // Metres above the table: high enough to attack (H).
const FAST_BALL = 9; // m/s: a ball to block rather than to hit (H).
const TOO_FAR_BACK = 1.5; // Metres behind the line (H, Q-P19).
const SHORT = 0.35;
const tilts = new Float64Array(3);

/**
 * The side of the other camp furthest from the opponent, given by where the opponent stands: a target wide, and as deep as asked.
 * @param {import("../types.js").View} view
 * @param {number} [depth] metres past the net
 * @param {number} [wide] metres from the middle line
 */
export function farSide(view, depth = DEPTH, wide = WIDE) {
  const y = view.opponent[BY];
  const away = y === 0 ? view.side : -Math.sign(y);
  return [-view.side * depth, away * wide];
}

const nextOf = (view) => [waitingX(view.side, view.profile), 0];

const plain = (view, plan, target, swing) => ({ step: plan.step, goal: plan.goal, target, swing, next: nextOf(view) });

/** The ball as it will be at contact. */
function contactOf(step) {
  const at = step * BALL_SIZE;
  const [vx, vy, vz] = [frames[at + VX], frames[at + VY], frames[at + VZ]];
  return { x: frames[at + X], height: frames[at + Z], speed: Math.sqrt(vx * vx + vy * vy + vz * vz) };
}

/** R1, « loin de lui »: the far corner. */
function decideFar(view) {
  const plan = catchPlan(view);
  return plan && plain(view, plan, farSide(view), FLAT);
}

/** Softer when the time to prepare runs short. */
function prudent(view, plan, swing) {
  return plan.step * view.h < RUSHED ? { ...swing, speed: swing.speed * SOFT } : swing;
}

/** R2, « prudent »: R1, softer when rushed. */
function decidePrudent(view) {
  const plan = catchPlan(view);
  return plan && plain(view, plan, farSide(view), prudent(view, plan, FLAT));
}

/** Can this ball be pushed to that side? A push the aim cannot land would fall on the player's own side. */
function canPush(view, step) {
  const ball = frames.slice(step * BALL_SIZE, (step + 1) * BALL_SIZE);
  return aim({ ball, forward: -view.side, target: farSide(view), swing: PUSH }, tilts);
}

/**
 * The swing a ball calls for: a lift on what comes high enough, a push on what stays low over the table if it can be played, flat
 * otherwise. A push from behind the table would not reach the other side.
 */
function spinSwing(view, step) {
  const { x, height } = contactOf(step);
  if (height >= HIGH_BALL) return TOP;
  return view.side * x < TABLE.halfLength && canPush(view, step) ? PUSH : FLAT;
}

/** R3, « effet »: R2, with a lift in attack, deeper since the lift brings it down, and a push on a low ball over the table. */
function decideSpin(view) {
  const plan = catchPlan(view);
  if (!plan) return null;
  const swing = spinSwing(view, plan.step);
  const target = swing === TOP ? farSide(view, TOP_DEPTH, TOP_WIDE) : farSide(view);
  return plain(view, plan, target, prudent(view, plan, swing));
}

/** R4, « contre »: R3, and a fast ball is blocked, taken on the rise, with the racket nearly still. */
function decideCounter(view) {
  const blocked = view.way.from >= 0 && contactOf(view.way.from).speed >= FAST_BALL;
  if (!blocked) return decideSpin(view);
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
  R3: { name: "R3", version: 2, decide: decideSpin },
  R4: { name: "R4", version: 2, decide: decideCounter },
  R5: { name: "R5", version: 2, decide: decideShort },
});
