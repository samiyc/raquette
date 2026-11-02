import { BALL_SIZE, X, Y } from "./ball/constants.js";
import { advance, FLOOR_TOUCH, NET_TOUCH, NONE, TABLE_BOUNCE } from "./ball/table.js";

/**
 * A ball's flight kept step by step, for the page to replay: the page draws what is recorded here and decides nothing.
 * It allocates, unlike the step itself.
 *
 * @typedef {import("./types.js").Recording} Recording
 * @typedef {import("./types.js").FlightEvent} FlightEvent
 */
const MAX_STEPS = 960; // Four seconds: a ball rolling on the table would never end.

/** @returns {FlightEvent} */
function eventOf(kind, step, ball, contact) {
  return kind === TABLE_BOUNCE
    ? { kind: "table", step, x: contact[0], y: contact[1] }
    : { kind: kind === NET_TOUCH ? "net" : "floor", step, x: ball[X], y: ball[Y] };
}

/**
 * @param {Float64Array} start the ball; it is left as it is
 * @returns {Recording}
 */
export function recordFlight(start) {
  const ball = start.slice();
  const frames = new Float64Array((MAX_STEPS + 1) * BALL_SIZE);
  frames.set(ball);
  const contact = new Float64Array(3);
  const events = [];
  let steps = 0;
  let kind = NONE;
  while (steps < MAX_STEPS && kind !== NET_TOUCH && kind !== FLOOR_TOUCH) {
    kind = advance(ball, contact);
    steps += 1;
    frames.set(ball, steps * BALL_SIZE);
    if (kind !== NONE) events.push(eventOf(kind, steps, ball, contact));
  }
  return { steps, frames: frames.slice(0, (steps + 1) * BALL_SIZE), events };
}
