import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { createRng } from "mcts-commun/random.js";

/** The link to the sibling library (`file:../mcts-commun`) resolves, and a seed replays. */
describe("the shared library", () => {
  it("gives the same draws from the same seed", () => {
    const draws = (rng) => [rng.next(), rng.next(), rng.next()];
    assert.deepEqual(draws(createRng(42)), draws(createRng(42)));
  });
});
