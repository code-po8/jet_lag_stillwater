import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

/**
 * Validates the committed pre-baked Stillwater base map (MAP-000). Runs offline
 * against the bundled asset — no network. Re-baking with
 * `npm run bake:map` must keep these invariants.
 */
interface Feature {
  type: 'Feature'
  properties: { kind: string; name?: string | null; highway?: string }
  geometry: { type: string; coordinates: number[][] | number[][][] }
}
interface Collection {
  type: string
  features: Feature[]
}

const assetPath = resolve(process.cwd(), 'src/assets/map/stillwater-base.geojson')
const fc = JSON.parse(readFileSync(assetPath, 'utf8')) as Collection

describe('Stillwater base map asset (MAP-000)', () => {
  it('is a FeatureCollection with features', () => {
    expect(fc.type).toBe('FeatureCollection')
    expect(fc.features.length).toBeGreaterThan(100)
  })

  it('contains at least one city-limits polygon', () => {
    const cityLimits = fc.features.filter((f) => f.properties.kind === 'city-limits')
    expect(cityLimits.length).toBeGreaterThanOrEqual(1)
    expect(cityLimits[0]!.geometry.type).toBe('Polygon')
  })

  it('contains road line features', () => {
    const roads = fc.features.filter((f) => f.properties.kind === 'road')
    expect(roads.length).toBeGreaterThan(100)
    expect(roads[0]!.geometry.type).toBe('LineString')
  })

  it('all coordinates fall within Stillwater, OK bounds', () => {
    const inBounds = (lng: number, lat: number) =>
      lat > 35.9 && lat < 36.3 && lng > -97.25 && lng < -96.9

    for (const f of fc.features) {
      const coords =
        f.geometry.type === 'Polygon'
          ? (f.geometry.coordinates as number[][][]).flat()
          : (f.geometry.coordinates as number[][])
      for (const pt of coords) {
        expect(inBounds(pt[0]!, pt[1]!)).toBe(true)
      }
    }
  })

  it('includes recognizable Stillwater streets', () => {
    const names = fc.features
      .map((f) => f.properties.name)
      .filter((n): n is string => typeof n === 'string')
    const joined = names.join('|')
    expect(joined).toMatch(/Perkins/i)
    expect(joined).toMatch(/Washington/i)
  })
})
