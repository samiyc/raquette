import { playPairs } from "../src/pairs.js";
import { CLUB_PLAYER } from "../src/player.js";
import { RULES } from "../src/rules/ladder.js";

/**
 * Two rules by pairs, on the same seeds: `node scripts/duel.js R1 R0 --seeds 1200 --from 100000`. Calibration seeds are below
 * 100 000; a measure that counts is made above, on seeds no parameter has seen (docs/modele.md, § 6 and § 7).
 */
const args = process.argv.slice(2);
const option = (name, fallback) => {
  const at = args.indexOf(name);
  return at >= 0 ? Number(args[at + 1]) : fallback;
};
const [nameA, nameB] = args;
const percent = (value) => `${(value * 100).toFixed(1).replace(".", ",")} %`;
const causes = (counts) => Object.entries(counts).sort((x, y) => y[1] - x[1]).map(([cause, count]) => `${cause} ${count}`).join(", ") || "rien";

const report = playPairs({
  a: RULES[nameA],
  b: RULES[nameB],
  profile: CLUB_PLAYER,
  from: option("--from", 0),
  seeds: option("--seeds", 1200),
});
const { gap } = report;
const partOf = (mean) => percent(0.5 + mean / 4);

console.log(`${nameA} contre ${nameB}, ${gap.n} graines : ${percent(report.part)} des points pour ${nameA}, de ${partOf(gap.low)} à ${partOf(gap.high)}`);
console.log(`  écart ${gap.mean.toFixed(3)} [${gap.low.toFixed(3)} ; ${gap.high.toFixed(3)}], ${gap.wins} gagnées, ${gap.ties} égales, ${gap.losses} perdues`);
console.log(`  ${report.strokes.toFixed(1)} coups par échange, ${percent(report.limits)} à la limite, serveur ${percent(report.serverPart)}`);
console.log(`  ${nameA} perd : ${causes(report.lostByA)}`);
console.log(`  ${nameB} perd : ${causes(report.lostByB)}`);
