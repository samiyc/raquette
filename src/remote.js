import { createBody, moveBody } from "./player.js";
import { viewOf } from "./rally.js";

/**
 * A rule that thinks elsewhere, so that a page does not freeze while a search looks for its stroke. The page sends a picture of the
 * rally just before the step at which the rule decides, and waits; the answer is what the rule would have said there and then, to the
 * number, so that a point replays alike with or without a worker. The picture is plain data, for `postMessage`.
 */

/** A rally as plain data. */
export function snapshotOf(state) {
  return {
    seed: state.seed,
    server: state.server,
    tick: state.tick,
    ball: state.ball.slice(),
    contact: state.contact.slice(),
    bodies: state.bodies.map((body) => body.slice()),
    seats: state.seats.map(({ side, profile }) => ({ side, profile })),
    striker: state.striker,
    ownBounce: state.ownBounce,
    bounces: state.bounces,
    strokes: state.strokes,
    plans: state.plans,
    decideAt: state.decideAt.slice(),
    spent: state.spent.slice(),
    lastSpin: state.lastSpin.slice(),
    missed: state.missed,
  };
}

/**
 * What a rule decides on this picture: the step begins by moving the bodies, the server's first, as the rally does.
 * @param {ReturnType<typeof snapshotOf>} picture
 * @param {number} who
 * @param {import("./types.js").Rule} rule
 */
export function decideOn(picture, who, rule) {
  const seats = picture.seats.map((seat) => ({ ...seat, rule }));
  const bodies = picture.bodies.map((body, i) => {
    const copy = createBody(seats[i].side, seats[i].profile);
    copy.set(body);
    return copy;
  });
  const state = { ...picture, seats, bodies, ball: Float64Array.from(picture.ball), contact: Float64Array.from(picture.contact),
    spent: Float64Array.from(picture.spent), lastSpin: Float64Array.from(picture.lastSpin), listener: null, result: null };
  moveBody(bodies[state.server], seats[state.server]);
  moveBody(bodies[1 - state.server], seats[1 - state.server]);
  return rule.decide(viewOf(state, who));
}

/**
 * A rule that takes an answer given in advance for a step, and otherwise thinks by itself: a test or a replay needs no worker.
 * @param {import("./types.js").Rule} rule
 */
export function createRemoteRule(rule) {
  const remote = {
    ...rule,
    answer: null,
    /** @param {number} tick @param {any} intent */
    give(tick, intent) {
      remote.answer = { tick, intent };
    },
    /** @param {import("./types.js").View} view */
    decide(view) {
      const { answer } = remote;
      remote.answer = null;
      return answer?.tick === view.tick ? answer.intent : rule.decide(view);
    },
  };
  return remote;
}

/** Is this rally about to ask `who` for a decision? */
export const aboutToDecide = (state, who) => state.result === null && state.decideAt[who] === state.tick;
