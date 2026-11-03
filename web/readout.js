import { STEP, VX, VY, VZ, WX, WY, WZ, X, Y, Z } from "../src/ball/constants.js";
import { liftOf } from "./scale.js";

/** The words under the view: plain functions over a recording, tested under Node. */
const TURN = 2 * Math.PI;
const fixed = (value, digits) => value.toFixed(digits).replace(".", ",").replace("-", "−");

const WHERE = { table: "rebond", net: "filet", floor: "sol" };

/** Which camp a bounce is in, for a ball sent from x < 0 towards x > 0. */
const camp = (x) => (x < 0 ? "son camp" : "camp adverse");

function eventText({ kind, step, x, y }) {
  const time = `${fixed(step * STEP, 2)} s`;
  if (kind === "table") return `rebond à ${time}, ${camp(x)}, x ${fixed(x, 2)}, y ${fixed(y, 2)}`;
  return `${WHERE[kind]} à ${time}, x ${fixed(x, 2)}`;
}

/** Two bounces in the other camp in a row, first of all: nobody took the ball between them, and the point is the striker's. */
function twoBounces(events) {
  return events.length > 1 && events[0].kind === "table" && events[1].kind === "table" && events[0].x > 0 && events[1].x > 0;
}

/** What the flight ran into, the first few only: a ball that ends rolling bounces many times. */
export function eventsText(recording) {
  const events = recording.events;
  if (events.length === 0) return "La balle ne touche rien en 4 s.";
  const shown = events.slice(0, 3).map(eventText);
  if (events.length > 3) shown.push(`${events.length - 3} autre(s) ensuite`);
  const verdict = twoBounces(events) ? " Deux rebonds : point gagné si le receveur n'arrive pas avant le second." : "";
  return `${shown.join(" ; ")}.${verdict}`;
}

const CAUSES = {
  net: "balle dans le filet",
  out: "balle hors de la table",
  twoBounces: "deux rebonds, le receveur n'est pas arrivé à temps",
  notReached: "balle pas rejointe",
  behind: "balle passée dans le dos, hors du secteur",
  limit: "limite de 60 coups, sans vainqueur",
};

/**
 * How a rally went, in a sentence.
 * @param {{seed: number, result: any}} rally
 * @param {string[]} [winners] how to say each winner
 */
export function rallyText({ seed, result }, winners = ["le joueur de gauche gagne", "le joueur de droite gagne"]) {
  const end = result.winner < 0 ? CAUSES.limit : `${winners[result.winner]} : ${CAUSES[result.cause]}`;
  return `Graine ${seed}, ${result.strokes} coup(s) après le service, ${fixed(result.ticks * STEP, 2)} s ; ${end}.`;
}

/** The ball at one frame: time, height, speed, spin. */
export function frameText(recording, index, size) {
  const at = index * size;
  const f = recording.frames;
  const speed = Math.sqrt(f[at + VX] ** 2 + f[at + VY] ** 2 + f[at + VZ] ** 2);
  const lift = liftOf(f[at + VX], f[at + VY], f[at + WX], f[at + WY]) / TURN;
  const kind = lift >= 0 ? "lift" : "coupé";
  return [
    `${fixed(index * STEP, 2)} s`,
    `x ${fixed(f[at + X], 2)} m, y ${fixed(f[at + Y], 2)} m`,
    `hauteur ${fixed(f[at + Z], 2)} m`,
    `${fixed(speed, 1)} m/s`,
    `${kind} ${fixed(Math.abs(lift), 0)} tr/s`,
    `latéral ${fixed(f[at + WZ] / TURN, 0)} tr/s`,
  ].join(" · ");
}
