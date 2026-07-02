/**
 * Ruled-out shading composable (MAP-005).
 *
 * Seekers shade regions they've eliminated. Cells are stored/synced as geohash
 * cells via `ruledout.add` (the server unions them and broadcasts `ruledout`).
 * Supports manual freehand shading and answer-driven auto-shading.
 */
import { computed } from 'vue'
import { useSync } from './useSync'
import { encodeGeohash, geohashBounds, cellsInBBox, type Bounds } from '@/utils/geohash'
import { distanceMeters } from '@jet-lag-stillwater/shared'

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

  /**
   * Send geohash cells to be ruled out. Returns the cells that were genuinely
   * new (not already shaded) — callers track these for an order-independent
   * undo, since the synced `cells` array is a server-unioned set whose order
   * and length are not an append-only log of what this device just added.
   */
  function shadeCells(newCells: string[]): string[] {
    const already = new Set(sync.ruledOutCells.value)
    const added = newCells.filter((c) => !already.has(c))
    if (added.length) sync.addRuledOutCells(added)
    return added
  }

  /** Manual freehand: rule out the cells under a drawn path of points. */
  function shadeFreehand(points: LatLng[]): string[] {
    const set = new Set<string>()
    for (const p of points) set.add(encodeGeohash(p.lat, p.lng, SHADE_PRECISION))
    return shadeCells([...set])
  }

  /**
   * Answer-driven auto-shade for a Radar question ("Are you within R miles?").
   *  - answeredYes=false → hider is NOT within R → rule out the disc INSIDE R.
   *  - answeredYes=true  → hider IS within R → rule out everything OUTSIDE R
   *    (approximated as the ring between R and a generous outer bound).
   */
  function autoShadeRadar(seeker: LatLng, radiusMiles: number, answeredYes: boolean): string[] {
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
      return shadeCells(candidate.filter((c) => withinRadius(c, seeker, radiusMiles)))
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
    return shadeCells(candidate.filter((c) => !withinRadius(c, seeker, radiusMiles)))
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
  const { lat, lng } = cellCenter(cell)
  const meters = distanceMeters(seeker.lat, seeker.lng, lat, lng)
  return meters <= radiusMiles * 1609.34
}

/** Center of a geohash cell — the midpoint of its bounds. */
function cellCenter(cell: string): LatLng {
  const b = geohashBounds(cell)
  return { lat: (b.south + b.north) / 2, lng: (b.west + b.east) / 2 }
}
