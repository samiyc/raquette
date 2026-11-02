import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { VX, VY, VZ, WX, WY, WZ, X, Y, Z } from "../src/ball/constants.js";
import { createBall } from "../src/ball/flight.js";
import { advance, bounce, FLOOR_TOUCH, NET_TOUCH, NONE, restitution, TABLE_BOUNCE } from "../src/ball/table.js";

const RADIUS = 0.02;
const slipOf = (ball) => [ball[VX] - RADIUS * ball[WY], ball[VY] + RADIUS * ball[WX]];
const close = (actual, expected, tolerance = 1e-9) => Math.abs(actual - expected) <= tolerance;

/** Steps until something other than NONE happens. */
function until(ball, contact = new Float64Array(3)) {
  for (let i = 0; i < 2400; i += 1) {
    const event = advance(ball, contact);
    if (event !== NONE) return event;
  }
  return NONE;
}

describe("the bounce (Nakashima et al., as Conti et al. write it)", () => {
  it("gives back the vertical speed by the restitution, which falls with impact speed", () => {
    const ball = createBall([0.5, 0, RADIUS], [0, 0, -3], [0, 0, 0]);
    bounce(ball);
    assert.ok(close(ball[VZ], 3 * restitution(3)));
    assert.ok(close(restitution(3), 0.92));
    assert.ok(close(restitution(10), 0.78));
  });

  it("ends the sliding when the friction allows it: the contact point stops, at α = 2/5", () => {
    const ball = createBall([0.5, 0, RADIUS], [1, 0.4, -5], [-10, 30, 0]);
    const [slipX, slipY] = slipOf(ball);
    bounce(ball);
    const [afterX, afterY] = slipOf(ball);
    assert.ok(close(afterX, 0, 1e-12));
    assert.ok(close(afterY, 0, 1e-12));
    assert.ok(slipX !== 0 && slipY !== 0);
  });

  it("slides under a large slip, with the impulse friction allows", () => {
    const ball = createBall([0.5, 0, RADIUS], [20, 0, -2], [0, 0, 0]);
    bounce(ball);
    assert.ok(close(ball[VX], 20 - 0.25 * (1 + restitution(2)) * 2));
    assert.ok(ball[VX] - RADIUS * ball[WY] > 0);
  });

  it("joins rolling and sliding at α = 0.4", () => {
    const at = (slip) => {
      const ball = createBall([0.5, 0, RADIUS], [slip, 0, -4], [0, 0, 0]);
      bounce(ball);
      return [ball[VX], ball[WY]];
    };
    const edge = (0.25 * (1 + restitution(4)) * 4) / 0.4;
    const [below, above] = [at(edge - 1e-7), at(edge + 1e-7)];
    assert.ok(close(below[0], above[0], 1e-6));
    assert.ok(close(below[1], above[1], 1e-4));
    assert.ok(close(below[0], 0.6 * edge, 1e-6));
    assert.ok(close(below[1], (0.6 * edge) / RADIUS, 1e-4));
  });

  it("leaves the spin about the vertical alone, and a slip of zero changes nothing sideways", () => {
    const ball = createBall([0.5, 0, RADIUS], [0, 0, -2], [0, 0, 77]);
    bounce(ball);
    assert.deepEqual([ball[VX], ball[VY], ball[WX], ball[WY], ball[WZ]], [0, 0, 0, 0, 77]);
  });

  it("never gains energy", () => {
    const energy = (ball) => (ball[VX] ** 2 + ball[VY] ** 2 + ball[VZ] ** 2) / 2
      + ((1 / 3) * RADIUS * RADIUS) * (ball[WX] ** 2 + ball[WY] ** 2 + ball[WZ] ** 2);
    for (const vx of [0, 2, 8, 20]) {
      for (const wy of [-800, -200, 0, 300, 900]) {
        const ball = createBall([0.5, 0, RADIUS], [vx, 1, -4], [50, wy, 10]);
        const before = energy(ball);
        bounce(ball);
        assert.ok(energy(ball) <= before + 1e-9, `vx ${vx}, ωy ${wy}`);
      }
    }
  });
});

describe("a step of the simulation", () => {
  it("bounces on the table, at the point it crossed", () => {
    const ball = createBall([0.5, 0.1, 0.5], [2, 0, -3], [0, 0, 0]);
    const contact = new Float64Array(3);
    assert.equal(until(ball, contact), TABLE_BOUNCE);
    assert.ok(contact[0] > 0.5 && contact[0] < 1);
    assert.ok(close(contact[1], 0.1));
    assert.ok(contact[2] >= 0 && contact[2] <= 1);
    assert.ok(ball[VZ] > 0);
    assert.ok(ball[Z] > RADIUS);
  });

  it("does not bounce beyond the lines: a ball long or wide reaches the floor", () => {
    for (const start of [[1.5, 0, 0.3], [0.5, 0.9, 0.3]]) {
      const ball = createBall(start, [0, 0, 0], [0, 0, 0]);
      assert.equal(until(ball), FLOOR_TOUCH);
      assert.ok(close(ball[Z], -0.76 + RADIUS));
      assert.equal(ball[VZ], 0);
    }
  });

  it("stops a low ball at the net, and lets a high one pass", () => {
    const low = createBall([-0.2, 0, 0.1], [10, 0, 0], [0, 0, 0]);
    assert.equal(until(low), NET_TOUCH);
    assert.ok(close(low[X], 0));
    assert.equal(low[VX], 0);
    const high = createBall([-0.2, 0, 0.35], [3, 0, 0], [0, 0, 0]);
    assert.equal(until(high), TABLE_BOUNCE);
    assert.ok(high[X] > 0);
  });

  it("stops the net from both sides, and lets a ball go round its posts", () => {
    const back = createBall([0.2, 0, 0.1], [-10, 0, 0], [0, 0, 0]);
    assert.equal(until(back), NET_TOUCH);
    const round = createBall([-0.2, 0.95, 0.1], [10, 0, 0], [0, 0, 0]);
    assert.equal(until(round), FLOOR_TOUCH);
    assert.ok(round[Y] > 0.9);
  });

  it("does not miss the net on the fastest ball, nor a table crossed between two steps", () => {
    const fast = createBall([-0.3, 0, 0.12], [35, 0, 0], [0, 0, 0]);
    assert.equal(until(fast), NET_TOUCH);
    const steep = createBall([0.5, 0, 0.5], [0, 0, -30], [0, 0, 0]);
    assert.equal(until(steep), TABLE_BOUNCE);
  });

  it("takes the net first when both are crossed in the same step", () => {
    const ball = createBall([-0.03, 0, 0.03], [20, 0, -2], [0, 0, 0]);
    assert.equal(advance(ball, new Float64Array(3)), NET_TOUCH);
  });
});
