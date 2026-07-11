import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

/**
 * Validates the committed Stillwater POI overlay (MAP-002). Offline, no network.
 * The overlay is baked by merging the OSM, Google My Maps, and manual sources
 * (see scripts/bake-stillwater-poi.mjs). Whatever the source mix, these invariants
 * must hold: same `kind` values, points within Stillwater bounds.
 */
interface Feature {
  type: 'Feature'
  properties: { kind: string; name?: string | null }
  geometry: { type: string; coordinates: number[] }
}
interface Collection {
  type: string
  features: Feature[]
}

const assetPath = resolve(process.cwd(), 'src/assets/map/stillwater-poi.json')
const fc = JSON.parse(readFileSync(assetPath, 'utf8')) as Collection

describe('Stillwater POI overlay asset (MAP-002)', () => {
  it('is a FeatureCollection of points', () => {
    expect(fc.type).toBe('FeatureCollection')
    expect(fc.features.length).toBeGreaterThan(20)
    expect(fc.features.every((f) => f.geometry.type === 'Point')).toBe(true)
  })

  it('includes the expected overlay categories', () => {
    const kinds = new Set(fc.features.map((f) => f.properties.kind))
    expect(kinds.has('bus-stop')).toBe(true)
    expect(kinds.has('restaurant')).toBe(true)
    expect(kinds.has('school')).toBe(true)
    expect(kinds.has('park')).toBe(true)
  })

  it('has bus stops (OSU transit network)', () => {
    const busStops = fc.features.filter((f) => f.properties.kind === 'bus-stop')
    expect(busStops.length).toBeGreaterThan(10)
  })

  it('all points fall within Stillwater, OK bounds', () => {
    for (const f of fc.features) {
      const [lng, lat] = f.geometry.coordinates
      expect(lat! > 35.9 && lat! < 36.3 && lng! > -97.25 && lng! < -96.9).toBe(true)
    }
  })
})
