/**
 * Position throttle policy (MULTI-003a).
 *
 * Decides whether a new GPS fix is worth sending to the server:
 *   - drop low-accuracy fixes
 *   - otherwise send if it's been >= MIN_INTERVAL_MS since the last send,
 *     OR the device moved more than MIN_MOVE_M.
 * Pure function so it is trivially unit-testable.
 */
import type { Position } from '@/services/sync/protocol'

export const MIN_INTERVAL_MS = 2500 // ~2.5s between sends
export const MIN_MOVE_M = 15 // or whenever moved > 15 m
export const MAX_ACCURACY_M = 100 // drop fixes worse than this

/** Haversine distance in meters (shared shape with the server's RoomHub). */
export function distanceMeters(a: Position, b: Position): number {
  const R = 6_371_000
  const toRad = (d: number) => (d * Math.PI) / 180
  const dLat = toRad(b.lat - a.lat)
  const dLng = toRad(b.lng - a.lng)
  const lat1 = toRad(a.lat)
  const lat2 = toRad(b.lat)
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(h))
}

export function shouldSendPosition(last: Position | null, next: Position): boolean {
  // Drop low-accuracy fixes (when accuracy is reported).
  if (typeof next.accuracy === 'number' && next.accuracy > MAX_ACCURACY_M) {
    return false
  }
  if (!last) return true

  const elapsed = next.ts - last.ts
  if (elapsed >= MIN_INTERVAL_MS) return true

  return distanceMeters(last, next) > MIN_MOVE_M
}
