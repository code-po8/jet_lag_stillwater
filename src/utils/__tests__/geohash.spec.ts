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

  it('fully covers the bbox with no skipped cells (precision 6)', () => {
    // Regression: the cell-step must not exceed the true cell size, or whole
    // rows/columns of cells between sample points get skipped, leaving
    // un-shaded stripes in the seeker shading. Verify coverage by checking that
    // the cell of every point on a fine grid across the bbox is returned.
    const b = { south: 36.1, west: -97.1, north: 36.16, east: -97.04 }
    const cells = new Set(cellsInBBox(b, 6))
    for (let lat = b.south; lat <= b.north; lat += 0.001) {
      for (let lng = b.west; lng <= b.east; lng += 0.001) {
        expect(cells.has(encodeGeohash(lat, lng, 6))).toBe(true)
      }
    }
  })

  it('fully covers the bbox with no skipped cells (precision 7)', () => {
    const b = { south: 36.12, west: -97.07, north: 36.13, east: -97.06 }
    const cells = new Set(cellsInBBox(b, 7))
    for (let lat = b.south; lat <= b.north; lat += 0.0003) {
      for (let lng = b.west; lng <= b.east; lng += 0.0003) {
        expect(cells.has(encodeGeohash(lat, lng, 7))).toBe(true)
      }
    }
  })
})
