import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { CLUB_PLAYER, BX, BY } from "../src/player.js";
import {
  clickPoint, closePoint, createGame, createPoint, mouseProfile, nextPoint, pointOver, positionOf, replayPoint, runToEvent, serverOf, stepPoint, stepsFor, winnerOf,
} from "../src/game.js";
import { destinationOf, firstAim, orderOf } from "../src/mouse.js";
import { fromTopBand, layoutFor, topPoint } from "../web/scale.js";

const layout = layoutFor(960);
const view = { ...layout, forward: 1 };
const at = (x, y, button) => {
  const [px, py] = topPoint(layout, x, y);
  return { px, py: fromTopBand(layout, py), button };
};
const close = (a, b, tolerance = 1e-9) => Math.abs(a - b) <= tolerance;

describe("a click", () => {
  it("of the left button says where to go, anywhere on the plane", () => {
    const { moveTo } = orderOf(at(-2, 0.5, 0), view);
    assert.ok(close(moveTo[0], -2) && close(moveTo[1], 0.5), `${moveTo}`);
  });

  it("of the right button says where to send the ball, on the other camp only", () => {
    const { aimAt } = orderOf(at(0.9, -0.4, 2), view);
    assert.ok(close(aimAt[0], 0.9) && close(aimAt[1], -0.4), `${aimAt}`);
    assert.equal(orderOf(at(-0.9, 0, 2), view), null);
    assert.equal(orderOf(at(1.5, 0, 2), view), null);
    assert.equal(orderOf(at(0.9, 0.9, 2), view), null);
  });

  it("off the view from above, or of another button, asks nothing", () => {
    assert.equal(orderOf({ px: 100, py: layout.topHeight + 5, button: 0 }, view), null);
    assert.equal(orderOf({ px: 100, py: -5, button: 0 }, view), null);
    assert.equal(orderOf(at(0.9, 0, 1), view), null);
  });
});

/** A point up to the step before a condition, or its end. */
function runUntil(point, done) {
  while (!pointOver(point) && !done(point.state)) stepPoint(point);
}

describe("a point at the mouse", () => {
  it("is played without a click: the arm takes what comes within its reach", () => {
    const point = createPoint({ seed: 3, server: 1, scatter: 1 });
    runUntil(point, () => false);
    assert.ok(point.state.result.strokes >= 1, JSON.stringify(point.state.result));
  });

  it("sends the ball where the right button said", () => {
    const point = createPoint({ seed: 3, server: 1, scatter: 0 });
    clickPoint(point, { aimAt: [0.9, 0.5] });
    runUntil(point, (state) => state.strokes === 1);
    while (point.recorder.recording.events.at(-1)?.x < 0 || point.state.bounces === 0) {
      stepPoint(point);
      if (pointOver(point)) break;
    }
    const landed = point.recorder.recording.events.at(-1);
    assert.ok(close(landed.x, 0.9, 0.05) && close(landed.y, 0.5, 0.05), JSON.stringify(landed));
  });

  it("moves the body to the left click, at the robot's speed", () => {
    const point = createPoint({ seed: 3, server: 0, scatter: 1 });
    stepPoint(point);
    clickPoint(point, { moveTo: [-2.5, 0.8] });
    const body = point.state.bodies[0];
    stepPoint(point);
    const [x, y] = [body[BX], body[BY]];
    assert.ok(Math.abs(x + 1.87) < 0.01 && Math.abs(y) < 0.01, `${x}, ${y}`);
    for (let i = 0; i < 240; i += 1) stepPoint(point);
    assert.ok(Math.sqrt((body[BX] + 1.87) ** 2 + body[BY] ** 2) <= 3 + 1e-9);
  });

  it("places the body at once before the service: a player chooses where to wait", () => {
    const point = createPoint({ seed: 3, server: 1, scatter: 1 });
    clickPoint(point, { moveTo: [-2.2, 0.4] });
    const body = point.state.bodies[0];
    assert.deepEqual([body[BX], body[BY]], [-2.2, 0.4]);
    stepPoint(point);
    assert.ok(Math.abs(body[BX] + 2.2) < 1e-9 && Math.abs(body[BY] - 0.4) < 1e-9);
  });

  it("makes a move during the reaction wait for its end: the pause gives time to think, not to run", () => {
    const point = createPoint({ seed: 3, server: 1, scatter: 1 });
    const body = point.state.bodies[0];
    const start = body[BY];
    stepPoint(point);
    clickPoint(point, { moveTo: [-1.87, 1.5] });
    for (let i = 0; i < 46; i += 1) stepPoint(point);
    assert.equal(body[BY], start);
    for (let i = 0; i < 30; i += 1) stepPoint(point);
    assert.ok(body[BY] > start, `${body[BY]}`);
  });

  it("shows the destination even while the move waits, then where the body is going", () => {
    const point = createPoint({ seed: 3, server: 1, scatter: 1 });
    const body = point.state.bodies[0];
    stepPoint(point);
    clickPoint(point, { moveTo: [-2.5, 1] });
    assert.deepEqual(destinationOf(point.rule, body), [-2.5, 1]);
    for (let i = 0; i < 60; i += 1) stepPoint(point);
    assert.deepEqual(destinationOf(point.rule, body), [-2.5, 1]);
  });

  it("takes an aim until the preparation starts, and not after", () => {
    const point = createPoint({ seed: 3, server: 1, scatter: 0 });
    runUntil(point, (state) => state.plans[0] !== null);
    const plan = point.state.plans[0];
    assert.equal(clickPoint(point, { aimAt: [1, 0.3] }), true);
    runUntil(point, (state) => state.tick >= plan.at - 36);
    assert.equal(clickPoint(point, { aimAt: [0.2, -0.3] }), false);
    assert.deepEqual(point.rule.aim, [1, 0.3]);
  });

  it("scatters as the robot does at 100 %, not at all at 0 %", () => {
    assert.equal(mouseProfile(1).scatterTilt, CLUB_PLAYER.scatterTilt);
    assert.equal(mouseProfile(1).speed, CLUB_PLAYER.speed);
    assert.equal(mouseProfile(0).scatterSpeed, 0);
    assert.equal(mouseProfile(0).scatterAcross, 0);
    const replays = [0, 1].map((scatter) => {
      const point = createPoint({ seed: 4, server: 1, scatter });
      runUntil(point, (state) => state.strokes === 1);
      return point.state.ball[3];
    });
    assert.notEqual(replays[0], replays[1]);
  });

  it("runs to the next event when asked, one at a time", () => {
    const point = createPoint({ seed: 3, server: 0, scatter: 1 });
    const [first, second] = [runToEvent(point), runToEvent(point)];
    assert.ok(first > 0 && second > 0);
    assert.equal(point.recorder.recording.events.length, 2);
  });

  it("says when the robot has just struck, for the pause", () => {
    const point = createPoint({ seed: 3, server: 1, scatter: 1 });
    assert.equal(point.robotStruck, false);
    runUntil(point, (state) => state.strokes >= 2);
    assert.equal(point.robotStruck, true);
  });
});

describe("a kept point", () => {
  function played(seed) {
    const point = createPoint({ seed, server: seed % 2, scatter: 1 });
    while (!pointOver(point)) {
      const { tick } = point.state;
      if (tick % 97 === 10) clickPoint(point, { aimAt: [0.5 + (tick % 7) / 10, tick % 2 ? 0.5 : -0.5] });
      if (tick % 131 === 20) clickPoint(point, { moveTo: [-1.9, (tick % 5) / 10 - 0.2] });
      stepPoint(point);
    }
    return point;
  }

  it("replays exactly from its seed and its clicks", () => {
    for (const seed of [1, 2, 3, 4, 5]) {
      const point = played(seed);
      const again = replayPoint({ seed, server: point.server, scatter: 1, orders: point.orders });
      assert.deepEqual(again.state.result, point.state.result);
      assert.deepEqual(again.rule.aim, point.rule.aim);
    }
  });

  it("goes out as plain data, and comes back the same", () => {
    const point = played(6);
    const position = JSON.parse(JSON.stringify(positionOf(point)));
    assert.deepEqual(position.result, point.state.result);
    assert.deepEqual(replayPoint(position).state.result, point.state.result);
  });
});

describe("the robot of a game", () => {
  it("can be the search: a point is played, and plays again the same", () => {
    const point = createPoint({ seed: 2, server: 1, scatter: 1, robot: "S" });
    while (!pointOver(point)) stepPoint(point);
    assert.deepEqual(point.players[1].rule.name, "S");
    const again = replayPoint(JSON.parse(JSON.stringify(positionOf(point))));
    assert.deepEqual(again.state.result, point.state.result);
  });

  it("is R0 by default, and goes from the game to its points", () => {
    assert.equal(createPoint({ seed: 2, server: 1, scatter: 1 }).players[1].rule.name, "R0");
    const game = createGame({ seed: 1, scatter: 1, robot: "R3" });
    assert.equal(nextPoint(game).players[1].rule.name, "R3");
  });
});

describe("a game", () => {
  it("goes to 11, with 2 clear", () => {
    assert.equal(winnerOf([10, 5]), -1);
    assert.equal(winnerOf([11, 5]), 0);
    assert.equal(winnerOf([5, 11]), 1);
    assert.equal(winnerOf([11, 10]), -1);
    assert.equal(winnerOf([12, 10]), 0);
  });

  it("turns the service every 2 points, then at each point from 10-10", () => {
    const game = createGame({ seed: 0, scatter: 1 });
    const serving = ([mine, theirs]) => {
      game.score = [mine, theirs];
      return serverOf(game);
    };
    assert.deepEqual([[0, 0], [1, 0], [1, 1], [2, 1], [2, 2]].map(serving), [0, 0, 1, 1, 0]);
    assert.notEqual(serving([10, 10]), serving([11, 10]));
    assert.notEqual(serving([11, 10]), serving([11, 11]));
  });

  it("plays to its end against the robot, the score and the aim kept from point to point", () => {
    const game = createGame({ seed: 8, scatter: 1 });
    assert.deepEqual(game.aim, firstAim(1));
    while (winnerOf(game.score) < 0 && game.played < 400) {
      const point = nextPoint(game);
      clickPoint(point, { aimAt: [0.9, game.played % 2 ? 0.5 : -0.5] });
      while (!pointOver(point)) stepPoint(point);
      closePoint(game);
    }
    const winner = winnerOf(game.score);
    assert.ok(winner === 0 || winner === 1, `${game.score}`);
    assert.ok(Math.abs(game.aim[1]) === 0.5);
    assert.equal(game.points.length, game.played);
  });

  it("counts no point for a rally stopped at its limit", () => {
    const game = createGame({ seed: 1, scatter: 1 });
    game.current = { state: { result: { winner: -1 } }, rule: { aim: [1, 0] } };
    assert.equal(closePoint(game), -1);
    assert.deepEqual(game.score, [0, 0]);
  });
});

describe("the clock of the live game", () => {
  it("runs 240 steps a second at full speed, and carries the part of a step left over", () => {
    assert.deepEqual(stepsFor(1, 1, 0), { steps: 240, carry: 0 });
    const eighth = stepsFor(1 / 60, 1 / 8, 0);
    assert.equal(eighth.steps, 0);
    assert.ok(close(eighth.carry, 0.5));
    assert.equal(stepsFor(1 / 60, 1 / 8, eighth.carry).steps, 1);
  });
});
