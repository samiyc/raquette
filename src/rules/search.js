import { createRng, streamOf } from "mcts-commun/random.js";
import { createClimb } from "mcts-commun/climb.js";
import { BALL_SIZE } from "../ball/constants.js";
import { frames } from "../forecast.js";
import { rollout, setUpRollout } from "../rollout.js";
import { choicesAt, STROKE_KINDS } from "../strokes.js";
import { bestService } from "./service-search.js";
import { RULES } from "./ladder.js";

/**
 * The first search (docs/modele.md, § 8): a climb on the numbers of the next stroke, against a fixed model of the opponent, the
 * best simple rule. A stroke is the point aimed at, the speed and the two brushes; when to take the ball stays the rule's. Each plan is
 * scored on the same few draws of its own stream, never on the world's: a plan cannot know the scatter to come, and noting it on
 * one draw would reward luck. In the player's own frame, so that two players facing each other do mirror images.
 *
 * With `freshEvery: 1`, every plan is drawn afresh and nothing is climbed: the witness of the flat Monte-Carlo.
 *
 * It tries only what can be played (Sami, 3/11/2026): a fresh plan is drawn among the strokes that make sense for this ball, and a
 * soft plan on a ball too fast for one scores nothing without being played. `pruned: false` takes that away, to measure it.
 */
const GENES = 5;
const [DEPTH, WIDE, SPEED, BRUSH, SIDE] = [0, 1, 2, 3, 4];
const LOW = [0.2, -0.7, 2.5, -10, -8.8];
const HIGH = [1.25, 0.7, 13, 14, 8.8];
const NEAR = [0.3, 0.3, 3, 6, 6]; // How far a mutation moves a gene at full amplitude.
const MOVED = 2; // Genes moved by a mutation, at most.
const BRUSH_ROOM = 2; // m/s around a stroke's brush, for a fresh plan.
const SOFT = 4.5; // m/s: a plan under this is a controlled stroke.
const SEARCH_STREAM = 7919; // Far from the world's streams, which go up to 2 000.

const clamp = (value, gene) => Math.max(LOW[gene], Math.min(HIGH[gene], value));

function mutatePlan(child, best, amplitude, rng) {
  child.set(best);
  for (let moved = 1 + rng.int(MOVED); moved > 0; moved -= 1) {
    const gene = rng.int(GENES);
    child[gene] = clamp(best[gene] + (rng.next() * 2 - 1) * NEAR[gene] * amplitude, gene);
  }
}

function freshPlan(plan, rng) {
  for (let gene = 0; gene < GENES; gene += 1) plan[gene] = LOW[gene] + rng.next() * (HIGH[gene] - LOW[gene]);
}

/** A fresh plan around one of the strokes that make sense for this ball, drawn at random, aimed anywhere it can go. */
function freshFromKinds(plan, keys, rng) {
  freshPlan(plan, rng);
  const { swing, depths } = STROKE_KINDS[keys[rng.int(keys.length)]];
  if (depths) plan[DEPTH] = depths[rng.int(depths.length)];
  plan[SPEED] = clamp(swing.speed * (0.8 + rng.next() * 0.4), SPEED);
  plan[BRUSH] = clamp(swing.brushUp + (rng.next() * 2 - 1) * BRUSH_ROOM, BRUSH);
  plan[SIDE] = swing.sideways ? plan[SIDE] : (rng.next() * 2 - 1) * BRUSH_ROOM;
}

/** The strokes that make sense for the ball at this step of the way. */
function playableKinds(view, base, step) {
  const ball = frames.slice(step * BALL_SIZE, (step + 1) * BALL_SIZE);
  const choices = choicesAt(ball, { side: view.side, aim: base.target });
  const keys = Object.keys(choices).filter((key) => choices[key] === null);
  return { keys, softAllowed: keys.includes("push") || keys.includes("short") };
}

/** The genes of a stroke of the model, in the player's own frame: the plan to start from. */
function encode(plan, intent, forward) {
  plan[DEPTH] = clamp(forward * intent.target[0], DEPTH);
  plan[WIDE] = clamp(forward * intent.target[1], WIDE);
  plan[SPEED] = clamp(intent.swing.speed, SPEED);
  plan[BRUSH] = clamp(intent.swing.brushUp, BRUSH);
  plan[SIDE] = clamp(intent.swing.brushSide, SIDE);
}

/** What a plan asks of the rally, written into a stroke kept from plan to plan. */
function decode(stroke, plan, forward) {
  stroke.target[0] = forward * plan[DEPTH];
  stroke.target[1] = forward * plan[WIDE];
  stroke.swing.speed = plan[SPEED];
  stroke.swing.brushUp = plan[BRUSH];
  stroke.swing.brushSide = plan[SIDE];
}

const SEARCH_DEFAULTS = { draws: 8, horizon: 4, model: RULES.R3, freshEvery: 10, name: "S", pruned: true, serves: true };

/**
 * @param {{budget: number, draws?: number, horizon?: number, model?: any, freshEvery?: number, name?: string, pruned?: boolean, serves?: boolean}} setup
 *   `budget` plans a stroke, each on `draws` rollouts of at most `horizon` strokes, the players following `model`. `serves`: it picks its
 *   service too. 8 draws: 53,1 % against 4, more than a larger budget (docs/recherche/chiffres.md, § 8)
 * @returns {import("../types.js").Rule}
 */
export function createSearch(setup) {
  const { budget, draws, horizon, model, freshEvery, name, pruned, serves } = { ...SEARCH_DEFAULTS, ...setup };
  const climb = createClimb({ genes: GENES });

  function decide(view) {
    const base = model.decide(view);
    if (!base) return null;
    const forward = -view.side;
    const kinds = pruned ? playableKinds(view, base, base.step) : null;
    const stroke = { target: base.target.slice(), swing: { ...base.swing }, next: base.next };
    const recover = (target) => model.recovery?.(view, target) ?? base.next;
    const setup = setUpRollout(view.state, { who: view.who, step: base.step, goal: base.goal, next: base.next }, model);
    const seeds = Array.from({ length: draws }, (_, i) => streamOf(view.state.tick, SEARCH_STREAM + i).int(2 ** 31));
    const problem = {
      start: (first) => encode(first, base, forward),
      score(candidate) {
        if (kinds && !kinds.softAllowed && candidate[SPEED] < SOFT) return 0;
        decode(stroke, candidate, forward);
        stroke.next = recover(stroke.target);
        let won = 0;
        for (const seed of seeds) won += rollout(setup, { stroke, seed, horizon });
        return won / draws;
      },
      mutate: mutatePlan,
      fresh: kinds?.keys.length ? (candidate, rng) => freshFromKinds(candidate, kinds.keys, rng) : freshPlan,
    };
    const { plan: best } = climb.run(problem, { budget, freshEvery, rng: createRng(view.state.tick + SEARCH_STREAM) });
    climb.forget();
    decode(stroke, best, forward);
    return { ...base, target: stroke.target.slice(), swing: { ...stroke.swing }, next: recover(stroke.target) };
  }

  const rule = { name, version: 3, decide };
  if (serves) rule.chooseService = (rally) => bestService(rally, { model, draws: 2 * draws, horizon });
  return rule;
}
