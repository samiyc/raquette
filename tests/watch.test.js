import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { createMatch, nextRally, playWatched, scoreRally } from "../src/watch.js";

describe("two robots watched on the page", () => {
  it("changes server every two points, on seeds that follow", () => {
    const match = createMatch({ seed: 10, left: "U", right: "R3" });
    const servers = [];
    for (let i = 0; i < 4; i += 1) {
      const rally = nextRally(match);
      assert.equal(rally.seed, 10 + i);
      servers.push(rally.server);
      scoreRally(match, { winner: 0 });
    }
    assert.deepEqual(servers, [0, 0, 1, 1]);
    assert.deepEqual(match.score, [4, 0]);
  });

  it("gives no one the point of a rally stopped at its limit", () => {
    const match = createMatch({ seed: 1, left: "U", right: "U" });
    scoreRally(match, { winner: -1 });
    assert.deepEqual(match.score, [0, 0]);
    assert.equal(match.played, 1);
  });

  it("replays a rally from its seed, whoever serves, and goes through a worker's message", () => {
    for (const server of [0, 1]) {
      const rally = { seed: 3, left: "T", right: "R0", server };
      const one = playWatched(rally);
      assert.deepEqual(playWatched(rally).result, one.result);
      assert.deepEqual(structuredClone(one.result), one.result);
      assert.ok(one.frames instanceof Float64Array);
    }
  });

  it("lets a search pick its own service", () => {
    const { result } = playWatched({ seed: 2, left: "S-mU", right: "R0", server: 0 });
    assert.ok(result.strokes >= 0);
  });
});
