import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { NoopSyncService, WsSyncService, createSyncService } from '../syncService'
import type { ClientMessage, ServerMessage } from '../protocol'

describe('NoopSyncService', () => {
  it('reports disconnected status', () => {
    const svc = new NoopSyncService()
    expect(svc.status.value).toBe('disconnected')
  })

  it('connect() does nothing and stays disconnected', async () => {
    const svc = new NoopSyncService()
    await svc.connect({ url: 'ws://x', code: 'ABCD', rejoinToken: 't' })
    expect(svc.status.value).toBe('disconnected')
  })

  it('send() is a no-op (does not throw)', () => {
    const svc = new NoopSyncService()
    expect(() => svc.send({ t: 'pos', pos: { lat: 0, lng: 0, ts: 1 } })).not.toThrow()
  })

  it('onMessage returns an unsubscribe fn', () => {
    const svc = new NoopSyncService()
    const off = svc.onMessage(() => {})
    expect(typeof off).toBe('function')
    off()
  })
})

// ── WsSyncService with a mock WebSocket ─────────────────────────────────────

class MockWebSocket {
  static OPEN = 1
  static CLOSED = 3
  readyState = 0
  sent: string[] = []
  onopen: (() => void) | null = null
  onclose: (() => void) | null = null
  onerror: ((e: unknown) => void) | null = null
  onmessage: ((e: { data: string }) => void) | null = null

  constructor(public url: string) {
    MockWebSocket.last = this
  }
  static last: MockWebSocket | null = null

  send(data: string) {
    this.sent.push(data)
  }
  close() {
    this.readyState = MockWebSocket.CLOSED
    this.onclose?.()
  }
  // test helpers
  _open() {
    this.readyState = MockWebSocket.OPEN
    this.onopen?.()
  }
  _emit(msg: ServerMessage) {
    this.onmessage?.({ data: JSON.stringify(msg) })
  }
}

describe('WsSyncService', () => {
  beforeEach(() => {
    vi.stubGlobal('WebSocket', MockWebSocket as unknown as typeof WebSocket)
    MockWebSocket.last = null
  })
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  function makeConnected() {
    const svc = new WsSyncService()
    const p = svc.connect({ url: 'ws://x/ws', code: 'ABCD', rejoinToken: 'tok' })
    const ws = MockWebSocket.last!
    ws._open()
    return { svc, ws, connected: p }
  }

  it('opens a socket to the given url', () => {
    const { ws } = makeConnected()
    expect(ws.url).toBe('ws://x/ws')
  })

  it('sends the hello handshake on open', async () => {
    const { ws, connected } = makeConnected()
    await connected
    const first = JSON.parse(ws.sent[0]!) as ClientMessage
    expect(first).toMatchObject({ t: 'hello', code: 'ABCD', rejoinToken: 'tok' })
  })

  it('transitions to connected after the socket opens', async () => {
    const { svc, connected } = makeConnected()
    await connected
    expect(svc.status.value).toBe('connected')
  })

  it('send() serializes client messages over the socket', async () => {
    const { svc, ws, connected } = makeConnected()
    await connected
    svc.send({ t: 'ruledout.add', cells: ['x'] })
    const last = JSON.parse(ws.sent.at(-1)!) as ClientMessage
    expect(last).toMatchObject({ t: 'ruledout.add', cells: ['x'] })
  })

  it('delivers server messages to subscribers', async () => {
    const { svc, ws, connected } = makeConnected()
    await connected
    const received: ServerMessage[] = []
    svc.onMessage((m) => received.push(m))
    ws._emit({ t: 'phase', phase: 'seeking' })
    expect(received).toEqual([{ t: 'phase', phase: 'seeking' }])
  })

  it('unsubscribe stops delivery', async () => {
    const { svc, ws, connected } = makeConnected()
    await connected
    const received: ServerMessage[] = []
    const off = svc.onMessage((m) => received.push(m))
    off()
    ws._emit({ t: 'phase', phase: 'seeking' })
    expect(received).toHaveLength(0)
  })

  it('ignores malformed inbound JSON without throwing', async () => {
    const { ws, connected } = makeConnected()
    await connected
    expect(() => ws.onmessage?.({ data: 'not json' })).not.toThrow()
  })

  it('disconnect() closes the socket and sets disconnected', async () => {
    const { svc, connected } = makeConnected()
    await connected
    svc.disconnect()
    expect(svc.status.value).toBe('disconnected')
  })
})

describe('createSyncService', () => {
  it('returns a Noop service by default', () => {
    expect(createSyncService()).toBeInstanceOf(NoopSyncService)
  })
  it('returns a Ws service when kind is "ws"', () => {
    expect(createSyncService('ws')).toBeInstanceOf(WsSyncService)
  })
})
