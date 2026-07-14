import { describe, it, expect } from 'vitest'
import { halfPlanePolygon, sideOfPoint } from '../halfPlane'

const M_PER_DEG_LAT = 111_320

/** Is `point` inside the polygon ring? Ray-casting (planar; fine at town scale). */
function pointInPolygon(point: [number, number], ring: [number, number][]): boolean {
  const [y, x] = point // [lat, lng]
  let inside = false
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [yi, xi] = ring[i]!
    const [yj, xj] = ring[j]!
    const intersect = yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi
    if (intersect) inside = !inside
  }
  return inside
}

describe('halfPlanePolygon (MAP-011)', () => {
  const start = { lat: 36.12, lng: -97.07 }
  // End due north of start.
  const end = { lat: 36.13, lng: -97.07 }

  it('returns null when start and end coincide (no direction)', () => {
    expect(halfPlanePolygon(start, start, 'toward')).toBeNull()
  })

  it("'toward' shades the half containing the end pin", () => {
    const ring = halfPlanePolygon(start, end, 'toward')!
    expect(ring).not.toBeNull()
    // A point just past the end (further north) is in the toward half.
    expect(pointInPolygon([36.14, -97.07], ring)).toBe(true)
    // A point south of start (behind) is NOT.
    expect(pointInPolygon([36.1, -97.07], ring)).toBe(false)
  })

  it("'away' shades the opposite half (behind the start pin)", () => {
    const ring = halfPlanePolygon(start, end, 'away')!
    // South of start is in the away half; north (toward end) is not.
    expect(pointInPolygon([36.1, -97.07], ring)).toBe(true)
    expect(pointInPolygon([36.14, -97.07], ring)).toBe(false)
  })

  it('divides along the perpendicular THROUGH the start (not the midpoint)', () => {
    // For a due-north travel, the divide is the east-west line at start's lat.
    // A point at start latitude but far east/west sits on the boundary; a point
    // just north of start is 'toward', just south is 'away' — regardless of how
    // far end is. Verify the split latitude is start.lat, not the midpoint.
    const ringToward = halfPlanePolygon(start, end, 'toward')!
    // Just north of START (well south of the midpoint is still north of start).
    expect(pointInPolygon([36.1201, -97.07], ringToward)).toBe(true)
    // Just south of START.
    expect(pointInPolygon([36.1199, -97.07], ringToward)).toBe(false)
  })

  it('handles a diagonal travel direction', () => {
    const e2 = { lat: 36.13, lng: -97.06 } // north-east
    const ring = halfPlanePolygon(start, e2, 'toward')!
    // A point further north-east is toward; south-west is away.
    expect(pointInPolygon([36.14, -97.05], ring)).toBe(true)
    expect(pointInPolygon([36.1, -97.09], ring)).toBe(false)
  })

  it('spans well beyond the local play area', () => {
    const ring = halfPlanePolygon(start, end, 'toward', 20_000)!
    // Some vertex is at least ~15 km from start (≈0.13° lat).
    const farEnough = ring.some(([lat, lng]) => {
      const dyM = (lat - start.lat) * M_PER_DEG_LAT
      const dxM = (lng - start.lng) * M_PER_DEG_LAT * Math.cos((start.lat * Math.PI) / 180)
      return Math.hypot(dxM, dyM) >= 15_000
    })
    expect(farEnough).toBe(true)
  })

  it('sideOfPoint classifies points relative to the perpendicular', () => {
    expect(sideOfPoint(start, end, { lat: 36.14, lng: -97.07 })).toBe('toward')
    expect(sideOfPoint(start, end, { lat: 36.1, lng: -97.07 })).toBe('away')
    expect(sideOfPoint(start, start, { lat: 36.1, lng: -97.07 })).toBeNull()
  })
})
