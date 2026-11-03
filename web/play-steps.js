import {
  clickPoint, giveAnswer, needsAnswer, PAGE_BUDGET, pictureFor, pointOver, stepPoint,
} from "../src/game.js";

/**
 * How the live game moves on, with a search thinking in a worker: the steps wait for its answer, and the page goes on drawing and
 * listening. What is decided stays in src/game.js.
 *
 * @typedef {{live: any, autopause: () => boolean, say: (text: string) => void, done: () => void, worker: Worker, onService: (answer: any) => void}} Page
 */

function ask(page, owed) {
  const { live, worker } = page;
  live.waiting = true;
  live.owed = owed;
  worker.postMessage({ picture: pictureFor(live.point), who: 1, robot: live.point.robot, budget: PAGE_BUDGET });
}

/** One step of the point. @returns {boolean} whether the steps must stop there */
function stepOne(page) {
  const { live } = page;
  live.point.robotStruck = false;
  stepPoint(live.point);
  if (!live.point.robotStruck || !page.autopause()) return false;
  live.running = false;
  page.say("Le robot a frappé : à vous.");
  return true;
}

/** Stops at each stroke of the robot, if asked, so that there is time to click; a decision to wait for stops it too. */
function runSteps(page, steps) {
  const { live } = page;
  for (let i = 0; i < steps && !pointOver(live.point); i += 1) {
    if (needsAnswer(live.point)) {
      ask(page, steps - i);
      return;
    }
    if (stepOne(page)) return;
  }
}

/** Up to the next stroke or bounce. */
function runToNext(page) {
  const { live } = page;
  live.point.sawEvent = false;
  live.toEvent = true;
  while (live.toEvent && !pointOver(live.point) && !live.point.sawEvent && !live.waiting) runSteps(page, 1);
  live.toEvent = live.waiting && !live.point.sawEvent;
}

/** What comes after the answered step: the event still awaited, or the steps owed. */
function carryOn(page, owed) {
  if (page.live.toEvent) runToNext(page);
  else if (owed > 0) runSteps(page, owed);
}

const isAnswerAwaited = ({ waiting, point }, tick) => waiting && point && !point.closed && tick === point.state.tick;

/** The answer: its step is played, then the clicks made in the meantime count, then the steps owed. */
function onAnswer(page, { tick, intent }) {
  const { live } = page;
  if (!isAnswerAwaited(live, tick)) return;
  live.waiting = false;
  giveAnswer(live.point, intent);
  const owed = live.owed - 1;
  live.owed = 0;
  const stopped = stepOne(page);
  for (const order of live.clicks.splice(0)) clickPoint(live.point, order);
  if (!stopped) carryOn(page, owed);
  page.done();
}

/** An order during the worker's thinking counts just after its step: the worker was shown the rally as it stood. */
function sendOrder({ live, say }, order) {
  if (live.waiting) live.clicks.push(order);
  else if (!clickPoint(live.point, order)) say("Trop tard : la préparation a commencé.");
}

/** @param {Omit<Page, "worker">} setup */
export function createStepper(setup) {
  const worker = new Worker(new URL("search-worker.js", import.meta.url), { type: "module" });
  const page = { ...setup, worker };
  worker.addEventListener("message", ({ data }) => {
    if ("service" in data) page.onService(data);
    else onAnswer(page, data);
  });
  return {
    runSteps: (steps) => runSteps(page, steps),
    runToNext: () => runToNext(page),
    sendOrder: (order) => sendOrder(page, order),
    askService: (service) => worker.postMessage({ service, robot: service.robot, budget: service.budget }),
  };
}
