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
      phaseStartedAt: null,
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
      phaseStartedAt: null,
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
    f.emit({ t: 'phase', phase: 'seeking', startedAt: 1_000_000 })
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

  it('updates clockOffset from a time.reply matching an in-flight probe', async () => {
    const session = createSyncSession({ service: f.svc })
    await session.connect({ url: 'ws://x', code: 'ABCD', rejoinToken: 't' })
    // A probe must be sent first; the reply echoes its t1.
    session.syncClock()
    const probe = f.sent.at(-1) as Extract<ClientMessage, { t: 'time.sync' }>
    // Server claims a large time vs the local clock → positive offset.
    f.emit({ t: 'time.reply', t1: probe.t1, t2: probe.t1 + 100000 })
    expect(session.clockOffset.value).toBeGreaterThan(50000)
  })

  it('ignores a stale time.reply whose t1 does not match the in-flight probe', async () => {
    const session = createSyncSession({ service: f.svc })
    await session.connect({ url: 'ws://x', code: 'ABCD', rejoinToken: 't' })
    session.syncClock()
    const probe = f.sent.at(-1) as Extract<ClientMessage, { t: 'time.sync' }>
    // A reply for a DIFFERENT (older) probe must not corrupt the offset — NTP
    // offset is only valid for a matched round-trip pair.
    f.emit({ t: 'time.reply', t1: probe.t1 - 999999, t2: probe.t1 + 100000 })
    expect(session.clockOffset.value).toBe(0)
  })

  it('applies a host paused broadcast', async () => {
    const session = createSyncSession({ service: f.svc })
    await session.connect({ url: 'ws://x', code: 'ABCD', rejoinToken: 't' })
    expect(session.paused.value).toBe(false)
    f.emit({ t: 'paused', paused: true })
    expect(session.paused.value).toBe(true)
    f.emit({ t: 'paused', paused: false })
    expect(session.paused.value).toBe(false)
  })

  it('applies a roster broadcast, updating players and own role', async () => {
    const session = createSyncSession({ service: f.svc })
    await session.connect({ url: 'ws://x', code: 'ABCD', rejoinToken: 't' })
    f.emit({
      t: 'welcome',
      you: { id: 'h1', name: 'Host', role: 'hider', isHost: true, connected: true },
      players: [{ id: 'h1', name: 'Host', role: 'hider', isHost: true, connected: true }],
      phase: 'setup',
      phaseStartedAt: null,
      zone: null,
    })
    expect(session.role.value).toBe('hider')

    // Host picked s1 as hider → host is now a seeker.
    f.emit({
      t: 'roster',
      players: [
        { id: 'h1', name: 'Host', role: 'seeker', isHost: true, connected: true },
        { id: 's1', name: 'Sam', role: 'hider', isHost: false, connected: true },
      ],
    })
    expect(session.players.value.map((p) => p.id)).toEqual(['h1', 's1'])
    expect(session.role.value).toBe('seeker') // own role updated from the roster
  })

  it('setHider sends a set-hider frame', async () => {
    const session = createSyncSession({ service: f.svc })
    await session.connect({ url: 'ws://x', code: 'ABCD', rejoinToken: 't' })
    session.setHider('s1')
    expect(f.sent.at(-1)).toEqual({ t: 'set-hider', playerId: 's1' })
  })

  it('records phaseStartedAt from a phase message', async () => {
    const session = createSyncSession({ service: f.svc })
    await session.connect({ url: 'ws://x', code: 'ABCD', rejoinToken: 't' })
    f.emit({ t: 'phase', phase: 'hiding-period', startedAt: 1_700_000_000_000 })
    expect(session.phaseStartedAt.value).toBe(1_700_000_000_000)
  })

  it('does NOT probe the clock until welcome (avoids racing the hello handshake)', async () => {
    vi.useFakeTimers()
    const session = createSyncSession({ service: f.svc })
    await session.connect({ url: 'ws://x', code: 'ABCD', rejoinToken: 't' })
    // No probe before welcome: a time.sync here races hello → server closes the
    // socket ("expected hello").
    expect(f.sent.filter((m) => m.t === 'time.sync')).toHaveLength(0)

    // welcome acknowledges the handshake → first probe fires, then periodically.
    f.emit({
      t: 'welcome',
      you: { id: 'p1', name: 'A', role: 'seeker', isHost: false, connected: true },
      players: [],
      phase: 'setup',
      phaseStartedAt: null,
      zone: null,
    })
    expect(f.sent.filter((m) => m.t === 'time.sync')).toHaveLength(1)
    vi.advanceTimersByTime(30_000)
    expect(f.sent.filter((m) => m.t === 'time.sync')).toHaveLength(2)
    session.disconnect()
    vi.advanceTimersByTime(60_000)
    // No more probes after disconnect (interval cleared).
    expect(f.sent.filter((m) => m.t === 'time.sync')).toHaveLength(2)
    vi.useRealTimers()
  })

  it('serverNow applies the clock offset to local time', async () => {
    const session = createSyncSession({ service: f.svc })
    await session.connect({ url: 'ws://x', code: 'ABCD', rejoinToken: 't' })
    session.syncClock()
    const probe = f.sent.at(-1) as Extract<ClientMessage, { t: 'time.sync' }>
    f.emit({ t: 'time.reply', t1: probe.t1, t2: probe.t1 + 100_000 })
    // Offset ≈ +100000; serverNow should be well ahead of local Date.now().
    expect(session.serverNow()).toBeGreaterThan(Date.now() + 50_000)
  })

  it('relays game events to subscribers', async () => {
    const session = createSyncSession({ service: f.svc })
    await session.connect({ url: 'ws://x', code: 'ABCD', rejoinToken: 't' })
    const events: string[] = []
    session.onGameEvent((e) => events.push(e.kind))
    f.emit({ t: 'game.event', kind: 'question.asked', from: 'p9', payload: { questionId: 'q' } })
    expect(events).toEqual(['question.asked'])
  })
})
