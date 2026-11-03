/**
 * The shapes the modules hand each other, in JSDoc (`npm run types`). A module points here with
 * `@typedef {import("./types.js").Name} Name`.
 *
 * A ball is a Float64Array of 9 numbers: position, velocity, spin (src/ball/constants.js gives their places).
 *
 * @typedef {object} Launch A ball thrown by hand: metres, m/s, degrees, turns per second.
 * @property {number} [x]
 * @property {number} [y]
 * @property {number} [z]
 * @property {number} speed
 * @property {number} [elevation] above the horizontal
 * @property {number} [azimuth] from the x axis, towards +y
 * @property {number} [topspin] negative for a backspin
 * @property {number} [sidespin] about the vertical; positive deflects a ball going towards +x to +y
 *
 * @typedef {object} FlightEvent What a flight ran into, and where.
 * @property {"table" | "net" | "floor"} kind
 * @property {number} step
 * @property {number} x
 * @property {number} y
 *
 * @typedef {object} Recording A flight kept step by step.
 * @property {number} steps
 * @property {Float64Array} frames `(steps + 1)` balls, one after the other
 * @property {FlightEvent[]} events
 *
 * @typedef {object} Swing What a player asks of the racket.
 * @property {number} speed how fast the ball is to leave along the racket's normal, m/s
 * @property {number} brushUp the racket's speed along its face, m/s: up for a lift, down for a backspin
 * @property {number} brushSide the racket's speed across its face, m/s
 * @property {boolean} [sideways] a side stroke: at the mouse, its brush turns towards the side aimed at
 *
 * @typedef {object} AimTask A stroke to aim.
 * @property {Float64Array} ball as it comes to the racket
 * @property {number} forward the way the player plays, +1 or −1
 * @property {number[]} target x and y on the other camp
 * @property {Swing} swing
 *
 * @typedef {typeof import("./player.js").CLUB_PLAYER} Profile What a body and an arm can do.
 *
 * @typedef {object} View What a rule reads when it decides.
 * @property {{from: number, to: number}} way the steps at which the ball may be taken (src/forecast.js holds its frames)
 * @property {number} h seconds per step
 * @property {number} side −1 or +1
 * @property {Profile} profile
 * @property {Float64Array} body
 * @property {Float64Array} opponent the other player's body
 * @property {number} tick
 * @property {number} who the player reading
 * @property {any} state the rally, for a search to play on from it, on a copy
 *
 * @typedef {object} Intent What a rule decides: the stroke, and where to go.
 * @property {number} step how many steps from now the ball is to be taken
 * @property {number[]} goal where to stand for it
 * @property {number[]} target where to send the ball
 * @property {Swing} swing
 * @property {number[] | null} next where to go afterwards; null: stay on course
 *
 * @typedef {object} Rule
 * @property {string} name
 * @property {number} [version] goes up when what it does changes: replays name it `R3@1`
 * @property {(rally: {seed: number, server: number, profile: any}) => {key: string, y: number}} [chooseService] a rule that picks its service
 * @property {(view: View) => Intent | null} decide null: the ball is let go
 *
 * @typedef {object} RallyListener Optional: what a recording or a page wants to hear of a rally.
 * @property {(state: any) => void} [tick]
 * @property {(kind: number, state: any) => void} [flight]
 * @property {(who: number, tick: number) => void} [stroke]
 * @property {(who: number, way: any, intent: any, state: any) => void} [read] a player has read the ball
 * @property {(detail: any, state: any) => void} [impact] the ball has left the racket; docs/replays.md
 *
 * @typedef {object} RallyOptions
 * @property {number} seed
 * @property {{rule: Rule, profile: Profile}[]} players the first plays from x < 0, the second from x > 0
 * @property {number} server 0 or 1
 * @property {RallyListener} [listener]
 * @property {any} [service] the long one by default; or one of src/services.js
 * @property {number} [serviceY] where a service of src/services.js is sent across the table, in the server's own frame
 * @property {{key: string, y: number}} [served] a service picked in advance, by its name
 * @property {boolean} [choosing] the server picks its service, if its rule can
 *
 * @typedef {"net" | "out" | "twoBounces" | "notReached" | "behind" | "limit"} Cause
 *
 * @typedef {object} RallyResult
 * @property {number} winner 0 or 1; −1 for a rally stopped at its limit
 * @property {Cause} cause
 * @property {number} strokes after the service
 * @property {number} ticks
 *
 * @typedef {object} RallyRecording A rally kept step by step, for the page to replay.
 * @property {number} steps
 * @property {Float64Array} frames `(steps + 1)` balls, one after the other
 * @property {Float64Array} bodies `(steps + 1)` times x and y of both players
 * @property {FlightEvent[]} events
 * @property {number[]} strokes the step of each stroke
 * @property {RallyResult} result
 */
export {};
