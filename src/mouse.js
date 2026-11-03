import { TABLE } from "./ball/constants.js";
import { topStep } from "./forecast.js";
import { GOAL_X, GOAL_Y, placeBody, setGoal } from "./player.js";
import { R0_SWING } from "./rules/center.js";

/**
 * The mouse player (Sami, 2/11/2026; docs/modele.md, § 10): the left button says where to go, the right button where to send the
 * ball. Only the input is simple: the body, the sector, the preparation and the scatter are the robot's. The force, no brush
 * and the contact at the top of the bounce are R0's. Everything goes through plain functions, so that tests can click.
 */
const LEFT = 0;
const RIGHT = 2;
const CENTRE = 0.685;

/** A pixel of the view from above, in metres: the inverse of `topPoint` in web/scale.js. */
function worldOf(px, py, layout) {
  return [(px - layout.width / 2) / layout.scale, (layout.topHeight / 2 - py) / layout.scale];
}

const onOtherCamp = (at, forward) => forward * at[0] > 0 && forward * at[0] <= TABLE.halfLength && Math.abs(at[1]) <= TABLE.halfWidth;

/**
 * What a click asks. A click off the view from above, or a right click off the other camp, asks nothing.
 * @param {{px: number, py: number, button: number}} click
 * @param {{width: number, scale: number, topHeight: number, forward: number}} view
 * @returns {{moveTo: number[]} | {aimAt: number[]} | null}
 */
export function orderOf({ px, py, button }, view) {
  if (py < 0 || py > view.topHeight) return null;
  const at = worldOf(px, py, view);
  if (button === LEFT) return { moveTo: at };
  if (button === RIGHT && onOtherCamp(at, view.forward)) return { aimAt: at };
  return null;
}

/**
 * The player's rule: it reads the ball as the robot does and plays it at the top of its bounce, wherever the clicks have put the
 * body and the aim. A ball going out is let go, since the robot lets it go too.
 * @param {number[]} aim where the ball goes, kept in place from one stroke to the next
 */
export function createMouseRule(aim) {
  const rule = {
    name: "souris",
    aim,
    /** @type {number[] | null} a move asked during the reaction, which starts when it ends */
    waiting: null,
    /** @param {import("./types.js").View} view */
    decide(view) {
      if (rule.waiting) setGoal(view.body, rule.waiting, view);
      rule.waiting = null;
      if (view.way.from < 0) return null;
      return {
        step: topStep(view.way),
        goal: [view.body[GOAL_X], view.body[GOAL_Y]],
        target: rule.aim,
        swing: R0_SWING,
        next: null,
      };
    },
  };
  return rule;
}

export const firstAim = (forward) => [forward * CENTRE, 0];

/** Where the body is going, a move waiting for the end of the reaction first: what the page shows. */
export function destinationOf(rule, body) {
  return rule.waiting ?? [body[GOAL_X], body[GOAL_Y]];
}

/**
 * Applies a click to a rally, at its current step. Before the service, a move places the body at once: a player chooses where
 * to wait. Then a move during the reaction waits for its end: the pause gives time to think, not to run. An aim counts until the
 * preparation of the stroke starts.
 * @param {any} state the rally
 * @param {{rule: ReturnType<typeof createMouseRule>, who: number}} player
 * @param {{moveTo?: number[], aimAt?: number[]}} order
 * @returns {boolean} whether it was taken
 */
export function applyOrder(state, { rule, who }, order) {
  const seat = state.seats[who];
  if (order.moveTo) {
    if (state.tick === 0) placeBody(state.bodies[who], order.moveTo, seat);
    else if (state.tick < state.decideAt[who]) rule.waiting = order.moveTo;
    else setGoal(state.bodies[who], order.moveTo, seat);
    return true;
  }
  const plan = state.plans[who];
  if (plan && state.tick >= plan.at - Math.round(seat.profile.preparation * 240)) return false;
  rule.aim[0] = order.aimAt[0];
  rule.aim[1] = order.aimAt[1];
  return true;
}
