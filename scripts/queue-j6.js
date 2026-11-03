import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

/**
 * The measures of J6, as jobs of the queue (mcts-commun/docs/backlog.md): a job per pair, of 3 or 6 threads, on seeds that served
 * no setting. `node scripts/queue-j6.js add` adds them, `node scripts/queue-j6.js read` prints what they gave. Each run of `add`
 * takes a fresh tag: an id is never used twice.
 */
const BACKLOG = fileURLToPath(new URL("../../mcts-commun/bin/backlog.js", import.meta.url));
const ROOT = fileURLToPath(new URL("../", import.meta.url));
const TAGS = fileURLToPath(new URL("../tmp/queue-j6.json", import.meta.url));
const FROM = 800000;

const MIX = ["--service", "mix"];

/** A, B, seeds, threads, estimate in minutes, and options. */
const JOBS = [
  ["S", "MC", 1200, 6, 5, ...MIX],
  ["S-b96", "MC-b96", 400, 6, 8, ...MIX],
  ["S", "R3", 1200, 6, 5, ...MIX, "--replays"],
  ["S", "R0", 1200, 6, 5, ...MIX],
  ["MC", "R3", 1200, 6, 5, ...MIX],
  ["S-b96", "S", 400, 6, 8, ...MIX],
  ["S-d2", "S", 800, 6, 5, ...MIX],
  ["S-d8", "S", 800, 6, 8, ...MIX],
  ["S-h2", "S", 800, 6, 5, ...MIX],
  ["S-h6", "S", 800, 6, 8, ...MIX],
  ["R3", "R3", 1200, 3, 2, "--service", "pendule"],
  ["R3", "R3", 1200, 3, 2, "--service", "marteau"],
  ["R3", "R3", 1200, 3, 2, "--service", "mou"],
  ["R3", "R3", 1200, 3, 2, "--service", "bombe"],
  ["R3", "R3", 1200, 3, 2, "--service", "lateral"],
  ["R3", "R0", 1200, 3, 2, ...MIX],
  ["R1", "R0", 1200, 3, 2, ...MIX],
];

// eslint-disable-next-line sonarjs/no-os-command-from-path -- a script of this machine, calling the queue's own command.
const backlog = (...args) => execFileSync("node", [BACKLOG, ...args], { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });

function add() {
  const tag = new Date().toISOString().slice(0, 16).replace(/[-:T]/g, "");
  const ids = JOBS.map(([a, b, seeds, threads, minutes, ...extra], i) => {
    const id = `raquette-j6-${a}-${b}-${i}-${tag}`;
    const command = ["node", "scripts/duel.js", a, b, "--seeds", String(seeds), "--from", String(FROM), ...extra];
    backlog("--add", id, "--cwd", ROOT, "--threads", String(threads), "--min-threads", String(Math.ceil(Number(threads) / 2)), "--estimate", `${minutes} min`, "--limit", "45", "--", ...command);
    return id;
  });
  writeFileSync(TAGS, JSON.stringify(ids));
  console.log(ids.join("\n"));
}

function readJob(id) {
  const status = JSON.parse(backlog("--status", id, "--json")) ?? {};
  console.log(`[${status.status ?? "inconnu"}, ${status.minutes ?? "?"} min] ${id}`);
  if (status.output && existsSync(status.output)) console.log(readFileSync(status.output, "utf8").trim());
}

function read() {
  if (existsSync(TAGS)) JSON.parse(readFileSync(TAGS, "utf8")).forEach(readJob);
}

if (process.argv[2] === "add") add();
else read();
