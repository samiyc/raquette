import { aim, missOf } from "./aim.js";
import { BALL_SIZE, STEP, TABLE, VX, VY, VZ, X, Z } from "./ball/constants.js";
import { frames, readWay, riseStep, topStep } from "./forecast.js";
import { createBody, moveBody, OK, reachOf, setGoal } from "./player.js";
import { poseRacket, RACKET_SIZE, strike } from "./racket.js";
import { recordFlight } from "./recording.js";
import { controlOf, effortOf, farOf, runningOf, rushOf, stretchOf } from "./scatter.js";
import { R0_SWING } from "./rules/center.js";
import { DRILL_STROKES } from "./rules/drills.js";
import { SHORT_SWING } from "./rules/short.js";

/**
 * The strokes a player at the mouse can pick during a pause (Sami, 3/11/2026), and which of them make sense for the next ball. What
 * is left out comes from the ball itself: a stroke is tried from where the player will really take the ball. Far from the table, a
 * push or a short cut would have to be hit much harder, or sent up high, to reach the other camp: they are not offered.
 *
 * @typedef {object} StrokeKind
 * @property {string} label
 * @property {import("./types.js").Swing} swing
 * @property {number} [rise] metres above the table, for a ball taken on the rise
 * @property {number[]} [depths] how far past the net it may go, the shortest first: where it can go depends on the ball
 * @property {(contact: {back: number, height: number, speed: number}) => string | null} [refuses] why not, from the ball at contact
 */
const LOW_ENOUGH = 0.4; // Metres above the table: higher, a ball is not pushed (H).
const CONTROLLED = 8; // m/s at contact: faster, no soft and short stroke (Sami, 3/11/2026; H, Q-P21).
const FAST_ENOUGH = 6; // m/s: under this, there is nothing to block (H).
const FAR_ENOUGH = 0.4; // Metres behind the line: a chop is played from away from the table (H).
const HARDER_AT_MOST = 1.5; // The aim may hit this much harder to get there: beyond, it is another stroke.
const STEEPEST = 1; // A ball leaving at more than 45° is a high ball, not this stroke.

const tooFast = (speed) => (speed > CONTROLLED ? "balle trop rapide pour un coup contrôlé" : null);

/** @type {Readonly<Record<string, StrokeKind>>} */
export const STROKE_KINDS = Object.freeze({
  flat: { label: "Plat", swing: R0_SWING },
  top: { label: "Top", swing: DRILL_STROKES.top.swing },
  push: {
    label: "Poussette",
    swing: DRILL_STROKES.push.swing,
    rise: DRILL_STROKES.push.rise,
    refuses: ({ height, speed }) => tooFast(speed) ?? (height > LOW_ENOUGH ? "balle trop haute" : null),
  },
  block: {
    label: "Bloc",
    swing: DRILL_STROKES.block.swing,
    rise: DRILL_STROKES.block.rise,
    refuses: ({ speed }) => (speed < FAST_ENOUGH ? "balle trop lente" : null),
  },
  side: { label: "Latéral", swing: { speed: 6, brushUp: 2, brushSide: 5, sideways: true } }, // About 55 turns: 89 at 8, more than a service (Sami, 3/11/2026).
  short: { label: "Deux rebonds", swing: SHORT_SWING, depths: [0.35, 0.45, 0.55, 0.65, 0.75], refuses: ({ speed }) => tooFast(speed) },
  chop: {
    label: "Tchop",
    swing: { speed: 7, brushUp: -8, brushSide: 0 },
    refuses: ({ back }) => (back < FAR_ENOUGH ? "trop près de la table" : null),
  },
});

/** The step at which a stroke takes the ball: at the top of its bounce, or on the rise. */
export const contactStep = (way, kind) => (kind.rise ? riseStep(way, kind.rise) : topStep(way));

/** Puts a copy of the body where it would go, a move waiting for the end of the reaction included. */
function copyBody(state, who, rule) {
  const seat = state.seats[who];
  const body = createBody(seat.side, seat.profile);
  body.set(state.bodies[who]);
  const waiting = () => {
    if (rule.waiting) setGoal(body, rule.waiting, seat);
  };
  return { body, seat, waiting };
}

const ballAt = (step) => frames.slice(step * BALL_SIZE, (step + 1) * BALL_SIZE);

/**
 * Where the next stroke will take the ball, if the body keeps going where it was told: the first step at or after the wished one with
 * the ball within the arm's sector, or earlier if it was about to pass out of reach, as the rally does.
 * @returns {{step: number, ball: Float64Array, body: Float64Array} | null} null: the ball will be let go, or missed
 */
export function nextContact(state, who, rule) {
  const way = readWay(state.ball, state.seats[who].side, { served: state.ownBounce, bounced: state.bounces > 0 });
  if (way.from < 0 || way.to < way.from || state.striker === who) return null;
  const wished = contactStep(way, STROKE_KINDS[rule.stroke]);
  const walker = copyBody(state, who, rule);
  const step = walkToContact(walker, way, { wished, reactionEnds: state.decideAt[who] - state.tick });
  return step === null ? null : { step, ball: ballAt(step), body: walker.body };
}

/** Moves the copy of the body along the ball's way, up to the step of the contact, or null. */
function walkToContact({ body, seat, waiting }, way, { wished, reactionEnds }) {
  const within = (step) => reachOf(body, frames.subarray(step * BALL_SIZE, step * BALL_SIZE + 3), seat.side, seat.profile) === OK;
  for (let step = 0; step <= way.to; step += 1) {
    if (step === reactionEnds) waiting();
    moveBody(body, seat);
    if (within(step) && (step >= wished || (step >= way.from && step < way.to && !within(step + 1)))) return step;
  }
  return null;
}

const pose = new Float64Array(3);
const racket = new Float64Array(RACKET_SIZE);

/** The ball as this stroke would send it. */
function sent(ball, tilts, swing, forward) {
  const start = ball.slice();
  poseRacket(racket, Float64Array.of(tilts[0], tilts[1], forward), swing, start);
  strike(start, racket);
  return start;
}

/** Does this flight bounce twice in the other camp? */
function bouncesTwice(start, forward) {
  const [first, second] = recordFlight(start).events;
  return second?.kind === "table" && forward * first.x > 0 && forward * second.x > 0;
}

const tooSteep = (start) => start[VZ] > STEEPEST * Math.sqrt(start[VX] * start[VX] + start[VY] * start[VY]);

/** A side stroke brushes towards the side aimed at. */
export const swingToward = (swing, y) => (swing.sideways && y < 0 ? { ...swing, brushSide: -swing.brushSide } : swing);

/** Why a stroke cannot be played on this ball, or null. */
export function refusal(kind, ball, target, forward) {
  const swing = swingToward(kind.swing, target[1]);
  const found = aim({ ball, forward, target, swing }, pose);
  if (!found) return "n'arrive pas sur la cible";
  if (pose[2] > kind.swing.speed * HARDER_AT_MOST) return "il faudrait frapper plus fort";
  const start = sent(ball, pose, { ...swing, speed: pose[2] }, forward);
  if (tooSteep(start)) return "il faudrait une chandelle";
  return kind.depths && !bouncesTwice(start, forward) ? "ne rebondirait pas deux fois" : null;
}

/** A stroke with several depths: the shortest it can play, and why not if none. */
function shortestDepth(kind, ball, { y, forward }) {
  let why = null;
  for (const depth of kind.depths) {
    why = refusal(kind, ball, [forward * depth, y], forward);
    if (why === null) return { depth, why };
  }
  return { depth: null, why };
}

export function contactFacts(ball, side) {
  const [vx, vy, vz] = [ball[VX], ball[VY], ball[VZ]];
  return { back: side * ball[X] - TABLE.halfLength, height: ball[Z], speed: Math.sqrt(vx * vx + vy * vy + vz * vz) };
}

function whyNot(kind, ball, { rule, forward }) {
  if (kind.depths) return shortestDepth(kind, ball, { y: rule.aim[1], forward }).why;
  return refusal(kind, ball, rule.aim, forward);
}

/**
 * How far past the net a stroke with several depths goes on the next ball: the page aims there when it is picked.
 * @returns {number | null}
 */
export function depthFor(state, { who, rule }, key) {
  const kind = STROKE_KINDS[key];
  const contact = nextContact(state, who, rule);
  if (!kind.depths || !contact) return null;
  return shortestDepth(kind, contact.ball, { y: rule.aim[1], forward: -state.seats[who].side }).depth;
}

/**
 * Which strokes make sense for a ball at contact: what the page shows and what a search may try.
 * @param {Float64Array} ball at contact
 * @param {{side: number, aim: number[]}} player
 * @returns {Record<string, string | null>} each stroke: why not, or null if it can be played
 */
export function choicesAt(ball, { side, aim: wanted }) {
  const facts = contactFacts(ball, side);
  /** @type {Record<string, string | null>} */
  const choices = {};
  for (const [key, kind] of Object.entries(STROKE_KINDS)) {
    choices[key] = kind.refuses?.(facts) ?? whyNot(kind, ball, { rule: { aim: wanted }, forward: -side });
  }
  return choices;
}

/**
 * Which strokes make sense for the next ball of a player at the mouse.
 * @param {any} state the rally
 * @param {{who: number, rule: any}} player
 * @returns {Record<string, string | null>}
 */
export function strokeChoices(state, { who, rule }) {
  const contact = nextContact(state, who, rule);
  if (contact) return choicesAt(contact.ball, { side: state.seats[who].side, aim: rule.aim });
  return Object.fromEntries(Object.keys(STROKE_KINDS).map((key) => [key, "pas de balle à prendre"]));
}

const MEDIAN_OF_TWO_AXES = 1.1774; // The median distance from the centre of a round normal spread, in standard deviations.

/**
 * How far from the target the next stroke will fall, in metres, half the time: what the circle shows. The racket's three scatters are
 * each tried on the ball as it will be, from where the body will be, with all that makes this stroke less sure.
 * @param {any} state the rally
 * @param {{who: number, rule: any}} player
 * @returns {number | null} null when there is no ball to take
 */
export function expectedMiss(state, { who, rule }) {
  const contact = nextContact(state, who, rule);
  if (!contact) return null;
  const { side, profile } = state.seats[who];
  const swing = rule.swing;
  const task = { ball: contact.ball, forward: -side, target: rule.aim, swing };
  aim(task, pose);
  const worse = rushOf((contact.step - Math.max(0, state.decideAt[who] - state.tick)) * STEP, profile)
    * stretchOf(contact.ball, contact.body, profile) * controlOf(contact.ball, profile) * farOf(contact.ball, side, profile)
    * effortOf({ ...swing, speed: pose[2] }, profile) * runningOf(contact.body, profile);
  const [across, up, speed] = [pose[0], pose[1], pose[2]];
  const base = missOf(task, { side: across, up, speed });
  const moved = [
    missOf(task, { side: across + profile.scatterAcross * worse, up, speed }),
    missOf(task, { side: across, up: up + profile.scatterTilt * worse, speed }),
    missOf(task, { side: across, up, speed: speed * (1 + profile.scatterSpeed * worse) }),
  ];
  const squares = moved.reduce((sum, [x, y]) => sum + (x - base[0]) * (x - base[0]) + (y - base[1]) * (y - base[1]), 0);
  return MEDIAN_OF_TWO_AXES * Math.sqrt(squares / 2);
}

/**
 * The ball's way from now on, to show during a pause: as the players read it. Up to its second bounce on a side, or wherever it ends.
 * @param {any} state the rally
 * @returns {{points: number[][], touches: {x: number, y: number}[]}}
 */
export function ballPath(state) {
  const { frames: flown, events, steps } = recordFlight(state.ball);
  const kept = state.ownBounce ? 3 : 2;
  const last = events[kept - 1]?.step ?? steps;
  const points = [];
  for (let step = 0; step <= last; step += 2) points.push([flown[step * BALL_SIZE], flown[step * BALL_SIZE + 1], flown[step * BALL_SIZE + Z]]);
  return { points, touches: events.slice(0, kept).map(({ x, y }) => ({ x, y })) };
}
