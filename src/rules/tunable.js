import { aim } from "../aim.js";
import { BALL_SIZE, TABLE, VX, VY, VZ, X, Z } from "../ball/constants.js";
import { catchPlan, frames } from "../forecast.js";
import { BY } from "../player.js";

/**
 * The rule of attack, its numbers in the open so that self-play can set them (docs/modele.md, § 8): a lift on what comes high enough,
 * a push on what stays low over the table if it can be played, flat otherwise, to the far side of the opponent, softer when rushed.
 * With its first numbers, it is R3. Each number is a hypothesis, which is the point: self-play moves them.
 */
export const R3_NUMBERS = Object.freeze({
  wide: 0.5, // Metres from the middle line.
  depth: 0.685,
  topWide: 0.45,
  topDepth: 0.9,
  topSpeed: 10,
  topBrush: 10,
  pushSpeed: 3,
  pushBrush: -2,
  flatSpeed: 6.5,
  highBall: 0.25, // Metres above the table: high enough to attack.
  wait: 0.5, // Metres behind the line, between strokes.
});

const RUSHED = 0.15; // Seconds: under this, a prudent player hits softer (Q-P6).
const SOFT = 0.7;
const tilts = new Float64Array(3);

/**
 * The side of the other camp furthest from the opponent, given by where the opponent stands: a target wide, and as deep as asked.
 * @param {import("../types.js").View} view
 * @param {number} depth metres past the net
 * @param {number} wide metres from the middle line
 */
export function farSide(view, depth, wide) {
  const y = view.opponent[BY];
  const away = y === 0 ? view.side : -Math.sign(y);
  return [-view.side * depth, away * wide];
}

/** The ball as it will be at contact. */
export function contactOf(step) {
  const at = step * BALL_SIZE;
  const [vx, vy, vz] = [frames[at + VX], frames[at + VY], frames[at + VZ]];
  return { x: frames[at + X], height: frames[at + Z], speed: Math.sqrt(vx * vx + vy * vy + vz * vz) };
}

/** Softer when the time to prepare runs short. */
export function prudent(view, plan, swing) {
  return plan.step * view.h < RUSHED ? { ...swing, speed: swing.speed * SOFT } : swing;
}

/** Can this ball be pushed to that side? A push the aim cannot land would fall on the player's own side. */
function canPush(view, step, target, swing) {
  const ball = frames.slice(step * BALL_SIZE, (step + 1) * BALL_SIZE);
  return aim({ ball, forward: -view.side, target, swing }, tilts);
}

/**
 * @param {typeof R3_NUMBERS} numbers
 * @param {string} name
 * @param {number} [version]
 * @returns {import("../types.js").Rule}
 */
export function createTunable(numbers, name, version = 1) {
  const top = { speed: numbers.topSpeed, brushUp: numbers.topBrush, brushSide: 0 };
  const push = { speed: numbers.pushSpeed, brushUp: numbers.pushBrush, brushSide: 0 };
  const flat = { speed: numbers.flatSpeed, brushUp: 0, brushSide: 0 };
  /** The swing and the target a ball calls for. */
  function strokeFor(view, step) {
    const { x, height } = contactOf(step);
    if (height >= numbers.highBall) return { swing: top, target: farSide(view, numbers.topDepth, numbers.topWide) };
    const target = farSide(view, numbers.depth, numbers.wide);
    const pushing = view.side * x < TABLE.halfLength && canPush(view, step, target, push);
    return { swing: pushing ? push : flat, target };
  }
  return {
    name,
    version,
    decide(view) {
      const plan = catchPlan(view);
      if (!plan) return null;
      const { swing, target } = strokeFor(view, plan.step);
      const next = [view.side * (TABLE.halfLength + numbers.wait), 0];
      return { step: plan.step, goal: plan.goal, target, swing: prudent(view, plan, swing), next };
    },
  };
}
