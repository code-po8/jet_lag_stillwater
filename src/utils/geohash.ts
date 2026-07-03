/**
 * Minimal geohash utilities (MAP-005).
 *
 * Ruled-out map regions are stored/synced as a set of geohash cells (sync = set
 * union — see the `ruledout` messages). This module encodes lat/lng to a cell,
 * returns a cell's bounding box (to render a rectangle), and enumerates the
 * cells covering a bounding box.
 */

const BASE32 = '0123456789bcdefghjkmnpqrstuvwxyz'

export interface Bounds {
  south: number
  west: number
  north: number
  east: number
}

/** Standard geohash encode. */
export function encodeGeohash(lat: number, lng: number, precision = 7): string {
  let latMin = -90
  let latMax = 90
  let lngMin = -180
  let lngMax = 180
  let hash = ''
  let bit = 0
  let ch = 0
  let even = true

  while (hash.length < precision) {
    if (even) {
      const mid = (lngMin + lngMax) / 2
      if (lng >= mid) {
        ch = (ch << 1) | 1
        lngMin = mid
      } else {
        ch = ch << 1
        lngMax = mid
      }
    } else {
      const mid = (latMin + latMax) / 2
      if (lat >= mid) {
        ch = (ch << 1) | 1
        latMin = mid
      } else {
        ch = ch << 1
        latMax = mid
      }
    }
    even = !even
    if (++bit === 5) {
      hash += BASE32[ch]
      bit = 0
      ch = 0
    }
  }
  return hash
}

/** Bounding box of a geohash cell. */
export function geohashBounds(hash: string): Bounds {
  let latMin = -90
  let latMax = 90
  let lngMin = -180
  let lngMax = 180
  let even = true

  for (const c of hash) {
    const idx = BASE32.indexOf(c)
    for (let z = 4; z >= 0; z--) {
      const bitN = (idx >> z) & 1
      if (even) {
        const mid = (lngMin + lngMax) / 2
        if (bitN) lngMin = mid
        else lngMax = mid
      } else {
        const mid = (latMin + latMax) / 2
        if (bitN) latMin = mid
        else latMax = mid
      }
      even = !even
    }
  }
  return { south: latMin, west: lngMin, north: latMax, east: lngMax }
}

/**
 * Exact geohash cell size (deg) at a given precision. Each base32 char adds 5
 * bits, alternating lng/lat starting with lng, so a `precision`-char hash uses
 * `ceil(5p/2)` lng bits and `floor(5p/2)` lat bits. The cell is the global range
 * (360 lng / 180 lat) divided by 2^bits — exact, not approximate.
 */
export function cellSizeDeg(precision: number): { lat: number; lng: number } {
  const totalBits = precision * 5
  const lngBits = Math.ceil(totalBits / 2)
  const latBits = Math.floor(totalBits / 2)
  return { lat: 180 / 2 ** latBits, lng: 360 / 2 ** lngBits }
}

/** Enumerate the distinct geohash cells covering a bounding box. */
export function cellsInBBox(b: Bounds, precision = 6): string[] {
  const cell = cellSizeDeg(precision)
  // Step by half a cell so no whole cell can fall between adjacent sample
  // points (a full-cell step risks skipping a row/column near cell edges).
  const latStep = cell.lat / 2
  const lngStep = cell.lng / 2
  const cells = new Set<string>()
  for (let lat = b.south; lat <= b.north + latStep; lat += latStep) {
    for (let lng = b.west; lng <= b.east + lngStep; lng += lngStep) {
      cells.add(encodeGeohash(Math.min(lat, b.north), Math.min(lng, b.east), precision))
    }
  }
  return [...cells]
}
