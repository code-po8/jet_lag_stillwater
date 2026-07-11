/**
 * Shared helpers for baking the Stillwater POI overlay from multiple sources.
 *
 * Three sources feed the merged `stillwater-poi.json`, in ascending precedence:
 *   1. OSM   (auto-baked from Overpass; the fallback)      → sources/stillwater-poi-osm.json
 *   2. Google My Maps export (.geojson or .kml)            → sources/stillwater-poi-google.(geojson|kml)
 *   3. Manual (hand-curated, you own it, never clobbered)  → sources/stillwater-poi-manual.json
 *
 * Precedence is resolved per-POI: a manual entry wins over a Google entry, which
 * wins over an OSM entry, when they refer to the same place (same `kind` + a name
 * or location match). This lets you correct or add restaurants without editing —
 * or losing edits to — the auto-baked OSM data.
 *
 * Zero npm dependencies (Node built-ins only). The KML reader is a small,
 * purpose-built parser for Google My Maps exports, not a general XML parser.
 */

/** The `kind` values the map legend understands. Anything else is dropped. */
export const KNOWN_KINDS = ['bus-stop', 'restaurant', 'school', 'park']

/**
 * Map a Google My Maps layer/folder name to a legend `kind`.
 * My Maps organizes pins into named layers; we treat one layer = one category.
 * Matching is case-insensitive and tolerant of plurals ("Restaurants" → restaurant).
 */
export function kindFromLayerName(layerName) {
  if (!layerName) return null
  const n = String(layerName).trim().toLowerCase()
  if (/bus|stop|transit/.test(n)) return 'bus-stop'
  if (/restaurant|dining|food|eat|cafe|bar|grill/.test(n)) return 'restaurant'
  if (/school|college|univ|educ/.test(n)) return 'school'
  if (/park|rec|trail|green/.test(n)) return 'park'
  return null
}

/** Round coordinates so equal locations from different sources dedupe cleanly. */
function roundCoord(n) {
  return Math.round(n * 1e5) / 1e5 // ~1.1 m precision
}

/** Normalize a name for matching: lowercase, collapse whitespace, strip punctuation. */
function normName(name) {
  if (!name) return ''
  return String(name)
    .toLowerCase()
    .replace(/['’.,&]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

/** Approximate metres between two [lng, lat] points (equirectangular; fine at city scale). */
export function metresBetween(a, b) {
  const [lng1, lat1] = a
  const [lng2, lat2] = b
  const midLat = ((lat1 + lat2) / 2) * (Math.PI / 180)
  const dx = (lng2 - lng1) * Math.cos(midLat)
  const dy = lat2 - lat1
  return Math.hypot(dx, dy) * 111_320
}

/**
 * Two features are the SAME POI (one overrides the other) only when they share a
 * `kind` AND are geographically close — either an exact location-key match, or a
 * matching normalized name within `NAME_MATCH_RADIUS_M`. The proximity guard stops
 * distinct places that happen to share a name (opposite-side bus stops, two campuses
 * of the same school) from being wrongly collapsed. Name matching still lets a manual
 * or Google entry correct an OSM point that drifted a bit.
 */
export const NAME_MATCH_RADIUS_M = 150

export function poiKeys(feature) {
  const kind = feature.properties.kind
  const name = normName(feature.properties.name)
  const [lng, lat] = feature.geometry.coordinates
  const loc = `${kind}@${roundCoord(lng)},${roundCoord(lat)}`
  const nameKey = name ? `${kind}:${name}` : null
  return { nameKey, loc, coordinates: [lng, lat] }
}

/** Build a normalized Feature, or null if it's unusable / not a known kind. */
export function makeFeature(kind, name, coordinates) {
  if (!KNOWN_KINDS.includes(kind)) return null
  if (!Array.isArray(coordinates) || coordinates.length < 2) return null
  const [lng, lat] = coordinates
  if (typeof lng !== 'number' || typeof lat !== 'number' || Number.isNaN(lng) || Number.isNaN(lat))
    return null
  return {
    type: 'Feature',
    properties: { kind, name: name ?? null },
    geometry: { type: 'Point', coordinates: [lng, lat] },
  }
}

/**
 * Extract normalized point features from a GeoJSON FeatureCollection.
 * `kind` comes from properties.kind if present, else from a layer-name hint.
 * Google My Maps GeoJSON exports carry the layer name in properties when a single
 * layer is exported; when unknown, callers can pass a `defaultKind`.
 */
export function featuresFromGeoJSON(fc, { defaultKind = null } = {}) {
  const out = []
  for (const f of fc.features ?? []) {
    if (f?.geometry?.type !== 'Point') continue
    const props = f.properties ?? {}
    const kind =
      props.kind ??
      kindFromLayerName(props.layer ?? props.Layer ?? props.folder) ??
      defaultKind
    const name = props.name ?? props.Name ?? props.title ?? null
    const feat = makeFeature(kind, name, f.geometry.coordinates)
    if (feat) out.push(feat)
  }
  return out
}

/**
 * Parse a Google My Maps KML export into normalized point features.
 *
 * My Maps KML nests <Placemark> pins inside <Folder> elements, one folder per
 * layer, with the layer name in the folder's <name>. We derive `kind` from the
 * enclosing folder name. This is a targeted reader for that structure — not a
 * general KML/XML parser — but it handles the export My Maps actually produces.
 */
export function featuresFromKML(kml) {
  const out = []

  // Split into <Folder>…</Folder> blocks so each Placemark knows its layer.
  // Any Placemarks outside a folder are collected with an unknown layer.
  const folderRe = /<Folder\b[\s\S]*?<\/Folder>/g
  const blocks = kml.match(folderRe) ?? []
  const looseKml = kml.replace(folderRe, '') // Placemarks not inside a folder

  const scanBlock = (block, layerName) => {
    const kind = kindFromLayerName(layerName)
    const pmRe = /<Placemark\b[\s\S]*?<\/Placemark>/g
    for (const pm of block.match(pmRe) ?? []) {
      const name = firstTag(pm, 'name')
      // Prefer a per-placemark kind hint in <description> if present.
      const descKind = kindFromDescription(firstTag(pm, 'description'))
      const coords = firstCoordinate(pm)
      if (!coords) continue
      const feat = makeFeature(descKind ?? kind, name, coords)
      if (feat) out.push(feat)
    }
  }

  for (const block of blocks) {
    // The folder's own <name> is the first <name> before any <Placemark>.
    const head = block.split('<Placemark')[0]
    const layerName = firstTag(head, 'name')
    scanBlock(block, layerName)
  }
  scanBlock(looseKml, null)

  return out
}

/** Read the text of the first <tag>…</tag> in a chunk (CDATA-aware, un-escaped). */
function firstTag(xml, tag) {
  const re = new RegExp(`<${tag}\\b[^>]*>([\\s\\S]*?)</${tag}>`, 'i')
  const m = xml.match(re)
  if (!m) return null
  let v = m[1].trim()
  const cdata = v.match(/^<!\[CDATA\[([\s\S]*?)\]\]>$/)
  if (cdata) v = cdata[1].trim()
  return v
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
}

/** Some My Maps templates stash a kind in the description as "kind: restaurant". */
function kindFromDescription(desc) {
  if (!desc) return null
  const m = desc.match(/\bkind\s*[:=]\s*([a-z-]+)/i)
  if (m && KNOWN_KINDS.includes(m[1].toLowerCase())) return m[1].toLowerCase()
  return null
}

/** Parse the first <coordinates>lng,lat[,alt]</coordinates> into [lng, lat]. */
function firstCoordinate(placemark) {
  const raw = firstTag(placemark, 'coordinates')
  if (!raw) return null
  const first = raw.trim().split(/\s+/)[0] // Points have one tuple
  const parts = first.split(',').map(Number)
  if (parts.length < 2 || parts.some((n) => Number.isNaN(n))) return null
  return [parts[0], parts[1]]
}

/**
 * Per-kind merge policy.
 *
 * `sourcesByKind` restricts which named sources may contribute a given `kind`.
 * Bus stops are curated in the Google map with route data (number + colors) that
 * OSM lacks, and the two systems name the same stop differently — so OSM bus stops
 * only add near-duplicates with worse names. We therefore take bus stops from
 * Google (+ manual) only. Everything else merges from all three sources, so OSM
 * still fills gaps the curated map misses.
 *
 * `locDedupeRadiusM` adds cross-source, name-INDEPENDENT dedup for a kind: any two
 * features of that kind within the radius collapse to one (higher-precedence wins).
 * Use ONLY where the same place is named differently across sources AND stops are
 * not intentionally close. We do NOT location-dedup bus stops: the curated Google
 * stops are uniquely route-numbered, and real north/south & east/west pairs sit
 * <30 m apart — collapsing them would drop valid hider zones.
 *
 * `dropName` drops features whose name matches the pattern — used to strip the
 * bare "Point N" scratch pins My Maps leaves behind (they carry no stop info).
 */
export const DEFAULT_MERGE_POLICY = {
  sourcesByKind: {
    // Curated in the Google map; OSM only adds worse-named near-duplicates.
    'bus-stop': ['google', 'manual'],
    // OSM lists every restaurant its own way and many sit in the same strip mall,
    // so a location merge would wrongly fuse distinct neighbours. Trust the curated
    // Google list instead.
    restaurant: ['google', 'manual'],
  },
  locDedupeRadiusM: {
    // Schools & parks appear in BOTH sources as the same place under slightly
    // different names ("Westwood Elementary" vs "…School"; every park has a "…
    // Playground" twin). They aren't packed tightly, so a location merge is safe and
    // collapses those twins while keeping any OSM-only school/park the map lacks.
    school: 50,
    park: 50,
  },
  dropName: /^Point \d+$/i,
}

/**
 * Merge named source lists in ascending precedence (later sources win).
 * `sources` is an array of `{ name, features }` ordered low→high precedence.
 * Returns { features, counts, overrides, dropped } where `dropped` counts features
 * excluded by the per-kind source policy.
 */
export function mergeSources(sources, policy = DEFAULT_MERGE_POLICY) {
  // Back-compat: allow a plain array of feature-lists (names inferred, no policy filtering).
  const named = sources.map((s, i) =>
    Array.isArray(s) ? { name: `src${i}`, features: s } : s,
  )
  const { sourcesByKind = {}, locDedupeRadiusM = {}, dropName = null } = policy ?? {}

  const byLoc = new Map() // exact location key → index
  const byName = new Map() // name key → array of indices (may be several far-apart)
  const ordered = [] // preserve insertion; we rebuild at the end
  let overrides = 0
  let dropped = 0

  const allowed = (kind, sourceName) => {
    const list = sourcesByKind[kind]
    return !list || list.includes(sourceName)
  }

  const upsert = (feat, sourceName) => {
    const kind = feat.properties.kind
    if (!allowed(kind, sourceName)) {
      dropped++
      return
    }
    if (dropName && feat.properties.name && dropName.test(feat.properties.name.trim())) {
      dropped++
      return
    }
    const { nameKey, loc, coordinates } = poiKeys(feat)

    // 1) Exact same rounded location + kind is always the same POI.
    let matchIdx = byLoc.has(loc) ? byLoc.get(loc) : undefined

    // 2) Name + kind match, if close enough on the ground.
    if (matchIdx === undefined && nameKey != null && byName.has(nameKey)) {
      for (const idx of byName.get(nameKey)) {
        if (metresBetween(coordinates, ordered[idx].geometry.coordinates) <= NAME_MATCH_RADIUS_M) {
          matchIdx = idx
          break
        }
      }
    }

    // 3) Location-only dedup for kinds where names differ across sources (e.g. bus stops).
    const radius = locDedupeRadiusM[kind]
    if (matchIdx === undefined && radius) {
      for (let idx = 0; idx < ordered.length; idx++) {
        const other = ordered[idx]
        if (!other || other.properties.kind !== kind) continue
        if (metresBetween(coordinates, other.geometry.coordinates) <= radius) {
          matchIdx = idx
          break
        }
      }
    }

    if (matchIdx !== undefined) {
      ordered[matchIdx] = feat // higher-precedence source overrides
      overrides++
      return
    }

    const idx = ordered.length
    ordered.push(feat)
    byLoc.set(loc, idx)
    if (nameKey != null) {
      if (!byName.has(nameKey)) byName.set(nameKey, [])
      byName.get(nameKey).push(idx)
    }
  }

  for (const { name, features } of named) for (const feat of features) upsert(feat, name)

  const features = ordered.filter(Boolean)
  const counts = {}
  for (const f of features) counts[f.properties.kind] = (counts[f.properties.kind] ?? 0) + 1
  return { features, counts, overrides, dropped }
}
