import { createMatch, nextRally, scoreRally } from "../src/watch.js";
import { rallyText } from "./readout.js";

const ROBOTS = [
  ["R0", "R0, renvoie au centre"],
  ["R1", "R1, vise les coins"],
  ["R3", "R3, attaque"],
  ["T", "T, l'angle"],
  ["U", "U, le régulier"],
  ["V", "V, fait courir"],
  ["W", "W, top et coupé"],
  ["X", "X, se replace"],
  ["Y", "Y, attend pour finir"],
  ["Z", "Z, patient"],
  ["S", "La recherche"],
  ["S-mT", "La recherche, modèle T"],
  ["S-mU", "La recherche, modèle U"],
  ["S-mV", "La recherche, modèle V"],
  ["S-mW", "La recherche, modèle W"],
  ["S-mY", "La recherche, modèle Y"],
];
const BETWEEN_RALLIES = 700; // Milliseconds to see how the point ended.

function fillMenus(byId) {
  for (const id of ["left", "right"]) for (const [name, label] of ROBOTS) byId(id).add(new Option(label, name));
  byId("left").value = "U";
  byId("right").value = "R3";
}

const scoreText = (match) => `${match.left} ${match.score[0]} – ${match.score[1]} ${match.right}`;

/** The score moves when the point ends on screen, not when the worker has played it: nothing is told in advance. */
function finishedText(match, { result, seed }) {
  scoreRally(match, result);
  const winners = [`${match.left} gagne`, `${match.right} gagne`];
  return `${scoreText(match)}. ${rallyText({ seed, result }, winners)}`;
}

/**
 * Two robots play a match under the page's eyes: a worker plays each rally, the page's player shows it, and the next one follows.
 * @param {{byId: (id: string) => any, show: (recording: any) => void, say: (text: string) => void}} page
 */
export function createWatch({ byId, show, say }) {
  const worker = new Worker(new URL("rally-worker.js", import.meta.url), { type: "module" });
  const now = { match: null, shown: null, waiting: /** @type {any} */ (0) };

  const stop = () => {
    Object.assign(now, { match: null, shown: null });
    clearTimeout(now.waiting);
    byId("match").textContent = "Faire jouer";
  };
  const ask = () => {
    say(`${scoreText(now.match)} : ils jouent…`);
    worker.postMessage(nextRally(now.match));
  };
  worker.onmessage = ({ data: { recording, played } }) => {
    if (!now.match) return;
    now.shown = { result: recording.result, seed: played };
    say(`${scoreText(now.match)}. Graine ${played}, l'échange en cours.`);
    show(recording);
  };
  fillMenus(byId);
  byId("match").addEventListener("click", () => {
    if (now.match) return stop();
    now.match = createMatch({ seed: Number(byId("seed").value), left: byId("left").value, right: byId("right").value });
    byId("match").textContent = "Arrêter";
    return ask();
  });
  return {
    stop,
    /** The rally shown has ended: the next one, in a moment. */
    ended() {
      if (!now.shown) return;
      say(finishedText(now.match, now.shown));
      now.shown = null;
      now.waiting = setTimeout(ask, BETWEEN_RALLIES);
    },
  };
}
