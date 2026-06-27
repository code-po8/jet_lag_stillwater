/**
 * Hiding-zone composable (MAP-004).
 *
 * The hider picks a bus stop as the zone center; we send a `zone.set` with the
 * ¼-mile (402 m) radius. The synced zone (from the server `zone` broadcast,
 * applied by useSync) is exposed so the map can draw it — seekers only ever see
 * this declared zone, never the hider's exact position.
 */
import { computed } from 'vue'
import { useSync } from './useSync'
import { QUARTER_MILE_M, type Zone } from '@/services/sync/protocol'

export interface BusStopLike {
  lat: number
  lng: number
  name?: string | null
}

export function useZone() {
  const sync = useSync()

  const zone = computed<Zone | null>(() => sync.zone.value)
  const hasZone = computed(() => sync.zone.value !== null)

  /** Declare the hiding zone centered on a chosen bus stop. */
  function setFromBusStop(stop: BusStopLike): void {
    sync.setZone({
      lat: stop.lat,
      lng: stop.lng,
      radiusM: QUARTER_MILE_M,
      label: stop.name ?? undefined,
    })
  }

  return { zone, hasZone, setFromBusStop }
}
