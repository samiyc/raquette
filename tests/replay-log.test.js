import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { CLUB_PLAYER } from "../src/player.js";
import { playPairs } from "../src/pairs.js";
import { playRally } from "../src/rally.js";
import { createRallyLog, botName, localTimestamp, REPLAY_FORMAT, replayHeader } from "../src/replay-log.js";
import { summarize } from "../src/replay-stats.js";
import { R0 } from "../src/rules/center.js";
import { RULES } from "../src/rules/ladder.js";
import { VERSION } from "../src/version.js";
import { clickPoint, createPoint, pointOver, replayOfPoint, replayPoint, stepPoint } from "../src/game.js";

const both = (rule) => [{ rule, profile: CLUB_PLAYER }, { rule, profile: CLUB_PLAYER }];

function logged(seed, players = both(RULES.R3), server = seed % 2) {
  const { listener, finish } = createRallyLog({ seed, server });
  playRally({ seed, players, server, listener });
  return finish();
}

describe("a rally's log", () => {
  it("changes nothing in the rally", () => {
    for (const seed of [1, 2, 3, 4, 5]) {
      const players = both(RULES.R3);
      const plain = playRally({ seed, players, server: seed % 2 });
      const line = logged(seed);
      assert.deepEqual({ winner: line.winner, cause: line.cause, strokes: line.strokes, ticks: line.ticks }, plain);
    }
  });

  it("has one impact per stroke, each with both players and the ball before and after", () => {
    const line = logged(3);
    assert.equal(line.impacts.length, line.strokes);
    for (const impact of line.impacts) {
      assert.equal(impact.ballIn.length, 9);
      assert.equal(impact.ballOut.length, 6);
      assert.equal(impact.body.length, 2);
      assert.equal(impact.opponent.length, 2);
      assert.ok(impact.reach >= 0 && impact.reach <= CLUB_PLAYER.reach + 1e-3, `${impact.reach}`);
      assert.ok(impact.tick >= impact.planned);
      assert.ok(Math.abs(Math.hypot(...impact.racket.normal) - 1) < 1e-3);
    }
  });

  it("says where a ball that crossed the net passed, and where it fell", () => {
    const rally = [1, 2, 3, 4, 5, 6].map((seed) => logged(seed)).find((line) => line.impacts.length >= 2);
    const [first] = rally.impacts;
    assert.equal(typeof first.netMargin, "number");
    assert.equal(first.landed.kind, "table");
    assert.ok(first.who === 1 ? first.landed.x < 0 : first.landed.x > 0, JSON.stringify(first.landed));
  });

  it("marks a ball sent into the net with a margin under zero", () => {
    const rally = Array.from({ length: 80 }, (_, seed) => logged(seed)).find((line) => line.cause === "net");
    const last = rally.impacts.at(-1);
    assert.equal(rally.lost.fault, "net");
    assert.equal(rally.lost.who, last.who);
    assert.equal(last.landed.kind, "net");
  });

  it("says where a player stood for a ball it did not get, and how close it came", () => {
    const players = [{ rule: RULES.R3, profile: CLUB_PLAYER }, { rule: R0, profile: CLUB_PLAYER }];
    const lines = Array.from({ length: 80 }, (_, seed) => logged(seed, players));
    const missed = lines.find((line) => line.lost?.missed);
    assert.ok(missed, "no ball missed in 80 rallies");
    const { lost } = missed;
    assert.equal(lost.body.length, 2);
    assert.equal(lost.who, 1 - missed.winner);
    assert.ok(lost.closest.distance >= 0);
    assert.equal(lost.closest.who, lost.who);
    assert.ok(lost.lastRead.who === lost.who);
  });

  it("keeps a let-go ball as a read with no goal", () => {
    const letGo = { name: "lets go", decide: () => null };
    const players = [{ rule: R0, profile: CLUB_PLAYER }, { rule: letGo, profile: CLUB_PLAYER }];
    const line = logged(1, players, 0);
    assert.equal(line.lost.who, 1);
    assert.equal(line.lost.lastRead.goal, null);
  });

  it("gives no one the blame for a rally stopped at its limit", () => {
    const soft = { name: "soft", decide: (view) => {
      const stroke = R0.decide(view);
      return stroke && { ...stroke, swing: { speed: 5, brushUp: 0, brushSide: 0 } };
    } };
    const steady = { ...CLUB_PLAYER, scatterTilt: 0, scatterAcross: 0, scatterSpeed: 0 };
    const line = logged(1, [{ rule: soft, profile: steady }, { rule: soft, profile: steady }], 0);
    assert.equal(line.cause, "limit");
    assert.equal(line.lost, null);
  });

  it("goes through JSON unchanged, as a line of a file", () => {
    const line = logged(4);
    assert.deepEqual(JSON.parse(JSON.stringify(line)), line);
  });
});

describe("a replay's header", () => {
  it("says the format, the version, the date and who played, with their versions and profiles", () => {
    const header = replayHeader({ players: both(RULES.R3) });
    assert.equal(header.format, REPLAY_FORMAT);
    assert.equal(header.version, VERSION);
    assert.equal(header.players[0].bot, "R3@1");
    assert.equal(header.players[0].profile.reach, CLUB_PLAYER.reach);
    assert.match(header.startedAt, /^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d[+-]\d\d:\d\d$/);
  });

  it("writes local time with its offset", () => {
    assert.match(localTimestamp(new Date(0)), /^19(69|70)-/);
  });

  it("names every rule of the ladder and R0 with a version", () => {
    for (const rule of Object.values(RULES)) assert.match(botName(rule), /^R\d@\d+$/);
  });

  it("carries the version of the journal", () => {
    const { versions } = JSON.parse(readFileSync(new URL("../docs/changelog.json", import.meta.url), "utf8"));
    assert.equal(VERSION, versions[0].version);
  });
});

describe("a series", () => {
  it("collects one line per rally when asked, and plays the same rallies", () => {
    const lines = [];
    const log = { start: (seed, server) => createRallyLog({ seed, server }), end: (line) => lines.push(line) };
    const match = { a: RULES.R1, b: R0, profile: CLUB_PLAYER, seeds: 10 };
    const plain = playPairs(match);
    const kept = playPairs({ ...match, log });
    assert.equal(lines.length, 20);
    assert.deepEqual(kept.gap, plain.gap);
    assert.deepEqual(lines.slice(0, 2).map((line) => [line.seed, line.server]), [[0, 0], [0, 1]]);
  });
});

describe("the summary of a series", () => {
  it("counts strokes, faults and missed balls by player, as the rallies say", () => {
    const players = [{ rule: RULES.R3, profile: CLUB_PLAYER }, { rule: R0, profile: CLUB_PLAYER }];
    const lines = Array.from({ length: 60 }, (_, seed) => logged(seed, players));
    const { rallies, seats, strokes } = summarize(lines);
    assert.equal(rallies, 60);
    assert.equal(seats[0].strokes + seats[1].strokes, lines.reduce((sum, line) => sum + line.strokes, 0));
    assert.ok(strokes > 0);
    const lost = Object.values(seats[1].faults).concat(Object.values(seats[1].missed)).reduce((sum, n) => sum + n, 0);
    assert.equal(lost, lines.filter((line) => line.winner === 0).length);
    assert.ok(seats[0].reach > 0 && seats[0].speed > 0 && seats[0].aimMiss > 0);
  });

  it("is empty for no rally", () => {
    assert.equal(summarize([]).rallies, 0);
  });
});

describe("a point at the mouse", () => {
  it("leaves a replay with its header, its clicks and its rally, that plays again the same", () => {
    const point = createPoint({ seed: 6, server: 1, scatter: 1 });
    clickPoint(point, { aimAt: [0.9, 0.4] });
    while (!pointOver(point)) stepPoint(point);
    const replay = JSON.parse(JSON.stringify(replayOfPoint(point)));
    assert.equal(replay.format, REPLAY_FORMAT);
    assert.deepEqual(replay.players.map((player) => player.bot), ["souris@1", "R0@1"]);
    assert.equal(replay.robot, "R0");
    assert.equal(replay.rally.winner, point.state.result.winner);
    assert.equal(replay.orders.length, 1);
    assert.match(replay.savedAt, /^\d{4}-/);
    assert.deepEqual(replayPoint(replay).state.result, point.state.result);
  });
});
