import { playWatched } from "../src/watch.js";

/** A rally between two robots, on a thread of its own: a search takes seconds, and the page goes on drawing. */
globalThis.onmessage = ({ data }) => {
  globalThis.postMessage({ recording: playWatched(data), played: data.seed });
};
