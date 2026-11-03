import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { CLUB_PLAYER } from "../src/player.js";
import { playPairs } from "../src/pairs.js";
import { playRally } from "../src/rally.js";
import { recordRally } from "../src/rally-recording.js";
import { rollout, setUpRollout } from "../src/rollout.js";
import { RULES } from "../src/rules/ladder.js";
import { createSearch } from "../src/rules/search.js";

const both = (rule) => [{ rule, profile: CLUB_PLAYER }, { rule, profile: CLUB_PLAYER }];
const search = (budget = 6) => createSearch({ budget, draws: 2, horizon: 3 });

/** A rule that looks at the rollouts of what the model would do, then does it. */
function probing(onView) {
  return { name: "probe", decide(view) {
    const intent = RULES.R3.decide(view);
    if (intent) onView(view, intent);
    return intent;
  } };
}

describe("a rollout", () => {
  it("leaves the real rally as it is", () => {
    const seen = [];
    const rule = probing((view, intent) => {
      const { state } = view;
      const before = [state.ball.slice(), state.bodies[0].slice(), state.strokes, state.tick, state.seed];
      const setup = setUpRollout(state, { who: view.who, step: intent.step, goal: intent.goal, next: intent.next }, RULES.R3);
      rollout(setup, { stroke: intent, seed: 11, horizon: 3 });
      seen.push(1);
      assert.deepEqual([...state.ball], [...before[0]]);
      assert.deepEqual([...state.bodies[0]], [...before[1]]);
      assert.deepEqual([state.strokes, state.tick, state.seed], before.slice(2));
    });
    const witness = playRally({ seed: 2, players: both(RULES.R3), server: 0 });
    const result = playRally({ seed: 2, players: both(rule), server: 0 });
    assert.ok(seen.length > 0);
    assert.deepEqual(result, witness);
  });

  it("says 1, 0 or one half, and replays the same from the same seed", () => {
    const values = new Set();
    const rule = probing((view, intent) => {
      const setup = setUpRollout(view.state, { who: view.who, step: intent.step, goal: intent.goal, next: intent.next }, RULES.R3);
      const one = rollout(setup, { stroke: intent, seed: 5, horizon: 4 });
      assert.equal(rollout(setup, { stroke: intent, seed: 5, horizon: 4 }), one);
      values.add(one);
    });
    for (let seed = 0; seed < 20; seed += 1) playRally({ seed, players: both(rule), server: seed % 2 });
    for (const value of values) assert.ok([0, 0.5, 1].includes(value), `${value}`);
    assert.ok(values.size >= 2, [...values].join());
  });

  it("a stroke into the net is worth nothing", () => {
    const rule = probing((view, intent) => {
      const setup = setUpRollout(view.state, { who: view.who, step: intent.step, goal: intent.goal, next: intent.next }, RULES.R3);
      const intoNet = { target: [-view.side * 0.1, 0], swing: { speed: 25, brushUp: -14, brushSide: 0 } };
      const worth = [1, 2, 3, 4].map((seed) => rollout(setup, { stroke: intoNet, seed, horizon: 4 }));
      assert.ok(worth.reduce((sum, value) => sum + value, 0) <= 2, worth.join());
    });
    playRally({ seed: 1, players: both(rule), server: 0 });
  });
});

describe("the search", () => {
  it("plays a whole rally, and the same again from the same seed", () => {
    const players = [{ rule: search(), profile: CLUB_PLAYER }, { rule: RULES.R3, profile: CLUB_PLAYER }];
    const one = recordRally({ seed: 3, players, server: 0 });
    const other = recordRally({ seed: 3, players, server: 0 });
    assert.deepEqual(one.result, other.result);
    assert.deepEqual([...one.frames], [...other.frames]);
    assert.ok(["net", "out", "twoBounces", "notReached", "behind", "limit"].includes(one.result.cause));
  });

  it("A/A: the search on both sides gives the mirror rally, number for number", () => {
    const players = both(search());
    for (const seed of [1, 2, 3]) {
      const one = playRally({ seed, players, server: 0 });
      const other = playRally({ seed, players, server: 1 });
      assert.equal(one.ticks, other.ticks);
      assert.equal(one.cause, other.cause);
    }
  });

  it("does not read the world's scatter: its choice stays the same whatever the rally's seed", () => {
    const targets = [11, 12].map((seed) => {
      let first = null;
      const rule = search();
      const spy = { name: "spy", decide(view) {
        const intent = rule.decide(view);
        first ??= intent && intent.target.slice();
        return intent;
      } };
      playRally({ seed, players: [{ rule: RULES.R3, profile: CLUB_PLAYER }, { rule: spy, profile: CLUB_PLAYER }], server: 0 });
      return first;
    });
    assert.deepEqual(targets[0], targets[1]);
  });

  it("is measured like any rule, by pairs", () => {
    const { gap, strokes } = playPairs({ a: search(4), b: RULES.R3, profile: CLUB_PLAYER, seeds: 4 });
    assert.equal(gap.n, 4);
    assert.ok(strokes > 0);
  });

  it("flat, it still plays: the witness", () => {
    const flat = createSearch({ budget: 6, draws: 2, horizon: 3, freshEvery: 1, name: "MC" });
    const result = playRally({ seed: 2, players: [{ rule: flat, profile: CLUB_PLAYER }, { rule: RULES.R3, profile: CLUB_PLAYER }], server: 0 });
    assert.ok(result.ticks > 0);
  });
});
