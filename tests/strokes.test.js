import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { X } from "../src/ball/constants.js";
import { clickPoint, createPoint, pointOver, replayPoint, stepPoint } from "../src/game.js";
import { ballPath, choicesAt, depthFor, expectedMiss, nextContact, STROKE_KINDS, strokeChoices } from "../src/strokes.js";

const MOUSE = { who: 0 };
const choicesOf = (point) => strokeChoices(point.state, { ...MOUSE, rule: point.rule });
const allowed = (choices) => Object.keys(choices).filter((key) => choices[key] === null);

/** A point the robot serves, the player placed before it. */
function waitingAt(x, y = 0, seed = 3) {
  const point = createPoint({ seed, server: 1, scatter: 0 });
  clickPoint(point, { moveTo: [x, y] });
  return point;
}

/** A point just after a stroke of the robot in which a short cut can be played. */
function afterRobotStroke() {
  for (let seed = 0; seed < 40; seed += 1) {
    const point = createPoint({ seed, server: 1, scatter: 1 });
    untilRobotStrikes(point);
    if (!pointOver(point) && choicesOf(point).short === null) return point;
  }
  throw new Error("aucune balle pour un coup court en 40 échanges");
}

/** Up to the first stroke of the robot after the player's first, for a ball that comes from a real stroke. */
function untilRobotStrikes(point) {
  while (!pointOver(point) && point.state.strokes < 2) stepPoint(point);
}

describe("the strokes offered for the next ball", () => {
  it("always offer something for a ball within reach", () => {
    const point = waitingAt(-1.87);
    assert.ok(allowed(choicesOf(point)).length >= 1, JSON.stringify(choicesOf(point)));
  });

  it("far from the table, no push and no short cut: the ball would have to be hit harder to get across (Sami)", () => {
    const far = waitingAt(-3.2);
    const choices = choicesOf(far);
    assert.notEqual(choices.push, null, JSON.stringify(choices));
    assert.notEqual(choices.short, null, JSON.stringify(choices));
  });

  it("on a ball of the robot, in a real rally, the short cut is there", () => {
    const point = afterRobotStroke();
    const choices = choicesOf(point);
    assert.equal(choices.short, null, JSON.stringify(choices));
  });

  it("near the table on a slow ball, the push is there, and no chop", () => {
    const near = createPoint({ seed: 3, server: 1, scatter: 0 });
    clickPoint(near, { moveTo: [-1.5, 0] });
    near.state.bounces = 1;
    near.state.ownBounce = false;
    near.state.ball.set([-0.6, 0, 0.1, -2.5, 0, 1.8, 0, 100, 0]);
    const choices = choicesOf(near);
    assert.equal(choices.push, null, JSON.stringify(choices));
    assert.notEqual(choices.chop, null);
    assert.notEqual(choices.block, null, "nothing to block on a slow ball");
  });

  it("on a fast ball, no push and no short cut (Sami): a block and a flat ball stay", () => {
    const point = createPoint({ seed: 3, server: 1, scatter: 0 });
    const fast = Float64Array.of(-1.6, 0, 0.25, -11, 0, 0.5, 0, -200, 0);
    const choices = choicesAt(fast, { side: -1, aim: point.rule.aim });
    assert.match(choices.push, /trop rapide/);
    assert.match(choices.short, /trop rapide/);
    assert.equal(choices.block, null, JSON.stringify(choices));
  });

  it("offer nothing when the ball is going out, or just struck by the player", () => {
    const point = waitingAt(-1.87);
    while (!pointOver(point) && point.state.strokes < 1) stepPoint(point);
    assert.equal(allowed(choicesOf(point)).length, 0);
    assert.equal(nextContact(point.state, 0, point.rule), null);
  });

  it("know where the stroke will take the ball, further back when the player is further back", () => {
    const [near, far] = [waitingAt(-1.87), waitingAt(-3.2)];
    const contacts = [nextContact(near.state, 0, near.rule), nextContact(far.state, 0, far.rule)];
    assert.ok(contacts[0], "near");
    if (contacts[1]) assert.ok(contacts[1].ball[X] <= contacts[0].ball[X]);
  });

  it("leave the rally as it is", () => {
    const point = waitingAt(-1.87);
    const copy = point.state.ball.slice();
    const body = point.state.bodies[0].slice();
    choicesOf(point);
    assert.deepEqual([...point.state.ball], [...copy]);
    assert.deepEqual([...point.state.bodies[0]], [...body]);
  });
});

describe("the circle around the target", () => {
  const fromRobot = (seed = 3) => createPoint({ seed, server: 1, scatter: 1 });
  const missOfPoint = (point) => expectedMiss(point.state, { who: 0, rule: point.rule });

  it("is in the tens of centimetres on an easy ball, and vanishes without scatter", () => {
    const miss = missOfPoint(fromRobot());
    assert.ok(miss > 0.05 && miss < 0.6, `${miss}`);
    assert.equal(missOfPoint(createPoint({ seed: 3, server: 1, scatter: 0 })), 0);
  });

  it("grows with the slider", () => {
    const half = createPoint({ seed: 3, server: 1, scatter: 0.5 });
    assert.ok(missOfPoint(half) < missOfPoint(fromRobot()));
  });

  it("grows the further from the table the ball is taken (Sami)", () => {
    const [near, far] = [fromRobot(), fromRobot()];
    for (const point of [near, far]) point.state.ball.set([1.47, 0, 0.25, -7, 0, -1.5, 0, 0, 0]);
    clickPoint(near, { moveTo: [-1.87, 0] });
    clickPoint(far, { moveTo: [-2.7, 0] });
    assert.ok(missOfPoint(far) > missOfPoint(near), `${missOfPoint(far)} / ${missOfPoint(near)}`);
  });

  it("grows on a fast ball (Sami)", () => {
    const point = fromRobot();
    clickPoint(point, { moveTo: [-1.9, 0] });
    const easy = missOfPoint(point);
    point.state.bounces = 1;
    point.state.ownBounce = false;
    point.state.ball.set([-1.2, 0, 0.2, -14, 0, 1, 0, -200, 0]);
    assert.ok(missOfPoint(point) > easy, `${missOfPoint(point)} / ${easy}`);
  });

  it("says nothing when there is no ball to take", () => {
    const point = fromRobot();
    while (!pointOver(point) && point.state.strokes < 1) stepPoint(point);
    assert.equal(missOfPoint(point), null);
  });
});

describe("the ball's way during a pause", () => {
  it("goes through the rally's next touches, and stops at the second on a side", () => {
    const point = createPoint({ seed: 3, server: 0, scatter: 0 });
    const { points, touches } = ballPath(point.state);
    assert.equal(touches.length, 3);
    assert.ok(touches[0].x < 0 && touches[1].x > 0);
    assert.ok(points.length > 10);
    assert.deepEqual(points[0].slice(0, 2), [point.state.ball[0], point.state.ball[1]]);
  });

  it("leaves the rally as it is, and a ball struck by the robot is read to the player's camp", () => {
    const point = createPoint({ seed: 6, server: 1, scatter: 0 });
    untilRobotStrikes(point);
    if (pointOver(point)) return;
    const copy = point.state.ball.slice();
    const { touches } = ballPath(point.state);
    assert.deepEqual([...point.state.ball], [...copy]);
    assert.ok(touches[0].x < 0, JSON.stringify(touches));
  });
});

describe("a stroke picked during a pause", () => {
  it("is played: the ball leaves as the stroke says", () => {
    const lift = (stroke) => {
      const point = createPoint({ seed: 3, server: 1, scatter: 0 });
      clickPoint(point, { aimAt: [0.7, 0] });
      clickPoint(point, { stroke });
      while (!pointOver(point) && point.state.strokes < 1) stepPoint(point);
      return point.state.ball[7];
    };
    assert.ok(lift("top") > lift("flat") + 200, `${lift("top")} / ${lift("flat")}`);
    assert.ok(lift("chop") < lift("flat") - 200, `${lift("chop")} / ${lift("flat")}`);
  });

  it("finds how short a short cut can go on this ball", () => {
    const point = afterRobotStroke();
    const depth = depthFor(point.state, { who: 0, rule: point.rule }, "short");
    assert.ok(depth >= 0.35 && depth <= 0.75, `${depth}`);
    assert.equal(depthFor(point.state, { who: 0, rule: point.rule }, "flat"), null);
  });

  it("counts until the preparation starts, like the aim, and not after", () => {
    const point = createPoint({ seed: 3, server: 1, scatter: 0 });
    while (point.state.plans[0] === null) stepPoint(point);
    const plan = point.state.plans[0];
    assert.equal(clickPoint(point, { stroke: "top" }), true);
    while (point.state.tick < plan.at - 36) stepPoint(point);
    assert.equal(clickPoint(point, { stroke: "flat" }), false);
    assert.equal(point.rule.stroke, "top");
  });

  it("starts each point flat", () => {
    assert.equal(createPoint({ seed: 1, server: 0, scatter: 1 }).rule.stroke, "flat");
  });

  it("is kept for the replay, which plays the same", () => {
    const point = createPoint({ seed: 5, server: 1, scatter: 1 });
    clickPoint(point, { stroke: "top" });
    while (!pointOver(point)) {
      if (point.state.tick === 200) clickPoint(point, { stroke: "push" });
      stepPoint(point);
    }
    const again = replayPoint({ seed: 5, server: 1, scatter: 1, orders: point.orders });
    assert.deepEqual(again.state.result, point.state.result);
  });

  it("every stroke has a name for the page", () => {
    for (const kind of Object.values(STROKE_KINDS)) assert.ok(kind.label && kind.swing);
  });

  it("a real rally reaches a choice with the robot's ball", () => {
    const point = createPoint({ seed: 6, server: 1, scatter: 0 });
    untilRobotStrikes(point);
    if (!pointOver(point)) assert.ok(allowed(choicesOf(point)).includes("flat"), JSON.stringify(choicesOf(point)));
  });
});
