import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { PerformanceObserver } from "node:perf_hooks";
import { readdirSync, readFileSync } from "node:fs";
import { MAX_SPEED, MAX_SPIN, STEP, VX, VY, VZ, WX, WY, WZ, X, Y, Z } from "../src/ball/constants.js";
import { bound, createBall, fly } from "../src/ball/flight.js";
import { advance, NONE } from "../src/ball/table.js";

const norm = (ball, at) => Math.sqrt(ball[at] ** 2 + ball[at + 1] ** 2 + ball[at + 2] ** 2);

describe("the flight", () => {
  it("is only gravity for a ball at rest, at first", () => {
    const ball = createBall([0, 0, 1], [0, 0, 0], [0, 0, 0]);
    fly(ball, STEP);
    assert.ok(Math.abs(ball[VZ] + 9.81 * STEP) < 1e-5);
    assert.equal(ball[VX], 0);
  });

  it("makes a topspin dive and a backspin float", () => {
    const after = (spin) => {
      const ball = createBall([-1, 0, 0.5], [10, 0, 0], [0, spin, 0]);
      for (let i = 0; i < 24; i += 1) fly(ball, STEP);
      return ball[Z];
    };
    assert.ok(after(300) < after(0));
    assert.ok(after(-300) > after(0));
  });

  it("deflects sidespin sideways, by the sign of ω × v", () => {
    const ball = createBall([-1, 0, 0.5], [10, 0, 0], [0, 0, 300]);
    for (let i = 0; i < 24; i += 1) fly(ball, STEP);
    assert.ok(ball[Y] > 0);
    assert.ok(ball[VY] > 0);
  });

  it("slows the ball down, and keeps its spin", () => {
    const ball = createBall([-1, 0, 5], [20, 0, 0], [10, 200, 30]);
    fly(ball, STEP);
    assert.ok(ball[VX] < 20);
    assert.deepEqual([ball[WX], ball[WY], ball[WZ]], [10, 200, 30]);
  });

  it("holds a ball within the bounds", () => {
    const ball = createBall([0, 0, 1], [40, 30, 0], [0, 2000, 0]);
    assert.ok(Math.abs(norm(ball, VX) - MAX_SPEED) < 1e-9);
    assert.ok(Math.abs(norm(ball, WX) - MAX_SPIN) < 1e-9);
    const inside = createBall([0, 0, 1], [10, 0, 0], [0, 100, 0]);
    assert.deepEqual([...bound(inside)], [...createBall([0, 0, 1], [10, 0, 0], [0, 100, 0])]);
  });

  it("does the same to a ball turned half way round, to the bit", () => {
    const one = createBall([-1.2, 0.31, 0.4], [13.7, -2.1, 1.9], [23, 311, -47]);
    const two = createBall([1.2, -0.31, 0.4], [-13.7, 2.1, 1.9], [-23, -311, -47]);
    const contact = new Float64Array(3);
    for (let i = 0; i < 90; i += 1) {
      assert.equal(advance(one, contact), advance(two, contact));
      for (const at of [X, Y, VX, VY, WX, WY]) assert.equal(one[at], -two[at]);
      for (const at of [Z, VZ, WZ]) assert.equal(one[at], two[at]);
    }
  });
});

describe("what the flight must not do", () => {
  it("uses no function that differs between JavaScript engines", () => {
    const folder = new URL("../src/ball/", import.meta.url);
    for (const name of readdirSync(folder)) {
      const code = readFileSync(new URL(name, folder), "utf8").replace(/\/\*[\s\S]*?\*\/|\/\/.*/g, "");
      assert.doesNotMatch(code, /Math\.(sin|cos|tan|asin|acos|atan|atan2|pow|exp|expm1|log|log2|log10|hypot|cbrt)\b|\*\*/, name);
    }
  });

  it("collects no garbage once warm (docs/modele.md, § 9)", async () => {
    const start = createBall([-1, 0, 0.3], [12, 0, 1], [0, 300, 0]);
    const ball = start.slice();
    const contact = new Float64Array(3);
    const steps = (count) => {
      for (let i = 0; i < count; i += 1) {
        if (advance(ball, contact) !== NONE) ball.set(start);
      }
    };
    steps(300000);
    let collections = 0;
    const observer = new PerformanceObserver((list) => { collections += list.getEntries().length; });
    await new Promise((done) => setImmediate(done));
    observer.observe({ entryTypes: ["gc"] });
    steps(1000000);
    await new Promise((done) => setTimeout(done, 20));
    observer.disconnect();
    assert.equal(collections, 0);
  });
});
