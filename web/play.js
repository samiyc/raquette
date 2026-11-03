import { nextSpeed } from "mcts-commun/replay-keys.js";
import { BALL_SIZE } from "../src/ball/constants.js";
import {
  closePoint, createGame, nextPoint, pointOver, robotPicks, servicePicture, stepsFor, winnerOf,
} from "../src/game.js";
import { destinationOf, orderOf } from "../src/mouse.js";
import { BX, BY } from "../src/player.js";
import { ballPath, depthFor, expectedMiss, nextContact, STROKE_KINDS, strokeChoices } from "../src/strokes.js";
import { drawBallPath, drawOrders, drawScene } from "./draw.js";
import { SPEEDS } from "./player.js";
import { frameText, rallyText } from "./readout.js";
import { exportWon, savePoint } from "./play-files.js";
import { createStepper } from "./play-steps.js";
import { layoutFor } from "./scale.js";
import { buildServices, buildStrokes, letGoOfButtons, showServices, showStrokes } from "./stroke-panel.js";

/** The page of the game at the mouse: it listens and draws; what decides is in src/game.js and src/mouse.js. */
const byId = (id) => document.getElementById(id);
const input = (id) => /** @type {HTMLInputElement} */ (byId(id));
const canvas = /** @type {HTMLCanvasElement} */ (byId("view"));
const context = canvas.getContext("2d");
const live = { game: null, point: null, running: false, speed: 0.25, carry: 0, last: 0, looping: false, contact: null, path: null, miss: 0.16, waiting: false, owed: 0, toEvent: false, clicks: [] };
let layout = layoutFor(canvas.clientWidth);

const scatterNow = () => Number(input("scatter").value) / 100;

function scoreText() {
  const [mine, theirs] = live.game.score;
  return `${mine} - ${theirs}`;
}

/** The strokes that make sense now, worked out during a pause: a stroke no longer possible falls back to a plain one. */
function refreshStrokes() {
  if (live.running || !live.point || live.point.closed) return;
  const { rule, state } = live.point;
  const choices = strokeChoices(state, { who: 0, rule });
  showStrokes(byId("strokes"), choices, rule.stroke);
  showServices(byId("services"), state.tick === 0 && state.server === 0, rule.service);
  readThePause(state, rule);
  const lost = choices[rule.stroke] !== null && rule.stroke !== "flat";
  if (lost && choices.flat === null) pick("flat");
}

/** What a pause shows: the ball's way, where the stroke takes it, and the circle. */
function readThePause(state, rule) {
  const contact = nextContact(state, 0, rule);
  live.contact = contact ? [contact.ball[0], contact.ball[1]] : null;
  live.path = ballPath(state);
  live.miss = expectedMiss(state, { who: 0, rule }) ?? live.miss;
}

function pickService(key) {
  if (live.point && !live.point.closed) stepper.sendOrder({ service: key });
  render();
}

function pick(key) {
  if (!live.point || live.point.closed) return;
  const { rule, state } = live.point;
  const depth = depthFor(state, { who: 0, rule }, key);
  stepper.sendOrder({ stroke: key });
  if (depth !== null) stepper.sendOrder({ aimAt: [depth, rule.aim[1]] });
  render();
}

function render() {
  refreshStrokes();
  byId("score").textContent = scoreText();
  byId("play").textContent = live.running ? "Pause" : "Lecture";
  byId("speed-label").textContent = String(SPEEDS.find(([value]) => value === live.speed)[1]);
  input("scatter").parentElement.querySelector("#scatter-label").textContent = `${Math.round(scatterNow() * 100)} %`;
  if (!live.point) return;
  const { recording } = live.point.recorder;
  context.setTransform(canvas.width / layout.width, 0, 0, canvas.width / layout.width, 0, 0);
  drawScene(context, layout, recording, recording.steps);
  const body = live.point.state.bodies[0];
  const goal = destinationOf(live.point.rule, body);
  const paused = !live.running && !live.point.closed;
  if (paused && live.path) drawBallPath(context, layout, live.path);
  drawOrders(context, layout, { aim: live.point.rule.aim, goal, body: [body[BX], body[BY]], miss: live.miss, contact: paused ? live.contact : null });
  byId("frame").textContent = frameText(recording, recording.steps, BALL_SIZE);
}

function resize() {
  layout = layoutFor(canvas.clientWidth);
  const ratio = window.devicePixelRatio || 1;
  canvas.width = Math.round(layout.width * ratio);
  canvas.height = Math.round(layout.height * ratio);
  canvas.style.height = `${layout.height}px`;
  render();
}

/** The next game takes the next seed: the same seed would draw the same scatter again. */
function endOfGameText(winner) {
  input("seed").value = String(live.game.seed + live.game.played);
  return winner === 0 ? "Manche gagnée." : "Manche perdue.";
}

/** The point is over: the score, then a word on what happened. */
function endPoint() {
  const { point, game } = live;
  live.running = false;
  savePoint(point);
  closePoint(game);
  const winner = winnerOf(game.score);
  const said = rallyText({ seed: point.seed, result: point.state.result }, ["vous gagnez", "le robot gagne"]);
  byId("events").textContent = winner < 0 ? said : `${said} ${endOfGameText(winner)}`;
  input("next").disabled = winner >= 0;
}

function afterSteps() {
  if (live.point && !live.point.closed && pointOver(live.point)) {
    live.point.closed = true;
    endPoint();
  }
  render();
}

const stepper = createStepper({
  live,
  autopause: () => input("autopause").checked,
  say: (text) => {
    byId("events").textContent = text;
  },
  done: afterSteps,
  onService: ({ service, seed }) => {
    if (live.game && seed === live.game.seed + live.game.played) beginPoint(service ?? undefined);
  },
});

function loop(time) {
  live.looping = live.running;
  if (!live.running) return;
  const { steps, carry } = stepsFor((time - live.last) / 1000, live.speed, live.carry);
  live.last = time;
  live.carry = carry;
  if (!live.waiting) stepper.runSteps(steps);
  afterSteps();
  if (live.running) requestAnimationFrame(loop);
  else live.looping = false;
}

function setRunning(running) {
  live.running = running && live.point !== null && !live.point.closed;
  live.last = performance.now();
  live.carry = 0;
  if (live.running && !live.looping) {
    live.looping = true;
    requestAnimationFrame(loop);
  }
  render();
}

function startPoint() {
  if (!live.game || winnerOf(live.game.score) >= 0) return;
  live.game.scatter = scatterNow();
  if (!robotPicks(live.game)) {
    beginPoint();
    return;
  }
  byId("events").textContent = "Le robot choisit son service…";
  stepper.askService(servicePicture(live.game));
}

function beginPoint(robotService) {
  live.point = nextPoint(live.game, robotService);
  live.waiting = false;
  live.toEvent = false;
  live.clicks.length = 0;
  const who = live.point.server === 0 ? "Vous servez" : "Le robot sert";
  byId("events").textContent = `${who} : placez-vous, visez, puis espace.`;
  setRunning(false);
}

function newGame() {
  live.game = createGame({ seed: Number(input("seed").value), scatter: scatterNow(), robot: /** @type {HTMLSelectElement} */ (byId("robot")).value });
  live.point = null;
  input("next").disabled = false;
  startPoint();
}

function clickOnView(event) {
  event.preventDefault();
  if (!live.point || live.point.closed) return;
  const box = canvas.getBoundingClientRect();
  const click = { px: event.clientX - box.left, py: event.clientY - box.top, button: event.button };
  const order = orderOf(click, { ...layout, forward: 1 });
  if (!order) return;
  stepper.sendOrder(order);
  render();
}

function stepOnce(run) {
  if (!live.point || live.point.closed || live.waiting) return;
  setRunning(false);
  run();
  afterSteps();
}

const faster = (way) => {
  live.speed = nextSpeed(SPEEDS, live.speed, way);
  render();
};
const togglePlay = () => {
  if (live.point?.closed) startPoint();
  else setRunning(!live.running);
};
const oneFrame = () => stepOnce(() => stepper.runSteps(4));
const toEvent = () => stepOnce(() => stepper.runToNext());

const KEYS = { " ": togglePlay, ".": oneFrame, n: toEvent, "+": () => faster(1), "-": () => faster(-1) };
Object.keys(STROKE_KINDS).forEach((key, i) => {
  KEYS[String(i + 1)] = () => pick(key);
});

function onKey(event) {
  if (event.target === input("seed")) return;
  const action = KEYS[event.key];
  if (!action) return;
  event.preventDefault();
  action();
}

function wire() {
  letGoOfButtons();
  byId("next").addEventListener("click", startPoint);
  byId("new").addEventListener("click", newGame);
  byId("play").addEventListener("click", togglePlay);
  byId("step").addEventListener("click", oneFrame);
  byId("event").addEventListener("click", toEvent);
  byId("slower").addEventListener("click", () => faster(-1));
  byId("faster").addEventListener("click", () => faster(1));
  byId("export").addEventListener("click", () => {
    byId("events").textContent = `${exportWon(live.game)} point(s) gagné(s) exporté(s) : à ranger un par fichier dans positions/.`;
  });
  input("scatter").addEventListener("input", render);
  canvas.addEventListener("pointerdown", clickOnView);
  canvas.addEventListener("contextmenu", (event) => event.preventDefault());
  document.addEventListener("keydown", onKey);
  window.addEventListener("resize", resize);
}

buildServices(byId("services"), pickService);
buildStrokes(byId("strokes"), pick);
wire();
newGame();
resize();
