import { VX, VY, VZ, WX, WY, Z } from "./ball/constants.js";
import { playRally } from "./rally.js";

/**
 * What a duel looks like over many seeds: how long it lasts, how it ends, what each player sends. The three reference duels are
 * held to these figures (docs/duels-reference.json, Sami, 3/11/2026): they say the model still looks like table tennis.
 */
const TURN = 2 * Math.PI;

function emptySeat() {
  return { strokes: 0, speed: 0, lift: 0, height: 0, lost: 0 };
}

function noteStroke(seat, ball) {
  const flat = Math.sqrt(ball[VX] * ball[VX] + ball[VY] * ball[VY]);
  seat.strokes += 1;
  seat.speed += Math.sqrt(flat * flat + ball[VZ] * ball[VZ]);
  seat.lift += flat > 0 ? (ball[WY] * ball[VX] - ball[WX] * ball[VY]) / flat / TURN : 0;
  seat.height += ball[Z];
}

const rounded = (value, digits) => Number(value.toFixed(digits));

function seatSummary(seat, rallies) {
  const per = seat.strokes || 1;
  return {
    speed: rounded(seat.speed / per, 1),
    lift: rounded(seat.lift / per, 0),
    height: rounded(seat.height / per, 2),
    lostPart: rounded(seat.lost / rallies, 3),
  };
}

/**
 * @param {{players: (profile: import("./types.js").Profile) => any, service: any}} duel
 * @param {{rallies: number, profile: import("./types.js").Profile}} options
 * @returns {{strokes: number, causes: Record<string, number>, seats: object[]}} the causes as parts of the rallies
 */
export function measureDuel(duel, { rallies, profile }) {
  const players = duel.players(profile);
  const seats = [emptySeat(), emptySeat()];
  const counts = {};
  let strokes = 0;
  let state;
  const listener = {
    tick(current) { state = current; },
    stroke(who) { noteStroke(seats[who], state.ball); },
  };
  for (let seed = 0; seed < rallies; seed += 1) {
    const result = playRally({ seed, players, server: seed % 2, service: duel.service, listener });
    counts[result.cause] = (counts[result.cause] ?? 0) + 1;
    strokes += result.strokes;
    if (result.winner >= 0) seats[1 - result.winner].lost += 1;
  }
  const causes = Object.fromEntries(Object.entries(counts).sort().map(([cause, count]) => [cause, rounded(count / rallies, 3)]));
  return { strokes: rounded(strokes / rallies, 1), causes, seats: seats.map((seat) => seatSummary(seat, rallies)) };
}
