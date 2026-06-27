import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { WebSocket } from 'ws'
import { buildApp } from '../../app.js'
import type { FastifyInstance } from 'fastify'
import type { ConnectionAuth } from '../gateway.js'
import type { ServerMessage } from '@shared'

// Mock auth: maps rejoin tokens to players, no DB needed. This exercises the
// full WS gateway over a real socket. Runs as an integration test because it
// binds a port (not the offline unit env).
const PLAYERS: Record<
  string,
  { id: string; name: string; role: 'hider' | 'seeker'; isHost: boolean }
> = {
  'tok-hider': { id: 'h1', name: 'Hank', role: 'hider', isHost: true },
  'tok-seeker': { id: 's1', name: 'Sue', role: 'seeker', isHost: false },
  'tok-seeker2': { id: 's2', name: 'Sam', role: 'seeker', isHost: false },
}
const mockAuth: ConnectionAuth = {
  async resolve(code, token) {
    const p = PLAYERS[token]
    if (!p || code.toUpperCase() !== 'ABCD') return null
    return { player: { ...p, connected: true } }
  },
}

function nextMessage(
  ws: WebSocket,
  predicate: (m: ServerMessage) => boolean,
): Promise<ServerMessage> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('timeout waiting for message')), 3000)
    function onMsg(data: Buffer) {
      const msg = JSON.parse(data.toString()) as ServerMessage
      if (predicate(msg)) {
        clearTimeout(timer)
        ws.off('message', onMsg)
        resolve(msg)
      }
    }
    ws.on('message', onMsg)
  })
}

function connect(url: string): Promise<WebSocket> {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(url)
    ws.once('open', () => resolve(ws))
    ws.once('error', reject)
  })
}

describe('WS gateway (integration)', () => {
  let app: FastifyInstance
  let url: string

  beforeEach(async () => {
    app = buildApp({ logger: false, ws: { auth: mockAuth, batchIntervalMs: 100 } })
    await app.listen({ port: 0, host: '127.0.0.1' })
    const addr = app.server.address()
    const port = typeof addr === 'object' && addr ? addr.port : 0
    url = `ws://127.0.0.1:${port}/ws`
  })

  afterEach(async () => {
    await app.close()
  })

  async function helloAs(token: string) {
    const ws = await connect(url)
    ws.send(JSON.stringify({ t: 'hello', code: 'ABCD', rejoinToken: token }))
    const welcome = await nextMessage(ws, (m) => m.t === 'welcome')
    return { ws, welcome }
  }

  it('completes the hello/welcome handshake', async () => {
    const { ws, welcome } = await helloAs('tok-hider')
    expect(welcome.t).toBe('welcome')
    if (welcome.t === 'welcome') expect(welcome.you.id).toBe('h1')
    ws.close()
  })

  it('rejects an invalid token', async () => {
    const ws = await connect(url)
    ws.send(JSON.stringify({ t: 'hello', code: 'ABCD', rejoinToken: 'nope' }))
    const err = await nextMessage(ws, (m) => m.t === 'error')
    expect(err.t === 'error' && err.code).toBe('bad_token')
    ws.close()
  })

  it('broadcasts player.joined to existing members', async () => {
    const { ws: hider } = await helloAs('tok-hider')
    const joinedPromise = nextMessage(hider, (m) => m.t === 'player.joined')
    const { ws: seeker } = await helloAs('tok-seeker')
    const joined = await joinedPromise
    expect(joined.t === 'player.joined' && joined.player.id).toBe('s1')
    hider.close()
    seeker.close()
  })

  it('withholds the hider position from a seeker but delivers other seekers', async () => {
    const { ws: hider } = await helloAs('tok-hider')
    const { ws: seeker } = await helloAs('tok-seeker')
    const { ws: seeker2 } = await helloAs('tok-seeker2')

    hider.send(JSON.stringify({ t: 'pos', pos: { lat: 36.12, lng: -97.07, ts: 1 } }))
    seeker2.send(JSON.stringify({ t: 'pos', pos: { lat: 36.1, lng: -97.0, ts: 1 } }))

    const batch = await nextMessage(seeker, (m) => m.t === 'pos.batch')
    if (batch.t === 'pos.batch') {
      const ids = batch.positions.map((p) => p.playerId)
      expect(ids).toContain('s2') // other seeker visible
      expect(ids).not.toContain('h1') // hider withheld
    }
    hider.close()
    seeker.close()
    seeker2.close()
  })

  it('emits zone.breach when a seeker enters the hider zone', async () => {
    const { ws: hider } = await helloAs('tok-hider')
    const { ws: seeker } = await helloAs('tok-seeker')

    hider.send(JSON.stringify({ t: 'zone.set', zone: { lat: 36.12, lng: -97.07, radiusM: 402 } }))
    const breachPromise = nextMessage(hider, (m) => m.t === 'zone.breach')
    // seeker moves into the zone center
    seeker.send(JSON.stringify({ t: 'pos', pos: { lat: 36.12, lng: -97.07, ts: 2 } }))

    const breach = await breachPromise
    expect(breach.t === 'zone.breach' && breach.playerId).toBe('s1')
    hider.close()
    seeker.close()
  })

  it('broadcasts ruled-out cells as a union', async () => {
    const { ws: seeker } = await helloAs('tok-seeker')
    seeker.send(JSON.stringify({ t: 'ruledout.add', cells: ['a', 'b'] }))
    const ruled = await nextMessage(seeker, (m) => m.t === 'ruledout')
    if (ruled.t === 'ruledout') expect(ruled.cells.sort()).toEqual(['a', 'b'])
    seeker.close()
  })

  it('broadcasts a phase change when the HOST sends host.action', async () => {
    const { ws: hider } = await helloAs('tok-hider') // host
    const { ws: seeker } = await helloAs('tok-seeker')

    const phasePromise = nextMessage(seeker, (m) => m.t === 'phase')
    hider.send(JSON.stringify({ t: 'host.action', action: 'start-seeking' }))

    const phase = await phasePromise
    expect(phase.t === 'phase' && phase.phase).toBe('seeking')
    hider.close()
    seeker.close()
  })

  it('ignores host.action from a NON-host (no phase broadcast)', async () => {
    const { ws: hider } = await helloAs('tok-hider')
    const { ws: seeker } = await helloAs('tok-seeker')

    let got = false
    seeker.on('message', (d: Buffer) => {
      if ((JSON.parse(d.toString()) as ServerMessage).t === 'phase') got = true
    })
    seeker.send(JSON.stringify({ t: 'host.action', action: 'end-round' }))
    await new Promise((r) => setTimeout(r, 200))
    expect(got).toBe(false)
    hider.close()
    seeker.close()
  })
})
