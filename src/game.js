import { NONE } from "./ball/table.js";
import { applyOrder, createMouseRule, firstAim } from "./mouse.js";
import { CLUB_PLAYER } from "./player.js";
import { createRecorder, retakeFirstFrame } from "./rally-recording.js";
import { startRally, stepRally } from "./rally.js";
import { bothListeners, createRallyLog, localTimestamp, replayHeader } from "./replay-log.js";
import { namedRule } from "./rules/named.js";
import { serviceOf, SERVICE_KINDS } from "./services.js";
import { aboutToDecide, createRemoteRule, snapshotOf } from "./remote.js";

/**
 * A game at the mouse against R0 (docs/modele.md, § 2 and § 10): 11 points, 2 clear, the service turning every 2 points, then at
 * each point from 10-10. A point replays exactly from its seed, the scatter and its clicks. The player plays from x < 0.
 */
const MOUSE = 0;
const ROBOT = 1;
const FORWARD = 1;
const WINNING = 11;
const LOOSE_END = 10;
const MAX_TICKS_TO_EVENT = 240 * 10;
const SLOW_ROBOTS = new Set(["S", "MC", "S-mT", "S-mV"]);
export const PAGE_BUDGET = 24; // Plans a stroke for a search at the mouse: as measured, since it thinks in a worker.

/**
 * The player's body and arm: the robot's, with its scatter scaled by the slider.
 * @returns {any}
 */
export function mouseProfile(scatter) {
  return {
    ...CLUB_PLAYER,
    scatterTilt: CLUB_PLAYER.scatterTilt * scatter,
    scatterAcross: CLUB_PLAYER.scatterAcross * scatter,
    scatterSpeed: CLUB_PLAYER.scatterSpeed * scatter,
  };
}

const robotServing = (seed, picked) => (picked ? { served: picked } : serviceOf(seed));

/** Does the robot of this game pick its service, and must a page ask its worker before the point? */
export const robotPicks = (game) => SLOW_ROBOTS.has(game.robot) && serverOf(game) === ROBOT;

/** The seed of the next point, and what a worker needs to pick the robot's service. */
export const servicePicture = (game) => ({ seed: game.seed + game.played, server: ROBOT, robot: game.robot, budget: PAGE_BUDGET });

/**
 * A point under way.
 * @param {{seed: number, server: number, scatter: number, aim?: number[], robot?: string, robotService?: {key: string, y: number}}} setup
 *   `robotService`: the one the robot picked in advance; a mix from the seed otherwise
 */
export function createPoint({ seed, server, scatter, aim = firstAim(FORWARD), robot = "R0", robotService }) {
  const rule = createMouseRule(aim.slice());
  const recorder = createRecorder();
  const log = createRallyLog({ seed, server });
  const point = { seed, server, scatter, robot, robotService, startAim: aim.slice(), rule, orders: [], recorder, sawEvent: false, robotStruck: false, state: null, log: null, players: null, robotRule: null };
  const watch = {
    flight(kind) {
      if (kind !== NONE) point.sawEvent = true;
    },
    stroke(who) {
      point.sawEvent = true;
      if (who === ROBOT) point.robotStruck = true;
    },
  };
  const listener = bothListeners(bothListeners(recorder.listener, log.listener), watch);
  const serving = server === MOUSE ? { service: SERVICE_KINDS[rule.service], serviceY: FORWARD * aim[1] } : robotServing(seed, robotService);
  const robotRule = createRemoteRule(namedRule(robot, PAGE_BUDGET));
  const players = [{ rule, profile: mouseProfile(scatter) }, { rule: robotRule, profile: CLUB_PLAYER }];
  point.robotRule = robotRule;
  point.log = log;
  point.players = players;
  point.state = startRally({ seed, players, server, listener, ...serving });
  return point;
}

/** A click on a point: it counts from this step, and is kept for the replay. */
export function clickPoint(point, order) {
  point.orders.push({ tick: point.state.tick, ...order });
  const taken = applyOrder(point.state, { rule: point.rule, who: MOUSE }, order);
  if (point.state.tick === 0) retakeFirstFrame(point.recorder.recording, point.state);
  return taken;
}

export const pointOver = (point) => point.state.result !== null;

/** Is the next step one at which a robot that thinks for long must decide? A page then asks its worker, and waits. */
export const needsAnswer = (point) => SLOW_ROBOTS.has(point.robot) && aboutToDecide(point.state, ROBOT) && point.robotRule.answer === null;

/** The picture for the worker. */
export const pictureFor = (point) => snapshotOf(point.state);

/** What the worker said, for the next step. */
export const giveAnswer = (point, intent) => point.robotRule.give(point.state.tick, intent);

/** One step of the point, if it is not over. */
export const stepPoint = (point) => {
  if (!pointOver(point)) stepRally(point.state);
};

/** Runs up to the next stroke or bounce, or the end of the point. @returns {number} the steps run */
export function runToEvent(point) {
  point.sawEvent = false;
  let steps = 0;
  while (!pointOver(point) && !point.sawEvent && steps < MAX_TICKS_TO_EVENT) {
    stepPoint(point);
    steps += 1;
  }
  return steps;
}

/** How many steps a frame of the page runs, and the part of a step left over: the clock of the live game. */
export function stepsFor(seconds, speed, carry) {
  const wanted = seconds * speed * 240 + carry;
  const steps = Math.floor(wanted);
  return { steps, carry: wanted - steps };
}

/**
 * Plays a kept point again, from its seed, its scatter and its clicks.
 * @param {{seed: number, server: number, scatter: number, aim?: number[], orders: any[]}} saved
 * @returns {ReturnType<typeof createPoint>}
 */
export function replayPoint(saved) {
  const point = createPoint(saved);
  let next = 0;
  while (!pointOver(point)) {
    while (next < saved.orders.length && saved.orders[next].tick === point.state.tick) {
      clickPoint(point, saved.orders[next]);
      next += 1;
    }
    stepPoint(point);
  }
  return point;
}

/** A game. @param {{seed: number, scatter: number, robot?: string}} setup */
export function createGame({ seed, scatter, robot = "R0" }) {
  return { seed, scatter, robot, score: [0, 0], played: 0, firstServer: seed % 2, aim: firstAim(FORWARD), points: [], current: null };
}

/** Who serves at this score: 2 points each, then 1 each from 10-10. */
export function serverOf(game) {
  const [mine, theirs] = game.score;
  const total = mine + theirs;
  const turns = mine >= LOOSE_END && theirs >= LOOSE_END ? total - LOOSE_END : Math.floor(total / 2);
  return (game.firstServer + turns) % 2;
}

/** The winner of a game at this score, or −1 while it goes on. */
export function winnerOf([mine, theirs]) {
  if (Math.max(mine, theirs) < WINNING || Math.abs(mine - theirs) < 2) return -1;
  return mine > theirs ? MOUSE : ROBOT;
}

/** The next point. The aim stays from the point before. */
export function nextPoint(game, robotService) {
  game.current = createPoint({ seed: game.seed + game.played, server: serverOf(game), scatter: game.scatter, aim: game.aim, robot: game.robot, robotService });
  game.played += 1;
  return game.current;
}

/** What a position needs to be played again, once kept in the bench of positions the robot lost (docs/modele.md, § 10). */
export function positionOf(point) {
  const { result } = point.state;
  return { seed: point.seed, server: point.server, scatter: point.scatter, robot: point.robot, robotService: point.robotService, aim: point.startAim, orders: point.orders, result };
}

/** A finished point as a replay: who played, its clicks, and everything the rally left (docs/replays.md). */
export function replayOfPoint(point) {
  const startedAt = localTimestamp();
  return { ...replayHeader({ players: point.players, startedAt }), savedAt: startedAt, ...positionOf(point), rally: point.log.finish() };
}

/** Closes the point under way: the score, the aim, what to keep. A rally stopped at its limit is played again, with no score. */
export function closePoint(game) {
  const point = game.current;
  const { winner } = point.state.result;
  game.aim = point.rule.aim.slice();
  if (winner >= 0) game.score[winner] += 1;
  game.points.push(point);
  game.current = null;
  return winner;
}
