import { streamOf } from "mcts-commun/random.js";
import { STEP, TABLE, VX, X, Y } from "./ball/constants.js";
import { createBall } from "./ball/flight.js";
import { advance, FLOOR_TOUCH, NET_TOUCH, TABLE_BOUNCE } from "./ball/table.js";
import { aim } from "./aim.js";
import { readWay } from "./forecast.js";
import { BEHIND, BX, BY, createBody, moveBody, OK, reachOf, setGoal } from "./player.js";
import { poseRacket, RACKET_SIZE, strike } from "./racket.js";

/**
 * A rally: a served ball, then each player reads it, moves and takes it, until a fault (docs/modele.md, § 2, § 4 and § 7).
 * One clock, at 240 Hz. Each draw of scatter comes from a stream of the role and the stroke, not from a shared counter, so that
 * two players get the same draw at stroke `k` even if their rallies parted earlier.
 *
 * @typedef {import("./types.js").RallyResult} RallyResult
 * @typedef {import("./types.js").RallyOptions} RallyOptions
 */
const MAX_STROKES = 60; // H, docs/modele.md, § 2.
const MAX_TICKS = 240 * 120;
const STREAM_PER_ROLE = 1000;

/**
 * The styled services (Q-S6): from above the end line, a bounce on each side, in the middle, no scatter yet. The long one, flat,
 * is the rules'; the short one, cut, bounces at x = 0.55 and starts a duel of pushes. `lift` is in rad/s, negative for a backspin.
 */
export const SERVICES = Object.freeze({
  long: Object.freeze({ height: 0.25, ahead: 7, down: -1.5, lift: 0 }),
  shortCut: Object.freeze({ height: 0.25, ahead: 5, down: -1.5, lift: -40 * 2 * Math.PI }),
});
const SERVE_BEHIND = 0.1;

function serve(side, service) {
  const x = side * (TABLE.halfLength + SERVE_BEHIND);
  return createBall([x, 0, service.height], [-side * service.ahead, 0, service.down], [0, -side * service.lift, 0]);
}

/** The normal draw, as a sum of uniforms: exact arithmetic, unlike Box-Muller's logarithm and cosine (docs/modele.md, § 3). */
function normalDraw(rng) {
  let sum = -6;
  for (let i = 0; i < 12; i += 1) sum += rng.next();
  return sum;
}

/** @param {RallyOptions} options */
function createState({ seed, players, server, listener, service = SERVICES.long }) {
  const sides = [-1, 1];
  const seats = players.map((player, i) => ({ side: sides[i], profile: player.profile, rule: player.rule }));
  return {
    seed, seats, server, listener,
    ball: serve(sides[server], service),
    contact: new Float64Array(3),
    bodies: seats.map((seat) => createBody(seat.side, seat.profile)),
    striker: server,
    ownBounce: true,
    bounces: 0,
    strokes: 0,
    tick: 0,
    plans: [null, null],
    decideAt: [-1, -1],
    missed: OK,
    result: null,
  };
}

/** The other player reads the ball, once its reaction has run out. */
function hearStroke(state) {
  const other = 1 - state.striker;
  const reaction = Math.round(state.seats[other].profile.reaction / STEP);
  state.decideAt[other] = state.tick + reaction;
  state.plans[other] = null;
}

function finish(state, winner, cause) {
  state.result = { winner, cause, strokes: state.strokes, ticks: state.tick };
}

function decide(state, who) {
  const seat = state.seats[who];
  const way = readWay(state.ball, seat.side, { served: state.ownBounce, bounced: state.bounces > 0 });
  const view = { way, h: STEP, side: seat.side, profile: seat.profile, body: state.bodies[who], opponent: state.bodies[1 - who], tick: state.tick };
  const intent = seat.rule.decide(view);
  state.listener?.read?.(who, way, intent, state);
  if (!intent) return;
  setGoal(state.bodies[who], intent.goal, seat);
  state.plans[who] = { ...intent, at: state.tick + intent.step, decided: state.tick };
}

const racket = new Float64Array(RACKET_SIZE);
const pose = new Float64Array(3);

/** How much more a stroke scatters when it had too little time: ×2 with none at all. */
function rushOf(plan, profile) {
  const time = (plan.at - plan.decided) * STEP;
  if (time >= profile.preparation) return 1;
  return 1 + (profile.rushedScatter - 1) * (1 - time / profile.preparation);
}

/**
 * How much more a stroke scatters at the end of the arm: nothing up to a comfortable distance, then up to `stretchedScatter` at full
 * reach. That is what a ball placed far from the player costs it, when it has no time to get there.
 */
function stretchOf(state, who, profile) {
  const body = state.bodies[who];
  const dx = state.ball[X] - body[BX];
  const dy = state.ball[Y] - body[BY];
  const distance = Math.sqrt(dx * dx + dy * dy);
  if (distance <= profile.comfort) return 1;
  return 1 + ((profile.stretchedScatter - 1) * (distance - profile.comfort)) / (profile.reach - profile.comfort);
}

/** What a stroke draws of its scatter: across, up, and on the speed, in that order, whatever the rule. */
function drawScatter(state, who) {
  const role = who === state.server ? 0 : 1;
  const rng = streamOf(state.seed, role * STREAM_PER_ROLE + state.strokes);
  return [normalDraw(rng), normalDraw(rng), normalDraw(rng)];
}

/** Aims, then scatters the racket, then strikes the true ball. */
function play(state, who, plan) {
  const { side, profile } = state.seats[who];
  const forward = -side;
  const found = aim({ ball: state.ball, forward, target: plan.target, swing: plan.swing }, pose);
  const kept = pose[2];
  pose[2] = forward;
  const rush = rushOf(plan, profile);
  const stretched = stretchOf(state, who, profile);
  const worse = rush * stretched;
  const draws = drawScatter(state, who);
  pose[0] += draws[0] * profile.scatterAcross * worse;
  pose[1] += draws[1] * profile.scatterTilt * worse;
  const swing = { ...plan.swing, speed: kept * (1 + draws[2] * profile.scatterSpeed * worse) };
  poseRacket(racket, pose, swing, state.ball);
  const before = state.listener?.impact ? state.ball.slice() : null;
  strike(state.ball, racket);
  if (before) state.listener.impact({ who, plan, before, racket, found, kept, draws, rush, stretch: stretched }, state);
}

const nextBall = new Float64Array(3);

/** Will a ball that has bounced leave the arm's sector at the next step? A player takes it now rather than let it pass. */
function leavingReach(state, seat, body) {
  if (state.bounces === 0 || state.ownBounce) return false;
  for (let i = 0; i < 3; i += 1) nextBall[i] = state.ball[i] + state.ball[VX + i] * STEP;
  return reachOf(body, nextBall, seat.side, seat.profile) !== OK;
}

/**
 * From the planned instant on, the stroke is played as soon as the ball is within the arm's sector, until the rally ends. Before
 * it, only if the ball is about to pass out of reach: the plan was made from a standing start, and a body may come late.
 */
function tryContact(state, who) {
  const plan = state.plans[who];
  if (!plan) return;
  const seat = state.seats[who];
  const body = state.bodies[who];
  const reach = reachOf(body, state.ball, seat.side, seat.profile);
  if (plan.at > state.tick && !(reach === OK && leavingReach(state, seat, body))) return;
  if (reach === OK) strikeNow(state, who, plan);
  else if (state.missed !== BEHIND) state.missed = reach;
}

/** The stroke is played, and the other player hears it. */
function strikeNow(state, who, plan) {
  const seat = state.seats[who];
  plan.at = Math.min(plan.at, state.tick);
  state.plans[who] = null;
  play(state, who, plan);
  state.striker = who;
  state.bounces = 0;
  state.ownBounce = false;
  state.strokes += 1;
  state.missed = OK;
  if (plan.next) setGoal(state.bodies[who], plan.next, seat);
  hearStroke(state);
  state.listener?.stroke?.(who, state.tick);
}

/** The ball is lost by whoever was to take it: the cause says how. */
const lostCause = (state) => (state.missed === BEHIND ? "behind" : "notReached");

function afterTableBounce(state) {
  const { striker } = state;
  const own = state.seats[striker].side * state.contact[0] > 0;
  if (state.ownBounce) {
    if (own) state.ownBounce = false;
    else finish(state, 1 - striker, "out");
    return;
  }
  if (own) {
    if (state.bounces > 0) finish(state, striker, lostCause(state));
    else finish(state, 1 - striker, "out");
    return;
  }
  state.bounces += 1;
  if (state.bounces === 2) finish(state, striker, "twoBounces");
}

function afterStop(state, kind) {
  const { striker } = state;
  if (state.bounces > 0) finish(state, striker, lostCause(state));
  else finish(state, 1 - striker, kind === NET_TOUCH ? "net" : "out");
}

function flyBall(state) {
  const kind = advance(state.ball, state.contact);
  state.listener?.flight?.(kind, state);
  if (kind === TABLE_BOUNCE) afterTableBounce(state);
  else if (kind === NET_TOUCH || kind === FLOOR_TOUCH) afterStop(state, kind);
}

function act(state, who) {
  if (state.decideAt[who] === state.tick) decide(state, who);
  tryContact(state, who);
}

function oneTick(state) {
  const first = state.server;
  moveBody(state.bodies[first], state.seats[first]);
  moveBody(state.bodies[1 - first], state.seats[1 - first]);
  act(state, first);
  act(state, 1 - first);
  flyBall(state);
  state.tick += 1;
  state.listener?.tick?.(state);
  if (state.result) return;
  if (state.strokes >= MAX_STROKES || state.tick >= MAX_TICKS) finish(state, -1, "limit");
}

/**
 * A rally ready to run, for a live game: its service has left.
 * @param {RallyOptions} options
 */
export function startRally(options) {
  const state = createState(options);
  hearStroke(state);
  state.listener?.tick?.(state);
  return state;
}

/** One step of a rally under way. */
export const stepRally = oneTick;

/**
 * Plays one rally.
 * @param {RallyOptions} options
 * @returns {RallyResult}
 */
export function playRally(options) {
  const state = startRally(options);
  while (!state.result) oneTick(state);
  return state.result;
}
