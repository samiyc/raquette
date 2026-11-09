import { STEP, TABLE } from "./ball/constants.js";

/**
 * The body and its reach (docs/modele.md, § 4): a point on the floor, one axis towards the net, an arm with no gesture.
 * Every value is a hypothesis of a good club player, gathered here so that a coach can correct them without touching the code.
 */
export const CLUB_PLAYER = Object.freeze({
  waitBehindLine: 0.5, // Q-P12
  reaction: 0.16, // Q-P4, seconds: 0.20 until the arm got shorter (Sami, 4/11/2026); a player reads the stroke as it comes
  speed: 3, // Q-P5, m/s
  acceleration: 14, // Q-P5, m/s²: at 8, turning back took 0.75 s; at 16, too quick to be wrong-footed (Sami); 14 fits the measured steps
  reach: 0.72, // Q-P5, metres: at 0.8, the whole table was covered with hardly a step (Sami, 4/11/2026)
  lean: 0.4, // Q-P19: how far the body goes over the table
  easySwing: 14.2, // m/s, the racket and its brush together: the ordinary top, 10 and 10, is no effort (H, Q-P22)
  swingLoss: 5, // m/s more for one more scatter (H, Q-P22)
  sideWeight: 3.5, // What a m/s of sideways brush weighs in that effort (H, Q-P22): at 3, the side stroke stayed easy (Sami, 3/11/2026)
  lowest: -0.5, // Q-P5: under the table's level
  highest: 1.2, // Q-P5: above it
  preparation: 0.15, // Q-P6, seconds
  easyRun: 1, // Q-P23, m/s: a stroke played while moving this fast costs nothing
  runningLoss: 3, // Q-P23, m/s more for one more scatter: at 4, not much of a reason to be there early (Sami, 4/11/2026); at 2.5, top against block falls under 10 strokes
  scatterTilt: 0.0524, // Q-P1: tan 3°, up and down, on the angle of the face (src/scatter.js, tiltedBy)
  scatterAcross: 0.0262, // Q-P1: tan 1.5°, sideways: at 3°, nothing near a side line was ever worth aiming at
  comfort: 0.45, // Q-P5, metres from the body to the ball, without stretching: the same part of the arm as before
  stretchedScatter: 2, // Q-P2: the scatter at full reach
  easyBall: 10, // Q-P21, m/s at contact: up to this, a ball is under control
  controlLoss: 2.5, // Q-P21, m/s more for the scatter to grow by one more time
  nearTable: 0.6, // Q-P21, metres behind the line: up to this, the distance costs nothing
  farLoss: 1, // Q-P21, metres further for the scatter to grow by one more time
  scatterSpeed: 0.06, // Q-P1
  rushedScatter: 2, // Q-P2: the scatter with no preparation at all
  tiredLoss: 10, // Q-P26: what the strokes of a rally spend, an ordinary top being 1, for one more scatter (Sami, 6/11/2026)
  spinRead: 0.02, // Q-P9: the spin is read within this part of it, one standard deviation (Sami, 6/11/2026)
  spinAnchor: 0.1, // Q-P9: the part of the last ball's spin that stays in the read: a change of spin is read late
});

/** cos 110°, kept as a constant so that the test reads no cosine: 220° around the axis, 110° on each side (Sami, 2/11/2026). */
export const SECTOR_COS = -0.3420201433256687;

/** Where each number sits in a body's Float64Array. */
export const BX = 0;
export const BY = 1;
export const BVX = 2;
export const BVY = 3;
export const GOAL_X = 4;
export const GOAL_Y = 5;
const BODY_SIZE = 6;

/** The place a player waits at, on `side` (−1 or +1): the middle, behind the line. */
export const waitingX = (side, profile) => side * (TABLE.halfLength + profile.waitBehindLine);

/** A body at rest, waiting. */
export function createBody(side, profile) {
  const body = new Float64Array(BODY_SIZE);
  body[BX] = waitingX(side, profile);
  body[GOAL_X] = body[BX];
  return body;
}

/** Writes the nearest place the body may stand at, on its own side and off the table, into `at` (x, y). */
function keepOffTable(at, side, profile) {
  if (side * at[0] < 0) at[0] = 0;
  const intoLength = TABLE.halfLength - profile.lean - side * at[0];
  const intoWidth = TABLE.halfWidth - Math.abs(at[1]);
  if (intoLength <= 0 || intoWidth <= 0) return;
  if (intoLength <= intoWidth) at[0] = side * (TABLE.halfLength - profile.lean);
  else at[1] = (at[1] === 0 ? side : Math.sign(at[1])) * TABLE.halfWidth;
}

const place = new Float64Array(2);

/** Where the body goes next. A goal over the table moves to the nearest place it may stand at. */
export function setGoal(body, target, sideAndProfile) {
  place[0] = target[0];
  place[1] = target[1];
  keepOffTable(place, sideAndProfile.side, sideAndProfile.profile);
  body[GOAL_X] = place[0];
  body[GOAL_Y] = place[1];
}

/** Puts a body at a place at once, at rest: where a player waits before the service. */
export function placeBody(body, target, sideAndProfile) {
  setGoal(body, target, sideAndProfile);
  body[BX] = body[GOAL_X];
  body[BY] = body[GOAL_Y];
}

/**
 * The stand a body may reach for a point of the plane, off the table: a test for a stroke, and what the body would do.
 * @returns {number[]} x, y
 */
export function standFor(target, side, profile) {
  const at = [target[0], target[1]];
  keepOffTable(at, side, profile);
  return at;
}

/** The velocity the body wants: towards its goal, slowing down in time to stop there. */
function steer(body, profile, h) {
  const dx = body[GOAL_X] - body[BX];
  const dy = body[GOAL_Y] - body[BY];
  const distance = Math.sqrt(dx * dx + dy * dy);
  const brake = Math.sqrt(2 * profile.acceleration * distance);
  const wanted = distance > 0 ? Math.min(profile.speed, brake) / distance : 0;
  const pushX = wanted * dx - body[BVX];
  const pushY = wanted * dy - body[BVY];
  const push = Math.sqrt(pushX * pushX + pushY * pushY);
  const limit = profile.acceleration * h;
  const scale = push > limit ? limit / push : 1;
  body[BVX] += pushX * scale;
  body[BVY] += pushY * scale;
}

/** One step of the body, in place. It stops against the table, and slides along it. */
export function moveBody(body, sideAndProfile, h = STEP) {
  steer(body, sideAndProfile.profile, h);
  place[0] = body[BX] + body[BVX] * h;
  place[1] = body[BY] + body[BVY] * h;
  keepOffTable(place, sideAndProfile.side, sideAndProfile.profile);
  body[BX] = place[0];
  body[BY] = place[1];
}

/**
 * How far a body at rest gets in `time` seconds, running flat out: what says who arrives before a second bounce.
 * @param {number} time seconds since it may start
 */
export function runDistance(time, profile) {
  if (time <= 0) return 0;
  const accelerating = profile.speed / profile.acceleration;
  if (time < accelerating) return 0.5 * profile.acceleration * time * time;
  return 0.5 * profile.speed * accelerating + profile.speed * (time - accelerating);
}

/** Why a point is out of reach, or OK. */
export const OK = 0;
export const TOO_FAR = 1;
export const BEHIND = 2;
export const TOO_HIGH = 3;

/**
 * Is a point of the ball's way within the arm's sector? A distance, an angle with the axis towards the net, a band of height.
 * The angle is a dot product against a constant: no trigonometry.
 * @param {number[] | Float64Array} body x, y first
 * @param {number[] | Float64Array} ball x, y, z first
 * @param {number} side the player's side: its axis points towards the net, `−side`
 * @returns {number} OK, TOO_FAR, BEHIND or TOO_HIGH
 */
export function reachOf(body, ball, side, profile) {
  if (ball[2] < profile.lowest || ball[2] > profile.highest) return TOO_HIGH;
  const dx = ball[0] - body[BX];
  const dy = ball[1] - body[BY];
  const square = dx * dx + dy * dy;
  if (square > profile.reach * profile.reach) return TOO_FAR;
  if (square === 0) return OK;
  return (-side * dx) / Math.sqrt(square) >= SECTOR_COS ? OK : BEHIND;
}
