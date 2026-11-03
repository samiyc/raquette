import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { measureDuel } from "../src/duel-stats.js";
import { CLUB_PLAYER } from "../src/player.js";
import { DUELS } from "../src/rules/drills.js";

/**
 * The three duels Sami watched and kept as the reference (3/11/2026). A change that moves one far from what he saw fails here,
 * on fewer rallies than `npm run duels` plays, hence the room. A change meant to move them rewrites the reference, and says so.
 */
const { duels } = JSON.parse(readFileSync(new URL("../docs/duels-reference.json", import.meta.url), "utf8"));
const RALLIES = 200;
const LENGTH_ROOM = 0.25;
const SPEED_ROOM = 0.1;
const LIFT_ROOM = 15; // Turns per second.

const within = (actual, expected, room) => Math.abs(actual - expected) <= room;

describe("the three reference duels", () => {
  it("are the three of the page, and the reference has them all", () => {
    assert.deepEqual(Object.keys(duels).sort(), Object.keys(DUELS).sort());
    assert.deepEqual(Object.keys(DUELS).sort(), ["pushes", "r0", "topBlock"]);
  });

  for (const [key, duel] of Object.entries(DUELS)) {
    it(`${duel.label} still looks as it did`, () => {
      const kept = duels[key];
      const now = measureDuel(duel, { rallies: RALLIES, profile: CLUB_PLAYER });
      assert.ok(within(now.strokes, kept.strokes, kept.strokes * LENGTH_ROOM), `${now.strokes} coups, référence ${kept.strokes}`);
      now.seats.forEach((seat, i) => {
        assert.ok(within(seat.speed, kept.seats[i].speed, kept.seats[i].speed * SPEED_ROOM), `${seat.speed} m/s, référence ${kept.seats[i].speed}`);
        assert.ok(within(seat.lift, kept.seats[i].lift, LIFT_ROOM), `${seat.lift} tr/s, référence ${kept.seats[i].lift}`);
      });
    });
  }
});
