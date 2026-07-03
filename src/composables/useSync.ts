/**
 * useSync (SYNC-002): owns the active SyncService and applies inbound server
 * messages to local reactive state. Outbound local actions go through this too.
 *
 * Echo-loop safety: inbound (remote) messages are applied directly to the
 * reactive refs here and NEVER trigger an outbound message. Only the explicit
 * `send*` helpers emit to the server. So a remote `zone` update does not bounce
 * back as a `zone.set`.
 *
 * Role is derived from the SERVER (`self.role`), not a local toggle — this is
 * the foundation the anti-cheat lock (SYNC-003) builds on.
 */
import { computed, ref, type Ref } from 'vue'
import {
  createSyncService,
  type ConnectOptions,
  type SyncService,
  type SyncStatus,
} from '@/services/sync/syncService'
import { computeClockOffset } from '@/services/sync/protocol'
import type {
  GameEventKind,
  GamePhase,
  Position,
  PublicPlayer,
  Role,
  ServerMessage,
  Zone,
} from '@/services/sync/protocol'

export interface SyncSessionOptions {
  /** Inject a service (tests). Defaults to a real WsSyncService. */
  service?: SyncService
}

export interface SyncSession {
  status: Ref<SyncStatus>
  self: Ref<PublicPlayer | null>
  players: Ref<PublicPlayer[]>
  phase: Ref<GamePhase>
  zone: Ref<Zone | null>
  positions: Ref<Map<string, Position>>
  breachedSeekers: Ref<string[]>
  ruledOutCells: Ref<string[]>
  role: Ref<Role | null>
  /** Whether the host has paused the game (synced across devices). */
  paused: Ref<boolean>
  /** Estimated server−client clock offset (ms). Add to a client clock for server time. */
  clockOffset: Ref<number>
  connect(options: ConnectOptions): Promise<void>
  disconnect(): void
  sendPosition(pos: Position): void
  setZone(zone: Zone): void
  addRuledOutCells(cells: string[]): void
  sendHostAction(action: HostAction): void
  sendGameEvent(kind: GameEventKind, payload: Record<string, unknown>): void
  /** Subscribe to inbound relayed game events. Returns an unsubscribe fn. */
  onGameEvent(handler: GameEventHandler): () => void
  /** Send a clock-sync probe; the reply updates `clockOffset`. */
  syncClock(): void
}

/** Host-only phase/control actions (MULTI-003b-1). */
export type HostAction = 'start-hiding' | 'start-seeking' | 'end-round' | 'pause' | 'resume'

export type GameEventHandler = (e: {
  kind: GameEventKind
  from: string
  payload: Record<string, unknown>
}) => void

export function createSyncSession(options: SyncSessionOptions = {}): SyncSession {
  const service = options.service ?? createSyncService('ws')

  const self = ref<PublicPlayer | null>(null)
  const players = ref<PublicPlayer[]>([])
  const phase = ref<GamePhase>('setup')
  const zone = ref<Zone | null>(null)
  const positions = ref<Map<string, Position>>(new Map())
  const breachedSeekers = ref<string[]>([])
  const ruledOutCells = ref<string[]>([])

  const role = computed<Role | null>(() => self.value?.role ?? null)
  const clockOffset = ref(0)
  const paused = ref(false)
  // t1 of the most recent in-flight clock probe; replies must echo it, so a
  // stale/out-of-order reply can't corrupt the offset (no matched round trip).
  let pendingProbeT1: number | null = null

  const gameEventHandlers = new Set<GameEventHandler>()
  let unsubscribe: (() => void) | null = null

  /** Apply an inbound server message to local state (never echoes outbound). */
  function applyRemote(msg: ServerMessage): void {
    switch (msg.t) {
      case 'welcome':
        self.value = msg.you
        players.value = msg.players
        phase.value = msg.phase
        zone.value = msg.zone
        break
      case 'player.joined':
        if (!players.value.some((p) => p.id === msg.player.id)) {
          players.value = [...players.value, msg.player]
        }
        break
      case 'player.left':
        players.value = players.value.filter((p) => p.id !== msg.playerId)
        break
      case 'player.presence':
        players.value = players.value.map((p) =>
          p.id === msg.playerId ? { ...p, connected: msg.connected } : p,
        )
        break
      case 'phase':
        phase.value = msg.phase
        break
      case 'paused':
        paused.value = msg.paused
        break
      case 'zone':
        zone.value = msg.zone
        break
      case 'ruledout':
        ruledOutCells.value = msg.cells
        break
      case 'zone.breach':
        if (!breachedSeekers.value.includes(msg.playerId)) {
          breachedSeekers.value = [...breachedSeekers.value, msg.playerId]
        }
        break
      case 'pos.batch': {
        const next = new Map(positions.value)
        for (const { playerId, pos } of msg.positions) next.set(playerId, pos)
        positions.value = next
        break
      }
      case 'game.event':
        for (const h of gameEventHandlers) {
          h({ kind: msg.kind, from: msg.from, payload: msg.payload })
        }
        break
      case 'time.reply':
        // Only accept the reply for the probe currently in flight — a stale or
        // out-of-order reply has a mismatched round trip and a wrong offset.
        if (msg.t1 === pendingProbeT1) {
          clockOffset.value = computeClockOffset(msg.t1, msg.t2, Date.now())
          pendingProbeT1 = null
        }
        break
      case 'error':
        // Surfaced via status/logging later; ignore for state purposes.
        break
    }
  }

  async function connect(opts: ConnectOptions): Promise<void> {
    unsubscribe?.()
    unsubscribe = service.onMessage(applyRemote)
    await service.connect(opts)
  }

  function disconnect(): void {
    unsubscribe?.()
    unsubscribe = null
    service.disconnect()
    self.value = null
    players.value = []
    positions.value = new Map()
    breachedSeekers.value = []
    ruledOutCells.value = []
    paused.value = false
    pendingProbeT1 = null
  }

  // Outbound local actions — the ONLY things that emit to the server.
  function sendPosition(pos: Position): void {
    service.send({ t: 'pos', pos })
  }
  function setZone(z: Zone): void {
    service.send({ t: 'zone.set', zone: z })
  }
  function addRuledOutCells(cells: string[]): void {
    service.send({ t: 'ruledout.add', cells })
  }
  function sendHostAction(action: HostAction): void {
    service.send({ t: 'host.action', action })
  }
  function sendGameEvent(kind: GameEventKind, payload: Record<string, unknown>): void {
    service.send({ t: 'game.event', kind, payload })
  }
  function onGameEvent(handler: GameEventHandler): () => void {
    gameEventHandlers.add(handler)
    return () => gameEventHandlers.delete(handler)
  }
  function syncClock(): void {
    const t1 = Date.now()
    pendingProbeT1 = t1
    service.send({ t: 'time.sync', t1 })
  }

  return {
    status: service.status,
    self,
    players,
    phase,
    zone,
    positions,
    breachedSeekers,
    ruledOutCells,
    role,
    paused,
    connect,
    disconnect,
    sendPosition,
    setZone,
    addRuledOutCells,
    sendHostAction,
    sendGameEvent,
    onGameEvent,
    syncClock,
    clockOffset,
  }
}

// App-wide singleton session (one connection per device).
let singleton: SyncSession | null = null

export function useSync(): SyncSession {
  if (!singleton) singleton = createSyncSession()
  return singleton
}

/** Test/teardown helper to reset the singleton. */
export function __resetSyncSession(): void {
  singleton = null
}
