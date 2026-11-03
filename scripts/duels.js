import { readFileSync, writeFileSync } from "node:fs";
import { measureDuel } from "../src/duel-stats.js";
import { CLUB_PLAYER } from "../src/player.js";
import { DUELS } from "../src/rules/drills.js";

/**
 * The three reference duels, over 1,000 rallies each (Sami, 3/11/2026), against docs/duels-reference.json. `--write` updates
 * the reference: a change meant to move them does that, and its commit gives the figures before and after.
 */
const PATH = new URL("../docs/duels-reference.json", import.meta.url);
const RALLIES = 1000;

const reference = JSON.parse(readFileSync(PATH, "utf8"));
const french = (value) => String(value).replace(".", ",");

function seatText({ speed, lift, height, lostPart }) {
  return `${french(speed)} m/s, effet ${lift} tr/s, pris à ${Math.round(height * 100)} cm, perd ${Math.round(lostPart * 100)} %`;
}

const measured = {};
for (const [key, duel] of Object.entries(DUELS)) {
  const now = measureDuel(duel, { rallies: RALLIES, profile: CLUB_PLAYER });
  measured[key] = now;
  const before = reference.duels[key];
  const moved = before && before.strokes !== now.strokes ? ` (référence ${french(before.strokes)})` : "";
  console.log(`${duel.label} : ${french(now.strokes)} coups${moved}`);
  now.seats.forEach((seat, i) => console.log(`  joueur ${i + 1} : ${seatText(seat)}`));
  const ends = Object.entries(now.causes).map(([cause, part]) => `${cause} ${Math.round(part * 100)} %`);
  console.log(`  fins : ${ends.join(", ")}`);
}

if (process.argv.includes("--write")) {
  writeFileSync(PATH, `${JSON.stringify({ ...reference, duels: measured }, null, 2)}\n`);
  console.log("Référence réécrite.");
}
