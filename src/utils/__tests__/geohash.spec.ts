import { describe, it, expect } from 'vitest'
import { encodeGeohash, geohashBounds, cellsInBBox } from '../geohash'

describe('encodeGeohash', () => {
  it('encodes a known point (geohash reference)', () => {
    // Classic reference: (57.64911, 10.40744) -> "u4pruydqqvj"
    expect(encodeGeohash(57.64911, 10.40744, 11)).toBe('u4pruydqqvj')
  })

  it('produces the requested precision length', () => {
    expect(encodeGeohash(36.12, -97.07, 7)).toHaveLength(7)
  })

  it('nearby points share a prefix', () => {
    const a = encodeGeohash(36.12, -97.07, 7)
    const b = encodeGeohash(36.1201, -97.0701, 7)
    expect(a.slice(0, 5)).toBe(b.slice(0, 5))
  })
})

describe('geohashBounds', () => {
  it('returns a bbox containing the encoded point', () => {
    const lat = 36.12
    const lng = -97.07
    const hash = encodeGeohash(lat, lng, 7)
    const b = geohashBounds(hash)
    expect(lat).toBeGreaterThanOrEqual(b.south)
    expect(lat).toBeLessThanOrEqual(b.north)
    expect(lng).toBeGreaterThanOrEqual(b.west)
    expect(lng).toBeLessThanOrEqual(b.east)
  })
})

describe('cellsInBBox', () => {
  it('covers a small bbox with at least one cell', () => {
    const cells = cellsInBBox({ south: 36.11, west: -97.08, north: 36.13, east: -97.06 }, 6)
    expect(cells.length).toBeGreaterThan(0)
    // all returned cells should be 6 chars
    expect(cells.every((c) => c.length === 6)).toBe(true)
  })

  it('returns more cells for a larger area', () => {
    const small = cellsInBBox({ south: 36.115, west: -97.065, north: 36.12, east: -97.06 }, 6)
    const large = cellsInBBox({ south: 36.0, west: -97.15, north: 36.2, east: -97.0 }, 6)
    expect(large.length).toBeGreaterThan(small.length)
  })
})
