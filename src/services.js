import { createRng, streamOf } from "mcts-commun/random.js";
import { TABLE } from "./ball/constants.js";
import { createBall } from "./ball/flight.js";
import { advance, FLOOR_TOUCH, NET_TOUCH, TABLE_BOUNCE } from "./ball/table.js";
import { normalDraw } from "./scatter.js";

/**
 * The services (Sami, 3/11/2026): from above the end line, a bounce on each side. A service is its spin and its pace: where it is
 * sent across the table is solved here, its curve included. Every value is a hypothesis, set so that each lands (Q-P10): the bomb is
 * as fast as a low contact allows, 10 m/s; the higher it starts, the less room there is for it to come down in the other camp.
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
const SERVE_BEHIND = 0.1;
const SCATTER_ANGLE = 0.0087; // tan 0.5°: a service is not hurried (H, Q-P10).
const SCATTER_PACE = 0.02;
const SERVICE_STREAM = 6007;
const PICK_STREAM = 6011;
const MAX_STEPS = 480;
const NUDGE = 0.02;
const WIDEST = 0.6;
const FLAT_SLOPE = 1e-6;

/** @type {Readonly<Record<string, ServiceKind>>} */
export const SERVICE_KINDS = Object.freeze({
  pendule: { label: "Pendule", height: 0.25, ahead: 6, down: -1.25, lift: -30 * TURN, turn: 40 * TURN },
  marteau: { label: "Marteau", height: 0.3, ahead: 5, down: -0.5, lift: -20 * TURN, turn: -50 * TURN },
  mou: { label: "Mou", height: 0.3, ahead: 4, down: 0, lift: -10 * TURN, turn: 0 },
  bombe: { label: "Bombe", height: 0.08, ahead: 10, down: -2.5, lift: 10 * TURN, turn: 0 },
  lateral: { label: "Latéral", height: 0.25, ahead: 7, down: -1.5, lift: 0, turn: 70 * TURN },
});

/** A ball leaving at `slant` metres across per metre ahead, in the server's own frame: two servers facing each other do mirror images. */
function launched(side, kind, { slant, pace = 1, dip = 0 }) {
  const forward = -side;
  const ahead = kind.ahead * pace;
  const across = ahead * slant;
  const flat = Math.sqrt(ahead * ahead + across * across);
  const position = [side * (TABLE.halfLength + SERVE_BEHIND), 0, kind.height];
  const velocity = [forward * ahead, forward * across, kind.down * pace + dip * ahead];
  const spin = [(-forward * across * kind.lift) / flat, (forward * ahead * kind.lift) / flat, kind.turn];
  return createBall(position, velocity, spin);
}

const contact = new Float64Array(3);

/** Where across the table a ball comes down after its bounce on the server's side, or null. */
function secondTouchY(start) {
  const ball = start.slice();
  let bounces = 0;
  for (let step = 0; step < MAX_STEPS; step += 1) {
    const kind = advance(ball, contact);
    if (kind === NET_TOUCH || kind === FLOOR_TOUCH) return null;
    if (kind === TABLE_BOUNCE) bounces += 1;
    if (bounces === 2) return contact[1];
  }
  return null;
}

/** The slant that brings the ball to this place across the table, in the server's frame: its curve is what it has to allow for. */
function slantFor(side, kind, y) {
  let slant = 0;
  for (let round = 0; round < 3; round += 1) {
    const here = secondTouchY(launched(side, kind, { slant }));
    const there = secondTouchY(launched(side, kind, { slant: slant + NUDGE }));
    if (here === null || there === null) return slant;
    const slope = (there - here) / NUDGE;
    if (Math.abs(slope) < FLAT_SLOPE) return slant;
    slant += (y - here) / slope;
  }
  return slant;
}

/**
 * A service, with its scatter, drawn from the rally's seed.
 * @param {number} side the server's
 * @param {ServiceKind} kind
 * @param {{seed: number, y?: number}} setup `y`: where it is sent across the table, in the server's own frame
 * @returns {Float64Array} the ball
 */
export function serviceBall(side, kind, { seed, y = 0 }) {
  const rng = streamOf(seed, SERVICE_STREAM);
  const slant = slantFor(-1, kind, Math.max(-WIDEST, Math.min(WIDEST, y)));
  return launched(side, kind, {
    slant: slant + normalDraw(rng) * SCATTER_ANGLE,
    dip: normalDraw(rng) * SCATTER_ANGLE,
    pace: 1 + normalDraw(rng) * SCATTER_PACE,
  });
}

/**
 * The service of a seed, for a measure or a robot: one kind, or `mix`, each seed its own, sent anywhere across the table.
 * @param {number} seed
 * @param {string} key a kind, or `mix`
 * @returns {{service: ServiceKind, serviceY: number}}
 */
export function serviceOf(seed, key = "mix") {
  const rng = createRng(streamOf(seed, PICK_STREAM).int(2 ** 31));
  const kinds = Object.keys(SERVICE_KINDS);
  const kind = key === "mix" ? kinds[rng.int(kinds.length)] : key;
  return { service: SERVICE_KINDS[kind], serviceY: (rng.next() * 2 - 1) * WIDEST * 0.7 };
}
