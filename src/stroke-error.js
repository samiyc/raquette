import { STEP, WX } from "./ball/constants.js";
import { controlOf, effortOf, energyOf, farOf, runningOf, rushOf, stretchOf, tiredOf } from "./scatter.js";

/** What a player gets wrong at a stroke, beside its draws of scatter (src/rally.js): the spin it reads, and what makes it less sure. */

const seen = new Float64Array(9);

/**
 * The ball as the player reads it (Q-P9, Sami, 6/11/2026): its spin off by a part of itself, and pulled towards the spin of the last
 * ball it took, so that a change of spin is read late. The first ball of a player is read without that pull.
 */
export function readBall(state, who, draw, profile) {
  seen.set(state.ball);
  const last = who * 3;
  const before = state.strokes >= 2;
  for (let i = 0; i < 3; i += 1) {
    const spin = state.ball[WX + i];
    seen[WX + i] = spin * (1 + draw * profile.spinRead) + (before ? profile.spinAnchor * (state.lastSpin[last + i] - spin) : 0);
    state.lastSpin[last + i] = spin;
  }
  return seen;
}

/** What makes this stroke less sure, each a factor on the scatter (src/scatter.js), and what it spends. */
export function factorsOf(state, who, plan, kept) {
  const { side, profile } = state.seats[who];
  const swing = { ...plan.swing, speed: kept };
  const factors = {
    rush: rushOf((plan.at - plan.decided) * STEP, profile),
    stretch: stretchOf(state.ball, state.bodies[who], profile),
    control: controlOf(state.ball, profile),
    far: farOf(state.ball, side, profile),
    effort: effortOf(swing, profile),
    running: runningOf(state.bodies[who], profile),
    tired: tiredOf(state.spent[who], profile),
  };
  state.spent[who] += energyOf(swing, profile);
  return factors;
}
