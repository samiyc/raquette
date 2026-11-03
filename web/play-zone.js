import { strokeZone } from "../src/stroke-zone.js";
import { ballPath, expectedMiss, nextContact } from "../src/strokes.js";

const GRAIN = 10; // Per metre: the contact moves by a few centimetres with each key, and the zone with it hardly at all.

/** The zone of the stroke picked, worked out again only when the ball, the stroke or the place of the contact change. */
function createZone() {
  let key = "";
  let cells = [];
  return (state, rule, contact) => {
    const now = contact ? [state.tick, rule.stroke, Math.round(contact[0] * GRAIN), Math.round(contact[1] * GRAIN)].join() : "";
    if (now !== key) cells = contact ? strokeZone(state, { who: 0, rule }) : [];
    key = now;
    return cells;
  };
}

const zoneOf = createZone();

/** What a pause shows: the ball's way, where the stroke takes it, the circle, and where it can go. */
export function readThePause(live, state, rule) {
  const contact = nextContact(state, 0, rule);
  live.contact = contact ? [contact.ball[0], contact.ball[1]] : null;
  live.path = ballPath(state);
  live.miss = expectedMiss(state, { who: 0, rule }) ?? live.miss;
  live.zone = zoneOf(state, rule, live.contact);
}
