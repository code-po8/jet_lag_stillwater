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

export type ClientMessage =
  | HelloMessage
  | PosMessage
  | ZoneSetMessage
  | RuledOutAddMessage
  | HostActionMessage

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

export interface ErrorMessage {
  t: 'error'
  code: 'bad_token' | 'room_not_found' | 'bad_message' | 'forbidden'
  message: string
}

export type ServerMessage =
  | WelcomeMessage
  | PlayerJoinedMessage
  | PlayerLeftMessage
  | PresenceMessage
  | PosBatchMessage
  | ZoneMessage
  | RuledOutMessage
  | ZoneBreachMessage
  | PhaseMessage
  | ErrorMessage

// ── Synced state snapshot (persisted in sessions.state JSONB) ────────────────

export interface SyncedState {
  phase: GamePhase
  zone: Zone | null
  ruledOutCells: string[]
  currentHiderId: string | null
}

// ── Type guards / helpers (tiny, still zero-dep) ─────────────────────────────

export function isClientMessageType(t: string): t is ClientMessage['t'] {
  return (
    t === 'hello' || t === 'pos' || t === 'zone.set' || t === 'ruledout.add' || t === 'host.action'
  )
}

export function isServerMessageType(t: string): t is ServerMessage['t'] {
  return (
    t === 'welcome' ||
    t === 'player.joined' ||
    t === 'player.left' ||
    t === 'player.presence' ||
    t === 'pos.batch' ||
    t === 'zone' ||
    t === 'ruledout' ||
    t === 'zone.breach' ||
    t === 'phase' ||
    t === 'error'
  )
}
