/**
 * Shared DTOs for the realtime sync protocol (INFRA-008).
 *
 * Zero runtime dependencies — type-only, plus a couple of small const helpers.
 * Imported by BOTH the Vue client and the Fastify server so the wire format
 * can never drift between them.
 *
 * Protocol: every WebSocket frame is JSON with a discriminant `t` field.
 */

// ── Core value types ────────────────────────────────────────────────────────

export type Role = 'hider' | 'seeker'

export type GamePhase = 'setup' | 'hiding-period' | 'seeking' | 'end-game' | 'round-complete'

/** A GPS position report. Accuracy in meters; ts is epoch millis. */
export interface Position {
  lat: number
  lng: number
  accuracy?: number
  ts: number
}

/** A player as seen by clients (never includes secrets like the token hash). */
export interface PublicPlayer {
  id: string
  name: string
  role: Role
  isHost: boolean
  connected: boolean
}

/** Hiding zone: a circle centered on the chosen bus stop. */
export interface Zone {
  /** Center latitude. */
  lat: number
  /** Center longitude. */
  lng: number
  /** Radius in meters (¼ mile = 402 m for the Stillwater small game). */
  radiusM: number
  /** Optional label, e.g. the bus stop name. */
  label?: string
}

/** Quarter-mile in meters — the Stillwater small-game hiding-zone radius. */
export const QUARTER_MILE_M = 402

// ── Client → Server messages ────────────────────────────────────────────────

/** First frame after the socket opens; authenticates via the rejoin token. */
export interface HelloMessage {
  t: 'hello'
  code: string
  rejoinToken: string
}

/** A throttled position update from this client. */
export interface PosMessage {
  t: 'pos'
  pos: Position
}

/** Hider declares/updates the hiding zone. */
export interface ZoneSetMessage {
  t: 'zone.set'
  zone: Zone
}

/** Seeker marks geohash cells as ruled out (set-union on the server). */
export interface RuledOutAddMessage {
  t: 'ruledout.add'
  cells: string[]
}

/** Host-only game action (phase transitions, etc.). */
export interface HostActionMessage {
  t: 'host.action'
  action: 'start-hiding' | 'start-seeking' | 'end-round' | 'pause' | 'resume'
}

/**
 * Host-only: choose which player is the hider. The server sets that player's
 * role to 'hider' and everyone else to 'seeker', then broadcasts the updated
 * roster (RosterMessage). Carries a playerId, which host.action can't.
 */
export interface SetHiderMessage {
  t: 'set-hider'
  playerId: string
}

/** Kinds of game events relayed between devices (MULTI-003b-2+). */
export type GameEventKind =
  | 'question.asked'
  | 'question.answered'
  | 'question.vetoed'
  | 'curse.activated'
  | 'curse.cleared'
  | 'card.drawn'
  | 'timetrap.triggered'
  | 'timer.sync'

/** Clock-sync probe (NTP-style): client stamps t1 and the server replies. */
export interface TimeSyncRequest {
  t: 'time.sync'
  /** Client send time (ms). */
  t1: number
}

/** A game event a client emits to be relayed to the rest of the room. */
export interface GameEventMessage {
  t: 'game.event'
  kind: GameEventKind
  /** Opaque, kind-specific payload (validated by the applying store). */
  payload: Record<string, unknown>
}

export type ClientMessage =
  | HelloMessage
  | PosMessage
  | ZoneSetMessage
  | RuledOutAddMessage
  | HostActionMessage
  | SetHiderMessage
  | GameEventMessage
  | TimeSyncRequest

// ── Server → Client messages ────────────────────────────────────────────────

/** Handshake ack: who you are + the current roster/phase. */
export interface WelcomeMessage {
  t: 'welcome'
  you: PublicPlayer
  players: PublicPlayer[]
  phase: GamePhase
  zone: Zone | null
}

export interface PlayerJoinedMessage {
  t: 'player.joined'
  player: PublicPlayer
}

/**
 * Full roster re-broadcast after a role change (e.g. the host picks the hider
 * via SetHiderMessage). Reuses `PublicPlayer.role`, so a single message keeps
 * every client's roster + roles authoritative — no separate hider-id concept.
 */
export interface RosterMessage {
  t: 'roster'
  players: PublicPlayer[]
}

export interface PlayerLeftMessage {
  t: 'player.left'
  playerId: string
}

export interface PresenceMessage {
  t: 'player.presence'
  playerId: string
  connected: boolean
}

/** Coalesced batch of latest positions, one per player. */
export interface PosBatchMessage {
  t: 'pos.batch'
  positions: Array<{ playerId: string; pos: Position }>
}

/** Broadcast of the current zone (seekers only ever see the declared zone). */
export interface ZoneMessage {
  t: 'zone'
  zone: Zone | null
}

/** Broadcast of the full ruled-out cell set. */
export interface RuledOutMessage {
  t: 'ruledout'
  cells: string[]
}

/** Server-computed: a seeker entered the hiding zone (drives end-game UI). */
export interface ZoneBreachMessage {
  t: 'zone.breach'
  playerId: string
}

export interface PhaseMessage {
  t: 'phase'
  phase: GamePhase
}

/**
 * Host paused/resumed the game. Pause is orthogonal to the phase machine (the
 * phase is unchanged), so it is its own message rather than a GamePhase value.
 */
export interface PausedMessage {
  t: 'paused'
  paused: boolean
}

/** A game event relayed from another device (the server echoes it on). */
export interface GameEventRelay {
  t: 'game.event'
  kind: GameEventKind
  /** Id of the player who originated the event (for echo suppression). */
  from: string
  payload: Record<string, unknown>
}

/** Clock-sync reply: echoes the client's t1 and adds the server time t2. */
export interface TimeSyncReply {
  t: 'time.reply'
  t1: number
  /** Server time when it processed the probe (ms). */
  t2: number
}

export interface ErrorMessage {
  t: 'error'
  code: 'bad_token' | 'room_not_found' | 'bad_message' | 'forbidden'
  message: string
}

export type ServerMessage =
  | WelcomeMessage
  | PlayerJoinedMessage
  | RosterMessage
  | PlayerLeftMessage
  | PresenceMessage
  | PosBatchMessage
  | ZoneMessage
  | RuledOutMessage
  | ZoneBreachMessage
  | PhaseMessage
  | PausedMessage
  | GameEventRelay
  | TimeSyncReply
  | ErrorMessage

// ── Synced state snapshot (persisted in sessions.state JSONB) ────────────────

export interface SyncedState {
  phase: GamePhase
  zone: Zone | null
  ruledOutCells: string[]
  currentHiderId: string | null
}

// ── Type guards / helpers (tiny, still zero-dep) ─────────────────────────────

/**
 * Estimate the client→server clock offset (ms) from a time-sync round trip.
 * offset ≈ serverTime − clientMidpoint, where clientMidpoint is halfway between
 * send (t1) and receive (t3). Add `offset` to a client clock to get server time.
 */
export function computeClockOffset(t1: number, t2: number, t3: number): number {
  return t2 - (t1 + t3) / 2
}

/**
 * Great-circle distance in meters between two lat/lng points (haversine).
 * The single source of truth for distance — client (throttle, shading) and
 * server (zone-breach) all use this so the breach boundary can never drift.
 */
export function distanceMeters(aLat: number, aLng: number, bLat: number, bLng: number): number {
  const R = 6_371_000 // Earth radius (m)
  const toRad = (d: number) => (d * Math.PI) / 180
  const dLat = toRad(bLat - aLat)
  const dLng = toRad(bLng - aLng)
  const lat1 = toRad(aLat)
  const lat2 = toRad(bLat)
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(h))
}

export function isClientMessageType(t: string): t is ClientMessage['t'] {
  return (
    t === 'hello' ||
    t === 'pos' ||
    t === 'zone.set' ||
    t === 'ruledout.add' ||
    t === 'host.action' ||
    t === 'set-hider' ||
    t === 'game.event' ||
    t === 'time.sync'
  )
}

export function isServerMessageType(t: string): t is ServerMessage['t'] {
  return (
    t === 'welcome' ||
    t === 'player.joined' ||
    t === 'roster' ||
    t === 'player.left' ||
    t === 'player.presence' ||
    t === 'pos.batch' ||
    t === 'zone' ||
    t === 'ruledout' ||
    t === 'zone.breach' ||
    t === 'phase' ||
    t === 'paused' ||
    t === 'game.event' ||
    t === 'time.reply' ||
    t === 'error'
  )
}
