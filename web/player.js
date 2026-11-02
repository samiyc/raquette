import { nextSpeed, within } from "mcts-commun/replay-keys.js";
import { STEP } from "../src/ball/constants.js";

/** The clock of a replay, in seconds of the simulation; the slow speeds are short, a flight lasts about a second. */
export const SPEEDS = [[0.125, "1/8"], [0.25, "1/4"], [0.5, "1/2"], [1, "×1"]];

/**
 * What `replayKeys` drives (mcts-commun/src/replay-keys.js): `t`, `end`, `seek`, `toggle`, `faster`. `onChange` draws;
 * `frames` is the time source, `requestAnimationFrame` in the page, `now` its clock in milliseconds. One loop at most
 * runs: a flight loaded during another must not play at twice the speed.
 */
export function createPlayer({ onChange, frames, now = () => performance.now() }) {
  const state = { t: 0, end: 0, speed: 0.25, playing: false, last: 0, looping: false };
  const tick = (time) => {
    state.looping = state.playing;
    if (!state.playing) return;
    state.t = within(state.t + ((time - state.last) / 1000) * state.speed, state.end);
    state.last = time;
    state.playing = state.t < state.end;
    state.looping = state.playing;
    onChange();
    if (state.playing) frames(tick);
  };
  const play = () => {
    state.playing = true;
    state.last = now();
    if (!state.looping) frames(tick);
    state.looping = true;
  };
  const seek = (t) => {
    state.t = within(t, state.end);
    onChange();
  };
  const toggle = () => {
    if (!state.playing && state.t >= state.end) state.t = 0;
    if (state.playing) state.playing = false;
    else play();
    onChange();
  };
  /** A new flight, played from its start. */
  const load = (steps) => {
    state.end = steps * STEP;
    state.t = 0;
    play();
    onChange();
  };
  const faster = (way) => {
    state.speed = nextSpeed(SPEEDS, state.speed, way);
    onChange();
  };
  return { t: () => state.t, end: () => state.end, seek, toggle, faster, load, speed: () => state.speed, playing: () => state.playing };
}
