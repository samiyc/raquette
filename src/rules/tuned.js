import { EARLY } from "./tuned-early.js";

/**
 * What self-play kept: the numbers of the attacking rule (src/rules/tunable.js), copied whole from a lineage's history, so that a
 * measure of the lineage is a measure of this rule. `T`: lineage h, the strongest of g, h and i, on the body of 8 m/s²
 * (docs/selfplay/h.json). `U`: lineage k, the strongest of j, k and l, on the body of 16 m/s² (docs/selfplay/k.json). `V`: lineage n,
 * level with o, on the body of 14 m/s² that pays for a stroke on the run (docs/selfplay/n.json). `W` and `X`: lineages p and q, level
 * with each other, on the arm of 72 cm: W keeps a cut for when it is not in place and barely covers, X covers a third of the way and
 * waits a little, but sits at the bottom of the range for its top and its soft stroke (docs/selfplay/p.json, q.json). `Y`: lineage t
 * at its version 19, better read on the panel than its last one (docs/selfplay/A3.json, same seeds as t.json): the first rule with a
 * finishing stroke, which it plays only with a quarter of a second in hand. `Z`: lineage v, from Y, the first rule to beat X;
 * it waits half a second in hand before finishing (docs/selfplay/v.json). `F`: lineage y3, from Y, the first one tuned with the fatigue
 * and the spin read late, at a rally of 20 strokes at most (docs/selfplay/y3.json). `G`: lineage w2, from W with the finishing stroke of
 * f1, the first one tuned with the error of the face as an angle, and the first rule to beat S-mW (docs/selfplay/w2.json). `H`: lineage
 * g1, from G, version 6: a faster top and a deeper cut, the strongest of g1 to g4 (docs/selfplay/g1.json). `I`: H, which picks its
 * service, each kind at the best place a map of 1 500 seeds a place found against H (raq-place, 10/11/2026): the pendulum, the hammer,
 * the soft and the cut service, as likely, none of the bomb and the sidespin (docs/recherche/autojeu.md). `J`: lineage k3, from I, its
 * return tuned on services drawn at random: level with I, better than I against every other rule (docs/selfplay/k3.json).
 */
/** H, apart: I is H with a service of its own. */
const H = Object.freeze({
    wide: 0.23149882843717937,
    depth: 0.685,
    topWide: 0.5811254220083355,
    topDepth: 0.9328799451235681,
    topSpeed: 7.100642495555803,
    topBrush: 12.36481721047312,
    pushSpeed: 1.9378881037700921,
    pushBrush: -1.7437373641878366,
    pushVary: 0.5713844890706241,
    flatSpeed: 5.793402028270066,
    highBall: 0.10359561834484339,
    wait: 0.31729065817780794,
    cover: 0.17895307829603554,
    ready: -0.10295073045417666,
    softSpeed: 6.225587263237685,
    softBrush: -7.236448443494737,
    softDepth: 0.8321663798764348,
    softWide: 0.2179408595431596,
    softRise: 0.150911890110001,
    killSlow: 7.98,
    killHigh: 0.24060783573426303,
    killReady: 0.18,
    killSpeed: 13.809074238408357,
    killBrush: 12.67,
    killWide: 0.59,
});

/** I, apart: J is I with a return of its own. */
const I = Object.freeze({
  ...H,
  // Each kind: its weight, where across it lands, where its server stands (src/rules/serving.js).
  servePendule: 1, serveAimPendule: 0.45, serveFromPendule: 0.25,
  serveMarteau: 1, serveAimMarteau: -0.15, serveFromMarteau: 0,
  serveMou: 1, serveAimMou: 0, serveFromMou: 0.5,
  serveCoupe: 1, serveAimCoupe: -0.45, serveFromCoupe: -0.25,
  serveBombe: 0, serveAimBombe: 0, serveFromBombe: 0.25,
  serveLateral: 0, serveAimLateral: 0.45, serveFromLateral: 0.5,
});

export const TUNED = Object.freeze({
  ...EARLY,
  F: Object.freeze({
    wide: 0.5610064342617989,
    depth: 0.7172152919135988,
    topWide: 0.5947404607199132,
    topDepth: 0.9826740829274058,
    topSpeed: 3,
    topBrush: 14.283890642225742,
    pushSpeed: 2.0641868081875145,
    pushBrush: -1.6543042799457908,
    pushVary: 0,
    flatSpeed: 6.708490592427552,
    highBall: 0.1,
    wait: 0.13555467925034462,
    cover: 0.3992567885667087,
    ready: -0.15777532975189384,
    softSpeed: 2,
    softBrush: 1.6555103342980146,
    softDepth: 0.8494041964877397,
    softWide: 0.3996309629641473,
    softRise: 0.15924145278986543,
    killSlow: 7.976958626881242,
    killHigh: 0.28559063682332636,
    killReady: 0.2567783311009407,
    killSpeed: 15.359148130984977,
    killBrush: 12.670148278586566,
    killWide: 0.59231733744964,
  }),
  G: Object.freeze({
    wide: 0.3206986870616675,
    depth: 0.685,
    topWide: 0.5811254220083355,
    topDepth: 0.88473213436082,
    topSpeed: 5.418558279285207,
    topBrush: 12.36481721047312,
    pushSpeed: 1.9378881037700921,
    pushBrush: -2.557134680915624,
    pushVary: 0.5713844890706241,
    flatSpeed: 5.73334011528641,
    highBall: 0.10359561834484339,
    wait: 0.15826186870690437,
    cover: 0.17895307829603554,
    ready: -0.10295073045417666,
    softSpeed: 5.787668405100703,
    softBrush: -6.039846641942859,
    softDepth: 0.8321663798764348,
    softWide: 0.2179408595431596,
    softRise: 0.150911890110001,
    killSlow: 7.98,
    killHigh: 0.29,
    killReady: 0.18,
    killSpeed: 14.785901677561924,
    killBrush: 12.67,
    killWide: 0.59,
  }),
  H,
  I,
  J: Object.freeze({
    ...I,
    // The return of service (src/rules/phases.js), set apart from the rest of the rally.
    returnHighBall: 0.12629526732489466,
    returnReady: -0.022538782632909718,
    returnTopSpeed: 8.598249659175053,
    returnTopBrush: 12.36481721047312,
    returnTopDepth: 0.9328799451235681,
    returnTopWide: 0.6229975426569581,
    returnPushSpeed: 1.8447126210667193,
    returnPushBrush: -1.7437373641878366,
    returnDepth: 0.685,
    returnWide: 0.23149882843717937,
    returnSoftDepth: 0.8584402306005359,
    returnSoftWide: 0.2179408595431596,
  }),
});
