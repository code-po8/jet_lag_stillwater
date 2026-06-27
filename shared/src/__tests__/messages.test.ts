import { describe, it, expect } from 'vitest'
import {
  isClientMessageType,
  isServerMessageType,
  computeClockOffset,
  distanceMeters,
  QUARTER_MILE_M,
  type ClientMessage,
  type ServerMessage,
  type SyncedState,
} from '../index.js'

describe('message type guards', () => {
  it('recognizes all client message types', () => {
    for (const t of ['hello', 'pos', 'zone.set', 'ruledout.add', 'host.action']) {
      expect(isClientMessageType(t)).toBe(true)
    }
  })

  it('recognizes all server message types', () => {
    for (const t of [
      'welcome',
      'player.joined',
      'player.left',
      'player.presence',
      'pos.batch',
      'zone',
      'ruledout',
      'zone.breach',
      'phase',
      'paused',
      'error',
    ]) {
      expect(isServerMessageType(t)).toBe(true)
    }
  })

  it('rejects unknown / cross types', () => {
    expect(isClientMessageType('welcome')).toBe(false)
    expect(isServerMessageType('hello')).toBe(false)
    expect(isClientMessageType('nope')).toBe(false)
  })
})

describe('constants', () => {
  it('quarter mile is 402 meters', () => {
    expect(QUARTER_MILE_M).toBe(402)
  })
})

describe('computeClockOffset', () => {
  it('is zero when client and server clocks agree (no latency)', () => {
    expect(computeClockOffset(1000, 1000, 1000)).toBe(0)
  })

  it('recovers a constant offset under symmetric latency', () => {
    // client sends at 1000, receives reply at 1200 (200ms RTT, symmetric).
    // server clock is 5000 ahead at the midpoint (t2 = 1100 + 5000 = 6100).
    const t1 = 1000
    const t3 = 1200
    const serverOffset = 5000
    const t2 = (t1 + t3) / 2 + serverOffset
    expect(computeClockOffset(t1, t2, t3)).toBe(serverOffset)
  })

  it('time.sync / time.reply are recognized message types', () => {
    expect(isClientMessageType('time.sync')).toBe(true)
    expect(isServerMessageType('time.reply')).toBe(true)
  })
})

describe('distanceMeters', () => {
  it('is zero for identical points', () => {
    expect(distanceMeters(36.12, -97.07, 36.12, -97.07)).toBe(0)
  })

  it('approximates a known short distance (~111m per 0.001 deg lat)', () => {
    const d = distanceMeters(36.12, -97.07, 36.121, -97.07)
    expect(d).toBeGreaterThan(100)
    expect(d).toBeLessThan(120)
  })

  it('is symmetric', () => {
    const ab = distanceMeters(36.12, -97.07, 36.13, -97.08)
    const ba = distanceMeters(36.13, -97.08, 36.12, -97.07)
    expect(ab).toBeCloseTo(ba, 6)
  })
})

describe('DTO shapes (compile-time, asserted structurally)', () => {
  it('a hello message conforms to ClientMessage', () => {
    const msg: ClientMessage = { t: 'hello', code: 'ABCD', rejoinToken: 'x' }
    expect(msg.t).toBe('hello')
  })

  it('a welcome message conforms to ServerMessage', () => {
    const msg: ServerMessage = {
      t: 'welcome',
      you: { id: 'p1', name: 'A', role: 'hider', isHost: true, connected: true },
      players: [],
      phase: 'setup',
      zone: null,
    }
    expect(msg.t).toBe('welcome')
  })

  it('synced state has the expected fields', () => {
    const state: SyncedState = {
      phase: 'seeking',
      zone: null,
      ruledOutCells: [],
      currentHiderId: null,
    }
    expect(state.ruledOutCells).toEqual([])
  })
})
