import { BALL, BALL_SIZE, NET, STEP, TABLE, X, Y, Z } from "./ball/constants.js";
import { fly } from "./ball/flight.js";
import { poseRacket, RACKET_SIZE, strike } from "./racket.js";

/**
 * The aim: the two tilts of the racket that send the ball onto a point of the other camp, by Newton's method, each try
 * flying the ball once (docs/modele.md, § 4). It is ballistics, shared by rules and searches, not a decision. Everything is
 * done in the player's own frame, so that two players facing each other get exact mirror images.
 */
const RADIUS = BALL.radius;
const MAX_FLIGHT = 720; // Three seconds: a ball that never comes down has no landing to aim with.
const NUDGE = 0.01;
const MAX_MOVE = 0.3;
const MAX_TILT = 3;
const MAX_ROUNDS = 6;
const TOLERANCE = 0.01; // One centimetre: far below the scatter of a stroke.
const LOW_START = 0.05;
const HIGH_START = 0.6;
const NOT_LANDED = 1e3;

const flying = new Float64Array(BALL_SIZE);
const racket = new Float64Array(RACKET_SIZE);
const landed = new Float64Array(3);
const pose = new Float64Array(3);
const base = new Float64Array(3);
const best = new Float64Array(3);

/** Where the ball first comes down on the table's level, into `landed`, with what it has to spare over the net. */
function flyToLanding() {
  landed[2] = -NOT_LANDED;
  for (let step = 0; step < MAX_FLIGHT; step += 1) {
    const [px, py, pz] = [flying[X], flying[Y], flying[Z]];
    fly(flying, STEP);
    if (px * flying[X] <= 0 && px !== 0) landed[2] = pz + (flying[Z] - pz) * (px / (px - flying[X])) - NET.height - RADIUS;
    if (pz >= RADIUS && flying[Z] < RADIUS) {
      const part = (pz - RADIUS) / (pz - flying[Z]);
      landed[0] = px + (flying[X] - px) * part;
      landed[1] = py + (flying[Y] - py) * part;
      return;
    }
    if (flying[Z] < TABLE.floor) break;
  }
  landed[0] = flying[X] > 0 ? NOT_LANDED : -NOT_LANDED;
  landed[1] = 0;
}

/**
 * What a racket with these tilts does: the miss in the player's own frame, into `landed`.
 * @param {import("./types.js").AimTask} task
 */
function tryTilts(task, side, up) {
  flying.set(task.ball);
  pose[0] = side;
  pose[1] = up;
  pose[2] = task.forward;
  poseRacket(racket, pose, task.swing, flying);
  strike(flying, racket);
  flyToLanding();
  landed[0] = task.forward * (landed[0] - task.target[0]);
  landed[1] = task.forward * (landed[1] - task.target[1]);
}

const clampMove = (move) => Math.max(-MAX_MOVE, Math.min(MAX_MOVE, move));
const clampTilt = (tilt) => Math.max(-MAX_TILT, Math.min(MAX_TILT, tilt));

/** One step of Newton from the tilts in `out`. @returns {boolean} false when the slopes say nothing */
function newtonStep(task, out) {
  base.set(landed);
  const [side, up] = [out[0], out[1]];
  tryTilts(task, side + NUDGE, up);
  const [xa, ya] = [(landed[0] - base[0]) / NUDGE, (landed[1] - base[1]) / NUDGE];
  tryTilts(task, side, up + NUDGE);
  const [xb, yb] = [(landed[0] - base[0]) / NUDGE, (landed[1] - base[1]) / NUDGE];
  const det = xa * yb - xb * ya;
  if (Math.abs(det) < 1e-9) return false;
  out[0] = clampTilt(side + clampMove((xb * base[1] - yb * base[0]) / det));
  out[1] = clampTilt(up + clampMove((ya * base[0] - xa * base[1]) / det));
  return true;
}

/** Newton's method from a starting tilt. @returns {number} the miss, in metres; `landed` holds the last flight */
function solveFrom(task, out) {
  let miss = NOT_LANDED;
  for (let round = 0; round <= MAX_ROUNDS; round += 1) {
    tryTilts(task, out[0], out[1]);
    miss = Math.abs(landed[0]) + Math.abs(landed[1]);
    if (miss < TOLERANCE || round === MAX_ROUNDS || !newtonStep(task, out)) break;
  }
  return miss;
}

/** Points the racket towards the target and a little up, the first guess. */
function startTilts(task, up, out) {
  const ahead = task.target[0] - task.ball[X];
  out[0] = ahead === 0 ? 0 : (task.forward * (task.target[1] - task.ball[Y])) / (task.forward * ahead);
  out[1] = up;
}

const clearsNet = () => landed[2] > 0;

/**
 * The tilts for a stroke: a low flight if one clears the net, otherwise a higher one. When neither hits the target, the tilts
 * of the closest are kept: the stroke is played all the same, and the rally says what comes of it.
 * @param {import("./types.js").AimTask} task
 * @param {Float64Array} out the two tilts
 * @returns {boolean} whether the stroke lands on its target and clears the net
 */
export function aim(task, out) {
  startTilts(task, LOW_START, out);
  const low = solveFrom(task, out);
  if (low < TOLERANCE && clearsNet()) return true;
  best[0] = out[0];
  best[1] = out[1];
  startTilts(task, HIGH_START, out);
  const high = solveFrom(task, out);
  if (high < TOLERANCE && clearsNet()) return true;
  if (low <= high) {
    out[0] = best[0];
    out[1] = best[1];
  }
  return false;
}
