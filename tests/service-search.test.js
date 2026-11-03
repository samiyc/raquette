import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { createGame, createPoint, nextPoint, pointOver, positionOf, replayPoint, robotPicks, servicePicture, stepPoint } from "../src/game.js";
import { playSeeds } from "../src/pairs.js";
import { CLUB_PLAYER } from "../src/player.js";
import { playRally } from "../src/rally.js";
import { createRallyLog } from "../src/replay-log.js";
import { RULES } from "../src/rules/ladder.js";
import { namedRule } from "../src/rules/named.js";
import { createSearch } from "../src/rules/search.js";
import { bestService } from "../src/rules/service-search.js";
import { SERVICE_KINDS } from "../src/services.js";

const quick = { model: RULES.R3, draws: 3, horizon: 2 };
const search = () => createSearch({ budget: 3, draws: 2, horizon: 2 });

describe("a search picks its service", () => {
  it("among the six, on one side of the table, and says what it thinks it is worth", () => {
    const { key, y, value } = bestService({ seed: 5, server: 0, profile: CLUB_PLAYER }, quick);
    assert.ok(SERVICE_KINDS[key], key);
    assert.ok(Math.abs(y) <= 0.35);
    assert.ok(value >= 0 && value <= 1);
  });

  it("picks the same from the same seed, and not always the same", () => {
    const pick = (seed) => bestService({ seed, server: 0, profile: CLUB_PLAYER }, quick);
    assert.deepEqual(pick(3), pick(3));
    const picks = new Set(Array.from({ length: 12 }, (_, seed) => {
      const { key, y } = pick(seed);
      return `${key} ${y}`;
    }));
    assert.ok(picks.size >= 2, [...picks].join());
  });

  it("two servers facing each other pick mirror images, in their own frames", () => {
    const [one, other] = [0, 1].map((server) => bestService({ seed: 7, server, profile: CLUB_PLAYER }, quick));
    assert.deepEqual(one, other);
  });

  it("only when asked: a rally takes the long service otherwise", () => {
    const players = [{ rule: search(), profile: CLUB_PLAYER }, { rule: RULES.R3, profile: CLUB_PLAYER }];
    const line = (options) => {
      const { listener, finish } = createRallyLog({ seed: 2, server: 0 });
      playRally({ seed: 2, players, server: 0, listener, ...options });
      return finish();
    };
    assert.equal(line({}).service, "long");
    assert.ok(Object.values(SERVICE_KINDS).some(({ label }) => label === line({ choosing: true }).service));
  });
});

describe("by pairs", () => {
  it("`choice`: a rule that can picks, another takes the mix, and the seeds still pair up", () => {
    const part = playSeeds({ a: search(), b: RULES.R3, profile: CLUB_PLAYER, seeds: 3, serving: "choice" });
    assert.equal(part.scoresA.length, 3);
    assert.equal(part.rallies, 6);
  });

  it("`Smix` has no service of its own", () => {
    assert.equal(namedRule("Smix", 4).chooseService, undefined);
    assert.equal(typeof namedRule("S", 4).chooseService, "function");
    assert.equal(RULES.R3.chooseService, undefined);
  });
});

describe("a game against the search", () => {
  it("asks for the robot's service only when it serves", () => {
    const game = createGame({ seed: 1, scatter: 1, robot: "S" });
    const asks = [0, 1, 2, 3].map(() => {
      const asked = robotPicks(game);
      const server = nextPoint(game).server;
      game.score[0] += 1;
      return [asked, server];
    });
    for (const [asked, server] of asks) assert.equal(asked, server === 1);
    assert.equal(robotPicks(createGame({ seed: 1, scatter: 1, robot: "R0" })), false);
    assert.equal(servicePicture(game).robot, "S");
  });

  it("a picked service is played and replayed", () => {
    const point = createPoint({ seed: 3, server: 1, scatter: 1, robot: "R3", robotService: { key: "bombe", y: 0.2 } });
    assert.equal(point.state.serviceName, "Bombe");
    while (!pointOver(point)) stepPoint(point);
    const again = replayPoint(JSON.parse(JSON.stringify(positionOf(point))));
    assert.deepEqual(again.state.result, point.state.result);
  });
});
