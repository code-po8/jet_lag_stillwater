#!/usr/bin/env node
/**
 * Bake the Stillwater game-data overlay (MAP-002): OSU bus stops + POIs
 * (restaurants / schools / parks) from OpenStreetMap, as a GeoJSON overlay that
 * draws on top of the MAP-000 base.
 *
 * Re-run:  npm run bake:poi
 *
 * This is the **OSM fallback** dataset. To use a curated set, export your custom
 * Google My Maps layers as GeoJSON and replace src/assets/map/stillwater-poi.json
 * (keep the `kind` property values used by the map legend).
 *
 * Zero npm dependencies (built-in fetch). Network only at bake time.
 */
import { writeFileSync, mkdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const OUT = resolve(__dirname, '../src/assets/map/stillwater-poi.json')
const OVERPASS = 'https://overpass-api.de/api/interpreter'
const BBOX = '35.99,-97.15,36.20,-96.98' // Stillwater, OK

const QUERY = `
[out:json][timeout:60];
(
  node["highway"="bus_stop"](${BBOX});
  node["amenity"="restaurant"](${BBOX});
  node["amenity"="school"](${BBOX});
  way["amenity"="school"](${BBOX});
  node["leisure"="park"](${BBOX});
  way["leisure"="park"](${BBOX});
);
out center;
`

async function overpass(query) {
  const res = await fetch(OVERPASS, {
    method: 'POST',
    headers: {
      'content-type': 'application/x-www-form-urlencoded',
      'user-agent': 'jet-lag-stillwater-poi-baker/1.0 (offline overlay generator)',
      accept: 'application/json',
    },
    body: 'data=' + encodeURIComponent(query),
  })
  if (!res.ok) throw new Error(`Overpass failed: ${res.status}`)
  return res.json()
}

/** Map an OSM element to a `kind` for the legend, or null to skip. */
function kindFor(tags) {
  if (!tags) return null
  if (tags.highway === 'bus_stop') return 'bus-stop'
  if (tags.amenity === 'restaurant') return 'restaurant'
  if (tags.amenity === 'school') return 'school'
  if (tags.leisure === 'park') return 'park'
  return null
}

function pointOf(el) {
  if (el.type === 'node') return [el.lon, el.lat]
  if (el.center) return [el.center.lon, el.center.lat]
  return null
}

function buildFeatures(data) {
  const features = []
  for (const el of data.elements ?? []) {
    const kind = kindFor(el.tags)
    const pt = pointOf(el)
    if (!kind || !pt) continue
    features.push({
      type: 'Feature',
      properties: { kind, name: el.tags?.name ?? null },
      geometry: { type: 'Point', coordinates: pt },
    })
  }
  return features
}

async function main() {
  console.log('Baking Stillwater POI overlay from OpenStreetMap…')
  const data = await overpass(QUERY)
  const features = buildFeatures(data)

  const counts = {}
  for (const f of features) counts[f.properties.kind] = (counts[f.properties.kind] ?? 0) + 1

  const collection = {
    type: 'FeatureCollection',
    metadata: {
      source: 'OpenStreetMap via Overpass API (fallback; replace with curated Google My Maps export)',
      bakedFor: 'Stillwater, OK',
      generatedBy: 'scripts/bake-stillwater-poi.mjs',
    },
    features,
  }

  mkdirSync(dirname(OUT), { recursive: true })
  writeFileSync(OUT, JSON.stringify(collection))
  console.log(`Wrote ${OUT}`)
  console.log('  counts:', JSON.stringify(counts))
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
