import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { createPlayer } from "../web/player.js";

/** A player on a hand-driven clock: `run(ms)` plays the frames asked for, one each `ms`. */
function rig() {
  const waiting = [];
  let time = 0;
  let drawn = 0;
  const player = createPlayer({
    onChange: () => { drawn += 1; },
    frames: (fn) => waiting.push(fn),
    now: () => time,
  });
  const run = (ms) => {
    time += ms;
    waiting.splice(0).forEach((fn) => fn(time));
  };
  return { player, run, waiting, drawn: () => drawn };
}

const near = (actual, expected) => Math.abs(actual - expected) < 1e-9;

describe("the replay's clock", () => {
  it("plays a new flight from its start, at its speed", () => {
    const { player, run } = rig();
    player.load(240);
    assert.equal(player.end(), 1);
    assert.equal(player.playing(), true);
    run(1000);
    assert.ok(near(player.t(), 0.25));
  });

  it("keeps one loop when a flight is loaded during another", () => {
    const { player, run, waiting } = rig();
    player.load(240);
    run(100);
    player.load(240);
    assert.equal(waiting.length, 1);
    run(1000);
    assert.ok(near(player.t(), 0.25));
  });

  it("keeps one loop through a quick pause and play", () => {
    const { player, waiting } = rig();
    player.load(240);
    player.toggle();
    player.toggle();
    assert.equal(waiting.length, 1);
  });

  it("stops at the end, and starts over on the next play", () => {
    const { player, run, waiting } = rig();
    player.load(24);
    run(10000);
    assert.equal(player.playing(), false);
    assert.ok(near(player.t(), player.end()));
    assert.equal(waiting.length, 0);
    player.toggle();
    assert.equal(player.t(), 0);
    assert.equal(player.playing(), true);
  });

  it("pauses, and does not move while paused", () => {
    const { player, run } = rig();
    player.load(240);
    run(100);
    player.toggle();
    const held = player.t();
    run(1000);
    assert.equal(player.t(), held);
    assert.equal(player.playing(), false);
  });

  it("seeks within the flight, and draws", () => {
    const { player, drawn } = rig();
    player.load(240);
    const before = drawn();
    player.seek(5);
    assert.equal(player.t(), 1);
    player.seek(-1);
    assert.equal(player.t(), 0);
    assert.equal(drawn(), before + 2);
  });

  it("goes through its speeds, and stops at both ends", () => {
    const { player } = rig();
    assert.equal(player.speed(), 0.25);
    player.faster(1);
    assert.equal(player.speed(), 0.5);
    player.faster(1);
    player.faster(1);
    assert.equal(player.speed(), 1);
    for (let i = 0; i < 5; i += 1) player.faster(-1);
    assert.equal(player.speed(), 0.125);
  });
});
