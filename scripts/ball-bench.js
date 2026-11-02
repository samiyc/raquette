import { PerformanceObserver } from "node:perf_hooks";
import { createBall, fly } from "../src/ball/flight.js";
import { STEP } from "../src/ball/constants.js";
import { advance, NONE } from "../src/ball/table.js";

/**
 * `node scripts/ball-bench.js [million steps]`: the cost of a step of flight and of a whole simulation step, with the
 * coefficient tables, and the collections they cause. docs/modele.md, § 3: past 100 ns a step, the tables become a grid.
 */
const count = Number(process.argv[2] ?? 20) * 1e6;
const WARM_UP = 1e6;

/** Starts of every kind, so that the tables are read at different places. */
const STARTS = [
  createBall([-1.5, 0, 0.25], [8, 0, 1.1], [0, 0, 0]),
  createBall([-1.6, 0.2, 0.3], [15, -1, 0.8], [0, 500, 0]),
  createBall([-1.4, -0.3, 0.2], [12, 1, 2.5], [0, 700, 80]),
  createBall([-1.5, 0, 0.1], [5, 0, 1.6], [0, -190, 0]),
  createBall([-1.6, 0, 0.3], [24, 0, 0.3], [0, 300, 0]),
];

function runSimulation(steps) {
  const ball = STARTS[0].slice();
  const contact = new Float64Array(3);
  let next = 0;
  for (let i = 0; i < steps; i += 1) {
    if (advance(ball, contact) !== NONE) {
      next = (next + 1) % STARTS.length;
      ball.set(STARTS[next]);
    }
  }
}

function runFlight(steps) {
  const ball = STARTS[1].slice();
  for (let i = 0; i < steps; i += 1) {
    fly(ball, STEP);
    if (i % 60 === 0) ball.set(STARTS[1]);
  }
}

function timed(name, run) {
  run(WARM_UP);
  const started = performance.now();
  run(count);
  const nanoseconds = ((performance.now() - started) * 1e6) / count;
  console.log(`${name.padEnd(28)} ${nanoseconds.toFixed(1).replace(".", ",")} ns par pas`);
}

let collections = 0;
const observer = new PerformanceObserver((list) => {
  collections += list.getEntries().length;
});
observer.observe({ entryTypes: ["gc"] });
timed("vol seul", runFlight);
timed("vol, table, filet, sol", runSimulation);
await new Promise((done) => setTimeout(done, 20));
observer.disconnect();
console.log(`${collections} collection(s) sur ${(2 * (count + WARM_UP)) / 1e6} millions de pas, échauffement compris`);
