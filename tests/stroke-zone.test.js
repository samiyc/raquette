import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { CLUB_PLAYER } from "../src/player.js";
import { createPoint, clickPoint } from "../src/game.js";
import { TABLE } from "../src/ball/constants.js";
import { strokeZone, ZONE_CELL } from "../src/stroke-zone.js";
import { nextContact, strokeChoices, STROKE_KINDS } from "../src/strokes.js";
import { effortOf } from "../src/scatter.js";

const received = (order = []) => {
  const point = createPoint({ seed: 3, server: 1, scatter: 1 });
  order.forEach((one) => clickPoint(point, one));
  return point;
};

describe("the zone of a stroke", () => {
  it("lies in the other camp, cell by cell", () => {
    const { state, rule } = received();
    const zone = strokeZone(state, { who: 0, rule });
    assert.ok(zone.length > 0);
    for (const [x, y] of zone) assert.ok(x > 0 && x < TABLE.halfLength && Math.abs(y) < TABLE.halfWidth, `${x}, ${y}`);
    assert.ok(ZONE_CELL.x > 0.1 && ZONE_CELL.y > 0.1);
  });

  it("says what the buttons say: aiming at a cell of it leaves the stroke open", () => {
    for (const stroke of Object.keys(STROKE_KINDS)) {
      const { state, rule } = received([{ stroke }]);
      if (!nextContact(state, 0, rule)) continue;
      for (const [x, y] of strokeZone(state, { who: 0, rule }).slice(0, 6)) {
        rule.aim[0] = x;
        rule.aim[1] = y;
        if (!STROKE_KINDS[stroke].depths) assert.equal(strokeChoices(state, { who: 0, rule })[stroke], null, `${stroke} vers ${x}, ${y}`);
      }
    }
  });

  it("is empty when the ball forbids the stroke", () => {
    const { state, rule } = received([{ moveTo: [-3, 0] }, { stroke: "push" }]);
    const contact = nextContact(state, 0, rule);
    if (contact && strokeChoices(state, { who: 0, rule }).push === "balle trop rapide pour un coup contrôlé") assert.deepEqual(strokeZone(state, { who: 0, rule }), []);
  });

  it("is empty with no ball to take", () => {
    const point = createPoint({ seed: 2, server: 0, scatter: 1 });
    assert.deepEqual(strokeZone(point.state, { who: 0, rule: point.rule }), []);
  });
});

describe("a big swing", () => {
  const swing = (speed, brushUp, brushSide = 0) => effortOf({ speed, brushUp, brushSide }, CLUB_PLAYER);

  it("costs nothing up to the ordinary top", () => {
    assert.equal(swing(10, 10), 1);
    assert.equal(swing(6.5, 0), 1);
    assert.equal(swing(3, -2), 1);
  });

  it("costs what self-play found free, whichever way the numbers go", () => {
    assert.ok(swing(5, 16) > 1.5);
    assert.ok(swing(15, 10) > 1.7);
    assert.equal(swing(5, -16), swing(5, 16));
  });

  it("costs more for a sideways brush, on either side", () => {
    assert.ok(swing(6, 2, 5) > swing(6, 5));
    assert.equal(swing(6, 2, 5), swing(6, 2, -5));
    assert.ok(swing(6, 2, 5) > 1.3);
  });
});

describe("a side stroke", () => {
  it("follows the side aimed at, even when the aim comes after", () => {
    const { state, rule } = received([{ stroke: "side" }, { aimAt: [0.8, 0.4] }]);
    assert.ok(rule.swing.brushSide > 0, `${rule.swing.brushSide}`);
    const point = createPoint({ seed: 3, server: 1, scatter: 1 });
    clickPoint(point, { stroke: "side" });
    clickPoint(point, { aimAt: [0.8, -0.4] });
    assert.ok(point.rule.swing.brushSide < 0);
    assert.ok(state);
  });
});
