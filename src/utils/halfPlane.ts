/**
 * Half-plane geometry for the thermometer (hotter/colder) shader (MAP-011).
 *
 * A Thermometer answer splits the map along the **perpendicular through the
 * start pin** (perpendicular to the start→end travel direction): one half is
 * "hotter", the other "colder". The seeker picks which half a given answer rules
 * out and shades it.
 *
 * We work in a local planar tangent — longitude scaled by cos(lat) so a degree
 * east and a degree north are the same metric distance near the start. At a
 * town's scale (Stillwater) this planar approximation is more than accurate
 * enough for a shading aid; we are not doing precise geodesy.
 */

export interface LatLng {
  lat: number
  lng: number
}

/** Which half-plane to shade, relative to the start→end direction. */
export type HalfPlaneSide = 'toward' | 'away'

/** Meters per degree latitude (approx); longitude scales by cos(lat). */
const M_PER_DEG_LAT = 111_320

/**
 * Build a large polygon covering one half-plane, split by the perpendicular to
 * `start`→`end` that passes through `start`.
 *
 * - `side: 'toward'` shades the half CONTAINING the end pin (the travel
 *   direction) — i.e. the "you got hotter toward end" region.
 * - `side: 'away'` shades the opposite half (behind the start pin).
 *
 * `spanMeters` is how far the polygon extends from `start` (default 20 km) —
 * large enough to blanket the play area so the shaded edge sits well off-screen.
 *
 * Returns the polygon ring as `[lat, lng]` pairs (open ring; Leaflet closes it).
 * Returns `null` if start and end coincide (no direction → no half-plane).
 */
export function halfPlanePolygon(
  start: LatLng,
  end: LatLng,
  side: HalfPlaneSide,
  spanMeters = 20_000,
): [number, number][] | null {
  const cosLat = Math.cos((start.lat * Math.PI) / 180)
  // Travel direction in local meters (east = +x, north = +y).
  const dx = (end.lng - start.lng) * M_PER_DEG_LAT * cosLat
  const dy = (end.lat - start.lat) * M_PER_DEG_LAT
  const len = Math.hypot(dx, dy)
  if (len === 0) return null

  // Unit vector along travel (the perpendicular's NORMAL), and the unit vector
  // ALONG the perpendicular line (rotate the normal 90°).
  const nx = dx / len
  const ny = dy / len
  const px = -ny // perpendicular (along the dividing line)
  const py = nx

  // 'toward' pushes into the +normal (end) half; 'away' into the −normal half.
  const sign = side === 'toward' ? 1 : -1
  const ox = sign * nx * spanMeters // offset from the line into the chosen half
  const oy = sign * ny * spanMeters
  const ex = px * spanMeters // extent along the dividing line
  const ey = py * spanMeters

  // Four corners in local meters, relative to start: the two ends of the
  // dividing line, then those two points pushed `spanMeters` into the half.
  const cornersM: Array<[number, number]> = [
    [ex, ey], // along +perpendicular, on the line
    [-ex, -ey], // along −perpendicular, on the line
    [-ex + ox, -ey + oy], // pushed into the chosen half
    [ex + ox, ey + oy],
  ]

  // Convert local meters back to lat/lng offsets from start.
  return cornersM.map(([mx, my]) => {
    const lat = start.lat + my / M_PER_DEG_LAT
    const lng = start.lng + mx / (M_PER_DEG_LAT * cosLat)
    return [lat, lng] as [number, number]
  })
}

/**
 * The two endpoints of a short line segment through `start`, perpendicular to
 * the `start`→`end` travel direction (issue #29). This is the hotter/colder
 * DIVIDING line itself — everything on the end-pin side is hotter, the other
 * side colder — drawn on the hider's map so they can read the boundary directly
 * at any travel angle rather than projecting it by eye.
 *
 * `halfLengthMeters` is how far the segment extends on EACH side of `start`.
 * Returns `[[lat,lng], [lat,lng]]`, or null if start/end coincide (no direction).
 */
export function perpendicularSegment(
  start: LatLng,
  end: LatLng,
  halfLengthMeters: number,
): [[number, number], [number, number]] | null {
  const cosLat = Math.cos((start.lat * Math.PI) / 180)
  const dx = (end.lng - start.lng) * M_PER_DEG_LAT * cosLat
  const dy = (end.lat - start.lat) * M_PER_DEG_LAT
  const len = Math.hypot(dx, dy)
  if (len === 0) return null

  // Unit vector ALONG the perpendicular (rotate the travel normal 90°).
  const px = -dy / len
  const py = dx / len

  const toLatLng = (sign: number): [number, number] => {
    const mx = sign * px * halfLengthMeters
    const my = sign * py * halfLengthMeters
    return [start.lat + my / M_PER_DEG_LAT, start.lng + mx / (M_PER_DEG_LAT * cosLat)]
  }
  return [toLatLng(1), toLatLng(-1)]
}

/**
 * Which half-plane does `point` fall in, relative to the perpendicular through
 * `start` (normal = start→end)? Returns 'toward' if on the end side, 'away'
 * otherwise, or null if start/end coincide. Useful for tests and for a future
 * "tap the map to pick the side" affordance.
 */
export function sideOfPoint(start: LatLng, end: LatLng, point: LatLng): HalfPlaneSide | null {
  const cosLat = Math.cos((start.lat * Math.PI) / 180)
  const dx = (end.lng - start.lng) * M_PER_DEG_LAT * cosLat
  const dy = (end.lat - start.lat) * M_PER_DEG_LAT
  if (dx === 0 && dy === 0) return null
  const vx = (point.lng - start.lng) * M_PER_DEG_LAT * cosLat
  const vy = (point.lat - start.lat) * M_PER_DEG_LAT
  return vx * dx + vy * dy >= 0 ? 'toward' : 'away'
}
