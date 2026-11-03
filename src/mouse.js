import { TABLE, Y } from "./ball/constants.js";
import { BY, GOAL_X, GOAL_Y, placeBody, setGoal, waitingX } from "./player.js";
import { MOST_FROM, receiverY, SERVE_BEHIND, serviceBall, SERVICE_KINDS } from "./services.js";
import { contactStep, STROKE_KINDS } from "./strokes.js";

/**
 * The mouse player (Sami, 2/11/2026; docs/modele.md, § 10): the left button says where to go, the right button where to send the
 * ball. Only the input is simple: the body, the sector, the preparation and the scatter are the robot's. The force, no brush
 * and the contact at the top of the bounce are R0's. Everything goes through plain functions, so that tests can click.
 */
const LEFT = 0;
const RIGHT = 2;
const CENTRE = 0.685;

/** A pixel of the view from above, counted from the top of that view, in metres: the inverse of `topPoint` in web/scale.js. */
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
    version: 1,
    aim,
    /** @type {number[] | null} a move asked during the reaction, which starts when it ends */
    waiting: null,
    stroke: "flat",
    service: "pendule",
    /** The swing of the stroke picked, kept in place: a plan made before a pick plays it all the same. */
    swing: { ...STROKE_KINDS.flat.swing },
    /** @param {import("./types.js").View} view */
    decide(view) {
      if (rule.waiting) setGoal(view.body, rule.waiting, view);
      rule.waiting = null;
      if (view.way.from < 0) return null;
      return {
        step: contactStep(view.way, STROKE_KINDS[rule.stroke]),
        goal: [view.body[GOAL_X], view.body[GOAL_Y]],
        target: rule.aim,
        swing: rule.swing,
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
 * @param {{moveTo?: number[], moveBy?: number[], aimAt?: number[], stroke?: string, service?: string}} order `moveBy`: from where the
 *   body is going, the keys of the page
 * @returns {boolean} whether it was taken
 */
export function applyOrder(state, { rule, who }, order) {
  const seat = state.seats[who];
  if (order.service) return serviceOrder(state, { rule, who }, order.service);
  const to = order.moveBy ? destinationOf(rule, state.bodies[who]).map((at, i) => at + order.moveBy[i]) : order.moveTo;
  if (to) {
    moveOrder(state, { rule, who, seat }, to);
    return true;
  }
  const plan = state.plans[who];
  if (plan && state.tick >= plan.at - Math.round(seat.profile.preparation * 240)) return false;
  if (order.stroke) pickStroke(rule, order.stroke);
  else {
    setAim(rule, order.aimAt);
    if (canServe(state, who)) relaunch(state, { rule, who });
  }
  return true;
}

function moveOrder(state, { rule, who, seat }, to) {
  if (canServe(state, who)) {
    placeBody(state.bodies[who], serverPlace(to, seat), seat);
    relaunch(state, { rule, who });
  } else if (state.tick === 0) placeBody(state.bodies[who], to, seat);
  else if (state.tick < state.decideAt[who]) rule.waiting = to;
  else setGoal(state.bodies[who], to, seat);
}

function setAim(rule, at) {
  rule.aim[0] = at[0];
  rule.aim[1] = at[1];
}

/** The stroke of the next ball. A side stroke brushes towards the side aimed at. */
function pickStroke(rule, key) {
  const { swing } = STROKE_KINDS[key];
  rule.stroke = key;
  Object.assign(rule.swing, swing);
  if (swing.sideways && rule.aim[1] < 0) rule.swing.brushSide = -swing.brushSide;
}

/** The service sets off anew from where the server stands: its kind, and where it is sent across the table. The other player follows. */
function relaunch(state, { rule, who }) {
  const { side } = state.seats[who];
  const from = -side * state.bodies[who][BY];
  state.ball.set(serviceBall(side, SERVICE_KINDS[rule.service], { seed: state.seed, y: -side * rule.aim[1], from }));
  const other = state.seats[1 - who];
  placeBody(state.bodies[1 - who], [waitingX(other.side, other.profile), receiverY(state.ball[Y], other.profile)], other);
}

const between = (value, low, high) => Math.max(low, Math.min(high, value));

/** Where a server may stand: behind its line, with the ball in reach, and across the table no further than a service leaves from. */
function serverPlace(to, { side, profile }) {
  const back = between(side * to[0], TABLE.halfLength + SERVE_BEHIND, TABLE.halfLength + profile.reach);
  return [side * back, between(to[1], -MOST_FROM, MOST_FROM)];
}

/** Before the point, the server picks its service and where it goes. */
const canServe = (state, who) => state.tick === 0 && state.server === who;

function serviceOrder(state, player, key) {
  if (!canServe(state, player.who)) return false;
  player.rule.service = key;
  relaunch(state, player);
  return true;
}
