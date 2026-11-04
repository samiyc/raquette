import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { createRng } from "mcts-commun/random.js";
import { playOnThreads } from "../scripts/lib/pairs-pool.js";
import { playPairs } from "../src/pairs.js";
import { CLUB_PLAYER } from "../src/player.js";
import { playRally } from "../src/rally.js";
import { RULES } from "../src/rules/ladder.js";
import { namedRule } from "../src/rules/named.js";
import { createTunable, R3_NUMBERS } from "../src/rules/tunable.js";
import { TUNED } from "../src/rules/tuned.js";
import { bestOfScreen, isKept, mutateNumbers, NUMBER_RANGES } from "../src/selfplay.js";

describe("the rule with its numbers in the open", () => {
  it("is R3 with R3's numbers, rally for rally", () => {
    const tunable = createTunable(R3_NUMBERS, "copie");
    for (let seed = 0; seed < 30; seed += 1) {
      const one = playRally({ seed, players: [{ rule: tunable, profile: CLUB_PLAYER }, { rule: RULES.R0, profile: CLUB_PLAYER }], server: seed % 2 });
      const other = playRally({ seed, players: [{ rule: RULES.R3, profile: CLUB_PLAYER }, { rule: RULES.R0, profile: CLUB_PLAYER }], server: seed % 2 });
      assert.deepEqual(one, other);
    }
  });

  it("plays differently with other numbers", () => {
    const soft = createTunable({ ...R3_NUMBERS, topSpeed: 5, topBrush: 2, flatSpeed: 3 }, "doux");
    const report = playPairs({ a: soft, b: RULES.R3, profile: CLUB_PLAYER, seeds: 20 });
    assert.ok(report.strokes !== playPairs({ a: RULES.R3, b: RULES.R3, profile: CLUB_PLAYER, seeds: 20 }).strokes);
  });

  it("keeps what self-play found inside the ranges it searched, and by name", () => {
    for (const [name, numbers] of Object.entries(TUNED)) {
      assert.equal(namedRule(name).name, name);
      for (const [key, [low, high]] of Object.entries(NUMBER_RANGES)) {
        const value = numbers[key] ?? R3_NUMBERS[key]; // What a kept rule does not name, it leaves as R3 has it.
        assert.ok(value >= low && value <= high, `${name} ${key}`);
      }
    }
  });

  it("lets a search take its opponent for a kept rule, which plays differently", () => {
    const players = (rule) => [{ rule, profile: CLUB_PLAYER }, { rule: RULES.R0, profile: CLUB_PLAYER }];
    const rally = (name) => playRally({ seed: 5, server: 1, players: players(namedRule(name, 8)) });
    assert.notDeepEqual(rally("S-mT"), rally("S"));
  });

  it("goes by name from a catalog, also on threads", async () => {
    assert.equal(namedRule("x", 4, { x: R3_NUMBERS }).name, "x");
    const match = { names: ["a", "R0"], budget: 4, from: 0, seeds: 6, replays: false, catalog: { a: R3_NUMBERS } };
    const { report } = await playOnThreads(match, 2);
    const direct = playPairs({ a: createTunable(R3_NUMBERS, "a"), b: RULES.R0, profile: CLUB_PLAYER, seeds: 6 });
    assert.deepEqual(report, direct);
  });
});

describe("a mutation", () => {
  it("moves a few numbers, within their bounds, and leaves the parent alone", () => {
    const rng = createRng(4);
    let numbers = { ...R3_NUMBERS };
    for (let i = 0; i < 400; i += 1) {
      const parent = { ...numbers };
      const child = mutateNumbers(numbers, rng);
      assert.deepEqual(numbers, parent);
      const moved = Object.keys(child).filter((key) => child[key] !== numbers[key]);
      assert.ok(moved.length <= 3);
      for (const [key, [low, high]] of Object.entries(NUMBER_RANGES)) assert.ok(child[key] >= low && child[key] <= high, key);
      numbers = child;
    }
  });

  it("has a range for every number of the rule, and R3 starts inside them", () => {
    assert.deepEqual(Object.keys(NUMBER_RANGES).sort(), Object.keys(R3_NUMBERS).sort());
    for (const [key, [low, high]] of Object.entries(NUMBER_RANGES)) assert.ok(R3_NUMBERS[key] >= low && R3_NUMBERS[key] <= high, key);
  });
});

describe("what is kept", () => {
  const panel = (...parts) => parts.map((part) => ({ part }));

  it("beats its version by more than chance, and loses to no one in the panel", () => {
    assert.equal(isKept({ gap: { low: 0.01 } }, panel(0.55, 0.5, 0.6)), true);
    assert.equal(isKept({ gap: { low: -0.01 } }, panel(0.55, 0.55, 0.6)), false);
    assert.equal(isKept({ gap: { low: 0.2 } }, panel(0.55, 0.49, 0.6)), false);
  });

  it("a screen keeps the best, and never a variant that does not win it", () => {
    const reports = [{ part: 0.49 }, { part: 0.56 }, { part: 0.52 }, { part: 0.5 }];
    assert.deepEqual(bestOfScreen(["a", "b", "c", "d"], reports, 2).map(({ numbers }) => numbers), ["b", "c"]);
    assert.deepEqual(bestOfScreen(["a"], [{ part: 0.49 }], 2), []);
  });
});
