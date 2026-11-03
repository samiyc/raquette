import { nextSpeed } from "mcts-commun/replay-keys.js";
import { BALL_SIZE } from "../src/ball/constants.js";
import {
  clickPoint, closePoint, createGame, nextPoint, pointOver, positionOf, replayOfPoint, runToEvent, stepPoint, stepsFor, winnerOf,
} from "../src/game.js";
import { destinationOf, orderOf } from "../src/mouse.js";
import { BX, BY } from "../src/player.js";
import { drawOrders, drawScene } from "./draw.js";
import { SPEEDS } from "./player.js";
import { frameText, rallyText } from "./readout.js";
import { layoutFor } from "./scale.js";

/** The page of the game at the mouse: it listens and draws; what decides is in src/game.js and src/mouse.js. */
const byId = (id) => document.getElementById(id);
const input = (id) => /** @type {HTMLInputElement} */ (byId(id));
const canvas = /** @type {HTMLCanvasElement} */ (byId("view"));
const context = canvas.getContext("2d");
const live = { game: null, point: null, running: false, speed: 0.25, carry: 0, last: 0, looping: false };
let layout = layoutFor(canvas.clientWidth);

const scatterNow = () => Number(input("scatter").value) / 100;

function scoreText() {
  const [mine, theirs] = live.game.score;
  return `${mine} - ${theirs}`;
}

function render() {
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
  drawOrders(context, layout, { aim: live.point.rule.aim, goal, body: [body[BX], body[BY]], scatter: live.point.scatter });
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

/** Every point is kept by the page server, out of git (docs/replays.md). A page opened without it plays on all the same. */
function savePoint(point) {
  fetch("/api/replays", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(replayOfPoint(point)) }).catch(() => {});
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

/** Stops at each stroke of the robot, if asked, so that there is time to click. */
function runSteps(steps) {
  for (let i = 0; i < steps && !pointOver(live.point); i += 1) {
    live.point.robotStruck = false;
    stepPoint(live.point);
    if (live.point.robotStruck && input("autopause").checked) {
      live.running = false;
      byId("events").textContent = "Le robot a frappé : à vous.";
      return;
    }
  }
}

function loop(time) {
  live.looping = live.running;
  if (!live.running) return;
  const { steps, carry } = stepsFor((time - live.last) / 1000, live.speed, live.carry);
  live.last = time;
  live.carry = carry;
  runSteps(steps);
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
  live.point = nextPoint(live.game);
  const who = live.point.server === 0 ? "Vous servez" : "Le robot sert";
  byId("events").textContent = `${who} : placez-vous, visez, puis espace.`;
  setRunning(false);
}

function newGame() {
  live.game = createGame({ seed: Number(input("seed").value), scatter: scatterNow() });
  live.point = null;
  input("next").disabled = false;
  startPoint();
}

function exportWon() {
  const won = live.game.points.filter((point) => point.state.result.winner === 0).map(positionOf);
  const link = document.createElement("a");
  link.href = URL.createObjectURL(new Blob([JSON.stringify(won, null, 2)], { type: "application/json" }));
  link.download = `positions-graine-${live.game.seed}.json`;
  link.click();
  URL.revokeObjectURL(link.href);
  byId("events").textContent = `${won.length} point(s) gagné(s) exporté(s) : à ranger un par fichier dans positions/.`;
}

function clickOnView(event) {
  event.preventDefault();
  if (!live.point || live.point.closed) return;
  const box = canvas.getBoundingClientRect();
  const click = { px: event.clientX - box.left, py: event.clientY - box.top, button: event.button };
  const order = orderOf(click, { ...layout, forward: 1 });
  if (!order) return;
  const taken = clickPoint(live.point, order);
  if (!taken) byId("events").textContent = "Trop tard pour viser : la préparation a commencé.";
  render();
}

function stepOnce(run) {
  if (!live.point || live.point.closed) return;
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
const oneFrame = () => stepOnce(() => runSteps(4));
const toEvent = () => stepOnce(() => runToEvent(live.point));

const KEYS = { " ": togglePlay, ".": oneFrame, n: toEvent, "+": () => faster(1), "-": () => faster(-1) };

function onKey(event) {
  if (event.target === input("seed")) return;
  const action = KEYS[event.key];
  if (!action) return;
  event.preventDefault();
  action();
}

/** A button keeps no focus: the space bar is the game's, and would press it again. */
function letGoOfButtons() {
  document.addEventListener("click", (event) => {
    if (event.target instanceof HTMLButtonElement || event.target instanceof HTMLInputElement) event.target.blur();
  });
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
  byId("export").addEventListener("click", exportWon);
  input("scatter").addEventListener("input", render);
  canvas.addEventListener("pointerdown", clickOnView);
  canvas.addEventListener("contextmenu", (event) => event.preventDefault());
  document.addEventListener("keydown", onKey);
  window.addEventListener("resize", resize);
}

wire();
newGame();
resize();
