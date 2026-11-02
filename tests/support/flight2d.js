import { dragCoefficient, magnusCoefficient } from "../../src/ball/coefficients.js";

/**
 * A plain flight in the vertical plane, separate from src/ball/flight.js, to compare methods and coefficients as
 * docs/recherche/chiffres.md, § 8, does. It starts above the table and stops at z = 0.
 */
const MASS = 0.0027;
const RADIUS = 0.02;
const AREA = Math.PI * RADIUS * RADIUS;
const VOLUME = (4 / 3) * Math.PI * RADIUS * RADIUS * RADIUS;
const RHO = 1.2;
const G = 9.81;

/** The full model of the tables. */
export const TABLES = {
  drag: (speed, spin) => dragCoefficient(speed, (RADIUS * spin) / speed),
  magnus: (speed, spin) => magnusCoefficient(speed, spin) * RHO * VOLUME,
};
/** Gossard et al.'s constant `k_m`, with a constant drag. */
export const CONSTANT = { drag: () => 0.5, magnus: () => 3e-6 };
/** The tables' Magnus, with a constant drag. */
export const CONSTANT_DRAG = { drag: () => 0.5, magnus: TABLES.magnus };

function acceleration(model, vx, vz, omega) {
  const speed = Math.sqrt(vx * vx + vz * vz);
  const spin = Math.abs(omega);
  const drag = (0.5 * RHO * model.drag(speed, spin) * AREA * speed) / MASS;
  const magnus = (model.magnus(speed, spin) * omega) / MASS;
  return [-drag * vx + magnus * vz, -drag * vz - magnus * vx - G];
}

const rk2 = (model, s, omega, dt) => {
  const a = acceleration(model, s[2], s[3], omega);
  const mx = s[2] + (a[0] * dt) / 2;
  const mz = s[3] + (a[1] * dt) / 2;
  const b = acceleration(model, mx, mz, omega);
  return [s[0] + mx * dt, s[1] + mz * dt, s[2] + b[0] * dt, s[3] + b[1] * dt];
};

const euler = (model, s, omega, dt) => {
  const a = acceleration(model, s[2], s[3], omega);
  const vx = s[2] + a[0] * dt;
  const vz = s[3] + a[1] * dt;
  return [s[0] + vx * dt, s[1] + vz * dt, vx, vz];
};

export const METHODS = { rk2, euler };

function startOf({ x = -1.5, z = 0.25, speed, elevation }) {
  const angle = (elevation * Math.PI) / 180;
  return [x, z, speed * Math.cos(angle), speed * Math.sin(angle)];
}

/**
 * The stroke's whole path until it reaches z = 0.
 * @returns {{ landing: number, time: number, path: number[][] }} `path` holds t, x, z.
 */
export function flyStroke(stroke, model, { dt = 1 / 2000, method = rk2 } = {}) {
  const omega = stroke.turns * 2 * Math.PI;
  let s = startOf(stroke);
  const path = [];
  for (let n = 0; n < 100000; n += 1) {
    const next = method(model, s, omega, dt);
    path.push([n * dt, s[0], s[1]]);
    if (next[1] <= 0 && next[3] < 0) {
      const part = s[1] / (s[1] - next[1]);
      return { landing: s[0] + part * (next[0] - s[0]), time: (n + part) * dt, path };
    }
    s = next;
  }
  throw new Error("the stroke never lands");
}
