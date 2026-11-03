import { positionOf, replayOfPoint } from "../src/game.js";

/** What the page keeps of a game: every point by the page server, and the points won, to a file. */

/** Every point is kept by the page server, out of git (docs/replays.md). A page opened without it plays on all the same. */
export function savePoint(point) {
  fetch("/api/replays", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(replayOfPoint(point)) }).catch(() => {});
}

/** The points won in a game, to a file. @returns {number} how many */
export function exportWon(game) {
  const won = game.points.filter((point) => point.state.result.winner === 0).map(positionOf);
  const link = document.createElement("a");
  link.href = URL.createObjectURL(new Blob([JSON.stringify(won, null, 2)], { type: "application/json" }));
  link.download = `positions-graine-${game.seed}.json`;
  link.click();
  URL.revokeObjectURL(link.href);
  return won.length;
}
