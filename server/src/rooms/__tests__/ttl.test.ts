import { describe, it, expect } from 'vitest'
import { ACTIVE_TTL_MS, ENDED_TTL_MS, initialExpiry, slidExpiry, endedExpiry } from '../ttl.js'

const NOW = new Date('2026-06-27T12:00:00.000Z')

describe('TTL constants', () => {
  it('active TTL is 2 days', () => {
    expect(ACTIVE_TTL_MS).toBe(2 * 24 * 60 * 60 * 1000)
  })
  it('ended TTL is 1 hour', () => {
    expect(ENDED_TTL_MS).toBe(60 * 60 * 1000)
  })
})

describe('initialExpiry', () => {
  it('is now + 2 days', () => {
    expect(initialExpiry(NOW).toISOString()).toBe('2026-06-29T12:00:00.000Z')
  })
})

describe('slidExpiry', () => {
  it('pushes expiry to now + 2 days on activity', () => {
    const later = new Date('2026-06-28T09:30:00.000Z')
    expect(slidExpiry(later).toISOString()).toBe('2026-06-30T09:30:00.000Z')
  })
})

describe('endedExpiry', () => {
  it('drops expiry to now + 1 hour when the round ends', () => {
    expect(endedExpiry(NOW).toISOString()).toBe('2026-06-27T13:00:00.000Z')
  })

  it('is sooner than the active expiry', () => {
    expect(endedExpiry(NOW).getTime()).toBeLessThan(initialExpiry(NOW).getTime())
  })
})
