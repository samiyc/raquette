import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { STEP } from "../src/ball/constants.js";
import { PRESETS, throwBall } from "../src/launch.js";
import {
  BEHIND, BX, BY, CLUB_PLAYER, createBody, moveBody, OK, reachOf, runDistance, SECTOR_COS, setGoal, standFor, TOO_FAR, TOO_HIGH, waitingX,
} from "../src/player.js";
import { recordFlight } from "../src/recording.js";

const seat = { side: 1, profile: CLUB_PLAYER };
const DEGREE = Math.PI / 180;

/** A ball at `angle` degrees from the axis of a player on the +x side, `distance` away. */
const ballAt = (angle, distance, z = 0.2) => [
  2 - distance * Math.cos(angle * DEGREE),
  distance * Math.sin(angle * DEGREE),
  z,
];

describe("the arm's sector", () => {
  const body = [2, 0];
  const reach = (ball) => reachOf(body, ball, 1, CLUB_PLAYER);

  it("is the constant it says", () => {
    assert.ok(Math.abs(SECTOR_COS - Math.cos(110 * DEGREE)) < 1e-15);
  });

  it("takes everything up to 110° on either side, nothing beyond", () => {
    for (const angle of [0, 60, 109.9, -109.9]) assert.equal(reach(ballAt(angle, 0.5)), OK, `${angle}`);
    for (const angle of [110.1, -110.1, 180]) assert.equal(reach(ballAt(angle, 0.5)), BEHIND, `${angle}`);
  });

  it("ends at the arm's length", () => {
    assert.equal(reach(ballAt(30, 0.79)), OK);
    assert.equal(reach(ballAt(30, 0.81)), TOO_FAR);
  });

  it("has a band of height", () => {
    assert.equal(reach(ballAt(0, 0.5, 1.19)), OK);
    assert.equal(reach(ballAt(0, 0.5, 1.21)), TOO_HIGH);
    assert.equal(reach(ballAt(0, 0.5, -0.49)), OK);
    assert.equal(reach(ballAt(0, 0.5, -0.51)), TOO_HIGH);
  });

  it("turns with the side: the axis points towards the net", () => {
    assert.equal(reachOf([-2, 0], [-1.6, 0, 0.2], -1, CLUB_PLAYER), OK);
    assert.equal(reachOf([-2, 0], [-2.4, 0, 0.2], -1, CLUB_PLAYER), BEHIND);
  });

  it("takes a ball exactly on the body", () => {
    assert.equal(reach([2, 0, 0.2]), OK);
  });
});

describe("the body", () => {
  const run = (body, seconds) => {
    let fastest = 0;
    for (let i = 0; i < seconds / STEP; i += 1) {
      const [x, y] = [body[BX], body[BY]];
      moveBody(body, seat);
      fastest = Math.max(fastest, Math.sqrt((body[BX] - x) * (body[BX] - x) + (body[BY] - y) * (body[BY] - y)) / STEP);
    }
    return fastest;
  };

  it("waits behind the line, in the middle", () => {
    const body = createBody(1, CLUB_PLAYER);
    assert.deepEqual([body[BX], body[BY]], [1.87, 0]);
    assert.equal(waitingX(-1, CLUB_PLAYER), -1.87);
  });

  it("gets to its goal and stops, never faster than its limit", () => {
    const body = createBody(1, CLUB_PLAYER);
    setGoal(body, [2.5, 1.5], seat);
    const fastest = run(body, 3);
    assert.ok(fastest <= 3.001 && fastest > 2.9, `${fastest}`);
    assert.ok(Math.abs(body[BX] - 2.5) < 0.01 && Math.abs(body[BY] - 1.5) < 0.01, `${body[BX]}, ${body[BY]}`);
  });

  it("takes as long as its acceleration says over a short run", () => {
    const body = createBody(1, CLUB_PLAYER);
    setGoal(body, [1.87, 3], seat);
    run(body, 0.25);
    assert.ok(Math.abs(body[BY] - runDistance(0.25, CLUB_PLAYER)) < 0.02, `${body[BY]}`);
  });

  it("does not cross the table, beyond its lean", () => {
    const body = createBody(1, CLUB_PLAYER);
    setGoal(body, [0.2, 0.1], seat);
    run(body, 3);
    assert.ok(Math.abs(body[BY]) >= 0.7625 || body[BX] >= 0.97 - 1e-9, `${body[BX]}, ${body[BY]}`);
    assert.ok(Math.abs(standFor([0.5, 0], 1, CLUB_PLAYER)[0] - 0.97) < 1e-9);
  });

  it("stays on its side of the net", () => {
    assert.ok(standFor([-1, 2], 1, CLUB_PLAYER)[0] >= 0);
  });

  it("slides around the end of the table, mirrored on the other side", () => {
    assert.deepEqual(standFor([0.1, 0], 1, CLUB_PLAYER), [0.1, 0.7625]);
    assert.deepEqual(standFor([-0.1, 0], -1, CLUB_PLAYER), [-0.1, -0.7625]);
    assert.deepEqual(standFor([0.1, -0.5], 1, CLUB_PLAYER), [0.1, -0.7625]);
  });
});

describe("how far a body runs", () => {
  it("speeds up, then holds its speed", () => {
    assert.equal(runDistance(0, CLUB_PLAYER), 0);
    assert.equal(runDistance(-1, CLUB_PLAYER), 0);
    const speedUp = 3 / 14;
    assert.ok(Math.abs(runDistance(speedUp / 2, CLUB_PLAYER) - (0.5 * 14 * (speedUp / 2) ** 2)) < 1e-12);
    assert.ok(Math.abs(runDistance(1, CLUB_PLAYER) - (1.5 * speedUp + 3 * (1 - speedUp))) < 1e-12);
  });

  /** The furthest start behind the line that still gets the ball within reach before its second bounce, on the ball's axis. */
  function furthestBack(key) {
    const recording = recordFlight(throwBall(PRESETS[key].launch));
    const second = recording.events[1];
    const last = second.step - 1;
    const x = recording.frames[last * 9];
    return x + CLUB_PLAYER.reach + runDistance(last * STEP - CLUB_PLAYER.reaction, CLUB_PLAYER) - 1.37;
  }

  it("Sami's two cuts are caught from 2.60 m and 1.89 m behind the line at best (docs/recherche/chiffres.md, § 8)", () => {
    assert.ok(Math.abs(furthestBack("twoBounces") - 2.6) < 0.01, `${furthestBack("twoBounces")}`);
    assert.ok(Math.abs(furthestBack("twoBouncesOver") - 1.89) < 0.01, `${furthestBack("twoBouncesOver")}`);
  });
});
