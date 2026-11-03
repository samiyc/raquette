/**
 * What the page's drawing computes without touching a canvas: where things go on screen, and the ball's colour. Plain
 * functions, tested under Node (tests/page-model.test.js).
 */

/**
 * What the view shows, in metres: the floor up to a lob's top, and below it the table and room for the players. A lob higher than
 * that leaves the screen rather than crossing the view from above, the one Sami watches (3/11/2026). Heights are squeezed in the
 * side band, so that both bands fit on a screen without scrolling; lengths keep one scale.
 */
const VIEW = { halfX: 3, halfY: 1.375, floor: -0.76, ceiling: 1.5 }; // 25 % more room from above than the 1.1 m it had (Sami, 3/11/2026).
const SIDE_HEIGHTS = 0.55;
const BAND_GAP = 14;

/** The page's Khaki, from Notepad++'s own theme (themes/khaki.xml: 5F5F00 on D7D7AF), and the table on it. */
export const COLORS = Object.freeze({
  floor: "#d7d7af",
  table: "#f1f1da",
  line: "#5f5f00",
  trail: "#8a8a4a",
  shadow: "#a9a97e",
  sector: "rgba(95, 95, 0, 0.12)",
  zone: "rgba(13, 71, 161, 0.13)",
  neutral: "#4a4a3a",
  lift: "#b71c1c",
  cut: "#0d47a1",
});

const SECTOR_HALF = (110 * Math.PI) / 180;

/** What the arm reaches, as a canvas draws it: from and to, in radians. The axis looks towards the net. */
export function sectorAngles(side) {
  const axis = side < 0 ? 0 : Math.PI;
  return [axis - SECTOR_HALF, axis + SECTOR_HALF];
}

/** Where the trail starts: at the last stroke played by `index`, or at the start. */
export function trailStart(strokes, index) {
  let start = 0;
  for (const step of strokes ?? []) if (step <= index) start = step;
  return start;
}

/** The two bands for a canvas `width` pixels wide, the side first: the same lengths, so that a point of one lies above the other's. */
export function layoutFor(width) {
  const scale = width / (2 * VIEW.halfX);
  const topHeight = 2 * VIEW.halfY * scale;
  const sideHeight = (VIEW.ceiling - VIEW.floor) * scale * SIDE_HEIGHTS;
  return { width, scale, topHeight, sideHeight, topStart: sideHeight + BAND_GAP, height: sideHeight + BAND_GAP + topHeight };
}

/** A point of the table's plane, seen from above: +y upwards on the screen. */
export const topPoint = (layout, x, y) => [
  layout.width / 2 + x * layout.scale,
  layout.topStart + layout.topHeight / 2 - y * layout.scale,
];

/** A click's height on the canvas, as the view from above counts it (src/mouse.js): negative in the side band. */
export const fromTopBand = (layout, py) => py - layout.topStart;

/** A point seen from the side. */
export const sidePoint = (layout, x, z) => [
  layout.width / 2 + x * layout.scale,
  (VIEW.ceiling - z) * layout.scale * SIDE_HEIGHTS,
];

const clampHeight = (z) => Math.max(0, Math.min(1, z));

/** The ball's radius from above, in pixels: larger the higher it is. A true radius would be 3 pixels. */
export const ballRadius = (z) => 5 + 7 * clampHeight(z);

/** How far its shadow falls from it, in pixels: further the higher it is. */
export const shadowOffset = (z) => 2 + 22 * clampHeight(z);

/**
 * The topspin of a ball as it travels, in rad/s, positive for a lift: what pushes it down, read from its way across the
 * table. After a bounce, a ball coming back with the same spin may become a lift. Zero for a ball with no way to read.
 */
export function liftOf(vx, vy, wx, wy) {
  const flat = Math.sqrt(vx * vx + vy * vy);
  return flat > 0 ? (wy * vx - wx * vy) / flat : 0;
}

const CHANNELS = (hex) => [1, 3, 5].map((at) => Number.parseInt(hex.slice(at, at + 2), 16));
const hexOf = (rgb) => `#${rgb.map((c) => Math.round(c).toString(16).padStart(2, "0")).join("")}`;

/** From the neutral colour to red for a lift or blue for a backspin, full at 600 rad/s (about 95 turns per second). */
export function spinColor(lift) {
  const part = Math.min(1, Math.abs(lift) / 600);
  const from = CHANNELS(COLORS.neutral);
  const to = CHANNELS(lift > 0 ? COLORS.lift : COLORS.cut);
  return hexOf(from.map((c, i) => c + (to[i] - c) * part));
}

/** The mark inside the ball, so that the spin does not rest on colour alone: "+" for a lift, "−" for a backspin. */
export function spinMark(lift) {
  if (Math.abs(lift) < 30) return "";
  return lift > 0 ? "+" : "−";
}

/** Which way a sidespin pushes the ball across the table: 1 towards +y, −1 towards −y, 0 if too weak to show. */
export function sidePush(vx, wz) {
  if (Math.abs(wz) < 30 || vx === 0) return 0;
  return Math.sign(wz * vx);
}
