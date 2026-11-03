import { TABLE, VX, VY, VZ, X, Y } from "./ball/constants.js";
import { BX, BY } from "./player.js";

/**
 * What makes a stroke less sure (docs/modele.md, § 4; Sami, 3/11/2026): each is a factor on the scatter, 1 when it costs nothing. All of
 * them are hypotheses, with their questions in docs/recherche/questions.md.
 */

/** The normal draw, as a sum of uniforms: exact arithmetic, unlike Box-Muller's logarithm and cosine (docs/modele.md, § 3). */
export function normalDraw(rng) {
  let sum = -6;
  for (let i = 0; i < 12; i += 1) sum += rng.next();
  return sum;
}

/** Too little time to prepare: ×2 with none at all. */
export function rushOf(seconds, profile) {
  if (seconds >= profile.preparation) return 1;
  return 1 + (profile.rushedScatter - 1) * (1 - seconds / profile.preparation);
}

/** The end of the arm: nothing up to a comfortable distance, then up to `stretchedScatter` at full reach. */
export function stretchOf(ball, body, profile) {
  const dx = ball[X] - body[BX];
  const dy = ball[Y] - body[BY];
  const distance = Math.sqrt(dx * dx + dy * dy);
  if (distance <= profile.comfort) return 1;
  return 1 + ((profile.stretchedScatter - 1) * (distance - profile.comfort)) / (profile.reach - profile.comfort);
}

/** A fast ball: a racket could otherwise give way by just what it takes, and return a smash as softly as it likes at no cost. */
export function controlOf(ball, profile) {
  const speed = Math.sqrt(ball[VX] * ball[VX] + ball[VY] * ball[VY] + ball[VZ] * ball[VZ]);
  return speed <= profile.easyBall ? 1 : 1 + (speed - profile.easyBall) / profile.controlLoss;
}

/** Far from the table: the further from it, the harder to be precise. Nothing near it, then more and more. */
export function farOf(ball, side, profile) {
  const back = side * ball[X] - TABLE.halfLength;
  return back <= profile.nearTable ? 1 : 1 + (back - profile.nearTable) / profile.farLoss;
}
