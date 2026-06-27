import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { ref } from 'vue'
import { createSyncSession } from '../useSync'
import type { SyncService, SyncStatus } from '@/services/sync/syncService'
import type { ClientMessage, ServerMessage } from '@/services/sync/protocol'

/** A controllable fake SyncService. */
function fakeService() {
  const handlers = new Set<(m: ServerMessage) => void>()
  const status = ref<SyncStatus>('disconnected')
  const sent: ClientMessage[] = []
  const svc: SyncService = {
    status,
    connect: vi.fn(async () => {
      status.value = 'connected'
    }),
    disconnect: vi.fn(() => {
      status.value = 'disconnected'
    }),
    send: vi.fn((m: ClientMessage) => sent.push(m)),
    onMessage: vi.fn((h) => {
      handlers.add(h)
      return () => handlers.delete(h)
    }),
  }
  return { svc, sent, emit: (m: ServerMessage) => handlers.forEach((h) => h(m)) }
}

describe('createSyncSession', () => {
  let f: ReturnType<typeof fakeService>

  beforeEach(() => {
    f = fakeService()
  })
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('connects with the given url/code/token', async () => {
    const session = createSyncSession({ service: f.svc })
    await session.connect({ url: 'ws://x/ws', code: 'ABCD', rejoinToken: 'tok' })
    expect(f.svc.connect).toHaveBeenCalledWith({
      url: 'ws://x/ws',
      code: 'ABCD',
      rejoinToken: 'tok',
    })
    expect(session.status.value).toBe('connected')
  })

  it('applies an inbound roster (welcome) to local state', async () => {
    const session = createSyncSession({ service: f.svc })
    await session.connect({ url: 'ws://x', code: 'ABCD', rejoinToken: 't' })
    f.emit({
      t: 'welcome',
      you: { id: 'p1', name: 'A', role: 'hider', isHost: true, connected: true },
      players: [{ id: 'p1', name: 'A', role: 'hider', isHost: true, connected: true }],
      phase: 'setup',
      zone: null,
    })
    expect(session.players.value.map((p) => p.id)).toEqual(['p1'])
    expect(session.self.value?.id).toBe('p1')
  })

  it('derives role from the server self (not a local toggle)', async () => {
    const session = createSyncSession({ service: f.svc })
    await session.connect({ url: 'ws://x', code: 'ABCD', rejoinToken: 't' })
    f.emit({
      t: 'welcome',
      you: { id: 's1', name: 'S', role: 'seeker', isHost: false, connected: true },
      players: [],
      phase: 'setup',
      zone: null,
    })
    expect(session.role.value).toBe('seeker')
  })

  it('updates roster on player.joined / player.left', async () => {
    const session = createSyncSession({ service: f.svc })
    await session.connect({ url: 'ws://x', code: 'ABCD', rejoinToken: 't' })
    f.emit({
      t: 'player.joined',
      player: { id: 'p2', name: 'B', role: 'seeker', isHost: false, connected: true },
    })
    expect(session.players.value.map((p) => p.id)).toContain('p2')
    f.emit({ t: 'player.left', playerId: 'p2' })
    expect(session.players.value.map((p) => p.id)).not.toContain('p2')
  })

  it('applies phase and zone updates', async () => {
    const session = createSyncSession({ service: f.svc })
    await session.connect({ url: 'ws://x', code: 'ABCD', rejoinToken: 't' })
    f.emit({ t: 'phase', phase: 'seeking' })
    expect(session.phase.value).toBe('seeking')
    f.emit({ t: 'zone', zone: { lat: 1, lng: 2, radiusM: 402 } })
    expect(session.zone.value).toMatchObject({ radiusM: 402 })
  })

  it('tracks position batches and breach', async () => {
    const session = createSyncSession({ service: f.svc })
    await session.connect({ url: 'ws://x', code: 'ABCD', rejoinToken: 't' })
    f.emit({ t: 'pos.batch', positions: [{ playerId: 'p2', pos: { lat: 1, lng: 2, ts: 5 } }] })
    expect(session.positions.value.get('p2')?.lat).toBe(1)
    f.emit({ t: 'zone.breach', playerId: 's1' })
    expect(session.breachedSeekers.value).toContain('s1')
  })

  it('does NOT echo remote-applied changes back to the server', async () => {
    const session = createSyncSession({ service: f.svc })
    await session.connect({ url: 'ws://x', code: 'ABCD', rejoinToken: 't' })
    // Applying an inbound zone must not trigger an outbound zone.set.
    f.emit({ t: 'zone', zone: { lat: 1, lng: 2, radiusM: 402 } })
    expect(f.sent.find((m) => m.t === 'zone.set')).toBeUndefined()
  })

  it('sends local actions via the service', async () => {
    const session = createSyncSession({ service: f.svc })
    await session.connect({ url: 'ws://x', code: 'ABCD', rejoinToken: 't' })
    session.sendPosition({ lat: 3, lng: 4, ts: 9 })
    expect(f.sent.find((m) => m.t === 'pos')).toBeTruthy()
  })

  it('disconnect() tears down the service', async () => {
    const session = createSyncSession({ service: f.svc })
    await session.connect({ url: 'ws://x', code: 'ABCD', rejoinToken: 't' })
    session.disconnect()
    expect(f.svc.disconnect).toHaveBeenCalled()
  })
})
