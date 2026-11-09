import { BALL, VX, VY, VZ, WX, WY, WZ } from "./ball/constants.js";
import { bound } from "./ball/flight.js";

/**
 * The contact with the racket: Conti et al. 2026, eq. 21 to 23 and table IV, without their neural network. In the racket's
 * frame, the normal speed comes back scaled by a restitution, and the tangential impulse takes a part `α = (1 + e_t) / (1 + κ)`
 * of the slip at the contact point. κ = 3/2 for a thin shell, deduced from their table section (docs/recherche/chiffres.md, § 4).
 */
const RADIUS = BALL.radius;
const KAPPA = 1.5;
const NORMAL_REST = 0.878;
const NORMAL_SLOPE = 0.02;
const TANGENT_REST = 0.819;
const TANGENT_SLOPE = 0.01;
const SPIN_DAMPING = 0.805;
const MAX_RACKET = 20; // Q-P7, m/s.

/** Where each number sits in a racket's Float64Array: its unit normal, towards the ball, then its velocity. */
export const NX = 0;
export const NY = 1;
export const NZ = 2;
export const RX = 3;
export const RY = 4;
export const RZ = 5;
export const RACKET_SIZE = 6;

/** The restitution at a normal speed, relative to the racket. It never goes below zero, however hard the ball comes. */
export const normalRestitution = (speed) => Math.max(0, NORMAL_REST - NORMAL_SLOPE * speed);

const part = new Float64Array(12);
const [UX, UY, UZ, SX, SY, SZ, OX, OY, OZ, TX, TY, TZ] = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];

/** The ball's velocity relative to the racket, split: `part` gets the tangential velocity; returns the normal speed. */
function splitVelocity(ball, racket) {
  const ux = ball[VX] - racket[RX];
  const uy = ball[VY] - racket[RY];
  const uz = ball[VZ] - racket[RZ];
  const normal = ux * racket[NX] + uy * racket[NY] + uz * racket[NZ];
  part[UX] = ux - normal * racket[NX];
  part[UY] = uy - normal * racket[NY];
  part[UZ] = uz - normal * racket[NZ];
  return normal;
}

/** The slip at the contact point, `u_t − r (ω × n)`, into `part`; the spin about the normal is returned. */
function splitSpin(ball, racket) {
  const [nx, ny, nz] = [racket[NX], racket[NY], racket[NZ]];
  const [wx, wy, wz] = [ball[WX], ball[WY], ball[WZ]];
  const spinNormal = wx * nx + wy * ny + wz * nz;
  part[OX] = wx - spinNormal * nx;
  part[OY] = wy - spinNormal * ny;
  part[OZ] = wz - spinNormal * nz;
  part[SX] = part[UX] - RADIUS * (wy * nz - wz * ny);
  part[SY] = part[UY] - RADIUS * (wz * nx - wx * nz);
  part[SZ] = part[UZ] - RADIUS * (wx * ny - wy * nx);
  return spinNormal;
}

/** `n × slip`, the axis the slip turns the ball about, into `part`. */
function turnAxis(racket) {
  const [nx, ny, nz] = [racket[NX], racket[NY], racket[NZ]];
  part[TX] = ny * part[SZ] - nz * part[SY];
  part[TY] = nz * part[SX] - nx * part[SZ];
  part[TZ] = nx * part[SY] - ny * part[SX];
}

/**
 * The ball leaves the racket, in place, within the physical bounds.
 * @param {Float64Array} ball
 * @param {Float64Array} racket
 */
export function strike(ball, racket) {
  const normal = splitVelocity(ball, racket);
  const spinNormal = splitSpin(ball, racket);
  turnAxis(racket);
  const tangent = Math.sqrt(part[UX] * part[UX] + part[UY] * part[UY] + part[UZ] * part[UZ]);
  const grip = (1 + TANGENT_REST - TANGENT_SLOPE * tangent) / (1 + KAPPA);
  const back = -normalRestitution(Math.abs(normal)) * normal;
  const turn = (KAPPA * grip) / RADIUS;
  for (let i = 0; i < 3; i += 1) {
    ball[VX + i] = racket[RX + i] + back * racket[NX + i] + part[UX + i] - grip * part[SX + i];
    ball[WX + i] = part[OX + i] + turn * part[TX + i] + SPIN_DAMPING * spinNormal * racket[NX + i];
  }
  bound(ball);
}

/**
 * The racket's speed along its normal for the ball to leave at `wanted`, given how fast it comes: the normal part of the ball
 * after contact is `V + e (V + coming)`, and `e` itself falls with the speed of impact, so it takes a few rounds. Negative
 * when the racket must give way: that is what a soft return off a fast ball does. Within the racket's limit (Q-P7).
 */
export function racketSpeedFor(wanted, coming) {
  let speed = wanted;
  for (let round = 0; round < 6; round += 1) {
    const e = normalRestitution(Math.abs(speed + coming));
    speed = (wanted - e * coming) / (1 + e);
  }
  return Math.max(-MAX_RACKET, Math.min(MAX_RACKET, speed));
}

/** The face alone, from a pose: the racket keeps the way it moves. */
export function turnFace(racket, pose) {
  const norm = Math.sqrt(1 + pose[0] * pose[0] + pose[1] * pose[1]);
  racket[NX] = pose[2] / norm;
  racket[NY] = (pose[2] * pose[0]) / norm;
  racket[NZ] = pose[1] / norm;
}

/**
 * A racket from its pose, seen from the player: two tilts of its face, across and up, then the way the player plays (+1 or −1).
 * `swing.speed` is how fast the ball is to leave along the normal; the brush goes along the face, up for a lift, down for a
 * backspin. All in the player's own frame, so that two players facing each other do exact mirror images.
 * @param {Float64Array} racket written in place
 * @param {Float64Array} pose tilt across, tilt up, forward
 * @param {import("./types.js").Swing} swing
 * @param {Float64Array} ball as it comes
 */
export function poseRacket(racket, pose, swing, ball) {
  const norm = Math.sqrt(1 + pose[0] * pose[0] + pose[1] * pose[1]);
  const nx = pose[2] / norm;
  const ny = (pose[2] * pose[0]) / norm;
  const nz = pose[1] / norm;
  const speed = racketSpeedFor(swing.speed, -(ball[VX] * nx + ball[VY] * ny + ball[VZ] * nz));
  const flat = Math.sqrt(1 - nz * nz);
  // The face's way up, then its way across: n × up.
  const [ux, uy, uz] = [(-nz * nx) / flat, (-nz * ny) / flat, flat];
  const [sx, sy, sz] = [ny * uz - nz * uy, nz * ux - nx * uz, nx * uy - ny * ux];
  racket[NX] = nx;
  racket[NY] = ny;
  racket[NZ] = nz;
  racket[RX] = speed * nx + swing.brushUp * ux + swing.brushSide * sx;
  racket[RY] = speed * ny + swing.brushUp * uy + swing.brushSide * sy;
  racket[RZ] = speed * nz + swing.brushUp * uz + swing.brushSide * sz;
}
