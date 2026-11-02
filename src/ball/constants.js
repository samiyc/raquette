/**
 * The ball, the air and the table, in metres, seconds and kilograms (docs/recherche/chiffres.md, § 1 to § 3).
 * The origin is at the centre of the table, on its surface: `x` runs from player to player, the net at `x = 0`;
 * `y` runs sideways; `z` goes up.
 */

/** The simulation's clock: 240 Hz (docs/modele.md, § 3). */
export const STEP = 1 / 240;

const RADIUS = 0.02;
const MASS = 0.0027;
const AIR_DENSITY = 1.2; // A hypothesis: standard air, not read in the article (Q-P15).

export const GRAVITY = 9.81;
export const MAX_SPEED = 35;
export const MAX_SPIN = 1000;

/** Conti et al. 2026, eq. 2, over the mass: drag is `DRAG_FACTOR * C_D * |v| * v`, Magnus `MAGNUS_FACTOR * C_M * (ω × v)`. */
export const DRAG_FACTOR = (0.5 * AIR_DENSITY * Math.PI * RADIUS * RADIUS) / MASS;
export const MAGNUS_FACTOR = (AIR_DENSITY * (4 / 3) * Math.PI * RADIUS * RADIUS * RADIUS) / MASS;

export const BALL = Object.freeze({ radius: RADIUS, mass: MASS, airDensity: AIR_DENSITY });

/** The Laws of the ITTF: 2.74 m by 1.525 m, 76 cm above the floor; the net 15.25 cm high, its posts 15.25 cm outside. */
export const TABLE = Object.freeze({ halfLength: 1.37, halfWidth: 0.7625, floor: -0.76 });
export const NET = Object.freeze({ height: 0.1525, halfWidth: 0.7625 + 0.1525 });

/** Where each number sits in a ball's Float64Array: position, velocity, spin. */
export const X = 0;
export const Y = 1;
export const Z = 2;
export const VX = 3;
export const VY = 4;
export const VZ = 5;
export const WX = 6;
export const WY = 7;
export const WZ = 8;
export const BALL_SIZE = 9;
