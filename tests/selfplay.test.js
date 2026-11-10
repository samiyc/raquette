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
import { phaseNumbers } from "../src/rules/phases.js";
import { SERVE_KEYS, SERVE_NUMBERS, servicePicker } from "../src/rules/serving.js";
import { TUNED } from "../src/rules/tuned.js";
import { bestOfScreen, isKept, isKeptWithSparring, mutateNumbers, NUMBER_RANGES } from "../src/selfplay.js";

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
      const full = { ...R3_NUMBERS, ...SERVE_NUMBERS, ...numbers }; // What a kept rule does not name, it leaves as R3 has it.
      const all = { ...full, ...phaseNumbers(full), ...numbers };
      for (const [key, [low, high]] of Object.entries(NUMBER_RANGES)) {
        const value = all[key];
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
    let numbers = { ...R3_NUMBERS, ...SERVE_NUMBERS, ...phaseNumbers(R3_NUMBERS) };
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

  it("has a range for every number of the rule, of its service and of its phases, and R3 starts inside them", () => {
    const start = { ...R3_NUMBERS, ...SERVE_NUMBERS, ...phaseNumbers(R3_NUMBERS) };
    assert.deepEqual(Object.keys(NUMBER_RANGES).sort(), Object.keys(start).sort());
    for (const [key, [low, high]] of Object.entries(NUMBER_RANGES)) assert.ok(start[key] >= low && start[key] <= high, key);
  });

  it("moves only the numbers it is told to", () => {
    const rng = createRng(9);
    const numbers = { ...R3_NUMBERS, ...SERVE_NUMBERS };
    for (let i = 0; i < 100; i += 1) {
      const child = mutateNumbers(numbers, rng, /^serve/);
      assert.ok(Object.keys(child).every((key) => key.startsWith("serve") || child[key] === numbers[key]));
    }
  });

  it("moves no number of the service in a rule that has none", () => {
    const rng = createRng(7);
    for (let i = 0; i < 200; i += 1) assert.ok(SERVE_KEYS.every((key) => !(key in mutateNumbers(R3_NUMBERS, rng))));
  });
});

describe("what is kept", () => {

  it("beats its version by more than chance, and that is all it has to do", () => {
    assert.equal(isKept({ gap: { low: 0.01 } }), true);
    assert.equal(isKept({ gap: { low: -0.01 } }), false);
    assert.equal(isKept({ gap: { low: 0 } }), false);
  });

  it("with a sparring partner, adds what the variant gains against it to what it gains against its version", () => {
    const even = { gap: { mean: 0.05, low: -0.05, high: 0.15 } };
    assert.equal(isKeptWithSparring(even, { mean: 0.1, low: 0, high: 0.2 }), true, "0.15 against a margin of 0.14");
    assert.equal(isKeptWithSparring(even, { mean: -0.1, low: -0.2, high: 0 }), false, "what it loses to the sparring partner counts");
    const strong = { gap: { mean: 0.2, low: 0.1, high: 0.3 } };
    assert.equal(isKept(strong), true);
    assert.equal(isKeptWithSparring(strong, { mean: -0.15, low: -0.25, high: -0.05 }), false, "beating its version is no longer enough");
  });

  it("a screen keeps the best, and never a variant that does not win it", () => {
    const reports = [{ part: 0.49 }, { part: 0.56 }, { part: 0.52 }, { part: 0.5 }];
    assert.deepEqual(bestOfScreen(["a", "b", "c", "d"], reports, 2).map(({ numbers }) => numbers), ["b", "c"]);
    assert.deepEqual(bestOfScreen(["a"], [{ part: 0.49 }], 2), []);
  });
});

describe("a rule that picks its service", () => {
  it("draws each kind in proportion to its weight, the same for the same seed, and none at weight 0", () => {
    const pick = servicePicker({ ...SERVE_NUMBERS, servePendule: 0, serveLateral: 0, serveMou: 3 });
    const counts = {};
    for (let seed = 0; seed < 2000; seed += 1) {
      const { key, y, from } = pick({ seed, server: seed % 2 });
      counts[key] = (counts[key] ?? 0) + 1;
      assert.equal(y, 0);
      assert.equal(from, 0);
    }
    assert.equal(counts.pendule, undefined);
    assert.equal(counts.lateral, undefined);
    assert.ok(counts.mou > 2.2 * counts.coupe && counts.mou < 3.8 * counts.coupe, JSON.stringify(counts));
    assert.deepEqual(pick({ seed: 5, server: 1 }), pick({ seed: 5, server: 1 }));
  });

  it("is only given to a rule with the numbers of its service, and a rally with a choice asks it", () => {
    assert.equal(createTunable(TUNED.H, "H").chooseService, undefined);
    const rule = createTunable({ ...TUNED.H, ...SERVE_NUMBERS, servePendule: 0, serveMarteau: 0, serveMou: 0, serveBombe: 0, serveLateral: 0 }, "Hs");
    const asked = [];
    const asking = { ...rule, chooseService: (rally) => asked.push(rule.chooseService(rally).key) && rule.chooseService(rally) };
    const players = [{ rule: asking, profile: CLUB_PLAYER }, { rule: asking, profile: CLUB_PLAYER }];
    for (let seed = 0; seed < 5; seed += 1) playRally({ seed, players, server: seed % 2, choosing: true });
    assert.deepEqual(asked, ["coupe", "coupe", "coupe", "coupe", "coupe"]);
  });
});
