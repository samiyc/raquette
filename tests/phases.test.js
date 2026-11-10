import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { CLUB_PLAYER } from "../src/player.js";
import { playRally } from "../src/rally.js";
import { numbersOf, PHASE_KEYS, phaseKey, phaseNumbers } from "../src/rules/phases.js";
import { createTunable, R3_NUMBERS } from "../src/rules/tunable.js";
import { TUNED } from "../src/rules/tuned.js";
import { NUMBER_RANGES } from "../src/selfplay.js";

const H = { ...R3_NUMBERS, ...TUNED.H };
const rallies = (rule, seeds = 30) => {
  const players = [{ rule, profile: CLUB_PLAYER }, { rule: createTunable(TUNED.H, "H"), profile: CLUB_PLAYER }];
  return Array.from({ length: seeds }, (_, seed) => playRally({ seed, players, server: seed % 2 }));
};

describe("strokes of their own for the return and the third ball", () => {
  it("copies the rule's own numbers, and has a range for each", () => {
    const phased = phaseNumbers(H);
    assert.equal(phased.thirdTopSpeed, H.topSpeed);
    assert.equal(phased.returnHighBall, H.highBall);
    assert.equal(Object.keys(phased).length, 2 * PHASE_KEYS.length);
    for (const key of Object.keys(phased)) assert.ok(NUMBER_RANGES[key], key);
    assert.equal(numbersOf(H, "third"), null);
    assert.equal(numbersOf({ ...H, ...phased, thirdWide: 0.1 }, "third").wide, 0.1);
  });

  it("leaves the rule as it was until they move, rally for rally", () => {
    assert.deepEqual(rallies(createTunable({ ...H, ...phaseNumbers(H) }, "H")), rallies(createTunable(H, "H")));
  });

  it("plays the return with its own numbers: a return that attacks less", () => {
    const tops = (numbers) => {
      const rule = createTunable(numbers, "H");
      const players = [{ rule, profile: CLUB_PLAYER }, { rule, profile: CLUB_PLAYER }];
      const counts = [0, 0]; // Tops on the return, on the third ball.
      const listener = { impact: ({ plan }, state) => state.strokes < 2 && plan.swing.brushUp === H.topBrush && (counts[state.strokes] += 1) };
      for (let seed = 0; seed < 40; seed += 1) playRally({ seed, players, server: seed % 2, listener });
      return counts;
    };
    const [mine, theirs] = [tops({ ...H, ...phaseNumbers(H), [phaseKey("return", "highBall")]: 0.5 }), tops(H)];
    assert.ok(theirs[0] > 0 && mine[0] < theirs[0] / 2, `${mine} ${theirs}`);
  });
});
