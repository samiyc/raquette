import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { CLUB_PLAYER } from "../src/player.js";
import { playRally } from "../src/rally.js";
import { TABLE_BOUNCE } from "../src/ball/table.js";
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

describe("answers to a service with depth and spin (Sami, 16/11/2026)", () => {
  const I = { ...R3_NUMBERS, ...TUNED.I };
  /** The return's swings against I's services, and where each first comes down past the net. */
  const returns = (numbers, seeds = 60) => {
    const players = [{ rule: createTunable(TUNED.I, "I"), profile: CLUB_PLAYER }, { rule: createTunable(numbers, "x"), profile: CLUB_PLAYER }];
    const found = [];
    for (let seed = 0; seed < seeds; seed += 1) {
      let swing = null;
      let landed = null;
      const listener = {
        impact: ({ plan }, state) => state.strokes === 0 && (swing = plan.swing),
        flight: (kind, state) => state.strokes === 1 && kind === TABLE_BOUNCE && landed === null && (landed = Math.abs(state.ball[0])),
      };
      playRally({ seed, players, server: 0, choosing: true, listener });
      if (swing) found.push({ swing, landed });
    }
    return found;
  };

  it("pushes instead of attacking a ball over the table, at flipShare 0", () => {
    const tops = (list) => list.filter(({ swing }) => swing.brushUp === I.topBrush).length;
    const [mine, theirs] = [returns({ ...I, returnFlipShare: 0 }), returns(I)];
    assert.ok(tops(theirs) > 20 && tops(mine) < tops(theirs) / 3, `${tops(mine)} ${tops(theirs)}`);
  });

  it("sends a part of its pushes short, when they land", () => {
    const list = returns({ ...I, returnFlipShare: 0, returnShortShare: 1, shortSpeed: 2, shortBrush: -1.5, returnShortDepth: 0.45 });
    const short = list.filter(({ swing }) => swing.brushUp === -1.5);
    assert.ok(short.length > 5, `${short.length}`);
    for (const { landed } of short) if (landed !== null) assert.ok(landed < 0.9, `${landed}`);
  });
});
