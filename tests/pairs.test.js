import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { CLUB_PLAYER, BY } from "../src/player.js";
import { mergePairs, playPairs, playSeeds } from "../src/pairs.js";
import { batchesOf, playOnThreads } from "../scripts/lib/pairs-pool.js";
import { playRally } from "../src/rally.js";
import { R0, takeToCentre } from "../src/rules/center.js";
import { farSide, RULES } from "../src/rules/ladder.js";

const SEEDS = 150;
const pairs = (a, b, seeds = SEEDS, profile = CLUB_PLAYER) => playPairs({ a, b, profile, seeds });

describe("two rules by pairs", () => {
  it("A/A: the same rule on both sides gives a gap of exactly 0, seed by seed", () => {
    const { gap, part } = pairs(RULES.R1, RULES.R1, 40);
    assert.equal(gap.mean, 0);
    assert.equal(gap.ties, 40);
    assert.equal(part, 0.5);
  });

  it("gives A's and B's parts as complements when the rules swap", () => {
    const one = pairs(RULES.R3, RULES.R0, 30);
    const other = pairs(RULES.R0, RULES.R3, 30);
    assert.ok(Math.abs(one.part + other.part - 1) < 1e-9, `${one.part} / ${other.part}`);
  });

  it("counts a rally at its limit half a point each, and apart", () => {
    const soft = { name: "soft", decide: (view) => {
      const stroke = takeToCentre(view);
      return stroke && { ...stroke, swing: { speed: 5, brushUp: 0, brushSide: 0 } };
    } };
    const steady = { ...CLUB_PLAYER, scatterTilt: 0, scatterAcross: 0, scatterSpeed: 0 };
    const report = pairs(soft, soft, 3, steady);
    assert.equal(report.limits, 1);
    assert.equal(report.part, 0.5);
    assert.deepEqual(report.lostByA, {});
  });
});

describe("seeds played in batches", () => {
  it("give the same report as all at once, whoever played them", () => {
    const match = { a: RULES.R1, b: RULES.R0, profile: CLUB_PLAYER };
    const whole = pairs(RULES.R1, RULES.R0, 12);
    const batches = batchesOf(0, 12, 5);
    assert.deepEqual(batches.map((batch) => batch.seeds), [5, 5, 2]);
    assert.deepEqual(batches.map((batch) => batch.from), [0, 5, 10]);
    const merged = mergePairs(batches.map(({ from, seeds }) => playSeeds({ ...match, from, seeds })));
    assert.deepEqual(merged, whole);
  });

  it("give the same report on several threads", async () => {
    const whole = pairs(RULES.R1, RULES.R0, 12);
    const { report } = await playOnThreads({ names: ["R1", "R0"], budget: 4, from: 0, seeds: 12, replays: false }, 2);
    assert.deepEqual(report, whole);
  });
});

describe("the guard of docs/modele.md, § 6", () => {
  it("the model does not punish placement: on few seeds R1 holds its own against R0; the measure is made in the queue", () => {
    const { part, lostByB } = pairs(RULES.R1, RULES.R0);
    assert.ok(part >= 0.47, `${part}`);
    assert.ok(Object.keys(lostByB).length > 0);
  });

  it("the attack pays, and pays more placed: R3 takes more than half of the points from R0", () => {
    assert.ok(pairs(RULES.R3, RULES.R0).part > 0.5);
  });
});

describe("the far side", () => {
  const view = (side, y) => ({ side, opponent: Float64Array.of(-side * 1.87, y) });

  it("is opposite the opponent, in the other camp, mirrored between the players", () => {
    assert.deepEqual(farSide(view(1, 0.3)), [-0.685, -0.5]);
    assert.deepEqual(farSide(view(-1, -0.3)), [0.685, 0.5]);
    assert.ok(BY === 1);
  });

  it("is defined when the opponent stands in the middle", () => {
    assert.deepEqual(farSide(view(1, 0)), [-0.685, 0.5]);
    assert.deepEqual(farSide(view(-1, 0)), [0.685, -0.5]);
  });
});

describe("the end of the arm", () => {
  /** A stand that leaves the ball at the very end of the arm, or nearly at the body. */
  const standing = (away) => ({ name: "stands", decide: (view) => {
    const stroke = takeToCentre(view);
    return stroke && { ...stroke, goal: [view.body[0], away] };
  } });

  it("scatters a stroke more than one played near the body", () => {
    const profile = { ...CLUB_PLAYER, stretchedScatter: 5 };
    const ending = (rule, seed) => {
      let state;
      let vy = null;
      const listener = {
        tick(current) { state = current; },
        stroke(who) { if (who === 1 && vy === null) vy = state.ball[4]; },
      };
      playRally({ seed, players: [{ rule: R0, profile }, { rule, profile }], server: 0, listener });
      return vy;
    };
    const spread = (away) => {
      const all = Array.from({ length: 40 }, (_, seed) => ending(standing(away), seed)).filter((vy) => vy !== null);
      const mean = all.reduce((sum, vy) => sum + vy, 0) / all.length;
      return Math.sqrt(all.reduce((sum, vy) => sum + (vy - mean) * (vy - mean), 0) / all.length);
    };
    assert.ok(spread(0.6) > spread(0) * 1.3, `${spread(0.6)} / ${spread(0)}`);
  });
});
