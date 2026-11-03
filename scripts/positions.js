import { existsSync, readdirSync, readFileSync } from "node:fs";
import { replayPoint } from "../src/game.js";

/**
 * The bench of positions: each file of positions/ is a point the robot lost at the mouse, exported from the page. It plays each
 * one again with the current robot: a variant shows there what it now does better (docs/modele.md, § 10).
 */
const FOLDER = new URL("../positions/", import.meta.url);
const files = existsSync(FOLDER) ? readdirSync(FOLDER).filter((name) => name.endsWith(".json")) : [];
if (files.length === 0) console.log("Aucune position dans positions/ : la page les exporte, une fois un point gagné contre le robot.");

let stillLost = 0;
for (const name of files) {
  const saved = JSON.parse(readFileSync(new URL(name, FOLDER), "utf8"));
  const { result } = replayPoint(saved).state;
  const lost = result.winner === 0;
  if (lost) stillLost += 1;
  console.log(`${name} : ${lost ? "le robot perd encore" : "le robot s'en sort"}, ${result.cause}, ${result.strokes} coups`);
}
if (files.length > 0) console.log(`${stillLost} sur ${files.length} encore perdues.`);
