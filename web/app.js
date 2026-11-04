import { replayHint, replayKeys } from "mcts-commun/replay-keys.js";
import { BALL_SIZE, STEP } from "../src/ball/constants.js";
import { PRESETS, throwBall } from "../src/launch.js";
import { CLUB_PLAYER } from "../src/player.js";
import { recordRally } from "../src/rally-recording.js";
import { recordFlight } from "../src/recording.js";
import { DUELS } from "../src/rules/drills.js";
import { drawScene } from "./draw.js";
import { createPlayer, SPEEDS } from "./player.js";
import { eventsText, frameText, rallyText } from "./readout.js";
import { layoutFor } from "./scale.js";
import { createWatch } from "./watch.js";

/** The page: a ball thrown by hand, or a rally between two robots. It listens and draws; what decides is in src/. */
const FIELDS = [
  ["speed", "Vitesse (m/s)", 0.5, 35, 0.5],
  ["elevation", "Élévation (°)", -20, 80, 1],
  ["azimuth", "Direction (°)", -30, 30, 1],
  ["topspin", "Lift ou coupé (tr/s)", -159, 159, 1],
  ["sidespin", "Latéral (tr/s)", -80, 80, 1],
  ["x", "Départ x (m)", -3, -0.1, 0.05],
  ["z", "Départ hauteur (m)", 0, 1, 0.05],
];
const DEFAULTS = { x: -1.6, z: 0.3, elevation: 0, azimuth: 0, topspin: 0, sidespin: 0 };

const byId = (id) => document.getElementById(id);
const position = /** @type {HTMLInputElement} */ (byId("position"));
const canvas = /** @type {HTMLCanvasElement} */ (byId("view"));
const context = canvas.getContext("2d");
const inputs = {};
/** @type {any} a flight or a rally: the view draws both */
let recording = recordFlight(throwBall(PRESETS.top.launch));
let layout = layoutFor(canvas.clientWidth);

const player = createPlayer({ onChange: render, frames: (run) => requestAnimationFrame(run) });

/** A rally of two robots, come from their worker. */
function showRally(rally) {
  recording = rally;
  player.load(recording.steps);
}

const say = (text) => {
  byId("events").textContent = text;
};
const watch = createWatch({ byId, show: showRally, say });

function render() {
  const index = Math.min(recording.steps, Math.round(player.t() / STEP));
  context.setTransform(canvas.width / layout.width, 0, 0, canvas.width / layout.width, 0, 0);
  drawScene(context, layout, recording, index);
  byId("frame").textContent = frameText(recording, index, BALL_SIZE);
  position.value = String(player.end() ? player.t() / player.end() : 0);
  if (player.end() > 0 && player.t() >= player.end()) watch.ended();
  byId("play").textContent = player.playing() ? "Pause" : "Lecture";
  byId("speed-label").textContent = String(SPEEDS.find(([value]) => value === player.speed())[1]);
}

function resize() {
  layout = layoutFor(canvas.clientWidth);
  const ratio = window.devicePixelRatio || 1;
  canvas.width = Math.round(layout.width * ratio);
  canvas.height = Math.round(layout.height * ratio);
  canvas.style.height = `${layout.height}px`;
  render();
}

function launchNow() {
  watch.stop();
  const launch = Object.fromEntries(Object.entries(inputs).map(([key, input]) => [key, Number(input.value)]));
  recording = recordFlight(throwBall(/** @type {import("../src/types.js").Launch} */ (/** @type {unknown} */ (launch))));
  byId("events").textContent = eventsText(recording);
  player.load(recording.steps);
}

function watchRally() {
  watch.stop();
  const seed = Number(/** @type {HTMLInputElement} */ (byId("seed")).value);
  const duel = DUELS[/** @type {HTMLSelectElement} */ (byId("duel")).value];
  recording = recordRally({ seed, server: seed % 2, players: duel.players(CLUB_PLAYER), service: duel.service });
  byId("events").textContent = rallyText({ seed, result: recording.result });
  player.load(recording.steps);
}

function usePreset(key) {
  const { launch } = PRESETS[key];
  for (const [name, input] of Object.entries(inputs)) input.value = String(launch[name] ?? DEFAULTS[name]);
  launchNow();
}

function buildControls() {
  const select = /** @type {HTMLSelectElement} */ (byId("preset"));
  for (const [key, { label }] of Object.entries(PRESETS)) select.add(new Option(label, key));
  const duel = /** @type {HTMLSelectElement} */ (byId("duel"));
  for (const [key, { label }] of Object.entries(DUELS)) duel.add(new Option(label, key));
  select.addEventListener("change", () => usePreset(select.value));
  for (const [name, label, min, max, step] of /** @type {[string, string, number, number, number][]} */ (FIELDS)) {
    const field = document.createElement("label");
    field.textContent = String(label);
    const input = document.createElement("input");
    Object.assign(input, { type: "number", min, max, step, value: String(DEFAULTS[name] ?? 0) });
    input.addEventListener("change", launchNow);
    inputs[name] = input;
    field.append(input);
    byId("fields").append(field);
  }
}

function wire() {
  byId("launch").addEventListener("click", launchNow);
  byId("rally").addEventListener("click", watchRally);
  byId("play").addEventListener("click", player.toggle);
  byId("slower").addEventListener("click", () => player.faster(-1));
  byId("faster").addEventListener("click", () => player.faster(1));
  position.addEventListener("input", () => player.seek(Number(position.value) * player.end()));
  const keys = replayKeys({ step: 1 / 60, bigStep: 0.1 });
  document.addEventListener("keydown", (event) => keys(player, event));
  byId("hint").textContent = replayHint({ step: "1/60 s", bigStep: "0,1 s", of: " du vol" });
  window.addEventListener("resize", resize);
}

buildControls();
wire();
resize();
usePreset("top");
