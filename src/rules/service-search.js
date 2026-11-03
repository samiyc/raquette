import { streamOf } from "mcts-commun/random.js";
import { startRally, stepRally } from "../rally.js";
import { SERVICE_KINDS } from "../services.js";

/**
 * A search picks its service as it picks its strokes (Sami, 3/11/2026): each kind, to the left, the middle and the right, is played on
 * from its contact against the model, on draws of its own. The draws come from the rally's seed, so that it does not always serve the
 * same way, and they are not the world's. Allocates: it runs once a rally, at most.
 */
const SIDES = [-0.35, 0, 0.35];
const FROMS = [-0.5, 0.5]; // Besides the middle, tried only for the kind that came out best: for every kind, it would take three times as long.
const STREAM = 9973;

/** A service played on against the model. @returns {number} what the point is worth to the server */
function worth(start, horizon) {
  const state = startRally(start);
  while (!state.result && state.strokes < horizon) stepRally(state);
  if (!state.result || state.result.winner < 0) return 0.5;
  return state.result.winner === start.server ? 1 : 0;
}

/**
 * @param {{seed: number, server: number, profile: any}} rally
 * @param {{model: import("../types.js").Rule, draws: number, horizon: number}} setup
 * @returns {{key: string, y: number, from: number, value: number}} the best service, its side and where it leaves from in the server's
 *   own frame, what it is thought to be worth
 */
export function bestService({ seed, server, profile }, { model, draws, horizon }) {
  const players = [{ rule: model, profile }, { rule: model, profile }];
  const seeds = Array.from({ length: draws }, (_, i) => streamOf(seed, STREAM + i).int(2 ** 31));
  const valueOf = (key, y, from) => seeds.reduce((sum, one) => sum + worth({ seed: one, players, server, service: SERVICE_KINDS[key], serviceY: y, serviceFrom: from }, horizon), 0) / draws;
  let best = { key: "", y: 0, from: 0, value: -1 };
  const keep = (key, y, from) => {
    const value = valueOf(key, y, from);
    if (value > best.value) best = { key, y, from, value };
  };
  for (const key of Object.keys(SERVICE_KINDS)) for (const y of SIDES) keep(key, y, 0);
  const { key } = best;
  for (const from of FROMS) for (const y of SIDES) keep(key, y, from);
  return best;
}
