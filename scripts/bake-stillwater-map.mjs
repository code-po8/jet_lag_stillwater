#!/usr/bin/env node
/**
 * Bake the stylized Stillwater base map (MAP-000).
 *
 * Pulls Stillwater city limits + major roads from the OpenStreetMap Overpass
 * API and writes a single GeoJSON FeatureCollection to
 * `src/assets/map/stillwater-base.json`. That asset is bundled into the PWA
 * so the map renders fully offline — no live tile server, no API key.
 *
 * Re-run to regenerate:  node scripts/bake-stillwater-map.mjs
 *
 * Zero npm dependencies (uses built-in fetch), so it does not pull untrusted
 * packages. Network access is required only while baking (not at app runtime).
 */
import { writeFileSync, mkdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const OUT = resolve(__dirname, '../src/assets/map/stillwater-base.json')
const OVERPASS = 'https://overpass-api.de/api/interpreter'

// Stillwater, OK — admin boundary relation (OSM) + major roads inside it.
// Bounding box roughly covering the city limits.
const BBOX = '35.99,-97.15,36.20,-96.98' // S,W,N,E

// Constrain the boundary to the Stillwater, OK bounding box so we don't match
// the same-named city in Minnesota.
const QUERY = `
[out:json][timeout:60];
(
  relation["boundary"="administrative"]["name"="Stillwater"]["admin_level"~"8"](${BBOX});
);
out geom;
(
  way["highway"~"^(motorway|trunk|primary|secondary|tertiary)$"](${BBOX});
);
out geom;
`

async function overpass(query) {
  const res = await fetch(OVERPASS, {
    method: 'POST',
    headers: {
      'content-type': 'application/x-www-form-urlencoded',
      'user-agent': 'jet-lag-stillwater-map-baker/1.0 (offline base map generator)',
      accept: 'application/json',
    },
    body: 'data=' + encodeURIComponent(query),
  })
  if (!res.ok) throw new Error(`Overpass failed: ${res.status}`)
  return res.json()
}

/** Convert an OSM element with `geometry` into GeoJSON coordinates. */
function lineCoords(el) {
  return (el.geometry ?? []).map((p) => [p.lon, p.lat])
}

function buildFeatures(data) {
  const features = []
  for (const el of data.elements ?? []) {
    if (el.type === 'relation' && el.tags?.boundary === 'administrative') {
      // Outer ways form the city-limits polygon ring(s).
      const rings = (el.members ?? [])
        .filter((m) => m.role === 'outer' && m.geometry)
        .map((m) => m.geometry.map((p) => [p.lon, p.lat]))
        .filter((r) => r.length > 2)
      for (const ring of rings) {
        // Close the ring if needed.
        const first = ring[0]
        const last = ring[ring.length - 1]
        if (first[0] !== last[0] || first[1] !== last[1]) ring.push(first)
        features.push({
          type: 'Feature',
          properties: { kind: 'city-limits', name: 'Stillwater' },
          geometry: { type: 'Polygon', coordinates: [ring] },
        })
      }
    } else if (el.type === 'way' && el.tags?.highway) {
      const coords = lineCoords(el)
      if (coords.length > 1) {
        features.push({
          type: 'Feature',
          properties: { kind: 'road', highway: el.tags.highway, name: el.tags.name ?? null },
          geometry: { type: 'LineString', coordinates: coords },
        })
      }
    }
  }
  return features
}

async function main() {
  console.log('Baking Stillwater base map from OpenStreetMap…')
  const data = await overpass(QUERY)
  const features = buildFeatures(data)

  const cityLimits = features.filter((f) => f.properties.kind === 'city-limits').length
  const roads = features.filter((f) => f.properties.kind === 'road').length
  if (cityLimits === 0) {
    console.warn('WARN: no city-limits boundary found — check the Overpass query.')
  }

  const collection = {
    type: 'FeatureCollection',
    metadata: {
      source: 'OpenStreetMap via Overpass API',
      bakedFor: 'Stillwater, OK',
      generatedBy: 'scripts/bake-stillwater-map.mjs',
    },
    features,
  }

  mkdirSync(dirname(OUT), { recursive: true })
  writeFileSync(OUT, JSON.stringify(collection))
  console.log(`Wrote ${OUT}`)
  console.log(`  city-limits features: ${cityLimits}`)
  console.log(`  road features:        ${roads}`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
