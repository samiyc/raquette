import { createRng, streamOf } from "mcts-commun/random.js";
import { BALL, TABLE, X, Y, Z } from "./ball/constants.js";
import { createBall } from "./ball/flight.js";
import { advance, FLOOR_TOUCH, NET_TOUCH, TABLE_BOUNCE } from "./ball/table.js";
import { normalDraw } from "./scatter.js";

/**
 * The services (Sami, 3/11/2026): from above the end line, a bounce on each side. A service is its spin and its pace: where it is
 * sent across the table is solved here, its curve included. Every value is a hypothesis, set so that each lands (Q-P10). The spins
 * stay under the 62.5 turns measured at the 2009 Worlds (docs/recherche/chiffres.md, § 5). The bomb is as fast as a low contact allows
 * with room over the net: 11 m/s at most, less when the line is short, since it must still come down in the other camp: straight and
 * from the middle, it went out (Sami, 3/11/2026). A service leaves from where the server stands across the table (Sami, 3/11/2026).
 *
 * @typedef {object} ServiceKind
 * @property {string} label
 * @property {number} height metres above the table at contact
 * @property {number} ahead m/s towards the other camp
 * @property {number} down m/s up, negative going down
 * @property {number} lift rad/s, negative for a backspin
 * @property {number} turn rad/s about the vertical
 */
const TURN = 2 * Math.PI;
export const SERVE_BEHIND = 0.1;
const DISTANCE = 2 * TABLE.halfLength + SERVE_BEHIND; // From a contact to the far end line.
/** How far from the middle line a service may leave: over the table's end, in reach of a body behind its line. */
export const MOST_FROM = 0.7;
const FROM_WIDE = 0.5; // Where a robot may serve from (H, Q-P10).
const DEEPEST = TABLE.halfLength - 0.12; // Where a service may be meant to land: 12 cm of room for its scatter (H, Q-P10).
const PACES = [1, 0.98, 0.96, 0.94, 0.92, 0.9, 0.88, 0.86];
const SCATTER_ANGLE = 0.0087; // tan 0.5°: a service is not hurried (H, Q-P10).
const SCATTER_PACE = 0.02;
const SERVICE_STREAM = 6007;
const PICK_STREAM = 6011;
const MAX_STEPS = 480;
const NUDGE = 0.02;
const WIDEST = 0.6;
const FLAT_SLOPE = 1e-6;
const RADIUS = BALL.radius;

/** @type {Readonly<Record<string, ServiceKind>>} */
export const SERVICE_KINDS = Object.freeze({
  pendule: { label: "Pendule", height: 0.25, ahead: 6, down: -1.25, lift: -30 * TURN, turn: 40 * TURN },
  marteau: { label: "Marteau", height: 0.3, ahead: 5, down: -0.5, lift: -20 * TURN, turn: -50 * TURN },
  mou: { label: "Mou", height: 0.3, ahead: 4, down: 0, lift: -10 * TURN, turn: 0 },
  coupe: { label: "Coupé", height: 0.25, ahead: 5, down: -1.5, lift: -55 * TURN, turn: 0 },
  bombe: { label: "Bombe", height: 0.08, ahead: 11, down: -2.5, lift: 10 * TURN, turn: 0 },
  lateral: { label: "Latéral", height: 0.25, ahead: 7, down: -1.5, lift: 0, turn: 55 * TURN },
});

/** A ball leaving at `slant` metres across per metre ahead, in the server's own frame: two servers facing each other do mirror images. */
function launched(side, kind, { slant, pace = 1, dip = 0, from = 0 }) {
  const forward = -side;
  const ahead = kind.ahead * pace;
  const across = ahead * slant;
  const flat = Math.sqrt(ahead * ahead + across * across);
  const position = [side * (TABLE.halfLength + SERVE_BEHIND), forward * from, kind.height];
  const velocity = [forward * ahead, forward * across, kind.down * pace + dip * ahead];
  const spin = [(-forward * across * kind.lift) / flat, (forward * ahead * kind.lift) / flat, kind.turn];
  return createBall(position, velocity, spin);
}

const contact = new Float64Array(3);

/**
 * Where across the table's level a ball comes down after its bounce on the server's side, or null if it never bounces there. On the
 * table or beside it: the slant is solved from a curve, and a service that would miss the side must still say by how much.
 * `contact` holds the place.
 */
function secondTouchY(start) {
  const ball = start.slice();
  let bounces = 0;
  for (let step = 0; step < MAX_STEPS; step += 1) {
    const before = ball[Z];
    const kind = advance(ball, contact);
    if (kind === NET_TOUCH || kind === FLOOR_TOUCH) return null;
    if (kind === TABLE_BOUNCE) bounces += 1;
    else if (bounces === 1 && cameDown(before, ball)) return beside(ball);
    if (bounces === 2) return contact[1];
  }
  return null;
}

const cameDown = (before, ball) => before >= RADIUS && ball[Z] < RADIUS;

function beside(ball) {
  contact[0] = ball[X];
  contact[1] = ball[Y];
  return ball[Y];
}

/** The slant that brings the ball to this place across the table, in the server's frame: its curve is what it has to allow for. */
function slantFor(kind, { y, from, pace }) {
  const side = -1;
  let slant = (y - from) / DISTANCE;
  for (let round = 0; round < 4; round += 1) {
    const here = secondTouchY(launched(side, kind, { slant, from, pace }));
    const there = secondTouchY(launched(side, kind, { slant: slant + NUDGE, from, pace }));
    if (here === null || there === null) return slant;
    const slope = (there - here) / NUDGE;
    if (Math.abs(slope) < FLAT_SLOPE) return slant;
    slant += (y - here) / slope;
  }
  return slant;
}

/** The fastest pace of this service that comes down in the other camp, and its slant: a short line leaves less room than a diagonal. */
function aimed(kind, y, from) {
  let slant = 0;
  for (const pace of PACES) {
    slant = slantFor(kind, { y, from, pace });
    const touch = secondTouchY(launched(-1, kind, { slant, from, pace }));
    if (touch !== null && contact[0] <= DEEPEST && Math.abs(touch) <= TABLE.halfWidth) return { slant, pace };
  }
  return { slant, pace: PACES.at(-1) };
}

const within = (value, most) => Math.max(-most, Math.min(most, value));

/**
 * A service, with its scatter, drawn from the rally's seed.
 * @param {number} side the server's
 * @param {ServiceKind} kind
 * @param {{seed: number, y?: number, from?: number}} setup in the server's own frame, `y`: where it is sent across the table,
 *   `from`: where it leaves from
 * @returns {Float64Array} the ball
 */
export function serviceBall(side, kind, { seed, y = 0, from = 0 }) {
  const rng = streamOf(seed, SERVICE_STREAM);
  const start = within(from, MOST_FROM);
  const { slant, pace } = aimed(kind, within(y, WIDEST), start);
  return launched(side, kind, {
    from: start,
    slant: slant + normalDraw(rng) * SCATTER_ANGLE,
    dip: normalDraw(rng) * SCATTER_ANGLE,
    pace: pace * (1 + normalDraw(rng) * SCATTER_PACE),
  });
}

/**
 * Where the other player waits for a service leaving from `y`: at the middle of what it can reach, half-way between the two lines from
 * the server to the far corners, at its own distance. Slightly on the opposite side (Sami, 3/11/2026), never so far that a straight
 * line down the side passes it by.
 * @param {number} y across the table, in the world's frame
 * @param {{waitBehindLine: number}} profile
 */
export const receiverY = (y, profile) => ((0 - y) * profile.waitBehindLine) / DISTANCE;

/**
 * The service of a seed, for a measure or a robot: one kind, or `mix`, each seed its own, sent anywhere across the table.
 * @param {number} seed
 * @param {string} key a kind, or `mix`
 * @returns {{service: ServiceKind, serviceY: number, serviceFrom: number}}
 */
export function serviceOf(seed, key = "mix") {
  const rng = createRng(streamOf(seed, PICK_STREAM).int(2 ** 31));
  const kinds = Object.keys(SERVICE_KINDS);
  const kind = key === "mix" ? kinds[rng.int(kinds.length)] : key;
  const serviceY = (rng.next() * 2 - 1) * WIDEST * 0.7;
  return { service: SERVICE_KINDS[kind], serviceY, serviceFrom: (rng.next() * 2 - 1) * FROM_WIDE };
}
