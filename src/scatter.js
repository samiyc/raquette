import { TABLE, VX, VY, VZ, X, Y } from "./ball/constants.js";
import { BVX, BVY, BX, BY } from "./player.js";

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

const MOST_TILT = 4; // A face closed or open by 76°: past it, the ball goes anywhere but onto the table.

/**
 * A tilt of the face, as the tangent the racket is posed with (src/racket.js), turned by an error given as the tangent of an angle:
 * tan(a + b), without trigonometry. Adding the error to the tangent itself shrank it on a closed face, to a fifth at 64°: self-play
 * found that a slow top with a heavy brush missed 0.7 % of balls where the ordinary top missed 14 % (Sami, 9/11/2026, Q-P1).
 */
export function tiltedBy(tilt, error) {
  const across = 1 - tilt * error;
  const turned = across > 1 / MOST_TILT ? (tilt + error) / across : Math.sign(tilt + error) * MOST_TILT;
  return Math.max(-MOST_TILT, Math.min(MOST_TILT, turned));
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

/**
 * A stroke played on the run (Sami, 4/11/2026): whatever pulled a body wide cost it nothing, so that a left and right on the edges never
 * paid. Nothing while it adjusts its feet, then more and more (Q-P23).
 */
export function runningOf(body, profile) {
  const speed = Math.sqrt(body[BVX] * body[BVX] + body[BVY] * body[BVY]);
  return speed <= profile.easyRun ? 1 : 1 + (speed - profile.easyRun) / profile.runningLoss;
}

/**
 * A big swing (Sami, 3/11/2026): nothing up to the ordinary top, then more and more. Without it, a brush cost nothing: self-play found
 * a racket at 5 m/s brushing at 16 m/s, 13 m/s and 150 turns on nine balls out of ten. A sideways brush weighs more: it is further
 * from the stroke's own line.
 * @param {{speed: number, brushUp: number, brushSide: number}} swing the speed kept by the aim
 * @param {any} profile
 */
export function effortOf({ speed, brushUp, brushSide }, profile) {
  const side = profile.sideWeight * brushSide;
  const effort = Math.sqrt(speed * speed + brushUp * brushUp + side * side);
  return effort <= profile.easySwing ? 1 : 1 + (effort - profile.easySwing) / profile.swingLoss;
}

/**
 * What a stroke spends (Sami, 6/11/2026): the square of the swing against the ordinary top, which spends 1. A push spends next to
 * nothing, a kill nearly twice as much.
 */
export function energyOf({ speed, brushUp, brushSide }, profile) {
  const side = profile.sideWeight * brushSide;
  return (speed * speed + brushUp * brushUp + side * side) / (profile.easySwing * profile.easySwing);
}

/** Tired by the strokes already played in the rally: nothing at first, one more scatter for every `tiredLoss` spent (Q-P26). */
export const tiredOf = (spent, profile) => 1 + spent / profile.tiredLoss;

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
