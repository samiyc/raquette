import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { VX, VY, VZ, WX, WY, X, Y } from "../src/ball/constants.js";
import { createBall } from "../src/ball/flight.js";
import { aim } from "../src/aim.js";
import { normalRestitution, poseRacket, RACKET_SIZE, racketSpeedFor, strike } from "../src/racket.js";
import { recordFlight } from "../src/recording.js";
import { SHORT_SWING } from "../src/rules/short.js";
import { liftOf } from "../web/scale.js";

const TURN = 2 * Math.PI;
const close = (actual, expected, tolerance = 1e-9) => Math.abs(actual - expected) <= tolerance;

/** A racket at rest, its face towards +x, the ball coming at it from +x. */
const stillRacket = () => Float64Array.of(1, 0, 0, 0, 0, 0);

describe("the racket's contact", () => {
  it("sends a ball straight back with the restitution of Conti's table IV", () => {
    const ball = createBall([0, 0, 0], [-5, 0, 0], [0, 0, 0]);
    strike(ball, stillRacket());
    assert.ok(close(ball[VX], 5 * (0.878 - 0.02 * 5)));
    assert.ok(close(ball[VY], 0));
    assert.ok(close(ball[VZ], 0));
  });

  it("never gives a negative restitution", () => {
    assert.equal(normalRestitution(100), 0);
  });

  it("a still racket makes a lift climb, and a backspin dive: the ball's spin kicks it the right way", () => {
    // Going towards −x, a lift turns about −y.
    const lifted = createBall([0, 0, 0], [-8, 0, 0], [0, -80 * TURN, 0]);
    strike(lifted, stillRacket());
    assert.ok(lifted[VZ] > 1, `${lifted[VZ]}`);
    const cut = createBall([0, 0, 0], [-8, 0, 0], [0, 80 * TURN, 0]);
    strike(cut, stillRacket());
    assert.ok(cut[VZ] < -1, `${cut[VZ]}`);
  });

  it("brushing up gives a lift, brushing down a backspin", () => {
    const hit = (brushUp) => {
      const ball = createBall([0, 0, 0], [-5, 0, 0], [0, 0, 0]);
      const racket = new Float64Array(RACKET_SIZE);
      poseRacket(racket, Float64Array.of(0, 0.2, 1), { speed: 8, brushUp, brushSide: 0 }, ball);
      strike(ball, racket);
      return liftOf(ball[VX], ball[VY], ball[WX], ball[WY]);
    };
    assert.ok(hit(8) > 100);
    assert.ok(hit(-8) < -100);
  });

  it("damps the spin about the normal by Conti's 0.805, without turning it into anything else", () => {
    const ball = createBall([0, 0, 0], [-5, 0, 0], [100, 0, 0]);
    strike(ball, stillRacket());
    assert.ok(close(ball[WX], 80.5));
    assert.ok(close(ball[WY], 0));
  });

  it("finds the racket speed that sends the ball off at the speed asked, giving way to a fast ball", () => {
    const speed = racketSpeedFor(6, 15);
    assert.ok(speed < 0, `${speed}`);
    const ball = createBall([0, 0, 0], [-15, 0, 0], [0, 0, 0]);
    const racket = Float64Array.of(1, 0, 0, speed, 0, 0);
    strike(ball, racket);
    assert.ok(close(ball[VX], 6, 0.02), `${ball[VX]}`);
    assert.equal(racketSpeedFor(90, 0), 20);
  });
});

describe("the aim", () => {
  const coming = (side = 1) => createBall([side * 1.6, side * 0.1, 0.25], [-side * 5, 0, 0.5], [0, -side * 30, 0]);
  const swing = { speed: 6.5, brushUp: 0, brushSide: 0 };
  const flown = (ball, forward, tilts) => {
    const racket = new Float64Array(RACKET_SIZE);
    const start = ball.slice();
    poseRacket(racket, Float64Array.of(tilts[0], tilts[1], forward), { ...swing, speed: tilts[2] }, start);
    strike(start, racket);
    return recordFlight(start);
  };

  it("lands the ball within a centimetre of its target, over the net", () => {
    const tilts = new Float64Array(3);
    const task = { ball: coming(), forward: -1, target: [-0.685, 0.3], swing };
    assert.equal(aim(task, tilts), true);
    const first = flown(task.ball, -1, tilts).events[0];
    assert.equal(first.kind, "table");
    assert.ok(close(first.x, -0.685, 0.012), `${first.x}`);
    assert.ok(close(first.y, 0.3, 0.012), `${first.y}`);
  });

  it("plays softer rather than onto the net's tape: the speed comes down until it clears", () => {
    const tilts = new Float64Array(3);
    const task = { ball: coming(), forward: -1, target: [-0.685, 0], swing: { speed: 12, brushUp: 0, brushSide: 0 } };
    assert.equal(aim(task, tilts), true);
    assert.ok(tilts[2] < 12, `${tilts[2]}`);
    assert.ok(flown(task.ball, -1, tilts).events[0].kind === "table");
  });

  it("closes the face on a heavy lift, and keeps the ball low: no high ball where a block will do", () => {
    const ball = createBall([1.2, 0, 0.2], [8, 0, 2], [0, 60 * TURN, 0]);
    const tilts = new Float64Array(3);
    const block = { speed: 6, brushUp: 0, brushSide: 0 };
    assert.equal(aim({ ball, forward: -1, target: [-0.9, 0], swing: block }, tilts), true);
    assert.ok(tilts[1] < -0.3, `${tilts[1]}`);
    const start = ball.slice();
    const racket = new Float64Array(RACKET_SIZE);
    poseRacket(racket, Float64Array.of(tilts[0], tilts[1], -1), { ...block, speed: tilts[2] }, start);
    strike(start, racket);
    assert.ok(start[VZ] < 3.5 && start[VX] < -4, `${start[VX]}, ${start[VZ]}`);
  });

  it("never sends a ball up for metres, even when nothing else lands there", () => {
    const tilts = new Float64Array(3);
    const task = { ball: coming(), forward: -1, target: [-0.3, 0], swing: { speed: 12, brushUp: 10, brushSide: 0 } };
    aim(task, tilts);
    const start = task.ball.slice();
    const racket = new Float64Array(RACKET_SIZE);
    poseRacket(racket, Float64Array.of(tilts[0], tilts[1], -1), { ...task.swing, speed: tilts[2] }, start);
    strike(start, racket);
    assert.ok(start[VZ] <= 1.2 * Math.abs(start[VX]) + 0.5, `${start[VX]}, ${start[VZ]}`);
  });

  it("leaves the ball as it is", () => {
    const task = { ball: coming(), forward: -1, target: [-0.685, 0], swing };
    const copy = task.ball.slice();
    aim(task, new Float64Array(3));
    assert.deepEqual([...task.ball], [...copy]);
  });

  it("gives two players facing each other the same tilts, exactly", () => {
    const [mine, theirs] = [new Float64Array(3), new Float64Array(3)];
    aim({ ball: coming(1), forward: -1, target: [-0.685, 0.3], swing }, mine);
    aim({ ball: coming(-1), forward: 1, target: [0.685, -0.3], swing }, theirs);
    assert.deepEqual([...mine], [...theirs]);
  });

  it("answers false when nothing lands there", () => {
    const task = { ball: coming(), forward: -1, target: [-30, 0], swing: { speed: 1, brushUp: 0, brushSide: 0 } };
    assert.equal(aim(task, new Float64Array(3)), false);
  });

  it("the robot's cut, from a ball of R0, is Sami's cut: two bounces in the other camp, about 80 turns of backspin", () => {
    const ball = createBall([-1.44, 0, 0.17], [-4.7, 0, 0.4], [0, -30, 0]);
    const tilts = new Float64Array(3);
    assert.equal(aim({ ball, forward: 1, target: [0.35, 0], swing: SHORT_SWING }, tilts), true);
    const start = ball.slice();
    const racket = new Float64Array(RACKET_SIZE);
    poseRacket(racket, Float64Array.of(tilts[0], tilts[1], 1), { ...SHORT_SWING, speed: tilts[2] }, start);
    strike(start, racket);
    assert.ok(start[WY] / TURN < -60, `${start[WY] / TURN}`);
    const [first, second] = recordFlight(start).events;
    assert.deepEqual([first.kind, second.kind], ["table", "table"]);
    assert.ok(second.x > 0 && second.x < 1.37, `${second.x}`);
    assert.ok(start[X] === ball[X] && start[Y] === ball[Y]);
  });
});

describe("what replays alike on every engine", () => {
  for (const name of ["racket.js", "aim.js", "player.js", "forecast.js", "rally.js", "rules/center.js", "rules/short.js", "rules/drills.js"]) {
    it(`src/${name} reads no inexact function`, () => {
      const source = readFileSync(new URL(`../src/${name}`, import.meta.url), "utf8").replace(/\/\*[\s\S]*?\*\/|\/\/.*/g, "");
      assert.doesNotMatch(source, /Math\.(sin|cos|tan|pow|hypot|exp|log|atan)|\*\*|\.normal\(/);
    });
  }
});

describe("a stroke stays a stroke", () => {
  // Slow balls out wide, from Sami's replays of 3/11/2026: the robot sent these up at 64° to 74°, up to 5 m over the net.
  const WIDE_BALLS = [
    { ball: [1.3416, -1.1639, 0.4397, 1.442, -1.6752, 0.0061, 146.0412, -39.9107, -931.6288], target: [-0.9, 0.45], speed: 10, brushUp: 10 },
    { ball: [1.2991, 0.8729, 0.2546, 2.6459, 1.6054, -0.0206, -104.2055, 102.9327, 519.0698], target: [-0.685, 0], speed: 6.5, brushUp: 0 },
    { ball: [1.3568, -0.8937, 0.2479, 3.4361, -1.2921, 0, 67.3615, 191.4996, -627.3894], target: [-0.685, 0], speed: 6.5, brushUp: 0 },
  ];
  const STEEPEST_DEGREES = 50.5;

  for (const [i, { ball, target, speed, brushUp }] of WIDE_BALLS.entries()) {
    it(`leaves under 50° on a slow ball out wide, ${i + 1}`, () => {
      const start = Float64Array.from(ball);
      const out = new Float64Array(3);
      assert.ok(aim({ ball: start, forward: -1, target, swing: { speed, brushUp, brushSide: 0 } }, out));
      const racket = new Float64Array(RACKET_SIZE);
      const struck = start.slice();
      poseRacket(racket, Float64Array.of(out[0], out[1], -1), { speed: out[2], brushUp, brushSide: 0 }, struck);
      strike(struck, racket);
      const angle = (Math.atan2(struck[VZ], Math.hypot(struck[VX], struck[VY])) * 180) / Math.PI;
      assert.ok(angle < STEEPEST_DEGREES, `${angle.toFixed(0)}°`);
    });
  }
});
