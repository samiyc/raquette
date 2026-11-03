import { TABLE } from "../ball/constants.js";
import { BX } from "../player.js";
import { takeToCentre } from "./center.js";

/**
 * The cut that bounces twice (Sami, 3/11/2026; docs/modele.md, § 6): against an opponent too far back to get there before the
 * second bounce, a slow ball, brushed down, just past the net. From R0's ball, this swing leaves at about 4.7 m/s, 23° up and
 * 82 turns of backspin: Sami's launch, and a racket gets there. Otherwise, R0. It is the block of R5, to be measured at J5.
 */
const SHORT = 0.35;
const TOO_FAR_BACK = 1.5; // Metres behind the line, when the stroke is decided: the opponent is still going back (H, Q-P19).
export const SHORT_SWING = Object.freeze({ speed: 4, brushUp: -6, brushSide: 0 });

/** How far behind its end line the opponent stands. */
const opponentBack = (view) => -view.side * view.opponent[BX] - TABLE.halfLength;

/** @param {import("../types.js").View} view */
function decideShort(view) {
  const stroke = takeToCentre(view);
  if (!stroke || opponentBack(view) < TOO_FAR_BACK) return stroke;
  return { ...stroke, target: [-view.side * SHORT, 0], swing: SHORT_SWING };
}

export const SHORT_CUT = Object.freeze({ name: "court", decide: decideShort });
