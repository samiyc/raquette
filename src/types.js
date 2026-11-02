/**
 * The shapes the modules hand each other, in JSDoc (`npm run types`). A module points here with
 * `@typedef {import("./types.js").Name} Name`.
 *
 * A ball is a Float64Array of 9 numbers: position, velocity, spin (src/ball/constants.js gives their places).
 *
 * @typedef {object} Launch A ball thrown by hand: metres, m/s, degrees, turns per second.
 * @property {number} [x]
 * @property {number} [y]
 * @property {number} [z]
 * @property {number} speed
 * @property {number} [elevation] above the horizontal
 * @property {number} [azimuth] from the x axis, towards +y
 * @property {number} [topspin] negative for a backspin
 * @property {number} [sidespin] about the vertical; positive deflects a ball going towards +x to +y
 *
 * @typedef {object} FlightEvent What a flight ran into, and where.
 * @property {"table" | "net" | "floor"} kind
 * @property {number} step
 * @property {number} x
 * @property {number} y
 *
 * @typedef {object} Recording A flight kept step by step.
 * @property {number} steps
 * @property {Float64Array} frames `(steps + 1)` balls, one after the other
 * @property {FlightEvent[]} events
 */
export {};
