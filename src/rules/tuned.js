/**
 * What self-play kept: the numbers of the attacking rule (src/rules/tunable.js), copied whole from a lineage's history, so that a
 * measure of the lineage is a measure of this rule. `T`: lineage h, the strongest of g, h and i, on the body of 8 m/s²
 * (docs/selfplay/h.json). `U`: lineage k, the strongest of j, k and l, on the body of 16 m/s² (docs/selfplay/k.json). `V`: lineage n,
 * level with o, on the body of 14 m/s² that pays for a stroke on the run (docs/selfplay/n.json).
 */
export const TUNED = Object.freeze({
  T: Object.freeze({
    wide: 0.5907540278974921,
    depth: 0.685,
    topWide: 0.5973440505564213,
    topDepth: 0.9519055159762502,
    topSpeed: 5,
    topBrush: 13.383805429562926,
    pushSpeed: 3.2896978443022817,
    pushBrush: -1.4117853669449687,
    flatSpeed: 5.618064164184034,
    highBall: 0.14853843853343277,
    wait: 0.43966010308358816,
  }),
  U: Object.freeze({
    wide: 0.33007483710534874,
    depth: 0.8269118836056442,
    topWide: 0.1,
    topDepth: 0.861447834642604,
    topSpeed: 5.015904356492683,
    topBrush: 6.557179170660675,
    pushSpeed: 3.409551758086309,
    pushBrush: -1.1930057709105313,
    flatSpeed: 4.749996110796928,
    highBall: 0.22810621045064183,
    wait: 0.1,
  }),
  V: Object.freeze({
    wide: 0.36415244434028865,
    depth: 0.685,
    topWide: 0.5879015626385807,
    topDepth: 0.9357812209054828,
    topSpeed: 4.064922779798508,
    topBrush: 13.306580382399261,
    pushSpeed: 2.2394939097575843,
    pushBrush: -2.0875269658863544,
    flatSpeed: 6.706215665210038,
    highBall: 0.1504727798514068,
    wait: 0.3767238041618839,
  }),
});
