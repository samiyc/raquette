const KEY_STEP = 0.05; // Metres a key moves the body by; held down, it repeats.
const MOVES = { z: [0, KEY_STEP], s: [0, -KEY_STEP], q: [-KEY_STEP, 0], d: [KEY_STEP, 0] };

/** The keys that move the body, along the screen's directions (Sami, 3/11/2026), caps or not. */
export function moveKeys(send) {
  return Object.fromEntries(Object.entries(MOVES).flatMap(([key, by]) => [[key, () => send(by)], [key.toUpperCase(), () => send(by)]]));
}

/**
 * What each key of the page does.
 * @param {{togglePlay: () => void, oneFrame: () => void, toEvent: () => void, faster: (way: number) => void, pick: (key: string) => void,
 *   sendMove: (by: number[]) => void, strokes: string[]}} page
 * @returns {Record<string, () => void>}
 */
export function keysOf({ togglePlay, oneFrame, toEvent, faster, pick, sendMove, strokes }) {
  const keys = { " ": togglePlay, ".": oneFrame, n: toEvent, "+": () => faster(1), "-": () => faster(-1), ...moveKeys(sendMove) };
  strokes.forEach((key, i) => {
    keys[String(i + 1)] = () => pick(key);
  });
  return keys;
}
