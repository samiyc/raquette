import { aim } from "../aim.js";
import { BALL_SIZE, TABLE, VX, VY, VZ, X, Z } from "../ball/constants.js";
import { catchPlan, frames, spareTime } from "../forecast.js";
import { BY } from "../player.js";
import { numbersOf, PHASES } from "./phases.js";
import { servicePicker } from "./serving.js";
import { variedSwing } from "./vary.js";

/**
 * The rule of attack, its numbers in the open so that self-play can set them (docs/modele.md, § 8): a lift on what comes high enough,
 * a push on what stays low over the table if it can be played, flat otherwise, to the far side of the opponent, softer when rushed.
 * With its first numbers, it is R3. Each number is a hypothesis, which is the point: self-play moves them.
 *
 * Two ideas of Sami's (4/11/2026) are in numbers that R3 leaves idle. After a stroke, the body goes where the easiest answer will come:
 * the crossed one, on the other side of where the ball was sent (`cover`). And a player attacks only with the time to stand set
 * (`ready`): otherwise it plays a steadier stroke, taken earlier if it likes, which may be cut (a chop block) or not (`soft…`).
 *
 * A third (Sami, 4/11/2026): who attacks has to win the point. A ball slow and high enough, with the body set, is hit to finish it
 * (`kill…`), so that a slow rally is no longer safe. At `killSlow` 0, no ball is that slow.
 *
 * A fourth (Sami, 10/11/2026): with the numbers of its service (src/rules/serving.js), it picks it; without, it is drawn for it. And
 * with the numbers of a phase (src/rules/phases.js), it plays the return or its third ball with them.
 */
export const R3_NUMBERS = Object.freeze({
  wide: 0.5, // Metres from the middle line.
  depth: 0.685,
  topWide: 0.45,
  topDepth: 0.9,
  topSpeed: 10,
  topBrush: 10,
  pushSpeed: 3,
  pushBrush: -2,
  pushVary: 0, // m/s of brush taken off a push at random, up to this: a backspin that changes is read late (Sami, 6/11/2026).
  flatSpeed: 6.5,
  highBall: 0.25, // Metres above the table: high enough to attack.
  wait: 0.5, // Metres behind the line, between strokes.
  cover: 0, // From 0, the middle, to 1, the mirror of where the ball was sent (H, Q-P25).
  ready: -1, // Seconds to spare at the ball for an attack: at −1, anything high enough is attacked (H).
  softSpeed: 6,
  softBrush: 0,
  softDepth: 0.9,
  softWide: 0.3,
  softRise: 0.2, // Metres above the table, taken on the rise; 0, at the top of the bounce.
  killSlow: 0, // m/s at contact: a ball under this may be finished; at 0, none (H).
  killHigh: 0.25, // Metres above the table.
  killReady: 0, // Seconds to spare at the ball.
  killSpeed: 14,
  killBrush: 12, // A low ball hit hard and with little brush does not stay hard: the aim gives back half the speed to land it.
  killWide: 0.6,
});

const RUSHED = 0.15; // Seconds: under this, a prudent player hits softer (Q-P6).
const SOFT = 0.7;
const tilts = new Float64Array(3);

/**
 * The side of the other camp furthest from the opponent, given by where the opponent stands: a target wide, and as deep as asked.
 * @param {import("../types.js").View} view
 * @param {number} depth metres past the net
 * @param {number} wide metres from the middle line
 */
export function farSide(view, depth, wide) {
  const y = view.opponent[BY];
  const away = y === 0 ? view.side : -Math.sign(y);
  return [-view.side * depth, away * wide];
}

/** The ball as it will be at contact. */
export function contactOf(step) {
  const at = step * BALL_SIZE;
  const [vx, vy, vz] = [frames[at + VX], frames[at + VY], frames[at + VZ]];
  return { x: frames[at + X], height: frames[at + Z], speed: Math.sqrt(vx * vx + vy * vy + vz * vz) };
}

/** Softer when the time to prepare runs short. */
export function prudent(view, plan, swing) {
  return plan.step * view.h < RUSHED ? { ...swing, speed: swing.speed * SOFT } : swing;
}

/**
 * Does this stroke land there? A push the aim cannot land would fall on the player's own side; a top or a finishing stroke, in the net:
 * on a short service, low and slow over the table, G topped every ball and lost 53 returns out of 120 at once, the aim landing 20 of
 * them (Sami, 9/11/2026). The ball as it will be, not as it is read.
 */
function lands(view, step, target, swing) {
  const ball = frames.slice(step * BALL_SIZE, (step + 1) * BALL_SIZE);
  return aim({ ball, forward: -view.side, target, swing }, tilts);
}

/** A ball too low to attack, or an attack that would not land: pushed if it is over the table and the push lands, flat otherwise. */
function lowStroke(view, plan, x, { numbers, push, flat }) {
  const target = farSide(view, numbers.depth, numbers.wide);
  const pushed = variedSwing(push, numbers.pushVary, view);
  const pushing = view.side * x < TABLE.halfLength && lands(view, plan.step, target, pushed);
  return { swing: pushing ? pushed : flat, target, taken: plan };
}

/** An attack, if it lands. */
const attack = (view, plan, swing, target) => lands(view, plan.step, target, swing) && { swing, target, taken: plan };

/**
 * The swing, the target and the instant a ball calls for, by these numbers.
 * @param {Record<string, number>} numbers R3's, and any other
 * @returns {(view: import("../types.js").View, plan: any) => {swing: any, target: number[], taken: any}}
 */
function strokeChooser(numbers) {
  const top = { speed: numbers.topSpeed, brushUp: numbers.topBrush, brushSide: 0 };
  const push = { speed: numbers.pushSpeed, brushUp: numbers.pushBrush, brushSide: 0 };
  const flat = { speed: numbers.flatSpeed, brushUp: 0, brushSide: 0 };
  const soft = { speed: numbers.softSpeed, brushUp: numbers.softBrush, brushSide: 0 };
  const kill = { speed: numbers.killSpeed, brushUp: numbers.killBrush, brushSide: 0 };
  /** Slow and high enough, with the body set: a ball to finish. */
  const canFinish = (view, plan, { height, speed }) =>
    speed < numbers.killSlow && height >= numbers.killHigh && spareTime(view, plan) >= numbers.killReady;
  /** Not set for an attack: the steadier stroke, on the rise if it can be there in time. */
  function steady(view, plan) {
    const taken = (numbers.softRise > 0 && catchPlan(view, numbers.softRise)) || plan;
    return { swing: soft, target: farSide(view, numbers.softDepth, numbers.softWide), taken };
  }
  return function strokeFor(view, plan) {
    const contact = contactOf(plan.step);
    const { height } = contact;
    const finish = canFinish(view, plan, contact) && attack(view, plan, kill, farSide(view, numbers.topDepth, numbers.killWide));
    if (finish) return finish;
    const high = height >= numbers.highBall;
    if (high && spareTime(view, plan) < numbers.ready) return steady(view, plan);
    const topped = high && attack(view, plan, top, farSide(view, numbers.topDepth, numbers.topWide));
    if (topped) return topped;
    return lowStroke(view, plan, contact.x, { numbers, push, flat });
  };
}

/**
 * @param {Partial<typeof R3_NUMBERS>} given what differs from R3
 * @param {string} name
 * @param {number} [version]
 * @returns {import("../types.js").Rule}
 */
export function createTunable(given, name, version = 1) {
  const numbers = { ...R3_NUMBERS, ...given };
  const rally = strokeChooser(numbers);
  /** By the strokes already played (PHASES): the return, the third ball, then the rest of the rally. */
  const phased = [];
  for (const [phase, count] of Object.entries(PHASES)) {
    const own = numbersOf(numbers, phase);
    phased[count] = own ? strokeChooser(own) : rally;
  }
  const strokeFor = (view, plan) => (phased[view.state.strokes] ?? rally)(view, plan);
  /** Where the body goes once the ball has left for `target`. */
  const recovery = (view, target) => [view.side * (TABLE.halfLength + numbers.wait), 0 - numbers.cover * target[1]];
  const chooseService = servicePicker(given);
  return {
    name,
    version,
    recovery,
    ...(chooseService && { chooseService }),
    decide(view) {
      const plan = catchPlan(view);
      if (!plan) return null;
      const { swing, target, taken } = strokeFor(view, plan);
      return { step: taken.step, goal: taken.goal, target, swing: prudent(view, taken, swing), next: recovery(view, target) };
    },
  };
}
