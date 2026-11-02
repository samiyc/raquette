import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { STEP, VX, VY, VZ, X, Z } from "../src/ball/constants.js";
import { createBall, fly } from "../src/ball/flight.js";
import { advance, NONE, TABLE_BOUNCE } from "../src/ball/table.js";
import { CONSTANT, CONSTANT_DRAG, flyStroke, METHODS, TABLES } from "./support/flight2d.js";

/** The tests of docs/modele.md, § 7, against published values, and the arithmetic of docs/recherche/chiffres.md, § 8. */
const RADIUS = 0.02;
const TURN = 2 * Math.PI;

function reboundHeight(dropHeight) {
  const ball = createBall([0.5, 0, RADIUS + dropHeight], [0, 0, 0], [0, 0, 0]);
  const contact = new Float64Array(3);
  let top = 0;
  let bounces = 0;
  for (let i = 0; i < 960 && bounces < 2; i += 1) {
    if (advance(ball, contact) === TABLE_BOUNCE) bounces += 1;
    if (bounces === 1 && ball[Z] - RADIUS > top) top = ball[Z] - RADIUS;
  }
  return top;
}

describe("against the Laws and published values", () => {
  it("rebounds about 23 cm from a 30 cm drop (Law 2.1.3), 24 by the framing's calculation", () => {
    const height = reboundHeight(0.3);
    assert.ok(Math.abs(height - 0.23) <= 0.015, `${height}`);
    assert.ok(Math.abs(height - 0.239) <= 0.002, `${height}`);
  });

  it("falls at a terminal speed of 8.0 to 8.7 m/s", () => {
    const ball = createBall([3, 0, 500], [0, 0, 0], [0, 0, 0]);
    for (let i = 0; i < 240 * 30; i += 1) fly(ball, STEP);
    assert.ok(-ball[VZ] > 8 && -ball[VZ] < 8.7, `${ball[VZ]}`);
  });

  it("a strong backspin comes back after the bounce (Conti et al.)", () => {
    const ball = createBall([0.5, 0, RADIUS + 0.05], [1, 0, -3], [0, -600, 0]);
    let event = NONE;
    const contact = new Float64Array(3);
    for (let i = 0; i < 240 && event === NONE; i += 1) event = advance(ball, contact);
    assert.equal(event, TABLE_BOUNCE);
    assert.ok(ball[VX] < 0);
  });

  /** A topspin from behind the line, followed until 1 m past the far line (Kidokoro et al.'s measuring point). */
  function topspin(speed, elevation, turns) {
    const angle = (elevation * Math.PI) / 180;
    const ball = createBall([-1.6, 0, 0.3], [speed * Math.cos(angle), 0, speed * Math.sin(angle)], [0, turns * TURN, 0]);
    const contact = new Float64Array(3);
    let time = 0;
    let change = 0;
    while (ball[X] < 2.37 && time < 2) {
      const before = ball[VX];
      if (advance(ball, contact) === TABLE_BOUNCE) change = ball[VX] - before;
      time += STEP;
    }
    return { time, change, speed: Math.sqrt(ball[VX] ** 2 + ball[VY] ** 2 + ball[VZ] ** 2) };
  }

  const STROKES = [[14, 2], [14, 5], [15, 3], [16, 2], [18, 1], [20, 0], [22, 0]];

  it("110 tr/s arrives quicker than 80 from the same start: 1.4 m/s and 27 ± 5 ms (Kidokoro et al.), sign and magnitude", () => {
    for (const [speed, elevation] of STROKES) {
      const slow = topspin(speed, elevation, 80);
      const quick = topspin(speed, elevation, 110);
      const gain = quick.speed - slow.speed;
      const saved = slow.time - quick.time;
      assert.ok(gain > 0.7 && gain < 2.8, `${speed} m/s: ${gain} m/s`);
      assert.ok(saved > 0.0135 && saved < 0.054, `${speed} m/s: ${saved} s`);
    }
  });

  it("the bounce changes the forward speed by −3.1 to +2.6 m/s (Kidokoro et al.)", () => {
    for (const [speed, elevation] of STROKES) {
      for (const turns of [60, 80, 110, 130]) {
        const { change } = topspin(speed, elevation, turns);
        assert.ok(change > -3.1 && change < 2.6, `${speed} m/s, ${turns} tr/s: ${change}`);
      }
    }
  });
});

describe("the framing's calculations (chiffres.md, § 8)", () => {
  const near = (actual, expected, tolerance) => Math.abs(actual - expected) <= tolerance;

  it("the midpoint method at 240 Hz lands within a millimetre, Euler's misses by centimetres", () => {
    for (const stroke of [
      { x: -1.37, z: 0.25, speed: 20, elevation: 2.86, turns: 100 },
      { x: -1.37, z: 0.15, speed: 12, elevation: 20, turns: 120 },
      { x: -1.37, z: 0.15, speed: 5, elevation: 6.9, turns: -40 },
    ]) {
      const reference = flyStroke(stroke, TABLES, { dt: 1 / 20000 }).landing;
      const midpoint = flyStroke(stroke, TABLES, { dt: 1 / 240 }).landing;
      const euler = flyStroke(stroke, TABLES, { dt: 1 / 240, method: METHODS.euler }).landing;
      assert.ok(Math.abs(midpoint - reference) < 0.001, `midpoint ${midpoint - reference}`);
      assert.ok(Math.abs(euler - reference) > 0.01, `Euler ${euler - reference}`);
    }
  });

  it("the simulation itself lands within a millimetre of a far finer step", () => {
    const landing = (h) => {
      const ball = createBall([-1.6, 0, 0.3], [14.98, 0, 0.785], [0, 503, 0]);
      const contact = new Float64Array(3);
      for (let time = 0; time < 2; time += h) {
        if (advance(ball, contact, h) === TABLE_BOUNCE) return contact[0];
      }
      throw new Error("the stroke never reaches the table");
    };
    assert.ok(Math.abs(landing(STEP) - landing(STEP / 40)) < 0.001);
  });

  it("a constant Magnus coefficient lands far from the tables, the tables' Magnus near them", () => {
    const rows = [
      [{ speed: 5, elevation: 18, turns: -30 }, -6.7, 2.7],
      [{ speed: 8, elevation: 8, turns: 0 }, -0.5, -0.5],
      [{ speed: 10, elevation: 8, turns: 40 }, 42.6, 0.7],
      [{ speed: 15, elevation: 6, turns: 60 }, 67.3, 0.5],
      [{ speed: 18, elevation: 8, turns: 117 }, 15, -18.3],
      [{ speed: 25, elevation: 1, turns: 20 }, 99, -2.8],
    ];
    for (const [stroke, constant, constantDrag] of rows) {
      const reference = flyStroke(stroke, TABLES).landing;
      assert.ok(near((flyStroke(stroke, CONSTANT).landing - reference) * 100, constant, 0.1));
      assert.ok(near((flyStroke(stroke, CONSTANT_DRAG).landing - reference) * 100, constantDrag, 0.1));
    }
  });

  /** The two RMSE of chiffres.md, § 8: as flown, then with the start refitted, in the vertical plane. */
  function errorsAlongFlight(stroke) {
    const a = flyStroke(stroke, TABLES).path;
    const b = flyStroke(stroke, CONSTANT).path;
    const count = Math.min(a.length, b.length);
    const rms = (errors) => errors.reduce((sum, e) => sum + e * e, 0) / count;
    const line = (axis) => {
      const times = a.slice(0, count).map((row) => row[0]);
      const errors = a.slice(0, count).map((row, i) => b[i][axis] - row[axis]);
      const meanT = times.reduce((s, t) => s + t, 0) / count;
      const meanE = errors.reduce((s, e) => s + e, 0) / count;
      const slope = times.reduce((s, t, i) => s + (t - meanT) * (errors[i] - meanE), 0)
        / times.reduce((s, t) => s + (t - meanT) ** 2, 0);
      return { raw: rms(errors), fitted: rms(errors.map((e, i) => e - meanE - slope * (times[i] - meanT))) };
    };
    const [x, z] = [line(1), line(2)];
    return { raw: Math.sqrt(x.raw + z.raw), fitted: Math.sqrt(x.fitted + z.fitted) };
  }

  it("the same gap reads 67 cm at the landing, 80 mm along the flight, 9 mm with the start refitted", () => {
    const { raw, fitted } = errorsAlongFlight({ speed: 15, elevation: 6, turns: 60 });
    assert.ok(near(raw * 1000, 80, 1));
    assert.ok(near(fitted * 1000, 9, 0.5));
  });

  /** Winning to 11 by 2, from independent points. */
  function gameWon(p) {
    const memo = new Map();
    const from = (a, b) => {
      if (a >= 11 && a - b >= 2) return 1;
      if (b >= 11 && b - a >= 2) return 0;
      if (a === 10 && b === 10) return (p * p) / (p * p + (1 - p) * (1 - p));
      const key = a * 100 + b;
      if (!memo.has(key)) memo.set(key, p * from(a + 1, b) + (1 - p) * from(a, b + 1));
      return memo.get(key);
    };
    return from(0, 0);
  }

  function matchWon(game, need = 4) {
    let total = 0;
    let ways = 1;
    for (let lost = 0; lost < need; lost += 1) {
      total += ways * game ** need * (1 - game) ** lost;
      ways = (ways * (need + lost)) / (lost + 1);
    }
    return total;
  }

  it("a point more is worth what the table says", () => {
    for (const [point, game, match] of [[0.5, 0.5, 0.5], [0.51, 0.539, 0.584], [0.52, 0.577, 0.665], [0.55, 0.687, 0.856], [0.6, 0.836, 0.984]]) {
      assert.ok(near(gameWon(point), game, 0.001));
      assert.ok(near(matchWon(gameWon(point)), match, 0.002));
    }
  });

  it("an interval costs the rallies the table says", () => {
    const rallies = (half) => Math.ceil(((1.96 * 0.5) / half) ** 2);
    assert.deepEqual([rallies(0.05), rallies(0.02), rallies(0.01)], [385, 2401, 9604]);
  });
});
