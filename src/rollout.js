import { stepRally } from "./rally.js";

/**
 * A rally played on from where it stands, on a copy, for a search: both players follow a model, with draws of their own. What it
 * returns is what the point is worth to the player who searches: 1 won, 0 lost, one half if it is still going at the horizon. The
 * real rally is left as it is.
 */

/** Everything of a rally that a rollout will overwrite, made once per decision. */
function copyInto(copy, state) {
  copy.ball.set(state.ball);
  copy.contact.set(state.contact);
  copy.bodies.forEach((body, i) => body.set(state.bodies[i]));
  copy.striker = state.striker;
  copy.ownBounce = state.ownBounce;
  copy.bounces = state.bounces;
  copy.strokes = state.strokes;
  copy.tick = state.tick;
  copy.plans[0] = null;
  copy.plans[1] = null;
  copy.decideAt[0] = state.decideAt[0];
  copy.decideAt[1] = state.decideAt[1];
  copy.missed = state.missed;
  copy.result = null;
}

/**
 * @param {any} state the rally, at the moment a player decides
 * @param {{who: number, step: number, goal: number[], next: number[]}} stroke when and where the player takes the ball
 * @param {import("./types.js").Rule} model what both players do afterwards
 */
export function setUpRollout(state, stroke, model) {
  const seats = state.seats.map((seat) => ({ ...seat, rule: model }));
  const copy = {
    ...state,
    seats,
    listener: null,
    ball: state.ball.slice(),
    contact: state.contact.slice(),
    bodies: state.bodies.map((body) => body.slice()),
    plans: [null, null],
    decideAt: state.decideAt.slice(),
  };
  return { state, copy, ...stroke, plan: { ...stroke, at: state.tick + stroke.step, decided: state.tick, target: null, swing: null } };
}

/**
 * One rollout of a stroke.
 * @param {ReturnType<typeof setUpRollout>} setup
 * @param {{stroke: {target: number[], swing: any}, seed: number, horizon: number}} run
 * @returns {number} what the point is worth to the player who decides
 */
export function rollout(setup, { stroke, seed, horizon }) {
  const { state, copy, who, plan } = setup;
  copyInto(copy, state);
  copy.seed = seed;
  plan.target = stroke.target;
  plan.swing = stroke.swing;
  copy.plans[who] = plan;
  copy.decideAt[who] = -1;
  const last = state.strokes + horizon;
  while (!copy.result && copy.strokes < last) stepRally(copy);
  if (!copy.result || copy.result.winner < 0) return 0.5;
  return copy.result.winner === who ? 1 : 0;
}
