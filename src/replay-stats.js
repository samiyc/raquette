/**
 * The first analyses of a series of replays, pure so that they are tested, and an example of how to read one: where each player
 * took the ball, what it kept over the net, how far its balls fell from where it aimed, and where it stood for a ball it missed.
 */
const mean = (values) => (values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : null);

function emptySeat() {
  return { strokes: 0, reach: [], margins: [], misses: [], speeds: [], stretched: 0, faults: {}, missed: {}, missedBack: [], missedAway: [] };
}

function noteImpact(seat, impact) {
  seat.strokes += 1;
  seat.reach.push(impact.reach);
  if (impact.netMargin !== null) seat.margins.push(impact.netMargin);
  if (impact.scatter.stretch > 1) seat.stretched += 1;
  const [vx, vy, vz] = impact.ballOut;
  seat.speeds.push(Math.sqrt(vx * vx + vy * vy + vz * vz));
  if (impact.landed?.kind === "table") {
    seat.misses.push(Math.hypot(impact.landed.x - impact.aim.target[0], impact.landed.y - impact.aim.target[1]));
  }
}

const count = (counts, key) => {
  counts[key] = (counts[key] ?? 0) + 1;
};

function noteLost(seats, lost) {
  if (!lost) return;
  const seat = seats[lost.who];
  if (lost.fault) {
    count(seat.faults, lost.fault);
    return;
  }
  count(seat.missed, lost.missed);
  seat.missedBack.push(Math.abs(lost.body[0]) - 1.37);
  if (lost.closest) seat.missedAway.push(lost.closest.distance);
}

const rounded = (value, digits = 3) => (value === null ? null : Number(value.toFixed(digits)));

function seatSummary(seat) {
  return {
    strokes: seat.strokes,
    reach: rounded(mean(seat.reach)),
    netMargin: rounded(mean(seat.margins)),
    speed: rounded(mean(seat.speeds), 2),
    aimMiss: rounded(mean(seat.misses)),
    stretchedPart: rounded(seat.strokes ? seat.stretched / seat.strokes : 0),
    faults: seat.faults,
    missed: seat.missed,
    missedBehindLine: rounded(mean(seat.missedBack)),
    missedClosest: rounded(mean(seat.missedAway)),
  };
}

/**
 * @param {any[]} rallies the lines of a series
 * @returns {{rallies: number, strokes: number, seats: object[]}}
 */
export function summarize(rallies) {
  const seats = [emptySeat(), emptySeat()];
  let strokes = 0;
  for (const rally of rallies) {
    strokes += rally.strokes;
    for (const impact of rally.impacts) noteImpact(seats[impact.who], impact);
    noteLost(seats, rally.lost);
  }
  return { rallies: rallies.length, strokes: rounded(rallies.length ? strokes / rallies.length : 0, 2), seats: seats.map(seatSummary) };
}
