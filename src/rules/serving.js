import { createRng, streamOf } from "mcts-commun/random.js";
import { SERVICE_KINDS } from "../services.js";

/**
 * The service as a tunable rule picks it (Sami, 10/11/2026). Rules drew theirs at random; against itself, H wins 63 % of its points
 * with the hammer or the soft service and 54 % with the sidespin one (docs/recherche/autojeu.md). A weight for each kind, the kind
 * drawn in proportion, so that self-play can move them a little at a time; and for each kind, where across it lands (`serveAim…`) and
 * where across its end the server stands (`serveFrom…`), both signed, in the server's own frame. The place counts as much as the
 * kind: against H, a cut service from −0.25 m down the line to −0.45 m wins 59 % of the points, the same to the middle 47 %, and the
 * best place of each kind is not another's (docs/recherche/autojeu.md). Each is a hypothesis.
 */
const KINDS = Object.keys(SERVICE_KINDS);
const named = (prefix) => KINDS.map((key) => `${prefix}${key[0].toUpperCase()}${key.slice(1)}`);

/** The weight of each kind, `servePendule` to `serveLateral`. */
export const SERVE_KEYS = Object.freeze(named("serve"));
/** Where each kind lands across the table, and where its server stands. */
export const SERVE_AIMS = Object.freeze(named("serveAim"));
export const SERVE_FROMS = Object.freeze(named("serveFrom"));

/** Every kind as likely, as the rules' random services were, from the middle to the middle. */
export const SERVE_NUMBERS = Object.freeze(
  Object.fromEntries([...SERVE_KEYS.map((key) => [key, 1]), ...SERVE_AIMS.map((key) => [key, 0]), ...SERVE_FROMS.map((key) => [key, 0])]),
);

const SERVE_STREAM = 6029; // Next to the services' own streams (src/services.js), far from the scatter's.

/** The kind a draw in [0, 1) falls on, in proportion to the weights; every kind as likely if they are all 0. */
function kindAt(draw, weights, total) {
  let left = draw * (total || KINDS.length);
  let at = 0;
  while (at < KINDS.length - 1 && left >= (total ? weights[at] : 1)) {
    left -= total ? weights[at] : 1;
    at += 1;
  }
  return at;
}

/**
 * The rule's service picker, or null if its numbers have no service: it then gets a random one, as before.
 * @param {Record<string, number>} numbers
 * @returns {((rally: {seed: number, server: number}) => {key: string, y: number, from: number}) | null}
 */
export function servicePicker(numbers) {
  if (![...SERVE_KEYS, ...SERVE_AIMS, ...SERVE_FROMS].every((key) => key in numbers)) return null;
  const weights = SERVE_KEYS.map((key) => Math.max(0, numbers[key]));
  const total = weights.reduce((sum, weight) => sum + weight, 0);
  return ({ seed, server }) => {
    const rng = createRng(streamOf(seed, SERVE_STREAM + server).int(2 ** 31));
    const at = kindAt(rng.next(), weights, total);
    return { key: KINDS[at], y: numbers[SERVE_AIMS[at]], from: numbers[SERVE_FROMS[at]] };
  };
}
