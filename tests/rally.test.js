import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { BALL_SIZE, VX, VY, WX, WY, X, Y } from "../src/ball/constants.js";
import { CLUB_PLAYER } from "../src/player.js";
import { playRally } from "../src/rally.js";
import { recordRally } from "../src/rally-recording.js";
import { R0, takeToCentre } from "../src/rules/center.js";
import { SHORT_CUT, SHORT_SWING } from "../src/rules/short.js";

const both = (rule, profile = CLUB_PLAYER) => [{ rule, profile }, { rule, profile }];
const SEEDS = Array.from({ length: 200 }, (_, seed) => seed);

function tally(players, seeds = SEEDS) {
  const causes = {};
  let strokes = 0;
  for (const seed of seeds) {
    const result = playRally({ seed, players, server: seed % 2 });
    causes[result.cause] = (causes[result.cause] ?? 0) + 1;
    strokes += result.strokes;
  }
  return { causes, mean: strokes / seeds.length };
}

/** The same exact numbers, the table turned half a turn: x, y and what goes with them change sign, z stays. */
function assertMirrored(one, other) {
  assert.equal(one.steps, other.steps);
  const turned = new Set([X, Y, VX, VY, WX, WY]);
  for (let i = 0; i < one.frames.length; i += 1) {
    const expected = turned.has(i % BALL_SIZE) ? -other.frames[i] : other.frames[i];
    if (one.frames[i] !== expected) assert.fail(`frame ${Math.floor(i / BALL_SIZE)}, number ${i % BALL_SIZE}: ${one.frames[i]} / ${expected}`);
  }
}

describe("a rally", () => {
  it("replays exactly from its seed", () => {
    const players = both(R0);
    const one = recordRally({ seed: 5, players, server: 0 });
    const other = recordRally({ seed: 5, players, server: 0 });
    assert.deepEqual(one.result, other.result);
    assert.deepEqual([...one.frames], [...other.frames]);
  });

  it("A/A: the same rule on both sides gives the mirror rally when the players swap, number for number", () => {
    const players = both(R0);
    let swings = 0;
    for (const seed of SEEDS.slice(0, 40)) {
      const one = recordRally({ seed, players, server: 0 });
      const other = recordRally({ seed, players, server: 1 });
      assertMirrored(one, other);
      swings += one.result.strokes;
      assert.equal(one.result.cause, other.result.cause);
      if (one.result.winner >= 0) assert.equal(one.result.winner, 1 - other.result.winner);
    }
    assert.ok(swings > 40);
  });

  it("starts with a service that bounces on each side, in the middle", () => {
    const recording = recordRally({ seed: 1, players: both(R0), server: 0 });
    const [own, other] = recording.events;
    assert.ok(own.kind === "table" && own.x < 0);
    assert.ok(other.kind === "table" && other.x > 0.6 && other.x < 1.37);
    assert.equal(own.y, 0);
  });

  it("keeps each player on its side, and records both bodies at each step", () => {
    const recording = recordRally({ seed: 2, players: both(R0), server: 1 });
    assert.equal(recording.bodies.length, (recording.steps + 1) * 4);
    for (let i = 0; i < recording.bodies.length; i += 4) {
      assert.ok(recording.bodies[i] <= 0 && recording.bodies[i + 2] >= 0);
    }
  });

  it("records each stroke when the rally has some", () => {
    const recording = recordRally({ seed: 3, players: both(R0), server: 0 });
    assert.equal(recording.strokes.length, recording.result.strokes);
    assert.deepEqual(recording.strokes, recording.strokes.toSorted((a, b) => a - b));
  });
});

describe("a ball read late", () => {
  it("is still played when it has bounced before the reaction ends: a fast ball is not let go", () => {
    const hard = { name: "hard", decide: (view) => {
      const stroke = takeToCentre(view);
      return stroke && { ...stroke, target: [-view.side * 1.1, 0], swing: { speed: 16, brushUp: 14, brushSide: 0 } };
    } };
    const players = [{ rule: hard, profile: CLUB_PLAYER }, { rule: R0, profile: CLUB_PLAYER }];
    const late = SEEDS.slice(0, 60).map((seed) => playRally({ seed, players, server: 1 }));
    assert.ok(late.some((result) => result.strokes >= 3));
  });
});

describe("R0 against R0", () => {
  it("goes on and on: two players sending the ball to the centre with room over the net rarely miss", () => {
    const { causes, mean } = tally(both(R0));
    assert.ok(mean > 30, `${mean}`);
    assert.ok(causes.limit > 0);
    assert.ok(causes.net > 0);
  });

  it("without scatter and at a soft pace, never ends: nothing but the scatter makes a fault", () => {
    const soft = { name: "soft", decide: (view) => {
      const stroke = takeToCentre(view);
      return stroke && { ...stroke, swing: { speed: 5, brushUp: 0, brushSide: 0 } };
    } };
    const steady = { ...CLUB_PLAYER, scatterTilt: 0, scatterSpeed: 0 };
    assert.deepEqual(playRally({ seed: 1, players: both(soft, steady), server: 0 }).cause, "limit");
  });

  it("a rally stopped at its limit has no winner", () => {
    const soft = { name: "soft", decide: (view) => {
      const stroke = takeToCentre(view);
      return stroke && { ...stroke, swing: { speed: 5, brushUp: 0, brushSide: 0 } };
    } };
    const steady = { ...CLUB_PLAYER, scatterTilt: 0, scatterSpeed: 0 };
    const result = playRally({ seed: 1, players: both(soft, steady), server: 0 });
    assert.equal(result.winner, -1);
    assert.equal(result.strokes, 60);
  });
});

describe("how a rally ends", () => {
  const letGo = { name: "lets go", decide: () => null };
  const slow = { ...CLUB_PLAYER, speed: 0.01, acceleration: 0.01 };

  it("a service nobody plays bounces twice, or falls off the table: the server's point", () => {
    const result = playRally({ seed: 1, players: [{ rule: R0, profile: CLUB_PLAYER }, { rule: letGo, profile: CLUB_PLAYER }], server: 0 });
    assert.equal(result.winner, 0);
    assert.equal(result.strokes, 0);
    assert.ok(result.cause === "twoBounces" || result.cause === "notReached", result.cause);
  });

  it("a player too slow does not get there", () => {
    const far = { ...slow, waitBehindLine: 3 };
    const result = playRally({ seed: 1, players: [{ rule: R0, profile: CLUB_PLAYER }, { rule: R0, profile: far }], server: 0 });
    assert.equal(result.winner, 0);
    assert.equal(result.strokes, 0);
  });

  it("a ball sent into the net is the striker's fault", () => {
    const intoNet = { name: "net", decide: (view) => {
      const stroke = takeToCentre(view);
      return stroke && { ...stroke, target: [-view.side * 0.1, 0], swing: { speed: 20, brushUp: 0, brushSide: 0 } };
    } };
    const steady = { ...CLUB_PLAYER, scatterTilt: 0, scatterSpeed: 0 };
    const result = playRally({ seed: 1, players: [{ rule: R0, profile: steady }, { rule: intoNet, profile: steady }], server: 0 });
    assert.equal(result.winner, 0);
    assert.ok(result.cause === "net" || result.cause === "out", result.cause);
  });

  it("a ball the arm cannot get, gone past the body, is lost behind it", () => {
    // A stand in front of the ball: it passes behind the body and the 140° of the back are out of reach.
    const wrongWay = { name: "wrong way", decide: (view) => {
      const stroke = takeToCentre(view);
      return stroke && { ...stroke, goal: [view.side * 1.0, 0] };
    } };
    const result = playRally({ seed: 1, players: [{ rule: R0, profile: CLUB_PLAYER }, { rule: wrongWay, profile: CLUB_PLAYER }], server: 0 });
    assert.equal(result.winner, 0);
    assert.equal(result.cause, "behind");
  });
});

describe("the cut that bounces twice (Sami, 3/11/2026)", () => {
  const steady = { ...CLUB_PLAYER, scatterTilt: 0, scatterSpeed: 0 };
  const atWait = (waitBehindLine) => ({ ...steady, waitBehindLine });
  /** From far back, R0's 6.5 m/s falls short: this one hits a little harder, so that the rally gets to the short ball. */
  const deep = { name: "deep", decide: (view) => {
    const stroke = takeToCentre(view);
    return stroke && { ...stroke, swing: { speed: 8, brushUp: 0, brushSide: 0 } };
  } };

  it("wins against a player who goes back far behind the line: the second bounce comes first", () => {
    const players = [{ rule: SHORT_CUT, profile: steady }, { rule: deep, profile: atWait(2.5) }];
    const result = playRally({ seed: 1, players, server: 0 });
    assert.equal(result.cause, "twoBounces");
    assert.equal(result.winner, 0);
    assert.equal(result.strokes, 2);
  });

  it("the same player returns R0's ball, in the same rally: it is the short ball that beats it", () => {
    const players = [{ rule: R0, profile: steady }, { rule: deep, profile: atWait(2.5) }];
    const result = playRally({ seed: 1, players, server: 0 });
    assert.ok(result.strokes > 2 || result.cause !== "twoBounces", JSON.stringify(result));
  });

  it("a player at its place gets to the short ball, played anyway", () => {
    const always = { name: "always short", decide: (view) => {
      const stroke = takeToCentre(view);
      return stroke && { ...stroke, target: [-view.side * 0.35, 0], swing: SHORT_SWING };
    } };
    const players = [{ rule: always, profile: steady }, { rule: R0, profile: steady }];
    const result = playRally({ seed: 1, players, server: 0 });
    assert.ok(result.strokes >= 3, JSON.stringify(result));
    assert.notEqual(result.cause, "twoBounces");
  });

  it("is not played against a player at its place: the same rallies as R0", () => {
    const close = [{ rule: SHORT_CUT, profile: CLUB_PLAYER }, { rule: R0, profile: { ...CLUB_PLAYER, waitBehindLine: 0.3 } }];
    const witness = [{ rule: R0, profile: CLUB_PLAYER }, { rule: R0, profile: { ...CLUB_PLAYER, waitBehindLine: 0.3 } }];
    const same = SEEDS.slice(0, 40).filter((seed) => {
      const [one, other] = [playRally({ seed, players: close, server: 0 }), playRally({ seed, players: witness, server: 0 })];
      return one.ticks === other.ticks;
    });
    assert.ok(same.length >= 36, `${same.length}`);
  });
});
