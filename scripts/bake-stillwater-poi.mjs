#!/usr/bin/env node
/**
 * Bake the Stillwater game-data overlay (MAP-002): OSU bus stops + POIs
 * (restaurants / schools / parks) as a GeoJSON overlay drawn on top of the
 * MAP-000 base.
 *
 * The overlay is MERGED from up to three sources (ascending precedence — later
 * wins on a per-POI match by `kind` + name or location):
 *
 *   1. OSM     src/assets/map/sources/stillwater-poi-osm.json      (auto-baked fallback)
 *   2. Google  src/assets/map/sources/stillwater-poi-google.{geojson,kml}
 *   3. Manual  src/assets/map/sources/stillwater-poi-manual.json   (hand-curated, you own it)
 *
 * Commands:
 *   npm run bake:poi:osm     Fetch OSM from Overpass → sources/…-osm.json        (network)
 *   npm run bake:poi:google  Refetch the curated My Maps KML → sources/…-google.kml (network)
 *   npm run bake:poi         Merge all present sources → stillwater-poi.json      (offline)
 *   npm run bake:poi:all     Do all three in sequence                            (network)
 *
 * Day to day you edit the Google My Maps map (then `bake:poi:google`) and/or
 * sources/stillwater-poi-manual.json, then run `npm run bake:poi`. Re-fetching a
 * source never touches your manual file.
 *
 * Zero npm dependencies (built-in fetch). Network only for the OSM fetch step.
 */
import { writeFileSync, readFileSync, existsSync, mkdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  featuresFromGeoJSON,
  featuresFromKML,
  mergeSources,
} from './lib/poi-sources.mjs'

const __dirname = dirname(fileURLToPath(import.meta.url))
const MAP_DIR = resolve(__dirname, '../src/assets/map')
const SRC_DIR = resolve(MAP_DIR, 'sources')
const OUT = resolve(MAP_DIR, 'stillwater-poi.json')

const OSM_SRC = resolve(SRC_DIR, 'stillwater-poi-osm.json')
const MANUAL_SRC = resolve(SRC_DIR, 'stillwater-poi-manual.json')
const GOOGLE_GEOJSON = resolve(SRC_DIR, 'stillwater-poi-google.geojson')
const GOOGLE_KML = resolve(SRC_DIR, 'stillwater-poi-google.kml')

const OVERPASS = 'https://overpass-api.de/api/interpreter'
const BBOX = '35.99,-97.15,36.20,-96.98' // Stillwater, OK

// The curated Google My Maps map ("Jet Lag: Stillwater"). `bake:poi:google` refetches
// its KML into GOOGLE_KML. The map must stay shared as "anyone with the link can view"
// for the export endpoint to serve it. Override with GOOGLE_MID=<mid> if it moves.
const GOOGLE_MID = process.env.GOOGLE_MID ?? '1AeXEHQ82RrOc7MCntBWNOtg7s00TlmY'
const GOOGLE_KML_URL = (mid) =>
  `https://www.google.com/maps/d/kml?mid=${encodeURIComponent(mid)}&forcekml=1`

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

/** Fetch OSM and write the raw OSM source (network step). */
async function bakeOsm() {
  console.log('Fetching Stillwater POIs from OpenStreetMap…')
  const data = await overpass(QUERY)
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
  const collection = {
    type: 'FeatureCollection',
    metadata: {
      source: 'OpenStreetMap via Overpass API',
      bakedFor: 'Stillwater, OK',
      generatedBy: 'scripts/bake-stillwater-poi.mjs (osm)',
    },
    features,
  }
  mkdirSync(SRC_DIR, { recursive: true })
  writeFileSync(OSM_SRC, JSON.stringify(collection))
  console.log(`Wrote ${OSM_SRC} (${features.length} features)`)
}

/** Refetch the curated Google My Maps KML into GOOGLE_KML (network step). */
async function bakeGoogle() {
  const url = GOOGLE_KML_URL(GOOGLE_MID)
  console.log(`Fetching curated Google My Maps KML (mid=${GOOGLE_MID})…`)
  const res = await fetch(url, {
    headers: { 'user-agent': 'jet-lag-stillwater-poi-baker/1.0 (my maps kml export)' },
  })
  if (!res.ok) {
    throw new Error(
      `Google My Maps export failed: ${res.status}. Is the map shared as ` +
        `"anyone with the link can view"? (set GOOGLE_MID to override the map id)`,
    )
  }
  const kml = await res.text()
  if (!kml.includes('<kml')) {
    throw new Error('Google My Maps export did not return KML (got a sign-in or error page).')
  }
  mkdirSync(SRC_DIR, { recursive: true })
  writeFileSync(GOOGLE_KML, kml)
  const placemarks = (kml.match(/<Placemark/g) ?? []).length
  console.log(`Wrote ${GOOGLE_KML} (${placemarks} placemarks)`)
}

/** Load a source file into normalized features, or [] if it's absent. */
function loadGeoJSONSource(path, label) {
  if (!existsSync(path)) return []
  const fc = JSON.parse(readFileSync(path, 'utf8'))
  const feats = featuresFromGeoJSON(fc)
  console.log(`  ${label}: ${feats.length} features (${path.replace(MAP_DIR + '/', '')})`)
  return feats
}

function loadGoogleSource() {
  if (existsSync(GOOGLE_GEOJSON)) {
    return loadGeoJSONSource(GOOGLE_GEOJSON, 'google (geojson)')
  }
  if (existsSync(GOOGLE_KML)) {
    const feats = featuresFromKML(readFileSync(GOOGLE_KML, 'utf8'))
    console.log(`  google (kml): ${feats.length} features (sources/stillwater-poi-google.kml)`)
    return feats
  }
  return []
}

/** Merge all present sources → the committed overlay (offline step). */
function bakeMerged() {
  console.log('Merging POI sources (osm < google < manual)…')
  const osm = loadGeoJSONSource(OSM_SRC, 'osm')
  const google = loadGoogleSource()
  const manual = loadGeoJSONSource(MANUAL_SRC, 'manual')

  if (osm.length + google.length + manual.length === 0) {
    throw new Error(
      'No POI sources found. Run `npm run bake:poi:osm` first, or add sources/stillwater-poi-manual.json.',
    )
  }

  const { features, counts, overrides, dropped } = mergeSources([
    { name: 'osm', features: osm },
    { name: 'google', features: google },
    { name: 'manual', features: manual },
  ])
  const collection = {
    type: 'FeatureCollection',
    metadata: {
      source: 'Merged: OpenStreetMap (fallback) + Google My Maps export + manual overrides',
      bakedFor: 'Stillwater, OK',
      generatedBy: 'scripts/bake-stillwater-poi.mjs (merge)',
      sources: {
        osm: osm.length,
        google: google.length,
        manual: manual.length,
        overrides,
        droppedByPolicy: dropped,
      },
    },
    features,
  }
  mkdirSync(dirname(OUT), { recursive: true })
  writeFileSync(OUT, JSON.stringify(collection))
  console.log(`Wrote ${OUT}`)
  console.log(`  counts: ${JSON.stringify(counts)}  overrides: ${overrides}  dropped: ${dropped}`)
}

async function main() {
  const mode = process.argv[2] ?? 'merge'
  if (mode === 'osm') {
    await bakeOsm()
  } else if (mode === 'google') {
    await bakeGoogle()
  } else if (mode === 'all') {
    await bakeOsm()
    await bakeGoogle()
    bakeMerged()
  } else {
    bakeMerged()
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
