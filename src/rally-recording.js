import { BALL_SIZE, X, Y } from "./ball/constants.js";
import { NET_TOUCH, NONE, TABLE_BOUNCE } from "./ball/table.js";
import { BX, BY } from "./player.js";
import { playRally } from "./rally.js";

/**
 * A rally kept step by step, for the page to replay: the page draws what is recorded here and decides nothing. It allocates,
 * unlike a rally played for a measure. A live game reads the recording as it grows.
 *
 * @typedef {import("./types.js").RallyRecording} RallyRecording
 */
const BODY_NUMBERS = 4;
const FIRST_SIZE = 2048;

/** @returns {import("./types.js").FlightEvent} */
function eventOf(kind, step, state) {
  if (kind === TABLE_BOUNCE) return { kind: "table", step, x: state.contact[0], y: state.contact[1] };
  return { kind: kind === NET_TOUCH ? "net" : "floor", step, x: state.ball[X], y: state.ball[Y] };
}

function grown(array, needed) {
  if (needed <= array.length) return array;
  const bigger = new Float64Array(array.length * 2);
  bigger.set(array);
  return bigger;
}

/** Writes where the ball and the bodies are at this step. */
function writeFrame(recording, step, state) {
  recording.frames.set(state.ball, step * BALL_SIZE);
  state.bodies.forEach((body, i) => {
    recording.bodies[step * BODY_NUMBERS + i * 2] = body[BX];
    recording.bodies[step * BODY_NUMBERS + i * 2 + 1] = body[BY];
  });
}

/** What a player changed before the service: the first picture must show it. */
export const retakeFirstFrame = (recording, state) => writeFrame(recording, 0, state);

/** A recording that grows at each step, and what a rally tells it. */
export function createRecorder() {
  const recording = {
    steps: -1,
    frames: new Float64Array(FIRST_SIZE * BALL_SIZE),
    bodies: new Float64Array(FIRST_SIZE * BODY_NUMBERS),
    events: [],
    strokes: [],
    result: null,
  };
  const listener = {
    tick(state) {
      recording.steps += 1;
      const step = recording.steps;
      recording.frames = grown(recording.frames, (step + 1) * BALL_SIZE);
      recording.bodies = grown(recording.bodies, (step + 1) * BODY_NUMBERS);
      writeFrame(recording, step, state);
      recording.result = state.result;
    },
    flight(kind, state) {
      if (kind !== NONE) recording.events.push(eventOf(kind, recording.steps + 1, state));
    },
    stroke(_who, tick) {
      recording.strokes.push(tick);
    },
  };
  return { recording, listener };
}

/**
 * @param {import("./types.js").RallyOptions} options
 * @returns {RallyRecording}
 */
export function recordRally(options) {
  const { recording, listener } = createRecorder();
  const result = playRally({ ...options, listener });
  const size = recording.steps + 1;
  return {
    ...recording,
    frames: recording.frames.slice(0, size * BALL_SIZE),
    bodies: recording.bodies.slice(0, size * BODY_NUMBERS),
    result,
  };
}
