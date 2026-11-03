import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { BALL_SIZE, VX, WZ } from "../src/ball/constants.js";
import { recordFlight } from "../src/recording.js";
import { clickPoint, createPoint, pointOver, replayPoint, stepPoint } from "../src/game.js";
import { CLUB_PLAYER } from "../src/player.js";
import { playRally } from "../src/rally.js";
import { recordRally } from "../src/rally-recording.js";
import { RULES } from "../src/rules/ladder.js";
import { createSearch } from "../src/rules/search.js";
import { serviceBall, serviceOf, SERVICE_KINDS } from "../src/services.js";
import { STROKE_KINDS } from "../src/strokes.js";

const both = (rule) => [{ rule, profile: CLUB_PLAYER }, { rule, profile: CLUB_PLAYER }];
const flightOf = (key, seed = 1, y = 0) => recordFlight(serviceBall(-1, SERVICE_KINDS[key], { seed, y }));

describe("the five services (Sami)", () => {
  it("are the ones he asked for", () => {
    assert.deepEqual(Object.values(SERVICE_KINDS).map((kind) => kind.label), ["Pendule", "Marteau", "Mou", "Bombe", "Latéral"]);
  });

  for (const key of Object.keys(SERVICE_KINDS)) {
    it(`${key} bounces on the server's side, then on the other, most of the time`, () => {
      const good = Array.from({ length: 200 }, (_, seed) => flightOf(key, seed).events).filter(([first, second]) =>
        first?.kind === "table" && first.x < 0 && second?.kind === "table" && second.x > 0 && second.x <= 1.37);
      assert.ok(good.length >= 160, `${good.length} sur 200`);
    });
  }

  it("the short one bounces twice, the bomb is the fastest and the deepest", () => {
    const mou = flightOf("mou").events;
    assert.deepEqual([mou[1].kind, mou[2].kind], ["table", "table"]);
    assert.ok(mou[2].x > 0 && mou[2].x < 1.37, JSON.stringify(mou[2]));
    const paces = Object.keys(SERVICE_KINDS).map((key) => Math.abs(flightOf(key).frames[VX]));
    assert.equal(Math.max(...paces), paces[3]);
    assert.ok(flightOf("bombe").frames[VX] > 9);
  });

  it("the pendulum and the hammer turn opposite ways, and curve opposite ways", () => {
    assert.ok(SERVICE_KINDS.pendule.turn * SERVICE_KINDS.marteau.turn < 0);
    const start = (key) => serviceBall(-1, { ...SERVICE_KINDS[key] }, { seed: 7 });
    assert.ok(start("pendule")[WZ] > 0 && start("marteau")[WZ] < 0);
  });

  it("goes where it is sent across the table, its curve allowed for", () => {
    for (const key of ["pendule", "marteau", "lateral", "bombe"]) {
      const mean = (y) => {
        const landed = Array.from({ length: 30 }, (_, seed) => flightOf(key, seed, y).events[1]).filter((touch) => touch?.kind === "table");
        return landed.reduce((sum, touch) => sum + touch.y, 0) / landed.length;
      };
      assert.ok(Math.abs(mean(0.4) - 0.4) < 0.1, `${key} : ${mean(0.4)}`);
      assert.ok(Math.abs(mean(-0.4) + 0.4) < 0.1, `${key} : ${mean(-0.4)}`);
    }
  });

  it("two servers facing each other do mirror images, number for number", () => {
    for (const key of Object.keys(SERVICE_KINDS)) {
      const [one, other] = [serviceBall(-1, SERVICE_KINDS[key], { seed: 4, y: 0.3 }), serviceBall(1, SERVICE_KINDS[key], { seed: 4, y: 0.3 })];
      for (let i = 0; i < BALL_SIZE; i += 1) assert.equal(Math.abs(one[i]), Math.abs(other[i]));
      assert.equal(one[2], other[2]);
      assert.equal(one[VX], -other[VX]);
      assert.equal(one[WZ], other[WZ]);
    }
  });
});

describe("a rally from a service", () => {
  it("plays out, by a rule or a search, the same from the same seed", () => {
    for (const key of Object.keys(SERVICE_KINDS)) {
      const options = { seed: 3, players: both(RULES.R3), server: 0, ...serviceOf(3, key) };
      assert.deepEqual(playRally(options), playRally(options));
    }
    const search = createSearch({ budget: 3, draws: 2, horizon: 2 });
    const result = playRally({ seed: 5, players: [{ rule: search, profile: CLUB_PLAYER }, { rule: RULES.R3, profile: CLUB_PLAYER }], server: 1, ...serviceOf(5) });
    assert.ok(result.ticks > 0);
  });

  it("the mix goes through all five, and stays the same for a seed", () => {
    const labels = new Set(Array.from({ length: 60 }, (_, seed) => serviceOf(seed).service.label));
    assert.equal(labels.size, 5);
    assert.deepEqual(serviceOf(9), serviceOf(9));
  });

  it("a robot returns each of them, more often than not", () => {
    for (const key of Object.keys(SERVICE_KINDS)) {
      const returned = Array.from({ length: 40 }, (_, seed) => recordRally({ seed, players: both(RULES.R3), server: 0, ...serviceOf(seed, key) })).filter((rally) => rally.result.strokes >= 1);
      assert.ok(returned.length >= 20, `${key} : ${returned.length}`);
    }
  });
});

describe("a service at the mouse", () => {
  it("is picked before the point, and sets off anew", () => {
    const point = createPoint({ seed: 2, server: 0, scatter: 1 });
    assert.equal(point.rule.service, "pendule");
    const before = point.state.ball[VX];
    assert.equal(clickPoint(point, { service: "bombe" }), true);
    assert.ok(point.state.ball[VX] > before + 2);
    assert.equal(point.recorder.recording.frames[VX], point.state.ball[VX]);
  });

  it("goes where the right button says, before the point", () => {
    const point = createPoint({ seed: 2, server: 0, scatter: 0 });
    clickPoint(point, { aimAt: [0.8, 0.45] });
    const { events } = recordFlight(point.state.ball);
    assert.ok(Math.abs(events[1].y - 0.45) < 0.15, JSON.stringify(events[1]));
  });

  it("cannot be changed once the point has started, nor by the receiver", () => {
    const point = createPoint({ seed: 2, server: 0, scatter: 1 });
    stepPoint(point);
    assert.equal(clickPoint(point, { service: "bombe" }), false);
    const receiving = createPoint({ seed: 2, server: 1, scatter: 1 });
    assert.equal(clickPoint(receiving, { service: "bombe" }), false);
  });

  it("is replayed, and the robot's own service comes from the seed", () => {
    const point = createPoint({ seed: 3, server: 0, scatter: 1 });
    clickPoint(point, { service: "marteau" });
    clickPoint(point, { aimAt: [0.9, -0.3] });
    while (!pointOver(point)) stepPoint(point);
    const again = replayPoint({ seed: 3, server: 0, scatter: 1, orders: point.orders });
    assert.deepEqual(again.state.result, point.state.result);
    const [one, other] = [createPoint({ seed: 8, server: 1, scatter: 1 }), createPoint({ seed: 8, server: 1, scatter: 1 })];
    assert.deepEqual([...one.state.ball], [...other.state.ball]);
  });
});

describe("the sidespin", () => {
  it("is a stroke of the mouse: the ball leaves turning about the vertical, towards the side aimed at", () => {
    const turnOf = (y) => {
      const point = createPoint({ seed: 3, server: 1, scatter: 0 });
      clickPoint(point, { aimAt: [0.8, y] });
      clickPoint(point, { stroke: "side" });
      while (!pointOver(point) && point.state.strokes < 1) stepPoint(point);
      return point.state.ball[WZ];
    };
    assert.ok(STROKE_KINDS.side);
    assert.ok(Math.abs(turnOf(0.4)) > 50, `${turnOf(0.4)}`);
    assert.ok(turnOf(0.4) * turnOf(-0.4) < 0);
  });

  it("is in the search's hands: it plays strokes with it", () => {
    const search = createSearch({ budget: 12, draws: 2, horizon: 2 });
    const sides = [];
    const spy = { name: "spy", decide(view) {
      const intent = search.decide(view);
      if (intent) sides.push(intent.swing.brushSide);
      return intent;
    } };
    for (let seed = 0; seed < 12; seed += 1) playRally({ seed, players: [{ rule: spy, profile: CLUB_PLAYER }, { rule: RULES.R3, profile: CLUB_PLAYER }], server: seed % 2 });
    assert.ok(sides.some((brush) => brush !== 0), sides.join());
  });
});
