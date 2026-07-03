/**
 * Geolocation tracker (MULTI-003a).
 *
 * Watches the device GPS and forwards throttled fixes to the sync session so
 * positions broadcast to the room. The server coalesces + withholds the hider's
 * position from seekers (INFRA-006); this is only the send side.
 */
import { ref, type Ref } from 'vue'
import type { Position } from '@/services/sync/protocol'
import { shouldSendPosition } from './positionThrottle'
import { useSync } from './useSync'

export interface GeolocationTrackerOptions {
  /** Inject navigator.geolocation (tests). Defaults to the browser API. */
  geolocation?: Geolocation
  /** Where to send a throttled position (defaults to the sync session). */
  send?: (pos: Position) => void
}

export interface GeolocationTracker {
  ownPosition: Ref<Position | null>
  error: Ref<string | null>
  start(): void
  stop(): void
}

export function createGeolocationTracker(
  options: GeolocationTrackerOptions = {},
): GeolocationTracker {
  const geo =
    options.geolocation ?? (typeof navigator !== 'undefined' ? navigator.geolocation : undefined)
  const send = options.send

  const ownPosition = ref<Position | null>(null)
  const error = ref<string | null>(null)
  let lastSent: Position | null = null
  let watchId: number | null = null

  function handleFix(gpos: GeolocationPosition): void {
    const pos: Position = {
      lat: gpos.coords.latitude,
      lng: gpos.coords.longitude,
      accuracy: gpos.coords.accuracy,
      ts: gpos.timestamp,
    }
    ownPosition.value = pos
    if (shouldSendPosition(lastSent, pos)) {
      lastSent = pos
      send?.(pos)
    }
  }

  function start(): void {
    if (!geo) {
      error.value = 'Geolocation is not available on this device.'
      return
    }
    error.value = null
    watchId = geo.watchPosition(
      handleFix,
      (e) => {
        error.value = e.message || 'Could not get your location.'
      },
      { enableHighAccuracy: true, maximumAge: 1000, timeout: 10_000 },
    )
  }

  function stop(): void {
    if (geo && watchId !== null) {
      geo.clearWatch(watchId)
      watchId = null
    }
  }

  return { ownPosition, error, start, stop }
}

/**
 * Convenience: a tracker bound to the app-wide sync session, so fixes flow to
 * the room automatically.
 */
export function useGeolocation(): GeolocationTracker {
  const sync = useSync()
  return createGeolocationTracker({ send: (pos) => sync.sendPosition(pos) })
}
