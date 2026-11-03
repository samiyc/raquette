import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { TABLE, Y } from "../src/ball/constants.js";
import { advance, FLOOR_TOUCH, NET_TOUCH, TABLE_BOUNCE } from "../src/ball/table.js";
import { clickPoint, createPoint, replayPoint } from "../src/game.js";
import { BY, CLUB_PLAYER } from "../src/player.js";
import { startRally } from "../src/rally.js";
import { RULES } from "../src/rules/ladder.js";
import { bestService } from "../src/rules/service-search.js";
import { MOST_FROM, receiverY, SERVICE_KINDS, serviceBall, serviceOf } from "../src/services.js";

const contact = new Float64Array(3);

/** The places of its first two touches, or null for what is not a good service. */
function touchesOf(start) {
  const ball = start.slice();
  const touches = [];
  for (let step = 0; step < 480 && touches.length < 2; step += 1) {
    const kind = advance(ball, contact);
    if (kind === NET_TOUCH || kind === FLOOR_TOUCH) return null;
    if (kind === TABLE_BOUNCE) touches.push([contact[0], contact[1]]);
  }
  return touches.length === 2 ? touches : null;
}

const missed = (kind, y, from) => {
  let misses = 0;
  for (let seed = 0; seed < 400; seed += 1) if (!touchesOf(serviceBall(-1, SERVICE_KINDS[kind], { seed, y, from }))) misses += 1;
  return misses / 400;
};

describe("a service comes down in the other camp", () => {
  // Straight from the middle, the bomb used to go out, 9 % of the time (Sami, 3/11/2026): each still has its scatter.
  for (const kind of Object.keys(SERVICE_KINDS)) {
    it(`${kind}, straight or across, from anywhere`, () => {
      for (const [y, from] of [[0, 0], [0.5, 0.5], [-0.5, 0.5], [0.5, -0.5], [0.42, 0], [0.6, 0.7], [-0.6, 0.7]]) {
        assert.ok(missed(kind, y, from) <= 0.03, `${kind} vers ${y} depuis ${from} : ${missed(kind, y, from)}`);
      }
    });
  }

  it("goes where it is sent, from where it leaves", () => {
    for (const [y, from] of [[0.5, 0.5], [-0.5, 0.5], [0.3, -0.5]]) {
      const ball = serviceBall(-1, SERVICE_KINDS.pendule, { seed: 3, y, from });
      assert.equal(ball[Y], from);
      assert.ok(Math.abs(touchesOf(ball)[1][1] - y) < 0.1, `${y} depuis ${from}`);
    }
  });

  it("does not leave from beyond the table", () => {
    assert.equal(serviceBall(-1, SERVICE_KINDS.mou, { seed: 1, from: 3 })[Y], MOST_FROM);
  });

  it("is the mirror image from the other side", () => {
    const one = serviceBall(-1, SERVICE_KINDS.bombe, { seed: 5, y: 0.3, from: 0.5 });
    const other = serviceBall(1, SERVICE_KINDS.bombe, { seed: 5, y: 0.3, from: 0.5 });
    assert.ok(Math.abs(one[Y] + other[Y]) < 1e-12);
  });
});

describe("the receiver", () => {
  const players = [{ rule: RULES.R0, profile: CLUB_PLAYER }, { rule: RULES.R0, profile: CLUB_PLAYER }];
  const FAR = 2 * TABLE.halfLength + 0.1;
  const wait = CLUB_PLAYER.waitBehindLine;

  it("stands half-way between the lines to the far corners: the straight one and the diagonal are as far from it", () => {
    const from = 0.6;
    const y = receiverY(from, CLUB_PLAYER);
    assert.ok(y < 0 && y > -0.2, `${y}`);
    const lineAt = (corner) => from + ((corner - from) * (FAR + wait)) / FAR;
    assert.ok(Math.abs(lineAt(TABLE.halfWidth) - y - (y - lineAt(-TABLE.halfWidth))) < 1e-12);
    assert.ok(lineAt(TABLE.halfWidth) - y < CLUB_PLAYER.reach * 1.2);
  });

  it("is placed there for the service, and the server behind its ball", () => {
    const state = startRally({ seed: 1, players, server: 0, service: SERVICE_KINDS.pendule, serviceY: 0.2, serviceFrom: 0.5 });
    assert.equal(state.bodies[0][BY], 0.5);
    assert.ok(Math.abs(state.bodies[1][BY] - receiverY(0.5, CLUB_PLAYER)) < 1e-12);
  });

  it("is in the middle for a service from the middle", () => {
    const state = startRally({ seed: 1, players, server: 1 });
    assert.equal(state.bodies[0][BY], 0);
    assert.equal(state.bodies[1][BY], 0);
  });
});

describe("the mouse player serving", () => {
  const serving = () => createPoint({ seed: 2, server: 0, scatter: 1 });

  it("sends the service from where it stands, and the robot follows", () => {
    const point = serving();
    for (let i = 0; i < 6; i += 1) clickPoint(point, { moveBy: [0, 0.05] });
    const { bodies, ball } = point.state;
    assert.ok(Math.abs(bodies[0][BY] - 0.3) < 1e-9);
    assert.ok(Math.abs(ball[Y] - 0.3) < 1e-9);
    assert.ok(Math.abs(bodies[1][BY] - receiverY(0.3, CLUB_PLAYER)) < 1e-9);
  });

  it("shows it on the first picture, for both players", () => {
    const point = serving();
    clickPoint(point, { moveTo: [-1.9, 0.4] });
    const { bodies } = point.recorder.recording;
    assert.deepEqual([bodies[0], bodies[1], bodies[3]], [-1.9, 0.4, receiverY(0.4, CLUB_PLAYER)]);
  });

  it("stays behind its line, the ball in reach", () => {
    const point = serving();
    clickPoint(point, { moveTo: [-0.5, 2] });
    const [x, y] = point.state.bodies[0];
    assert.ok(x < -TABLE.halfLength, `${x}`);
    assert.equal(y, MOST_FROM);
    clickPoint(point, { moveTo: [-3, 0] });
    assert.ok(point.state.bodies[0][0] >= -TABLE.halfLength - CLUB_PLAYER.reach - 1e-9);
  });

  it("plays again from its orders", () => {
    const orders = [{ tick: 0, moveBy: [0, 0.05] }, { tick: 0, moveTo: [-1.9, 0.4] }, { tick: 0, aimAt: [0.9, -0.4] }];
    const point = serving();
    orders.forEach((order) => clickPoint(point, order));
    const again = replayPoint({ seed: 2, server: 0, scatter: 1, orders });
    assert.ok(again.state.result);
    assert.equal(point.state.bodies[0][BY], 0.4);
  });
});

describe("a robot serving", () => {
  it("draws where it leaves from, with its seed", () => {
    const froms = Array.from({ length: 200 }, (_, seed) => serviceOf(seed).serviceFrom);
    assert.ok(froms.every((from) => Math.abs(from) <= MOST_FROM));
    assert.ok(new Set(froms).size > 100);
    assert.equal(serviceOf(7).serviceFrom, serviceOf(7).serviceFrom);
  });

  it("picks where it leaves from when it picks its service", () => {
    const froms = new Set();
    for (let seed = 0; seed < 8; seed += 1) {
      const { from } = bestService({ seed, server: 0, profile: CLUB_PLAYER }, { model: RULES.R3, draws: 4, horizon: 2 });
      froms.add(from);
    }
    assert.ok([...froms].every((from) => [-0.5, 0, 0.5].includes(from)));
  });
});
