import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { BALL_SIZE, VX, WY, X } from "../src/ball/constants.js";
import { PRESETS, throwBall } from "../src/launch.js";
import { recordFlight } from "../src/recording.js";
import { eventsText, frameText, rallyText } from "../web/readout.js";
import {
  ballRadius, COLORS, layoutFor, liftOf, sectorAngles, shadowOffset, sidePoint, sidePush, spinColor, spinMark, topPoint, trailStart,
} from "../web/scale.js";

const flightOf = (key) => recordFlight(throwBall(PRESETS[key].launch));
const kinds = (recording) => recording.events.map((event) => event.kind);
const close = (actual, expected, tolerance = 1e-9) => Math.abs(actual - expected) <= tolerance;

describe("a ball thrown by hand", () => {
  it("goes the way its angles say, its topspin square to it", () => {
    const ball = throwBall({ x: -1, z: 0.3, speed: 10, elevation: 0, azimuth: 90, topspin: 10 });
    assert.ok(close(ball[3], 0, 1e-9));
    assert.ok(close(ball[4], 10, 1e-9));
    assert.ok(close(ball[6], -10 * 2 * Math.PI, 1e-9));
    assert.ok(close(ball[7], 0, 1e-9));
  });

  it("the ball itself stays in the physical bounds", () => {
    const ball = throwBall({ speed: 60, topspin: 400 });
    assert.ok(close(ball[VX], 35));
    assert.ok(close(ball[WY], 1000));
  });
});

describe("the strokes the page offers do what they are called", () => {
  const landsInTheOtherCamp = (recording) => {
    const first = recording.events[0];
    return first.kind === "table" && first.x > 0 && first.x < 1.37;
  };

  for (const key of ["top", "fastTop", "flat", "cut", "lob", "side", "comeBack"]) {
    it(`${key} lands in the other camp`, () => {
      assert.ok(landsInTheOtherCamp(flightOf(key)), eventsText(flightOf(key)));
    });
  }

  it("the very spun top lands shorter than the top, and leaves the table faster", () => {
    const [top, fast] = [flightOf("top"), flightOf("fastTop")];
    assert.ok(fast.events[0].x < top.events[0].x);
    const after = (recording) => recording.frames[recording.events[0].step * BALL_SIZE + VX];
    assert.ok(after(fast) > after(top));
  });

  it("the strong backspin comes back after its bounce", () => {
    const recording = flightOf("comeBack");
    const after = recording.frames[recording.events[0].step * BALL_SIZE + VX];
    assert.ok(after < 0, `${after}`);
  });

  it("the net ball stops at the net, the long ball on the floor past the table", () => {
    assert.deepEqual(kinds(flightOf("net")), ["net"]);
    const long = flightOf("long");
    assert.deepEqual(kinds(long), ["floor"]);
    assert.ok(long.events[0].x > 1.37);
  });

  for (const key of ["twoBounces", "twoBouncesOver"]) {
    it(`${key} clears the net and bounces twice in the other camp`, () => {
      const [first, second] = flightOf(key).events;
      assert.equal(first.kind, "table");
      assert.equal(second.kind, "table");
      assert.ok(first.x > 0 && second.x > first.x && second.x < 1.37, eventsText(flightOf(key)));
    });
  }

  it("the chop comes from far back and bounces once, in the other camp", () => {
    const recording = flightOf("chop");
    assert.ok(landsInTheOtherCamp(recording), eventsText(recording));
    assert.ok(!(recording.events[1].kind === "table" && recording.events[1].x <= 1.37));
    assert.ok(recording.frames[X] < -2.5);
  });

  it("the sidespin goes where the page says", () => {
    const first = flightOf("side").events[0];
    assert.ok(first.y > 0);
  });
});

describe("a recording", () => {
  it("keeps the start, every step, and leaves the ball alone", () => {
    const start = throwBall(PRESETS.net.launch);
    const copy = start.slice();
    const recording = recordFlight(start);
    assert.deepEqual([...start], [...copy]);
    assert.deepEqual([...recording.frames.slice(0, BALL_SIZE)], [...start]);
    assert.equal(recording.frames.length, (recording.steps + 1) * BALL_SIZE);
    assert.ok(recording.frames[recording.steps * BALL_SIZE + X] > start[X]);
  });

  it("ends after four seconds on a ball that never leaves the table", () => {
    const recording = recordFlight(throwBall({ x: 0.5, z: 0.02, speed: 0 }));
    assert.equal(recording.steps, 960);
  });
});

describe("the words under the view", () => {
  it("say what the flight ran into", () => {
    assert.match(eventsText(flightOf("net")), /^filet à 0,\d\d s, x /);
    assert.match(eventsText(flightOf("top")), /^rebond à 0,\d\d s, camp adverse, x 1,\d\d, y 0,00 ; sol à /);
    assert.equal(eventsText({ events: [], steps: 0, frames: new Float64Array(0) }), "La balle ne touche rien en 4 s.");
  });

  it("say when a ball bounces twice in the other camp, and not otherwise", () => {
    assert.match(eventsText(flightOf("twoBounces")), /Deux rebonds : point gagné/);
    assert.doesNotMatch(eventsText(flightOf("top")), /Deux rebonds/);
    assert.doesNotMatch(eventsText(flightOf("chop")), /Deux rebonds/);
  });

  it("say how a rally went, its winner and its cause", () => {
    const result = { winner: 1, cause: "twoBounces", strokes: 3, ticks: 480 };
    assert.equal(rallyText({ seed: 7, result }), "Graine 7, 3 coup(s) après le service, 2,00 s ; le joueur de droite gagne : deux rebonds, le receveur n'est pas arrivé à temps.");
    assert.match(rallyText({ seed: 7, result: { ...result, winner: 0, cause: "net" } }), /le joueur de gauche gagne : balle dans le filet\.$/);
    assert.match(rallyText({ seed: 7, result: { ...result, winner: -1, cause: "limit" } }), /limite de 60 coups, sans vainqueur\.$/);
  });

  it("cut a long list short", () => {
    const events = Array.from({ length: 5 }, (_, i) => ({ kind: "table", step: i + 1, x: -0.5, y: 0 }));
    assert.match(eventsText({ events, steps: 5, frames: new Float64Array(0) }), /son camp.*2 autre\(s\) ensuite\.$/);
  });

  it("give the ball at a frame, in French figures", () => {
    const text = frameText(flightOf("top"), 0, BALL_SIZE);
    assert.match(text, /^0,00 s · x −1,60 m, y 0,00 m · hauteur 0,30 m · 15,0 m\/s · lift 80 tr\/s · latéral 0 tr\/s$/);
    assert.match(frameText(flightOf("cut"), 0, BALL_SIZE), /coupé 30 tr\/s/);
  });
});

describe("the view", () => {
  const layout = layoutFor(960);

  it("puts both bands on one scale, the table centred", () => {
    assert.deepEqual(topPoint(layout, 0, 0), [480, layout.topHeight / 2]);
    assert.equal(topPoint(layout, 1, 0)[0], sidePoint(layout, 1, 0)[0]);
    assert.ok(topPoint(layout, 0, 1)[1] < topPoint(layout, 0, -1)[1]);
    assert.ok(sidePoint(layout, 0, 1)[1] < sidePoint(layout, 0, 0)[1]);
    assert.ok(close(sidePoint(layout, 0, -0.76)[1], layout.height));
  });

  it("grows the ball and moves its shadow away with height, within bounds", () => {
    assert.ok(ballRadius(0.5) > ballRadius(0));
    assert.ok(shadowOffset(0.5) > shadowOffset(0));
    assert.equal(ballRadius(-0.5), ballRadius(0));
    assert.equal(ballRadius(3), ballRadius(1));
  });

  it("reads a lift from the ball's way, whichever way it goes", () => {
    assert.equal(liftOf(10, 0, 0, 300), 300);
    assert.equal(liftOf(-10, 0, 0, -300), 300);
    assert.equal(liftOf(10, 0, 0, -300), -300);
    assert.equal(liftOf(0, 10, -300, 0), 300);
    assert.equal(liftOf(0, 0, 0, 300), 0);
  });

  it("opens each player's sector towards the net, 220° wide", () => {
    const [from, to] = sectorAngles(-1);
    assert.ok(close(from, (-110 * Math.PI) / 180));
    assert.ok(close(to, (110 * Math.PI) / 180));
    const [back, round] = sectorAngles(1);
    assert.ok(close((back + round) / 2, Math.PI));
    assert.ok(close(round - back, (220 * Math.PI) / 180));
  });

  it("starts the trail at the last stroke played", () => {
    assert.equal(trailStart(undefined, 50), 0);
    assert.equal(trailStart([10, 40, 90], 5), 0);
    assert.equal(trailStart([10, 40, 90], 40), 40);
    assert.equal(trailStart([10, 40, 90], 89), 40);
  });

  it("colours and marks the spin", () => {
    assert.equal(spinColor(0), COLORS.neutral);
    assert.equal(spinColor(600), COLORS.lift);
    assert.equal(spinColor(1000), COLORS.lift);
    assert.equal(spinColor(-600), COLORS.cut);
    assert.deepEqual([spinMark(300), spinMark(-300), spinMark(5)], ["+", "−", ""]);
  });

  it("points the sidespin arrow the way the ball is pushed", () => {
    assert.equal(sidePush(10, 300), 1);
    assert.equal(sidePush(-10, 300), -1);
    assert.equal(sidePush(10, 5), 0);
    assert.equal(sidePush(0, 300), 0);
  });
});

describe("the colours, for anyone", () => {
  const channels = (hex) => [1, 3, 5].map((at) => Number.parseInt(hex.slice(at, at + 2), 16) / 255);
  const linear = (c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
  const luminance = (rgb) => 0.2126 * rgb[0] + 0.7152 * rgb[1] + 0.0722 * rgb[2];
  const contrast = (a, b) => {
    const [l1, l2] = [luminance(a.map(linear)), luminance(b.map(linear))].sort((x, y) => y - x);
    return (l1 + 0.05) / (l2 + 0.05);
  };

  it("the three ball colours stand out on the table and the floor, by WCAG's 3:1", () => {
    for (const ball of [COLORS.neutral, COLORS.lift, COLORS.cut]) {
      for (const ground of [COLORS.table, COLORS.floor]) {
        assert.ok(contrast(channels(ball), channels(ground)) >= 3, `${ball} on ${ground}`);
      }
    }
  });

  /** Machado et al. 2009, severity 1.0, on linear RGB. */
  const VISIONS = {
    protanopia: [[0.152286, 1.052583, -0.204868], [0.114503, 0.786281, 0.099216], [-0.003882, -0.048116, 1.051998]],
    deuteranopia: [[0.367322, 0.860646, -0.227968], [0.280085, 0.672501, 0.047413], [-0.01182, 0.04294, 0.968881]],
    tritanopia: [[1.255528, -0.076749, -0.178779], [-0.078411, 0.930809, 0.147602], [0.004733, 0.691367, 0.3039]],
  };
  const seen = (hex, matrix) => {
    const rgb = channels(hex).map(linear);
    return matrix.map((row) => row[0] * rgb[0] + row[1] * rgb[1] + row[2] * rgb[2]);
  };
  const apart = (a, b) => Math.sqrt(a.reduce((sum, c, i) => sum + (c - b[i]) ** 2, 0));

  it("lift and backspin stay apart under the three colour blindnesses", () => {
    for (const [name, matrix] of Object.entries(VISIONS)) {
      const distance = apart(seen(COLORS.lift, matrix), seen(COLORS.cut, matrix));
      assert.ok(distance > 0.08, `${name}: ${distance}`);
    }
  });
});
