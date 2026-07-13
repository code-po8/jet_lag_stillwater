import { describe, it, expect } from 'vitest'
// @ts-expect-error — plain .mjs helper, no type declarations by design
import {
  kindFromLayerName,
  featuresFromGeoJSON,
  featuresFromKML,
  mergeSources,
  metresBetween,
  NAME_MATCH_RADIUS_M,
  DEFAULT_MERGE_POLICY,
  CLOSED_POIS,
} from '../lib/poi-sources.mjs'

// Touch the export so its shape stays covered even as the default policy evolves.
void DEFAULT_MERGE_POLICY

const feat = (kind: string, name: string | null, coordinates: number[]) => ({
  type: 'Feature',
  properties: { kind, name },
  geometry: { type: 'Point', coordinates },
})

describe('kindFromLayerName', () => {
  it('maps My Maps layer names to legend kinds (case/plural tolerant)', () => {
    expect(kindFromLayerName('Restaurants')).toBe('restaurant')
    expect(kindFromLayerName('Dining & Bars')).toBe('restaurant')
    expect(kindFromLayerName('Bus Stops')).toBe('bus-stop')
    expect(kindFromLayerName('Schools')).toBe('school')
    expect(kindFromLayerName('Parks & Rec')).toBe('park')
  })

  it('returns null for unknown layers', () => {
    expect(kindFromLayerName('Landmarks')).toBeNull()
    expect(kindFromLayerName('')).toBeNull()
    expect(kindFromLayerName(null)).toBeNull()
  })
})

describe('featuresFromGeoJSON', () => {
  it('reads kind from a per-feature property', () => {
    const fc = {
      type: 'FeatureCollection',
      features: [
        {
          geometry: { type: 'Point', coordinates: [-97.06, 36.12] },
          properties: { kind: 'restaurant', name: 'A' },
        },
      ],
    }
    const out = featuresFromGeoJSON(fc)
    expect(out).toHaveLength(1)
    expect(out[0].properties).toEqual({ kind: 'restaurant', name: 'A' })
  })

  it('falls back to a layer-name hint and drops unknown kinds', () => {
    const fc = {
      type: 'FeatureCollection',
      features: [
        {
          geometry: { type: 'Point', coordinates: [-97.06, 36.12] },
          properties: { layer: 'Restaurants', name: 'B' },
        },
        {
          geometry: { type: 'Point', coordinates: [-97.07, 36.13] },
          properties: { layer: 'Landmarks', name: 'C' },
        },
        { geometry: { type: 'LineString', coordinates: [] }, properties: { kind: 'park' } },
      ],
    }
    const out = featuresFromGeoJSON(fc)
    expect(out).toHaveLength(1)
    expect(out[0].properties.name).toBe('B')
  })
})

describe('featuresFromKML (Google My Maps export)', () => {
  const kml = `<?xml version="1.0"?>
    <kml><Document><name>Trip</name>
      <Folder><name>Restaurants</name>
        <Placemark><name>Eskimo Joe's</name>
          <description><![CDATA[Cheese fries]]></description>
          <Point><coordinates>-97.0632,36.1201,0</coordinates></Point>
        </Placemark>
        <Placemark><name>Hideaway Pizza</name>
          <Point><coordinates>-97.0741,36.1189,0</coordinates></Point>
        </Placemark>
      </Folder>
      <Folder><name>Parks</name>
        <Placemark><name>Boomer Lake</name>
          <Point><coordinates>-97.0555,36.1489,0</coordinates></Point>
        </Placemark>
      </Folder>
    </Document></kml>`

  it('derives kind from the enclosing folder and parses name + coordinates', () => {
    const out = featuresFromKML(kml)
    expect(out).toHaveLength(3)
    const eskimo = out.find(
      (f: { properties: { name: string } }) => f.properties.name === "Eskimo Joe's",
    )
    expect(eskimo.properties.kind).toBe('restaurant')
    expect(eskimo.geometry.coordinates).toEqual([-97.0632, 36.1201])
    expect(
      out.find((f: { properties: { name: string } }) => f.properties.name === 'Boomer Lake')
        .properties.kind,
    ).toBe('park')
  })

  it('honors an explicit "kind:" hint in a placemark description', () => {
    const withHint = `<kml><Folder><name>Misc</name>
      <Placemark><name>X</name>
        <description>kind: restaurant</description>
        <Point><coordinates>-97.06,36.12,0</coordinates></Point>
      </Placemark></Folder></kml>`
    const out = featuresFromKML(withHint)
    expect(out).toHaveLength(1)
    expect(out[0].properties.kind).toBe('restaurant')
  })
})

// Generic merge mechanics — run with no game policy (pass {}) so source
// restrictions and per-kind dedup radii don't interfere.
describe('mergeSources precedence & proximity', () => {
  const NO_POLICY = {}

  it('later sources override an earlier co-located POI of the same kind', () => {
    const osm = [feat('restaurant', 'Joe', [-97.06, 36.12])]
    const manual = [feat('restaurant', 'Joe', [-97.0601, 36.1201])] // ~14m away
    const { features, overrides } = mergeSources([osm, manual], NO_POLICY)
    expect(features).toHaveLength(1)
    expect(overrides).toBe(1)
    expect(features[0].geometry.coordinates).toEqual([-97.0601, 36.1201]) // manual won
  })

  it('does NOT merge same-name POIs that are far apart', () => {
    const a = feat('school', 'Covenant', [-97.06, 36.12])
    const b = feat('school', 'Covenant', [-97.12, 36.18]) // kilometres away
    const { features } = mergeSources([[a], [b]], NO_POLICY)
    expect(features).toHaveLength(2)
  })

  it('merges byte-identical duplicates within one source', () => {
    const dup = feat('school', 'Stillwater High', [-97.08, 36.14])
    const { features, overrides } = mergeSources([[dup, { ...dup }]], NO_POLICY)
    expect(features).toHaveLength(1)
    expect(overrides).toBe(1)
  })

  it('keeps distinct unnamed POIs at different locations', () => {
    const { features } = mergeSources(
      [[feat('restaurant', null, [-97.06, 36.12]), feat('restaurant', null, [-97.07, 36.13])]],
      NO_POLICY,
    )
    expect(features).toHaveLength(2)
  })

  it('counts by kind in the result', () => {
    const { counts } = mergeSources(
      [[feat('restaurant', 'A', [-97.06, 36.12]), feat('park', 'B', [-97.07, 36.13])]],
      NO_POLICY,
    )
    expect(counts).toEqual({ restaurant: 1, park: 1 })
  })

  it('applies the DEFAULT_MERGE_POLICY when none is passed', () => {
    // restaurant is Google/manual-only by default → an unnamed src0 restaurant drops.
    const { features, dropped } = mergeSources([[feat('restaurant', 'X', [-97.06, 36.12])]])
    expect(features).toHaveLength(0)
    expect(dropped).toBe(1)
  })
})

describe('mergeSources per-kind policy', () => {
  it('restricts a kind to the allowed sources (bus stops: google/manual only)', () => {
    const osm = { name: 'osm', features: [feat('bus-stop', 'OSM Stop', [-97.06, 36.12])] }
    const google = { name: 'google', features: [feat('bus-stop', 'Google Stop', [-97.07, 36.13])] }
    const { features, dropped } = mergeSources([osm, google], {
      sourcesByKind: { 'bus-stop': ['google', 'manual'] },
    })
    expect(features).toHaveLength(1)
    expect(features[0].properties.name).toBe('Google Stop')
    expect(dropped).toBe(1) // the OSM bus stop
  })

  it('does NOT restrict kinds absent from the policy', () => {
    const osm = { name: 'osm', features: [feat('restaurant', 'OSM Diner', [-97.06, 36.12])] }
    const { features, dropped } = mergeSources([osm], {
      sourcesByKind: { 'bus-stop': ['google'] },
    })
    expect(features).toHaveLength(1)
    expect(dropped).toBe(0)
  })

  it('drops junk pins matching dropName', () => {
    const google = {
      name: 'google',
      features: [
        feat('bus-stop', 'Point 172', [-97.06, 36.12]),
        feat('bus-stop', 'Real Stop (5)', [-97.07, 36.13]),
      ],
    }
    const { features, dropped } = mergeSources([google], { dropName: /^Point \d+$/i })
    expect(features).toHaveLength(1)
    expect(features[0].properties.name).toBe('Real Stop (5)')
    expect(dropped).toBe(1)
  })

  it('CLOSED_POIS is an array the policy can drop by exact name', () => {
    // The list is empty when no closed pin is lingering; the mechanism still works.
    // Pass an explicit dropName built from a sample closed name to prove the behavior.
    expect(Array.isArray(CLOSED_POIS)).toBe(true)
    const google = {
      name: 'google',
      features: [
        feat('restaurant', 'Closed Diner', [-97.087, 36.1154]),
        feat('restaurant', 'Still Open Diner', [-97.07, 36.13]),
      ],
    }
    const { features, dropped } = mergeSources([google], {
      sourcesByKind: { restaurant: ['google'] },
      dropName: /^Closed Diner$/i,
    })
    expect(features.map((f: { properties: { name: string } }) => f.properties.name)).toEqual([
      'Still Open Diner',
    ])
    expect(dropped).toBe(1)
  })

  it('location-dedups school/park twins named differently across sources', () => {
    const osm = {
      name: 'osm',
      features: [feat('school', 'Westwood Elementary School', [-97.082, 36.116])],
    }
    const google = {
      name: 'google',
      features: [feat('school', 'Westwood Elementary', [-97.08203, 36.11605])],
    } // ~7m
    const { features, overrides } = mergeSources([osm, google], {
      locDedupeRadiusM: { school: 50 },
    })
    expect(features).toHaveLength(1)
    expect(overrides).toBe(1)
    expect(features[0].properties.name).toBe('Westwood Elementary') // google won
  })

  it('keeps an OSM-only school when merging schools (fills gaps)', () => {
    const osm = { name: 'osm', features: [feat('school', 'Lone OSM School', [-97.05, 36.14])] }
    const google = {
      name: 'google',
      features: [feat('school', 'A Google School', [-97.09, 36.11])],
    }
    const { features } = mergeSources([osm, google], { locDedupeRadiusM: { school: 50 } })
    expect(features).toHaveLength(2)
  })

  it('does NOT location-dedup route-numbered stops that sit close together', () => {
    // Real north/south pair ~13m apart, distinct route numbers — both must survive.
    const google = {
      name: 'google',
      features: [
        feat('bus-stop', 'Hester & 4th South (157)', [-97.06, 36.12]),
        feat('bus-stop', 'Hester & 4th North (183)', [-97.06001, 36.12008]),
      ],
    }
    const { features } = mergeSources([google], { sourcesByKind: { 'bus-stop': ['google'] } })
    expect(features).toHaveLength(2)
  })
})

describe('metresBetween', () => {
  it('is ~0 for identical points and within radius for close ones', () => {
    expect(metresBetween([-97.06, 36.12], [-97.06, 36.12])).toBeLessThan(1)
    expect(metresBetween([-97.06, 36.12], [-97.0601, 36.1201])).toBeLessThan(NAME_MATCH_RADIUS_M)
  })
})
