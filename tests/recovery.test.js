import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { GOAL_Y, BY, CLUB_PLAYER } from "../src/player.js";
import { createMouseRule } from "../src/mouse.js";
import { playRally, startRally } from "../src/rally.js";
import { R0 } from "../src/rules/center.js";
import { RULES } from "../src/rules/ladder.js";
import { createTunable, R3_NUMBERS } from "../src/rules/tunable.js";
import { serviceOf } from "../src/services.js";

const players = (rule, other = R0) => [{ rule, profile: CLUB_PLAYER }, { rule: other, profile: CLUB_PLAYER }];

describe("where a body goes after a stroke (Sami, 4/11/2026)", () => {
  const view = { side: -1, profile: CLUB_PLAYER };

  it("goes to the other side of where the ball was sent, as far as the rule says", () => {
    const rule = createTunable({ ...R3_NUMBERS, cover: 0.5, wait: 0.4 }, "test");
    assert.deepEqual(rule.recovery(view, [1, 0.6]), [-1.77, -0.3]);
    assert.deepEqual(rule.recovery(view, [1, -0.6]), [-1.77, 0.3]);
  });

  it("stays in the middle with R3's numbers", () => {
    const [x, y] = RULES.R3.recovery(view, [1, 0.6]);
    assert.equal(y, 0);
    assert.ok(Object.is(y, 0), "no minus zero: replays and hashes read it");
    assert.equal(x, -1.87);
  });

  it("sends a server back at once, wherever it served from", () => {
    const state = startRally({ seed: 3, players: players(R0), server: 0, service: serviceOf(3).service, serviceFrom: 0.5, serviceY: 0.3 });
    assert.ok(Math.abs(state.bodies[0][BY]) > 0.3, "it starts wide");
    assert.equal(state.bodies[0][GOAL_Y], 0);
  });

  it("covers the crossed return from the service on, for a rule that does", () => {
    const rule = createTunable({ ...R3_NUMBERS, cover: 1 }, "test");
    const state = startRally({ seed: 3, players: players(rule), server: 0, service: serviceOf(3).service, serviceFrom: 0, serviceY: 0.4 });
    assert.ok(Math.abs(Math.abs(state.bodies[0][GOAL_Y]) - 0.4) < 1e-9);
  });

  it("leaves a player at the mouse where its clicks put it", () => {
    const rule = createMouseRule([1, 0]);
    const state = startRally({ seed: 3, players: players(rule), server: 0, service: serviceOf(3).service, serviceFrom: 0.5, serviceY: 0 });
    assert.equal(state.bodies[0][GOAL_Y], state.bodies[0][BY]);
  });
});

describe("waiting for the moment to attack (Sami, 4/11/2026)", () => {
  /** How many strokes of a rule go out as its top. */
  function topsOf(numbers, seeds = 40) {
    const rule = createTunable(numbers, "test");
    const seen = { tops: 0, softs: 0 };
    for (let seed = 0; seed < seeds; seed += 1) {
      const listener = {
        impact: ({ who, plan }) => {
          if (who !== 0) return;
          if (plan.swing.brushUp === numbers.topBrush) seen.tops += 1;
          if (plan.swing.brushUp === numbers.softBrush) seen.softs += 1;
        },
      };
      playRally({ seed, players: players(rule, RULES.R3), server: seed % 2, listener, ...serviceOf(seed) });
    }
    return seen;
  }
  const cut = { ...R3_NUMBERS, softBrush: -5, softSpeed: 5 };

  it("attacks whatever is high enough at −1, as R3", () => {
    assert.equal(topsOf({ ...cut, ready: -1 }).softs, 0);
  });

  it("plays its steadier stroke when it asks for more time than it has", () => {
    const patient = topsOf({ ...cut, ready: 0.5 });
    const hasty = topsOf({ ...cut, ready: -1 });
    assert.ok(patient.softs > 0);
    assert.ok(patient.tops < hasty.tops, `${patient.tops} / ${hasty.tops}`);
  });
});
