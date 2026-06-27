/**
 * Ruled-out shading composable (MAP-005).
 *
 * Seekers shade regions they've eliminated. Cells are stored/synced as geohash
 * cells via `ruledout.add` (the server unions them and broadcasts `ruledout`).
 * Supports manual freehand shading and answer-driven auto-shading.
 */
import { computed } from 'vue'
import { useSync } from './useSync'
import { encodeGeohash, cellsInBBox, type Bounds } from '@/utils/geohash'

const SHADE_PRECISION = 6 // ~1.2km cells — coarse enough to sync cheaply

export interface LatLng {
  lat: number
  lng: number
}

/** Meters per degree latitude (approx); longitude scaled by cos(lat). */
const M_PER_DEG_LAT = 111_320

function milesToDeg(miles: number, lat: number) {
  const meters = miles * 1609.34
  const dLat = meters / M_PER_DEG_LAT
  const dLng = meters / (M_PER_DEG_LAT * Math.cos((lat * Math.PI) / 180))
  return { dLat, dLng }
}

export function useShading() {
  const sync = useSync()

  const cells = computed<string[]>(() => sync.ruledOutCells.value)

  /** Send a set of geohash cells to be ruled out. */
  function shadeCells(newCells: string[]): void {
    if (newCells.length) sync.addRuledOutCells(newCells)
  }

  /** Manual freehand: rule out the cells under a drawn path of points. */
  function shadeFreehand(points: LatLng[]): void {
    const set = new Set<string>()
    for (const p of points) set.add(encodeGeohash(p.lat, p.lng, SHADE_PRECISION))
    shadeCells([...set])
  }

  /**
   * Answer-driven auto-shade for a Radar question ("Are you within R miles?").
   *  - answeredYes=false → hider is NOT within R → rule out the disc INSIDE R.
   *  - answeredYes=true  → hider IS within R → rule out everything OUTSIDE R
   *    (approximated as the ring between R and a generous outer bound).
   */
  function autoShadeRadar(seeker: LatLng, radiusMiles: number, answeredYes: boolean): void {
    const { dLat, dLng } = milesToDeg(radiusMiles, seeker.lat)
    const inside: Bounds = {
      south: seeker.lat - dLat,
      north: seeker.lat + dLat,
      west: seeker.lng - dLng,
      east: seeker.lng + dLng,
    }

    if (!answeredYes) {
      // Rule out the cells inside the radius disc.
      const candidate = cellsInBBox(inside, SHADE_PRECISION)
      shadeCells(candidate.filter((c) => withinRadius(c, seeker, radiusMiles)))
      return
    }

    // answeredYes: rule out cells in a wider box but OUTSIDE the disc.
    const outer = milesToDeg(radiusMiles * 4, seeker.lat)
    const wide: Bounds = {
      south: seeker.lat - outer.dLat,
      north: seeker.lat + outer.dLat,
      west: seeker.lng - outer.dLng,
      east: seeker.lng + outer.dLng,
    }
    const candidate = cellsInBBox(wide, SHADE_PRECISION)
    shadeCells(candidate.filter((c) => !withinRadius(c, seeker, radiusMiles)))
  }

  /**
   * Remove cells from the LOCAL ruled-out view (client-side undo). The wire
   * protocol is union-only, so this does not un-shade on other devices — a
   * `ruledout.remove` message would be needed for that (see STORIES MAP-005).
   */
  function unshadeLocal(toRemove: string[]): void {
    const remove = new Set(toRemove)
    sync.ruledOutCells.value = sync.ruledOutCells.value.filter((c) => !remove.has(c))
  }

  return { cells, shadeCells, shadeFreehand, autoShadeRadar, unshadeLocal }
}

/** Is a geohash cell's approx center within `radiusMiles` of the seeker? */
function withinRadius(cell: string, seeker: LatLng, radiusMiles: number): boolean {
  // Re-derive the cell center from its hash via the bbox midpoint.
  // (Avoids importing geohashBounds twice — recompute cheaply.)
  // Distance via equirectangular approximation (fine at city scale).
  const { lat, lng } = cellCenter(cell)
  const meters = haversineMeters(seeker.lat, seeker.lng, lat, lng)
  return meters <= radiusMiles * 1609.34
}

function cellCenter(cell: string): LatLng {
  // Lightweight reuse of the decode logic via geohashBounds-equivalent.
  // Import lazily to avoid a circular concern — inline a tiny decode here.
  const BASE32 = '0123456789bcdefghjkmnpqrstuvwxyz'
  let latMin = -90,
    latMax = 90,
    lngMin = -180,
    lngMax = 180,
    even = true
  for (const c of cell) {
    const idx = BASE32.indexOf(c)
    for (let z = 4; z >= 0; z--) {
      const bit = (idx >> z) & 1
      if (even) {
        const mid = (lngMin + lngMax) / 2
        if (bit) lngMin = mid
        else lngMax = mid
      } else {
        const mid = (latMin + latMax) / 2
        if (bit) latMin = mid
        else latMax = mid
      }
      even = !even
    }
  }
  return { lat: (latMin + latMax) / 2, lng: (lngMin + lngMax) / 2 }
}

function haversineMeters(aLat: number, aLng: number, bLat: number, bLng: number): number {
  const R = 6_371_000
  const toRad = (d: number) => (d * Math.PI) / 180
  const dLat = toRad(bLat - aLat)
  const dLng = toRad(bLng - aLng)
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(aLat)) * Math.cos(toRad(bLat)) * Math.sin(dLng / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(h))
}
