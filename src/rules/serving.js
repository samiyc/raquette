import { createRng, streamOf } from "mcts-commun/random.js";
import { SERVICE_KINDS } from "../services.js";

/**
 * The service as a tunable rule picks it (Sami, 10/11/2026). Rules drew theirs at random; against itself, H wins 63 % of its points
 * with the hammer or the soft service and 54 % with the sidespin one (docs/recherche/autojeu.md). A weight for each kind, the kind
 * drawn in proportion, so that self-play can move them a little at a time and a rule stays hard to read; how far across it lands
 * (`serveWide`, on either side at random) and where across its end the server stands (`serveFrom`). Each is a hypothesis.
 */
export const SERVE_KEYS = Object.freeze(Object.keys(SERVICE_KINDS).map((key) => `serve${key[0].toUpperCase()}${key.slice(1)}`));

/** Every kind as likely, as the rules' random services were, landing a little off the middle, from the middle. */
export const SERVE_NUMBERS = Object.freeze({ ...Object.fromEntries(SERVE_KEYS.map((key) => [key, 1])), serveWide: 0.3, serveFrom: 0 });

const SERVE_STREAM = 6029; // Next to the services' own streams (src/services.js), far from the scatter's.

/**
 * The rule's service picker, or null if its numbers have no service: it then gets a random one, as before.
 * @param {Record<string, number>} numbers
 * @returns {((rally: {seed: number, server: number}) => {key: string, y: number, from: number}) | null}
 */
export function servicePicker(numbers) {
  if (!SERVE_KEYS.every((key) => key in numbers)) return null;
  const kinds = Object.keys(SERVICE_KINDS);
  const weights = SERVE_KEYS.map((key) => Math.max(0, numbers[key]));
  const total = weights.reduce((sum, weight) => sum + weight, 0);
  return ({ seed, server }) => {
    const rng = createRng(streamOf(seed, SERVE_STREAM + server).int(2 ** 31));
    let left = rng.next() * (total || kinds.length);
    let at = 0;
    while (at < kinds.length - 1 && left >= (total ? weights[at] : 1)) {
      left -= total ? weights[at] : 1;
      at += 1;
    }
    const y = (rng.next() < 0.5 ? -1 : 1) * numbers.serveWide;
    return { key: kinds[at], y, from: numbers.serveFrom };
  };
}
