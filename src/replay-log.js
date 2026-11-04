import { BALL, BALL_SIZE, NET, VX, X, Y, Z } from "./ball/constants.js";
import { FLOOR_TOUCH, NET_TOUCH, NONE, TABLE_BOUNCE } from "./ball/table.js";
import { BVX, BVY, BX, BY } from "./player.js";
import { NX, RX } from "./racket.js";
import { VERSION } from "./version.js";

/**
 * What a rally leaves for later analyses (Sami, 3/11/2026): where the players stood at each impact, how the ball met the racket,
 * what was aimed and what came of it, and where a player stood for a ball it did not get. A rally replays exactly from its seed,
 * but only at the commit it was played on: these figures stay readable afterwards, whatever the code becomes. The racket has no
 * geometry (docs/modele.md, § 4): there is no point of impact on its face, only its tilt, its velocity and the slip of the ball.
 *
 * Plain data, no `node:*`, for the scripts and the page alike. The format of a line: docs/replays.md.
 */
export const REPLAY_FORMAT = "raquette-replay/1";
const NET_MARGIN_LEVEL = NET.height + BALL.radius;
const KINDS = { [TABLE_BOUNCE]: "table", [NET_TOUCH]: "net", [FLOOR_TOUCH]: "floor" };

/** "2026-11-03T21:47:39+01:00": local time with its offset, as lopin writes it. */
export function localTimestamp(date = new Date()) {
  const offset = -date.getTimezoneOffset();
  const local = new Date(date.getTime() + offset * 60000).toISOString().slice(0, 19);
  const pad = (n) => String(Math.abs(n)).padStart(2, "0");
  return `${local}${offset >= 0 ? "+" : "-"}${pad(Math.trunc(offset / 60))}:${pad(offset % 60)}`;
}

/** A rule as a replay names it, as lopin does: `R3@1`. */
export const botName = (rule) => `${rule.name}@${rule.version ?? 0}`;

/** What every replay says of what played it. */
export function replayHeader({ players, startedAt = localTimestamp() }) {
  return {
    format: REPLAY_FORMAT,
    version: VERSION,
    startedAt,
    players: players.map(({ rule, profile }) => ({ bot: botName(rule), profile })),
  };
}

/** Millimetres and tenths of a m/s are plenty: the exact numbers replay from the seed. */
const short = (value) => Math.round(value * 1e4) / 1e4 + 0; // + 0: JSON has no -0.
const shortAll = (values) => Array.from(values, short);
const whereOf = (body) => [short(body[BX]), short(body[BY])];

function distanceOf(body, ball) {
  const dx = ball[X] - body[BX];
  const dy = ball[Y] - body[BY];
  return Math.sqrt(dx * dx + dy * dy);
}

function impactOf(state, { who, plan, before, racket, found, kept, draws, rush, stretch, control, far, effort, running }) {
  const body = state.bodies[who];
  return {
    tick: state.tick,
    who,
    read: plan.decided,
    planned: plan.at,
    body: whereOf(body),
    bodySpeed: [short(body[BVX]), short(body[BVY])],
    opponent: whereOf(state.bodies[1 - who]),
    reach: short(distanceOf(body, before)),
    ballIn: shortAll(before),
    ballOut: shortAll(state.ball.subarray(VX, BALL_SIZE)),
    racket: { normal: shortAll(racket.subarray(NX, NX + 3)), velocity: shortAll(racket.subarray(RX, RX + 3)) },
    aim: { target: shortAll(plan.target), speed: plan.swing.speed, kept: short(kept), brush: plan.swing.brushUp, found },
    scatter: { across: short(draws[0]), up: short(draws[1]), speed: short(draws[2]), rush: short(rush), stretch: short(stretch), control: short(control), far: short(far), effort: short(effort), running: short(running) },
    netMargin: null,
    landed: null,
  };
}

function readOf(state, who, way, intent) {
  return {
    who,
    tick: state.tick,
    body: whereOf(state.bodies[who]),
    window: [way.from, way.to],
    goal: intent ? shortAll(intent.goal) : null,
    step: intent ? intent.step : null,
  };
}

/** The closest a player came to a ball it was to take, kept step by step once the ball has bounced on its side. */
function noteClosest(log, state) {
  if (state.bounces === 0 || state.ownBounce) return;
  const who = 1 - state.striker;
  const distance = distanceOf(state.bodies[who], state.ball);
  if (log.closest && log.closest.who === who && log.closest.distance <= distance) return;
  log.closest = { who, tick: state.tick, distance: short(distance), body: whereOf(state.bodies[who]), ball: shortAll(state.ball.subarray(X, Z + 1)) };
}

/** The height at which the ball crosses the net, over the net's top, on the last impact. */
function noteNet(log, state) {
  const last = log.impacts.at(-1);
  if (!last || last.netMargin !== null) return;
  if (log.lastX * state.ball[X] > 0) return;
  last.netMargin = short(state.ball[Z] - NET_MARGIN_LEVEL);
}

function noteTouch(log, kind, state) {
  const table = kind === TABLE_BOUNCE;
  const touch = { tick: state.tick, kind: KINDS[kind], x: short(table ? state.contact[0] : state.ball[X]), y: short(table ? state.contact[1] : state.ball[Y]) };
  log.touches.push(touch);
  const last = log.impacts.at(-1);
  if (last && !last.landed) last.landed = { ...touch };
}

/** Who lost it, and how: a fault of the striker, or a ball the other did not get, with where it stood. */
function lostOf(log, result, state) {
  if (result.winner < 0) return null;
  const who = 1 - result.winner;
  const missed = who !== state.striker;
  if (!missed) return { who, fault: result.cause };
  const lastRead = log.reads.filter((read) => read.who === who).at(-1) ?? null;
  return { who, missed: result.cause, body: whereOf(state.bodies[who]), closest: log.closest, lastRead };
}

/**
 * Keeps what a rally tells: its `listener` goes to the rally, its `finish` gives the line of the replay.
 * @param {{seed: number, server: number}} setup
 */
export function createRallyLog({ seed, server }) {
  const log = { impacts: [], reads: [], touches: [], closest: null, lastX: 0 };
  let last = null;
  const listener = {
    tick(state) {
      last = state;
      noteClosest(log, state);
      noteNet(log, state);
      log.lastX = state.ball[X];
    },
    flight(kind, state) {
      if (kind !== NONE) noteTouch(log, kind, state);
    },
    read(who, way, intent, state) {
      log.reads.push(readOf(state, who, way, intent));
    },
    impact(detail, state) {
      log.impacts.push(impactOf(state, detail));
      log.closest = null;
    },
  };
  const finish = () => {
    const { result } = last;
    return { seed, server, service: last.serviceName, ...result, impacts: log.impacts, touches: log.touches, reads: log.reads, lost: lostOf(log, result, last) };
  };
  return { listener, finish };
}

/** Listeners that all hear the same rally. */
export function bothListeners(one, other) {
  const merged = {};
  for (const name of new Set([...Object.keys(one), ...Object.keys(other)])) {
    merged[name] = (...args) => {
      one[name]?.(...args);
      other[name]?.(...args);
    };
  }
  return merged;
}
