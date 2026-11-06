import { streamOf } from "mcts-commun/random.js";

/** A spin that changes from stroke to stroke (Sami, 6/11/2026): the other player reads it late (src/rally.js, Q-P9). */
const VARY_STREAM = 8011; // Far from the world's streams, which go up to 2 000.

/** A swing whose brush changes from stroke to stroke, by a draw of the rally's seed and stroke: the same rally plays the same way. */
export function variedSwing(swing, vary, view) {
  if (!vary) return swing;
  const draw = streamOf(view.state.seed, VARY_STREAM + view.state.strokes).next();
  return { ...swing, brushUp: swing.brushUp - vary * draw };
}
