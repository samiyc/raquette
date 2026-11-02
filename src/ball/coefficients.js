/**
 * The drag and Magnus coefficients of Conti et al. 2026 (Sony AI), their tables I to III, read against their figures
 * 1 and 2 (docs/recherche/chiffres.md, § 2). Both run twice per flight step, and nothing may allocate there: a double
 * passed to a call or returned by one that V8 does not inline becomes a heap number. So the numbers travel in a
 * Float64Array, the same lesson as Mad Pod Racing's garbage collector.
 */

/** Where each number sits in the work cell. */
export const SPEED = 0;
export const SPIN = 1;
export const SPIN_RATIO = 2;
export const DRAG = 3;
export const MAGNUS = 4;
const LOW = 5;
const HIGH = 6;
const PART = 7;
export const WORK_SIZE = 8;

const scalar = new Float64Array(WORK_SIZE);

const SPIN_RATIO_POINTS = 6;
const SPIN_RATIO_MAX = 2;
const DRAG_SPEED_MIN = 2.5;
const DRAG_SPEED_STEP = 5;
const DRAG_SPEED_MAX = 30; // The article extrapolates "up to around 30 m/s"; past that, the value is held.

/** Table I: per reference speed 2.5, 7.5, 12.5, 17.5 m/s, six spin ratios, then their six drag coefficients. */
const DRAG_TABLE = Float64Array.of(
  0, 0.3, 0.7, 0.95, 1.5, 2, 0.55, 0.55, 0.55, 0.55, 0.55, 0.55,
  0, 0.4, 0.75, 1.1, 1.3, 2, 0.49, 0.49, 0.55, 0.48, 0.53, 0.53,
  0, 0.4, 0.62, 0.95, 1.3, 2, 0.47, 0.47, 0.53, 0.41, 0.48, 0.48,
  0, 0.4, 0.5, 0.84, 1.2, 2, 0.47, 0.47, 0.51, 0.37, 0.45, 0.45,
);
const DRAG_ROW = 2 * SPIN_RATIO_POINTS;

/** The piecewise linear drag of one reference speed, at a spin ratio already within [0, 2], written at `into`. */
function dragAt(work, row, into) {
  const start = row * DRAG_ROW;
  const ratio = work[SPIN_RATIO];
  let i = 1;
  while (i < SPIN_RATIO_POINTS - 1 && ratio > DRAG_TABLE[start + i]) i += 1;
  const low = DRAG_TABLE[start + i - 1];
  const valueLow = DRAG_TABLE[start + SPIN_RATIO_POINTS + i - 1];
  const valueHigh = DRAG_TABLE[start + SPIN_RATIO_POINTS + i];
  work[into] = valueLow + ((valueHigh - valueLow) * (ratio - low)) / (DRAG_TABLE[start + i] - low);
}

/**
 * `C_D(v, Sp)`, from `work[SPEED]` and `work[SPIN_RATIO]` into `work[DRAG]`: linear in speed between the reference
 * speeds, extrapolated from the last two past 17.5 m/s, held below 2.5 and above 30.
 * @param {Float64Array} work
 */
export function writeDrag(work) {
  if (work[SPIN_RATIO] > SPIN_RATIO_MAX) work[SPIN_RATIO] = SPIN_RATIO_MAX;
  const speed = work[SPEED];
  work[PART] = speed < DRAG_SPEED_MIN ? DRAG_SPEED_MIN : speed;
  if (work[PART] > DRAG_SPEED_MAX) work[PART] = DRAG_SPEED_MAX;
  let row = 0;
  if (work[PART] >= 12.5) row = 2;
  else if (work[PART] >= 7.5) row = 1;
  work[PART] = (work[PART] - (DRAG_SPEED_MIN + row * DRAG_SPEED_STEP)) / DRAG_SPEED_STEP;
  dragAt(work, row, LOW);
  dragAt(work, row + 1, HIGH);
  work[DRAG] = work[LOW] + (work[HIGH] - work[LOW]) * work[PART];
}

/** The same, with plain numbers, away from the flight step. */
export function dragCoefficient(speed, spinRatio) {
  scalar[SPEED] = speed;
  scalar[SPIN_RATIO] = spinRatio;
  writeDrag(scalar);
  return scalar[DRAG];
}

/** Table II then III, per reference speed: m₁, s, the knee (rad/s), then a₂, a₁, a₀. */
const MAGNUS_SPEEDS = Float64Array.of(2, 3.5, 7.5, 10.5, 13.5, 17);
const MAGNUS_TABLE = Float64Array.of(
  0, 0.08, 150, -1.852e-7, -1.296e-4, 0.0983,
  -1.1e-3, 0.31, 200, -1.667e-7, -3.333e-5, 0.1,
  -8.0e-4, 0.37, 350, -2.0e-7, 1.7e-4, 0.0587,
  -6.58e-4, 0.375, 440, -2.604e-7, 3.646e-4, -0.0225,
  -5.6e-4, 0.383, 550, -3.571e-7, 5.357e-4, -0.0893,
  -4.48e-4, 0.371, 650, -1.0e-7, 2.3e-4, -0.0375,
);
const MAGNUS_ROW = 6;
const MAGNUS_LAST = MAGNUS_SPEEDS.length - 1;

/** Their eq. 5: a line up to the knee, then a parabola, and never negative; written at `into`. */
function magnusAt(work, row, into) {
  const at = row * MAGNUS_ROW;
  const spin = work[SPIN];
  const value = spin <= MAGNUS_TABLE[at + 2]
    ? MAGNUS_TABLE[at] * spin + MAGNUS_TABLE[at + 1]
    : (MAGNUS_TABLE[at + 3] * spin + MAGNUS_TABLE[at + 4]) * spin + MAGNUS_TABLE[at + 5];
  work[into] = value > 0 ? value : 0;
}

/**
 * `C_M(v, ω)`, from `work[SPEED]` and `work[SPIN]` into `work[MAGNUS]`: clipped outside 2 to 17 m/s, as in the article.
 * Linear in speed between reference speeds: the article says so for the drag, and this assumes the same here.
 * @param {Float64Array} work
 */
export function writeMagnus(work) {
  if (work[SPEED] <= MAGNUS_SPEEDS[0]) {
    magnusAt(work, 0, MAGNUS);
    return;
  }
  if (work[SPEED] >= MAGNUS_SPEEDS[MAGNUS_LAST]) {
    magnusAt(work, MAGNUS_LAST, MAGNUS);
    return;
  }
  let row = 0;
  while (work[SPEED] > MAGNUS_SPEEDS[row + 1]) row += 1;
  magnusAt(work, row, LOW);
  magnusAt(work, row + 1, HIGH);
  work[MAGNUS] = work[LOW] + ((work[HIGH] - work[LOW]) * (work[SPEED] - MAGNUS_SPEEDS[row])) / (MAGNUS_SPEEDS[row + 1] - MAGNUS_SPEEDS[row]);
}

/** The same, with plain numbers, away from the flight step. */
export function magnusCoefficient(speed, spin) {
  scalar[SPEED] = speed;
  scalar[SPIN] = spin;
  writeMagnus(scalar);
  return scalar[MAGNUS];
}
