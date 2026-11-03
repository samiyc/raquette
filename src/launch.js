import { createBall } from "./ball/flight.js";

/**
 * A ball thrown by hand, from angles and turns per second, for the page and the tests. The angles are converted here,
 * once, and the ball's vector is kept: the flight itself reads no sine (docs/modele.md, § 3).
 */
const TURN = 2 * Math.PI;
const DEGREE = Math.PI / 180;

/**
 * @typedef {import("./types.js").Launch} Launch
 * @param {Launch} launch
 * @returns {Float64Array} the ball
 */
export function throwBall({ x = -1.6, y = 0, z = 0.3, speed, elevation = 0, azimuth = 0, topspin = 0, sidespin = 0 }) {
  const up = elevation * DEGREE;
  const side = azimuth * DEGREE;
  const flat = speed * Math.cos(up);
  const velocity = [flat * Math.cos(side), flat * Math.sin(side), speed * Math.sin(up)];
  // The axis of a topspin is square to the way the ball goes, so that ω × v points down.
  const spin = [-topspin * TURN * Math.sin(side), topspin * TURN * Math.cos(side), sidespin * TURN];
  return createBall([x, y, z], velocity, spin);
}

/** The strokes the page offers. What each one does is held by tests/page-model.test.js. */
export const PRESETS = Object.freeze({
  top: { label: "Top (80 tr/s)", launch: { speed: 15, elevation: 3, topspin: 80 } },
  fastTop: { label: "Top très tourné (110 tr/s)", launch: { speed: 15, elevation: 3, topspin: 110 } },
  flat: { label: "Sans effet", launch: { speed: 9, elevation: 8 } },
  cut: { label: "Coupé", launch: { z: 0.2, speed: 6, elevation: 18, topspin: -30 } },
  // Sami's two launches (3/11/2026), the only ones kept as they came: a ball left to bounce twice is lost by whoever is too far back.
  twoBounces: { label: "Coupé à deux rebonds", launch: { x: -1.6, z: 0.25, speed: 5, elevation: 18, topspin: -90 } },
  twoBouncesOver: { label: "Coupé à deux rebonds, sur la table", launch: { x: -0.8, z: 0.15, speed: 4, elevation: 18, topspin: -30 } },
  chop: { label: "Tchop, loin de la table", launch: { x: -3, z: 0, speed: 9, elevation: 12, topspin: -80 } },
  comeBack: { label: "Fort coupé qui revient", launch: { x: -0.3, z: 0.25, speed: 2, elevation: 60, topspin: -130 } },
  lob: { label: "Lob", launch: { x: -2.6, z: 0.2, speed: 8, elevation: 40, topspin: 30 } },
  side: { label: "Latéral", launch: { speed: 10, elevation: 5, topspin: 20, sidespin: 50 } },
  net: { label: "Dans le filet", launch: { z: 0.15, speed: 12, elevation: 0 } },
  long: { label: "Trop long", launch: { speed: 20, elevation: 6 } },
});
