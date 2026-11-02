import { DRAG, MAGNUS, SPEED, SPIN, SPIN_RATIO, WORK_SIZE, writeDrag, writeMagnus } from "./coefficients.js";
import {
  BALL, BALL_SIZE, DRAG_FACTOR, GRAVITY, MAGNUS_FACTOR, MAX_SPEED, MAX_SPIN, VX, VY, VZ, WX, WY, WZ, X, Y, Z,
} from "./constants.js";

/**
 * The ball in flight: Conti et al. 2026's eq. 2, by the midpoint method (RK2) at 240 Hz. Only + − × / and sqrt, exact
 * on every JavaScript engine, so a rally replays alike under Node and in any browser; nothing allocates. The spin is
 * constant in flight, as in Gossard et al. 2026.
 */

/**
 * A ball within the physical bounds (docs/modele.md, § 3): a search must not get outside the domain the model was
 * fitted on.
 * @param {number[]} position x, y, z
 * @param {number[]} velocity vx, vy, vz
 * @param {number[]} spin ωx, ωy, ωz
 * @returns {Float64Array}
 */
export function createBall(position, velocity, spin) {
  const ball = new Float64Array(BALL_SIZE);
  ball.set(position, X);
  ball.set(velocity, VX);
  ball.set(spin, WX);
  return bound(ball);
}

/** Scales the velocity and the spin back to their bounds, in place. */
export function bound(ball) {
  scaleDown(ball, VX, MAX_SPEED);
  scaleDown(ball, WX, MAX_SPIN);
  return ball;
}

function scaleDown(ball, at, limit) {
  const size = Math.sqrt(ball[at] * ball[at] + ball[at + 1] * ball[at + 1] + ball[at + 2] * ball[at + 2]);
  if (size <= limit) return;
  const scale = limit / size;
  ball[at] *= scale;
  ball[at + 1] *= scale;
  ball[at + 2] *= scale;
}

const RADIUS = BALL.radius;
const work = new Float64Array(WORK_SIZE);
const velocity = new Float64Array(3);
const acceleration = new Float64Array(3);

/** The acceleration at `velocity`, written into `acceleration`. Doubles stay in arrays: see coefficients.js. */
function accelerate(ball) {
  const vx = velocity[0];
  const vy = velocity[1];
  const vz = velocity[2];
  const wx = ball[WX];
  const wy = ball[WY];
  const wz = ball[WZ];
  const speed = Math.sqrt(vx * vx + vy * vy + vz * vz);
  work[SPEED] = speed;
  work[SPIN_RATIO] = speed > 0 ? (RADIUS * work[SPIN]) / speed : 0;
  writeDrag(work);
  writeMagnus(work);
  const drag = DRAG_FACTOR * work[DRAG] * speed;
  const magnus = MAGNUS_FACTOR * work[MAGNUS];
  acceleration[0] = -drag * vx + magnus * (wy * vz - wz * vy);
  acceleration[1] = -drag * vy + magnus * (wz * vx - wx * vz);
  acceleration[2] = -drag * vz + magnus * (wx * vy - wy * vx) - GRAVITY;
}

/**
 * One step of flight, in place.
 * @param {Float64Array} ball
 * @param {number} h seconds
 */
export function fly(ball, h) {
  work[SPIN] = Math.sqrt(ball[WX] * ball[WX] + ball[WY] * ball[WY] + ball[WZ] * ball[WZ]);
  velocity[0] = ball[VX];
  velocity[1] = ball[VY];
  velocity[2] = ball[VZ];
  accelerate(ball);
  velocity[0] += (h / 2) * acceleration[0];
  velocity[1] += (h / 2) * acceleration[1];
  velocity[2] += (h / 2) * acceleration[2];
  accelerate(ball);
  ball[X] += h * velocity[0];
  ball[Y] += h * velocity[1];
  ball[Z] += h * velocity[2];
  ball[VX] += h * acceleration[0];
  ball[VY] += h * acceleration[1];
  ball[VZ] += h * acceleration[2];
}
