import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { BALL_SIZE } from "../src/ball/constants.js";
import { createBall } from "../src/ball/flight.js";
import { advance, NONE } from "../src/ball/table.js";

/**
 * What the simulation does, held in a hash (as in mcts-urgences, mcts-entrepot and mcts-cuisine): a refactor must leave
 * it unchanged. A change meant to alter what the model does updates it here, and its commit says so, with the measures
 * before and after.
 */
const EXPECTED = {
  ball: "acdeaa748cb109c6",
};

/** Launches across the model's range: drives, loops, pushes, sidespin, net balls, long balls, the bounds. */
const LAUNCHES = [
  [[-1.5, 0, 0.25], [8, 0, 1.1], [0, 0, 0]],
  [[-1.6, 0.2, 0.3], [15, -1, 0.8], [0, 500, 0]],
  [[-1.4, -0.3, 0.2], [12, 1, 2.5], [0, 700, 80]],
  [[-1.5, 0, 0.1], [5, 0, 1.6], [0, -190, 0]],
  [[-1.2, 0.5, 0.15], [4, -1, 2], [40, -600, -60]],
  [[1.5, 0, 0.3], [-22, 2, 0], [0, -120, 0]],
  [[-1.3, 0, 0.05], [10, 0, 0.2], [0, 100, 0]],
  [[-1.7, 0, 0.4], [40, 0, 3], [0, 1500, 0]],
];

/** Every event of a flight of up to two seconds, and the ball's numbers at each step's end, exactly. */
function trace([position, velocity, spin]) {
  const ball = createBall(position, velocity, spin);
  const contact = new Float64Array(3);
  const hash = createHash("sha256");
  const events = [];
  for (let step = 0; step < 480; step += 1) {
    const event = advance(ball, contact);
    hash.update(new Uint8Array(ball.buffer, 0, BALL_SIZE * 8));
    if (event !== NONE) events.push([step, event, ...contact]);
  }
  return [events, hash.digest("hex")];
}

const digest = (value) => createHash("sha256").update(JSON.stringify(value)).digest("hex").slice(0, 16);

describe("the fingerprints", () => {
  it("of the ball", () => {
    assert.equal(digest(LAUNCHES.map(trace)), EXPECTED.ball);
  });
});
