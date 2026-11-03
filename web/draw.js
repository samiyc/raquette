import { BALL_SIZE, NET, TABLE, VX, VY, WX, WY, WZ, X, Y, Z } from "../src/ball/constants.js";
import { CLUB_PLAYER } from "../src/player.js";
import {
  ballRadius, COLORS, liftOf, sectorAngles, shadowOffset, sidePoint, sidePush, spinColor, spinMark, topPoint, trailStart,
} from "./scale.js";

const REACH = CLUB_PLAYER.reach;
const SMALLEST_CIRCLE = 2;

/** The drawing: the table from above and from the side, the flight so far, the ball. It decides nothing. */

/**
 * @param {CanvasRenderingContext2D} ctx
 * @param {number[]} from
 * @param {number[]} to
 */
function line(ctx, from, to) {
  ctx.beginPath();
  ctx.moveTo(from[0], from[1]);
  ctx.lineTo(to[0], to[1]);
  ctx.stroke();
}

function drawTableFromAbove(ctx, layout) {
  const [left, top] = topPoint(layout, -TABLE.halfLength, TABLE.halfWidth);
  const [right, bottom] = topPoint(layout, TABLE.halfLength, -TABLE.halfWidth);
  ctx.fillStyle = COLORS.table;
  ctx.fillRect(left, top, right - left, bottom - top);
  ctx.strokeStyle = COLORS.line;
  ctx.lineWidth = 2;
  ctx.strokeRect(left, top, right - left, bottom - top);
  ctx.lineWidth = 1;
  line(ctx, topPoint(layout, -TABLE.halfLength, 0), topPoint(layout, TABLE.halfLength, 0));
  ctx.lineWidth = 3;
  line(ctx, topPoint(layout, 0, NET.halfWidth), topPoint(layout, 0, -NET.halfWidth));
}

function drawTableFromSide(ctx, layout) {
  ctx.strokeStyle = COLORS.line;
  ctx.lineWidth = 1;
  line(ctx, sidePoint(layout, -layout.width, TABLE.floor), sidePoint(layout, layout.width, TABLE.floor));
  ctx.lineWidth = 4;
  line(ctx, sidePoint(layout, -TABLE.halfLength, 0), sidePoint(layout, TABLE.halfLength, 0));
  ctx.lineWidth = 3;
  line(ctx, sidePoint(layout, 0, 0), sidePoint(layout, 0, NET.height));
}

/** The way the ball has come since the last stroke, in both views. */
function drawTrail(ctx, layout, recording, index) {
  const f = recording.frames;
  const start = trailStart(recording.strokes, index);
  const views = [
    (at) => topPoint(layout, f[at + X], f[at + Y]),
    (at) => sidePoint(layout, f[at + X], f[at + Z]),
  ];
  ctx.strokeStyle = COLORS.trail;
  ctx.lineWidth = 1.5;
  for (const point of views) {
    ctx.beginPath();
    for (let i = start; i <= index; i += 1) {
      const [x, y] = point(i * BALL_SIZE);
      if (i === start) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
  }
}

/** A cross where the flight touched something since the last stroke, once the ball has got there. */
function drawEvents(ctx, layout, recording, index) {
  ctx.strokeStyle = COLORS.line;
  ctx.lineWidth = 1.5;
  const start = trailStart(recording.strokes, index);
  for (const { step, x, y } of recording.events) {
    if (step > index) break;
    if (step < start) continue;
    const [px, py] = topPoint(layout, x, y);
    line(ctx, [px - 4, py - 4], [px + 4, py + 4]);
    line(ctx, [px - 4, py + 4], [px + 4, py - 4]);
  }
}

/**
 * @param {CanvasRenderingContext2D} ctx
 * @param {number[]} point
 * @param {number} radius
 * @param {string} color
 */
function disc(ctx, point, radius, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(point[0], point[1], radius, 0, 2 * Math.PI);
  ctx.fill();
}

/** The ball, its colour for the spin, an outline so that it stands out on anything, its mark inside. */
function drawBallAt(ctx, point, radius, lift) {
  disc(ctx, point, radius, spinColor(lift));
  ctx.strokeStyle = "#ffffff";
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.fillStyle = "#ffffff";
  ctx.font = `bold ${Math.round(radius * 1.5)}px system-ui, sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(spinMark(lift), point[0], point[1]);
}

/** A small arrow beside the ball: which way its sidespin pushes it. */
function drawSideArrow(ctx, point, radius, push) {
  if (push === 0) return;
  const [x, y] = point;
  const tip = y - push * (radius + 13);
  const base = y - push * (radius + 3);
  ctx.strokeStyle = COLORS.line;
  ctx.lineWidth = 2;
  line(ctx, [x, base], [x, tip]);
  line(ctx, [x - 4, tip + push * 5], [x, tip]);
  line(ctx, [x + 4, tip + push * 5], [x, tip]);
}

function drawBall(ctx, layout, recording, index) {
  const f = recording.frames;
  const at = index * BALL_SIZE;
  const lift = liftOf(f[at + VX], f[at + VY], f[at + WX], f[at + WY]);
  const radius = ballRadius(f[at + Z]);
  const point = topPoint(layout, f[at + X], f[at + Y]);
  const offset = shadowOffset(f[at + Z]);
  disc(ctx, [point[0] + offset, point[1] + offset], radius, COLORS.shadow);
  drawBallAt(ctx, point, radius, lift);
  drawSideArrow(ctx, point, radius, sidePush(f[at + VX], f[at + WZ]));
  drawBallAt(ctx, sidePoint(layout, f[at + X], f[at + Z]), 6, lift);
}

/** A player from above: its body, and what its arm reaches without moving. */
function drawPlayer(ctx, layout, at, side) {
  const point = topPoint(layout, at[0], at[1]);
  const [from, to] = sectorAngles(side);
  ctx.fillStyle = COLORS.sector;
  ctx.strokeStyle = COLORS.line;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(point[0], point[1]);
  ctx.arc(point[0], point[1], REACH * layout.scale, from, to);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  disc(ctx, point, 7, COLORS.line);
}

function drawPlayers(ctx, layout, recording, index) {
  const b = recording.bodies;
  if (!b) return;
  drawPlayer(ctx, layout, [b[index * 4], b[index * 4 + 1]], -1);
  drawPlayer(ctx, layout, [b[index * 4 + 2], b[index * 4 + 3]], 1);
}

/** The way the ball will go, as the players read it, in both views: dots, and a cross where it touches. */
export function drawBallPath(ctx, layout, { points, touches }) {
  ctx.fillStyle = COLORS.cut;
  for (const [x, y, z] of points) {
    const top = topPoint(layout, x, y);
    ctx.fillRect(top[0] - 1, top[1] - 1, 2, 2);
    const side = sidePoint(layout, x, z);
    ctx.fillRect(side[0] - 1, side[1] - 1, 2, 2);
  }
  ctx.strokeStyle = COLORS.cut;
  ctx.lineWidth = 2;
  for (const { x, y } of touches) {
    const [px, py] = topPoint(layout, x, y);
    line(ctx, [px - 5, py - 5], [px + 5, py + 5]);
    line(ctx, [px - 5, py + 5], [px + 5, py - 5]);
  }
}

/** A cross where the ball is aimed, in a circle of the scatter to expect. */
function drawAim(ctx, at, radius) {
  const [ax, ay] = at;
  ctx.strokeStyle = COLORS.lift;
  ctx.lineWidth = 2;
  line(ctx, [ax - 7, ay], [ax + 7, ay]);
  line(ctx, [ax, ay - 7], [ax, ay + 7]);
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(ax, ay, radius, 0, 2 * Math.PI);
  ctx.stroke();
}

/**
 * What the player asked: where it aims, with a circle where half of such strokes fall, and where it goes, a square at the end of a route.
 * A blue ring: where the next stroke will take the ball, during a pause.
 * The square is larger than the body, so that it shows once the body has got there. The radius comes from a stroke
 * on an easy ball, 16 cm in median at 100 % (docs/recherche/chiffres.md, § 8).
 */
export function drawOrders(ctx, layout, { aim, goal, body, miss, contact }) {
  drawAim(ctx, topPoint(layout, aim[0], aim[1]), Math.max(SMALLEST_CIRCLE, miss * layout.scale));
  const [gx, gy] = topPoint(layout, goal[0], goal[1]);
  ctx.strokeStyle = COLORS.lift;
  ctx.lineWidth = 1.5;
  ctx.setLineDash([5, 4]);
  line(ctx, topPoint(layout, body[0], body[1]), [gx, gy]);
  ctx.setLineDash([]);
  ctx.lineWidth = 2.5;
  ctx.strokeRect(gx - 9, gy - 9, 18, 18);
  if (contact) drawContact(ctx, topPoint(layout, contact[0], contact[1]));
}

/** A blue ring: where the next stroke will take the ball. */
function drawContact(ctx, at) {
  ctx.strokeStyle = COLORS.cut;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(at[0], at[1], 6, 0, 2 * Math.PI);
  ctx.stroke();
}

/** The whole view at one frame. */
export function drawScene(ctx, layout, recording, index) {
  ctx.fillStyle = COLORS.floor;
  ctx.fillRect(0, 0, layout.width, layout.height);
  drawTableFromAbove(ctx, layout);
  drawTableFromSide(ctx, layout);
  drawPlayers(ctx, layout, recording, index);
  drawTrail(ctx, layout, recording, index);
  drawEvents(ctx, layout, recording, index);
  drawBall(ctx, layout, recording, index);
}
