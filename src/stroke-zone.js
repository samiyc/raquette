import { TABLE } from "./ball/constants.js";
import { contactFacts, nextContact, refusal, STROKE_KINDS } from "./strokes.js";

/**
 * Where the stroke picked can go on the next ball (Sami, 3/11/2026): the page colours it, so as not to look for the limit by watching a
 * button disappear. A grid of the other camp, each cell tried as the buttons try it. About 2 ms a cell: for a pause, not for a search.
 */
const COLUMNS = 7;
const ROWS = 8;

/** The size of a cell, in metres. */
export const ZONE_CELL = Object.freeze({ x: TABLE.halfLength / COLUMNS, y: (2 * TABLE.halfWidth) / ROWS });

/**
 * @param {any} state the rally
 * @param {{who: number, rule: any}} player
 * @returns {number[][]} the centres of the cells it can reach
 */
export function strokeZone(state, { who, rule }) {
  const contact = nextContact(state, who, rule);
  const kind = STROKE_KINDS[rule.stroke];
  const { side } = state.seats[who];
  if (!contact || kind.refuses?.(contactFacts(contact.ball, side))) return [];
  const cells = [];
  for (let column = 0; column < COLUMNS; column += 1) {
    for (let row = 0; row < ROWS; row += 1) {
      const target = [-side * (column + 0.5) * ZONE_CELL.x, (row + 0.5) * ZONE_CELL.y - TABLE.halfWidth];
      if (refusal(kind, contact.ball, target, -side) === null) cells.push(target);
    }
  }
  return cells;
}
