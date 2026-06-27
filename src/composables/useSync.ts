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
import type {
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
  connect(options: ConnectOptions): Promise<void>
  disconnect(): void
  sendPosition(pos: Position): void
  setZone(zone: Zone): void
  addRuledOutCells(cells: string[]): void
}

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
    connect,
    disconnect,
    sendPosition,
    setZone,
    addRuledOutCells,
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
