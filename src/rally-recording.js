import { BALL_SIZE, X, Y } from "./ball/constants.js";
import { NET_TOUCH, NONE, TABLE_BOUNCE } from "./ball/table.js";
import { BX, BY } from "./player.js";
import { playRally } from "./rally.js";

/**
 * A rally kept step by step, for the page to replay: the page draws what is recorded here and decides nothing. It allocates,
 * unlike a rally played for a measure.
 *
 * @typedef {import("./types.js").RallyRecording} RallyRecording
 */
/** @returns {import("./types.js").FlightEvent} */
function eventOf(kind, step, state) {
  if (kind === TABLE_BOUNCE) return { kind: "table", step, x: state.contact[0], y: state.contact[1] };
  return { kind: kind === NET_TOUCH ? "net" : "floor", step, x: state.ball[X], y: state.ball[Y] };
}

/**
 * @param {import("./types.js").RallyOptions} options
 * @returns {RallyRecording}
 */
export function recordRally(options) {
  const balls = [];
  const bodies = [];
  const events = [];
  const strokes = [];
  const listener = {
    tick(state) {
      balls.push(state.ball.slice());
      for (const body of state.bodies) bodies.push(body[BX], body[BY]);
    },
    flight(kind, state) {
      if (kind !== NONE) events.push(eventOf(kind, balls.length, state));
    },
    stroke(_who, tick) {
      strokes.push(tick);
    },
  };
  const result = playRally({ ...options, listener });
  const frames = new Float64Array(balls.length * BALL_SIZE);
  balls.forEach((ball, i) => frames.set(ball, i * BALL_SIZE));
  return { steps: balls.length - 1, frames, bodies: Float64Array.from(bodies), events, strokes, result };
}
