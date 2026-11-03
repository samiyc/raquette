import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { CLUB_PLAYER } from "../src/player.js";
import { startRally, stepRally } from "../src/rally.js";
import { aboutToDecide, createRemoteRule, decideOn, snapshotOf } from "../src/remote.js";
import { RULES } from "../src/rules/ladder.js";
import { createSearch } from "../src/rules/search.js";
import { clickPoint, createPoint, needsAnswer, pointOver, replayPoint, stepPoint, pictureFor, giveAnswer, PAGE_BUDGET } from "../src/game.js";
import { namedRule } from "../src/rules/named.js";

const search = () => createSearch({ budget: 4, draws: 2, horizon: 2 });

/** A rally of `first` against a search answering from pictures, as a worker would. */
function played(seed, remote) {
  const rule = remote ? createRemoteRule(search()) : search();
  const state = startRally({ seed, players: [{ rule: RULES.R3, profile: CLUB_PLAYER }, { rule, profile: CLUB_PLAYER }], server: seed % 2 });
  const away = search();
  let asked = 0;
  while (!state.result) {
    if (remote && aboutToDecide(state, 1)) {
      const picture = JSON.parse(JSON.stringify(snapshotOf(state), (_, value) => (ArrayBuffer.isView(value) ? Array.from(value) : value)));
      rule.give(state.tick, decideOn(picture, 1, away));
      asked += 1;
    }
    stepRally(state);
  }
  return { result: state.result, ball: [...state.ball], asked };
}

describe("a rule that thinks elsewhere", () => {
  it("plays the same rally, to the number, as the rule at home", () => {
    for (const seed of [1, 2, 3, 4]) {
      const [home, away] = [played(seed, false), played(seed, true)];
      assert.deepEqual(away.result, home.result);
      assert.deepEqual(away.ball, home.ball);
      assert.ok(away.asked >= 1);
    }
  });

  it("thinks by itself when no answer is there, and an old answer does not count", () => {
    const seen = [];
    const rule = createRemoteRule({ name: "r", decide: (view) => {
      seen.push(view.tick);
      return null;
    } });
    assert.equal(rule.decide({ tick: 5 }), null);
    rule.give(6, "réponse");
    assert.equal(rule.decide({ tick: 6 }), "réponse");
    rule.give(6, "vieille");
    assert.equal(rule.decide({ tick: 9 }), null);
    assert.deepEqual(seen, [5, 9]);
  });
});

describe("a point at the mouse against a search", () => {
  function playedAgainst(remote) {
    const point = createPoint({ seed: 4, server: 1, scatter: 1, robot: "S" });
    const away = namedRule("S", PAGE_BUDGET);
    while (!pointOver(point)) {
      if (point.state.tick === 30) clickPoint(point, { moveTo: [-2, 0.3] });
      if (remote && needsAnswer(point)) giveAnswer(point, decideOn(pictureFor(point), 1, away));
      stepPoint(point);
    }
    return point;
  }

  it("is the same with a worker, without one, and in its replay", () => {
    const [home, away] = [playedAgainst(false), playedAgainst(true)];
    assert.deepEqual(away.state.result, home.state.result);
    const again = replayPoint({ seed: 4, server: 1, scatter: 1, robot: "S", orders: away.orders });
    assert.deepEqual(again.state.result, away.state.result);
  });

  it("asks nothing of a robot that thinks at once", () => {
    const point = createPoint({ seed: 4, server: 1, scatter: 1, robot: "R3" });
    while (!pointOver(point)) {
      assert.equal(needsAnswer(point), false);
      stepPoint(point);
    }
  });
});
