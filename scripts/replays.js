import { existsSync, readdirSync } from "node:fs";
import path from "node:path";
import { summarize } from "../src/replay-stats.js";
import { readSeries, SERIES_FOLDER } from "./lib/replay-files.js";

/**
 * `npm run replays [-- fichier]`: what the series of replays/series/ say, the last one by default (docs/replays.md). An example of a
 * mass analysis as well: anything kept in a line can be counted in the same way.
 */
const named = process.argv[2];
const files = existsSync(SERIES_FOLDER) ? readdirSync(SERIES_FOLDER).filter((name) => name.endsWith(".jsonl.gz")).sort() : [];
const file = named ?? (files.length ? path.join(SERIES_FOLDER, files.at(-1)) : null);
if (!file) {
  console.log("Aucune série dans replays/series/ : node scripts/duel.js R3 R0 --seeds 200 --replays en écrit une.");
  process.exit(0);
}

const { header, rallies } = readSeries(file);
const { strokes, seats } = summarize(rallies);
const french = (value) => (value === null ? "–" : String(value).replace(".", ","));
const counts = (values) => Object.entries(values).sort((x, y) => y[1] - x[1]).map(([cause, n]) => `${cause} ${n}`).join(", ") || "rien";

console.log(`${path.basename(file)} : ${rallies.length} échanges, ${french(strokes)} coups par échange`);
console.log(`  version ${header.version}, commit ${header.code.commit}${header.code.dirty ? " modifié" : ""}, src ${header.code.src}, du ${header.startedAt} au ${header.endedAt}`);
seats.forEach((seat, i) => {
  console.log(`  ${header.players[i].bot} : ${seat.strokes} frappes à ${french(seat.speed)} m/s, balle à ${french(seat.reach)} m du corps, ${Math.round(seat.stretchedPart * 100)} % au-delà du confort`);
  console.log(`    marge au filet ${french(seat.netMargin)} m, chute à ${french(seat.aimMiss)} m de la cible`);
  console.log(`    fautes : ${counts(seat.faults)}`);
  console.log(`    balles perdues : ${counts(seat.missed)} ; alors à ${french(seat.missedBehindLine)} m derrière sa ligne, au plus près à ${french(seat.missedClosest)} m de la balle`);
});
