import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { VX, VY, WX, WY } from "../src/ball/constants.js";
import { CLUB_PLAYER } from "../src/player.js";
import { playRally } from "../src/rally.js";
import { DRILL_STROKES, DUELS, drillPlayers } from "../src/rules/drills.js";

const TURN = 2 * Math.PI;
const SEEDS = Array.from({ length: 120 }, (_, seed) => seed);

/** A duel over many seeds: how long it lasts, how it ends, and what each player sends. */
function watch({ first, second, service }, profile = CLUB_PLAYER) {
  const players = drillPlayers(first, second, profile);
  const sent = [[], []];
  const causes = {};
  let strokes = 0;
  let state;
  for (const seed of SEEDS) {
    const listener = {
      tick(current) { state = current; },
      stroke(who) {
        const ball = state.ball;
        const flat = Math.sqrt(ball[VX] * ball[VX] + ball[VY] * ball[VY]);
        sent[who].push({ speed: flat, lift: (ball[WY] * ball[VX] - ball[WX] * ball[VY]) / flat / TURN });
      },
    };
    const result = playRally({ seed, players, server: seed % 2, service, listener });
    causes[result.cause] = (causes[result.cause] ?? 0) + 1;
    strokes += result.strokes;
  }
  return { sent, causes, mean: strokes / SEEDS.length };
}

const average = (balls, key) => balls.reduce((sum, ball) => sum + ball[key], 0) / balls.length;

describe("a duel of top against block (Sami, 3/11/2026)", () => {
  const { sent, causes, mean } = watch(DUELS.topBlock);

  it("lasts as a training drill lasts: 10 to 25 strokes on average", () => {
    assert.ok(mean >= 10 && mean <= 25, `${mean}`);
  });

  it("the top is a real one: at least 9 m/s and 60 turns of lift", () => {
    assert.ok(average(sent[0], "speed") >= 9, `${average(sent[0], "speed")}`);
    assert.ok(average(sent[0], "lift") >= 60, `${average(sent[0], "lift")}`);
  });

  it("the block is slower, with far less spin", () => {
    assert.ok(average(sent[1], "speed") < average(sent[0], "speed"));
    assert.ok(Math.abs(average(sent[1], "lift")) < average(sent[0], "lift") / 2);
  });

  it("ends in faults, not at the limit, and hardly by a ball out of reach", () => {
    const total = SEEDS.length;
    assert.ok((causes.limit ?? 0) < total / 5, JSON.stringify(causes));
    assert.ok((causes.out ?? 0) + (causes.net ?? 0) > total * 0.8, JSON.stringify(causes));
  });
});

describe("a duel of pushes (Sami, 3/11/2026)", () => {
  const { sent, causes, mean } = watch(DUELS.pushes);

  it("lasts long, slow and cut on both sides", () => {
    assert.ok(mean >= 15, `${mean}`);
    for (const balls of sent) {
      assert.ok(average(balls, "speed") < 6, `${average(balls, "speed")}`);
      assert.ok(average(balls, "lift") < -20, `${average(balls, "lift")}`);
    }
  });

  it("is even: no side wins it, and it stays within the table", () => {
    assert.ok((causes.net ?? 0) + (causes.out ?? 0) + (causes.limit ?? 0) > SEEDS.length * 0.9, JSON.stringify(causes));
  });

  it("gets shorter as the players get less sure: what a low level would see", () => {
    const shaky = { ...CLUB_PLAYER, scatterTilt: 0.0875, scatterSpeed: 0.1 };
    assert.ok(watch(DUELS.pushes, shaky).mean < mean / 2);
  });
});

describe("the mirror holds in a duel", () => {
  it("a duel with the same stroke on both sides replays as its mirror when the players swap", () => {
    const players = drillPlayers(DRILL_STROKES.push, DRILL_STROKES.push, CLUB_PLAYER);
    for (const seed of SEEDS.slice(0, 20)) {
      const one = playRally({ seed, players, server: 0, service: DUELS.pushes.service });
      const other = playRally({ seed, players, server: 1, service: DUELS.pushes.service });
      assert.equal(one.ticks, other.ticks);
      assert.equal(one.cause, other.cause);
    }
  });
});
