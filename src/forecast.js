import { BALL_SIZE, X } from "./ball/constants.js";
import { advance, FLOOR_TOUCH, NET_TOUCH, TABLE_BOUNCE } from "./ball/table.js";
import { BX, BY, OK, reachOf, runDistance, SECTOR_COS, standFor } from "./player.js";

/**
 * What a player reads of the ball: its whole way, as the ball is read without error for now (docs/modele.md, § 4), and the
 * instant and the stand to take it from. It decides nothing of where the ball goes next: that is the rule's.
 */
const MAX_STEPS = 720;
const COMFORT = 0.5; // Metres from the body to the ball at contact, with time to spare (H).
const REACH_MARGIN = 0.97; // The body comes short of its full reach by a few centimetres of a step (H).
const LEVEL_MARGIN = 0.05;

const ball = new Float64Array(BALL_SIZE);
const contact = new Float64Array(3);
export const frames = new Float64Array((MAX_STEPS + 1) * BALL_SIZE);

/** What a bounce does to the window: it opens at the first bounce on our side, closes at the second, and a bounce elsewhere ends it. */
function afterBounce(way, step, side) {
  if (side * contact[0] <= 0) {
    if (way.from < 0) way.from = -2;
    return true;
  }
  if (way.from >= 0) return true;
  way.from = step;
  return false;
}

function endsWay(kind, way, step, side) {
  if (kind === NET_TOUCH || kind === FLOOR_TOUCH) return true;
  return kind === TABLE_BOUNCE && afterBounce(way, step, side);
}

/**
 * The ball's way from now, into `frames`, as long as `side` may take it.
 * @param {Float64Array} start the ball
 * @param {number} side the side of the player reading it
 * @param {boolean} [served] a service yet to bounce on the server's side, which ends nothing
 * @returns {{from: number, to: number}} the steps at which it may be taken; `from` is negative if never
 */
export function readWay(start, side, served = false) {
  ball.set(start);
  frames.set(ball);
  const way = { from: -1, to: -1 };
  let ownBounce = served;
  for (let step = 1; step <= MAX_STEPS; step += 1) {
    const kind = advance(ball, contact);
    frames.set(ball, step * BALL_SIZE);
    if (kind === TABLE_BOUNCE && ownBounce) ownBounce = false;
    else if (endsWay(kind, way, step, side)) break;
    way.to = step;
  }
  if (way.from < 0) way.from = -1;
  return way;
}

const seen = new Float64Array(3);

function seeFrame(step) {
  seen.set(frames.subarray(step * BALL_SIZE + X, step * BALL_SIZE + X + 3));
}

/** The highest point of the window: the top of the bounce. */
function topOf(way) {
  let top = way.from;
  for (let step = way.from; step <= way.to; step += 1) {
    if (frames[step * BALL_SIZE + 2] > frames[top * BALL_SIZE + 2]) top = step;
  }
  return top;
}

/** The stand with time to spare, behind the ball; a body already there stays. */
function comfortStand(view) {
  return standFor([seen[0] + view.side * COMFORT, seen[1]], view.side, view.profile);
}

/** The distance between two points of the plane, x and y first. */
function apart(one, other) {
  const dx = other[0] - one[BX];
  const dy = other[1] - one[BY];
  return Math.sqrt(dx * dx + dy * dy);
}

/** Slowing down to stop takes half as long again as passing through: the time to stand at a distance, from rest. */
function timeToStand(distance, profile) {
  const braking = (profile.speed * profile.speed) / profile.acceleration;
  if (distance < braking) return 2 * Math.sqrt(distance / profile.acceleration);
  return (2 * profile.speed) / profile.acceleration + (distance - braking) / profile.speed;
}

/**
 * No time to stand: how far the body must run for the arm to get the ball on the way. A ball in front: until it is within
 * reach. A ball gone past the body: back level with it, since the 140° of the back are out of reach.
 */
function rushFor(view, time, stand) {
  const { body, side, profile } = view;
  const behind = side * (seen[0] - body[BX]);
  const distance = apart(body, seen);
  const passed = distance > 0 && -behind / distance < SECTOR_COS;
  const goal = passed ? stand : standFor(seen, side, profile);
  if (apart(goal, seen) > profile.reach) return null;
  const needed = passed ? behind + LEVEL_MARGIN : distance - profile.reach * REACH_MARGIN;
  return needed <= runDistance(time, profile) ? goal : null;
}

/** Where to go to take the ball at `step`, or null if the body cannot be there in time. */
function goalFor(view, step, h) {
  seeFrame(step);
  const { profile } = view;
  if (seen[2] < profile.lowest || seen[2] > profile.highest) return null;
  const stand = comfortStand(view);
  const time = step * h;
  const standing = reachOf(stand, seen, view.side, profile) === OK;
  if (standing && timeToStand(apart(view.body, stand), profile) <= time) return stand;
  return rushFor(view, time, stand);
}

/**
 * The instant and the stand to take the ball: at the top of its bounce, or else at the last instant within reach (docs/modele.md,
 * § 6). `view.way` comes from `readWay`.
 * @param {import("./types.js").View} view
 * @returns {{step: number, goal: number[]} | null}
 */
export function catchPlan(view) {
  const { way, h } = view;
  if (way.from < 0 || way.to < way.from) return null;
  const top = topOf(way);
  const atTop = goalFor(view, top, h);
  if (atTop) return { step: top, goal: atTop };
  for (let step = way.to; step >= way.from; step -= 1) {
    const goal = goalFor(view, step, h);
    if (goal) return { step, goal };
  }
  return null;
}
