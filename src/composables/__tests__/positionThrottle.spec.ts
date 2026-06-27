import { describe, it, expect } from 'vitest'
import {
  shouldSendPosition,
  MIN_INTERVAL_MS,
  MIN_MOVE_M,
  MAX_ACCURACY_M,
} from '../positionThrottle'

const base = { lat: 36.12, lng: -97.07, accuracy: 10, ts: 0 }

describe('shouldSendPosition', () => {
  it('always sends the first fix', () => {
    expect(shouldSendPosition(null, base)).toBe(true)
  })

  it('drops low-accuracy fixes', () => {
    expect(shouldSendPosition(null, { ...base, accuracy: MAX_ACCURACY_M + 1 })).toBe(false)
  })

  it('allows a fix with no accuracy field (unknown accuracy)', () => {
    const next = { lat: 36.13, lng: -97.08, ts: MIN_INTERVAL_MS + 1 }
    expect(shouldSendPosition({ ...base, ts: 0 }, next)).toBe(true)
  })

  it('throttles by time: too-soon + no movement is dropped', () => {
    const last = { ...base, ts: 0 }
    const next = { ...base, ts: MIN_INTERVAL_MS - 500 } // same spot, too soon
    expect(shouldSendPosition(last, next)).toBe(false)
  })

  it('sends after the min interval even without movement', () => {
    const last = { ...base, ts: 0 }
    const next = { ...base, ts: MIN_INTERVAL_MS + 100 }
    expect(shouldSendPosition(last, next)).toBe(true)
  })

  it('sends when moved more than the min distance even if too soon', () => {
    const last = { ...base, ts: 0 }
    // ~ >15m north: 0.0002 deg lat ≈ 22 m
    const next = { lat: 36.12 + 0.0002, lng: -97.07, accuracy: 10, ts: 500 }
    expect(shouldSendPosition(last, next)).toBe(true)
  })

  it('does not send tiny movement within the interval', () => {
    const last = { ...base, ts: 0 }
    // ~1m move, well under threshold, too soon
    const next = { lat: 36.12 + 0.00001, lng: -97.07, accuracy: 10, ts: 200 }
    expect(shouldSendPosition(last, next)).toBe(false)
  })
})

describe('throttle constants', () => {
  it('interval is in the 2-3s range', () => {
    expect(MIN_INTERVAL_MS).toBeGreaterThanOrEqual(2000)
    expect(MIN_INTERVAL_MS).toBeLessThanOrEqual(3000)
  })
  it('move threshold is ~15m', () => {
    expect(MIN_MOVE_M).toBeGreaterThanOrEqual(10)
    expect(MIN_MOVE_M).toBeLessThanOrEqual(20)
  })
})
