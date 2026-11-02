import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { dragCoefficient, magnusCoefficient } from "../src/ball/coefficients.js";

const close = (actual, expected, tolerance = 1e-9) => Math.abs(actual - expected) <= tolerance;

describe("the drag coefficient (Conti et al. 2026, table I)", () => {
  it("gives the table's breakpoints at its reference speeds", () => {
    assert.ok(close(dragCoefficient(2.5, 0), 0.55));
    assert.ok(close(dragCoefficient(7.5, 0.75), 0.55));
    assert.ok(close(dragCoefficient(7.5, 1.1), 0.48));
    assert.ok(close(dragCoefficient(12.5, 0.95), 0.41));
    assert.ok(close(dragCoefficient(17.5, 0.5), 0.51));
    assert.ok(close(dragCoefficient(17.5, 0.84), 0.37));
    assert.ok(close(dragCoefficient(17.5, 2), 0.45));
  });

  it("is linear in the spin ratio between breakpoints, and held past 2", () => {
    assert.ok(close(dragCoefficient(17.5, 0.67), 0.44));
    assert.ok(close(dragCoefficient(17.5, 3), 0.45));
  });

  it("is linear in speed between reference speeds", () => {
    assert.ok(close(dragCoefficient(5, 0), (0.55 + 0.49) / 2));
    assert.ok(close(dragCoefficient(10, 0), (0.49 + 0.47) / 2));
    assert.ok(close(dragCoefficient(15, 0.4), 0.47));
  });

  it("is held below 2.5 m/s, extrapolated up to 30 m/s, then held", () => {
    assert.ok(close(dragCoefficient(1, 0.5), 0.55));
    assert.ok(close(dragCoefficient(22.5, 0.84), 0.37 + (0.37 - dragCoefficient(12.5, 0.84))));
    assert.ok(close(dragCoefficient(35, 0.5), dragCoefficient(30, 0.5)));
  });

  it("stays positive within the physical bounds", () => {
    for (let speed = 1; speed <= 35; speed += 0.5) {
      for (let spin = 0; spin <= 1000; spin += 25) {
        assert.ok(dragCoefficient(speed, (0.02 * spin) / speed) > 0.2, `v ${speed}, ω ${spin}`);
      }
    }
  });
});

describe("the Magnus coefficient (Conti et al. 2026, tables II and III)", () => {
  it("is the line of table II up to the knee", () => {
    assert.ok(close(magnusCoefficient(2, 100), 0.08));
    assert.ok(close(magnusCoefficient(3.5, 200), -1.1e-3 * 200 + 0.31));
    assert.ok(close(magnusCoefficient(13.5, 550), -5.6e-4 * 550 + 0.383));
    assert.ok(close(magnusCoefficient(17, 650), -4.48e-4 * 650 + 0.371));
  });

  it("is the parabola of table III past it", () => {
    assert.ok(close(magnusCoefficient(7.5, 351), -2e-7 * 351 * 351 + 1.7e-4 * 351 + 0.0587));
    assert.ok(close(magnusCoefficient(17, 900), -1e-7 * 900 * 900 + 2.3e-4 * 900 - 0.0375));
  });

  it("is never negative", () => {
    assert.equal(magnusCoefficient(2, 1000), 0);
    for (let speed = 0; speed <= 35; speed += 0.5) {
      for (let spin = 0; spin <= 1000; spin += 25) assert.ok(magnusCoefficient(speed, spin) >= 0);
    }
  });

  it("is clipped outside 2 to 17 m/s, and linear between rows", () => {
    assert.equal(magnusCoefficient(1, 300), magnusCoefficient(2, 300));
    assert.equal(magnusCoefficient(30, 300), magnusCoefficient(17, 300));
    assert.ok(close(magnusCoefficient(9, 100), (magnusCoefficient(7.5, 100) + magnusCoefficient(10.5, 100)) / 2));
  });

  it("keeps the jump the printed table has at the 13.5 m/s knee (chiffres.md, § 2)", () => {
    assert.ok(close(magnusCoefficient(13.5, 550), 0.075, 1e-3));
    assert.ok(close(magnusCoefficient(13.5, 550.001), 0.097, 1e-3));
  });
});
