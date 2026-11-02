import { BALL, BALL_SIZE, NET, STEP, TABLE, VX, VY, VZ, WX, WY, WZ, X, Y, Z } from "./constants.js";
import { fly } from "./flight.js";

/**
 * The table, the net and the floor: a step of flight that stops at the first thing it crosses. At 25 m/s the ball makes
 * 10 cm per step and the net is 15 cm high, so a crossing is found inside the step, by interpolation.
 */

/** What a step ran into. */
export const NONE = 0;
export const TABLE_BOUNCE = 1;
export const NET_TOUCH = 2;
export const FLOOR_TOUCH = 3;

const RADIUS = BALL.radius;
const FRICTION = 0.25; // μ, Conti et al. 2026.
const ROLLING = 0.4; // 2/5: the tangential impulse that ends the sliding, on a thin shell.
const INERTIA_RATIO = 1.5; // m r² / I = 3/2 for a thin shell.
const FLOOR_LEVEL = TABLE.floor + RADIUS;
const NOT_CROSSED = 2; // A fraction of a step is at most 1.

/** The restitution of the table, which falls with the impact speed as the ball buckles: `0.98 − 0.02 |v_z|`. */
export const restitution = (speedDown) => 0.98 - 0.02 * speedDown;

/** The rebound of Nakashima et al., as Conti et al. write it (their eq. 6 to 10, without residuals), in place. */
export function bounce(ball) {
  const speedDown = -ball[VZ];
  const e = restitution(speedDown);
  const slipX = ball[VX] - RADIUS * ball[WY];
  const slipY = ball[VY] + RADIUS * ball[WX];
  const slip = Math.sqrt(slipX * slipX + slipY * slipY);
  const sliding = slip > 0 ? (FRICTION * (1 + e) * speedDown) / slip : ROLLING;
  const alpha = sliding < ROLLING ? sliding : ROLLING;
  const turn = (alpha * INERTIA_RATIO) / RADIUS;
  ball[VX] -= alpha * slipX;
  ball[VY] -= alpha * slipY;
  ball[VZ] = e * speedDown;
  ball[WX] -= turn * slipY;
  ball[WY] += turn * slipX;
}

const previous = new Float64Array(BALL_SIZE);

/** Puts the ball at a fraction of the step just flown, from its position and velocity before it. */
function rewind(ball, part) {
  for (let i = X; i <= VZ; i += 1) ball[i] = previous[i] + (ball[i] - previous[i]) * part;
}

/** The ball stops where it touched. */
function stopAt(ball, part) {
  rewind(ball, part);
  for (let i = VX; i <= WZ; i += 1) ball[i] = 0;
}

/** The fraction of the step at which the ball comes down through a level, or NOT_CROSSED. A ball on the level counts. */
function downThrough(ball, level) {
  return previous[Z] >= level && ball[Z] < level ? (previous[Z] - level) / (previous[Z] - ball[Z]) : NOT_CROSSED;
}

const between = (at, ball, part) => previous[at] + (ball[at] - previous[at]) * part;

function netPart(ball) {
  if (previous[X] === 0 || previous[X] * ball[X] > 0) return NOT_CROSSED;
  const part = previous[X] / (previous[X] - ball[X]);
  return Math.abs(between(Y, ball, part)) <= NET.halfWidth && between(Z, ball, part) <= NET.height + RADIUS ? part : NOT_CROSSED;
}

function tablePart(ball) {
  const part = downThrough(ball, RADIUS);
  if (part === NOT_CROSSED) return part;
  return Math.abs(between(X, ball, part)) <= TABLE.halfLength && Math.abs(between(Y, ball, part)) <= TABLE.halfWidth ? part : NOT_CROSSED;
}

/** The bounce itself, then the rest of the step, flown from the table. */
function bounceWithin(ball, contact, part, h) {
  rewind(ball, part);
  contact[0] = ball[X];
  contact[1] = ball[Y];
  contact[2] = part;
  bounce(ball);
  fly(ball, h * (1 - part));
  // A ball that ends rolling leaves too slowly to clear the table within the step: it must not start the next one below it.
  if (ball[Z] < RADIUS) ball[Z] = RADIUS;
}

/**
 * One step of the simulation, in place. A table contact writes where the ball touched into `contact` (x, y and the
 * fraction of the step) and finishes the step after the bounce; a net or floor contact leaves the ball stopped there.
 * @param {Float64Array} ball
 * @param {Float64Array} contact at least 3 numbers
 * @param {number} [h] seconds
 * @returns {number} NONE, TABLE_BOUNCE, NET_TOUCH or FLOOR_TOUCH
 */
export function advance(ball, contact, h = STEP) {
  for (let i = 0; i < BALL_SIZE; i += 1) previous[i] = ball[i];
  fly(ball, h);
  const onTable = tablePart(ball);
  const onNet = netPart(ball);
  if (onNet !== NOT_CROSSED && onNet <= onTable) {
    stopAt(ball, onNet);
    return NET_TOUCH;
  }
  if (onTable !== NOT_CROSSED) {
    bounceWithin(ball, contact, onTable, h);
    return TABLE_BOUNCE;
  }
  const onFloor = downThrough(ball, FLOOR_LEVEL);
  if (onFloor === NOT_CROSSED) return NONE;
  stopAt(ball, onFloor);
  return FLOOR_TOUCH;
}
