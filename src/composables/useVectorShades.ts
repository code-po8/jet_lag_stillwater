/**
 * Vector shades (MAP-010 / MAP-011).
 *
 * Smooth, precise seeker shading built from real geometry — a circle
 * (center + radius) or a half-plane line — rather than the coarse geohash cells
 * of MAP-005 (`useShading`). Both models coexist: geohash freehand/auto-shade
 * stays as-is; these vector shades render on top as `L.circle` / `L.polygon`.
 *
 * Scope: **local to the drawing seeker** for now. There is no wire protocol for
 * vector shades yet, so they are not shared across devices or persisted. The
 * store is deliberately shaped so a future sync layer can drop in the same way
 * MAP-005's `ruledout` union does — see the "sync seam" note below.
 *
 * App-singleton (mirrors `useSync`): one shared list per device so the tool UI
 * (MapPanel) and the renderer (BaseMap, via a prop) observe the same shades.
 */
import { ref, type Ref } from 'vue'

export interface LatLng {
  lat: number
  lng: number
}

/** Shade a disc (`inside`) or everything outside it (`outside`) — Radar hit/miss. */
export type RadiusMode = 'inside' | 'outside'

/** A circular shade: a disc of `radiusM` around `center` (MAP-010). */
export interface RadiusShade {
  kind: 'radius'
  id: string
  center: LatLng
  radiusM: number
  mode: RadiusMode
}

/**
 * A half-plane shade for thermometer hotter/colder (MAP-011): the perpendicular
 * through `start` (perpendicular to start→end) splits the map; `side` picks which
 * half is shaded — `'toward'` = the half containing the end pin, `'away'` = the
 * opposite half. Geometry lives in `src/utils/halfPlane.ts`.
 */
export interface LineShade {
  kind: 'line'
  id: string
  start: LatLng
  end: LatLng
  /** Which half-plane to shade, relative to the start→end direction. */
  side: 'toward' | 'away'
}

export type VectorShade = RadiusShade | LineShade

/** Monotonic id so shades are stable for reconciliation without Date/random. */
let idCounter = 0
function nextId(prefix: string): string {
  idCounter += 1
  return `${prefix}-${idCounter}`
}

export interface VectorShadesApi {
  /** The reactive list of committed vector shades (render source). */
  shades: Ref<VectorShade[]>
  /** Commit a circular shade; returns its id (for undo). */
  addRadiusShade(center: LatLng, radiusM: number, mode: RadiusMode): string
  /** Commit a half-plane shade (MAP-011); returns its id. */
  addLineShade(start: LatLng, end: LatLng, side: LineShade['side']): string
  /** Remove one shade by id (undo of a single commit). */
  removeShade(id: string): void
  /** Remove all shades. */
  clearShades(): void
}

function createVectorShades(): VectorShadesApi {
  const shades = ref<VectorShade[]>([])

  function addRadiusShade(center: LatLng, radiusM: number, mode: RadiusMode): string {
    const id = nextId('radius')
    shades.value = [...shades.value, { kind: 'radius', id, center, radiusM, mode }]
    // Sync seam: a future MAP-01x could broadcast this shade here (e.g.
    // `sync.addVectorShade(...)`) and let an inbound handler union it into
    // `shades`, exactly as MAP-005 does with `ruledout`. Kept local for now.
    return id
  }

  function addLineShade(start: LatLng, end: LatLng, side: LineShade['side']): string {
    const id = nextId('line')
    shades.value = [...shades.value, { kind: 'line', id, start, end, side }]
    return id
  }

  function removeShade(id: string): void {
    shades.value = shades.value.filter((s) => s.id !== id)
  }

  function clearShades(): void {
    shades.value = []
  }

  return { shades, addRadiusShade, addLineShade, removeShade, clearShades }
}

// App-wide singleton — the tool UI and the map renderer share one list.
let singleton: VectorShadesApi | null = null

export function useVectorShades(): VectorShadesApi {
  if (!singleton) singleton = createVectorShades()
  return singleton
}

/** Test/teardown helper to reset the singleton (mirrors `__resetSyncSession`). */
export function __resetVectorShades(): void {
  singleton?.clearShades()
  singleton = null
  idCounter = 0
}
