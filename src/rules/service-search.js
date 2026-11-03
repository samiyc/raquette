import { streamOf } from "mcts-commun/random.js";
import { startRally, stepRally } from "../rally.js";
import { SERVICE_KINDS } from "../services.js";

/**
 * A search picks its service as it picks its strokes (Sami, 3/11/2026): each kind, to the left, the middle and the right, is played on
 * from its contact against the model, on draws of its own. The draws come from the rally's seed, so that it does not always serve the
 * same way, and they are not the world's. Allocates: it runs once a rally, at most.
 */
const SIDES = [-0.35, 0, 0.35];
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
 * @returns {{key: string, y: number, value: number}} the best service, its side in the server's own frame, what it is thought to be worth
 */
export function bestService({ seed, server, profile }, { model, draws, horizon }) {
  const players = [{ rule: model, profile }, { rule: model, profile }];
  const seeds = Array.from({ length: draws }, (_, i) => streamOf(seed, STREAM + i).int(2 ** 31));
  let best = { key: "", y: 0, value: -1 };
  for (const [key, service] of Object.entries(SERVICE_KINDS)) {
    for (const y of SIDES) {
      const total = seeds.reduce((sum, one) => sum + worth({ seed: one, players, server, service, serviceY: y }, horizon), 0);
      if (total / draws > best.value) best = { key, y, value: total / draws };
    }
  }
  return best;
}
