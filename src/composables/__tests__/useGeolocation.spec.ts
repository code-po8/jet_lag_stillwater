import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { createGeolocationTracker } from '../useGeolocation'
import type { Position } from '@/services/sync/protocol'

/** Mock the browser geolocation API. */
function mockGeolocation() {
  let watchCb: ((pos: GeolocationPosition) => void) | null = null
  let errCb: ((e: GeolocationPositionError) => void) | null = null
  const clearWatch = vi.fn()
  const geo = {
    watchPosition: vi.fn((success: PositionCallback, error?: PositionErrorCallback) => {
      watchCb = success as never
      errCb = (error ?? null) as never
      return 1
    }),
    clearWatch,
  }
  function emit(lat: number, lng: number, accuracy: number, ts: number) {
    watchCb?.({
      coords: { latitude: lat, longitude: lng, accuracy } as GeolocationCoordinates,
      timestamp: ts,
    } as GeolocationPosition)
  }
  function emitError() {
    errCb?.({ code: 1, message: 'denied' } as GeolocationPositionError)
  }
  return { geo, emit, emitError, clearWatch }
}

describe('createGeolocationTracker', () => {
  let sent: Position[]
  let send: (p: Position) => void

  beforeEach(() => {
    sent = []
    send = (p) => sent.push(p)
  })
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('starts watching and sends the first fix', () => {
    const m = mockGeolocation()
    const tracker = createGeolocationTracker({ geolocation: m.geo as never, send })
    tracker.start()
    m.emit(36.12, -97.07, 10, 1000)
    expect(sent).toHaveLength(1)
    expect(sent[0]).toMatchObject({ lat: 36.12, lng: -97.07 })
  })

  it('throttles rapid same-spot updates', () => {
    const m = mockGeolocation()
    const tracker = createGeolocationTracker({ geolocation: m.geo as never, send })
    tracker.start()
    m.emit(36.12, -97.07, 10, 0)
    m.emit(36.12, -97.07, 10, 500) // too soon, no move
    expect(sent).toHaveLength(1)
  })

  it('sends again after a real move', () => {
    const m = mockGeolocation()
    const tracker = createGeolocationTracker({ geolocation: m.geo as never, send })
    tracker.start()
    m.emit(36.12, -97.07, 10, 0)
    m.emit(36.12 + 0.0003, -97.07, 10, 500) // ~33m north
    expect(sent).toHaveLength(2)
  })

  it('exposes the latest own position', () => {
    const m = mockGeolocation()
    const tracker = createGeolocationTracker({ geolocation: m.geo as never, send })
    tracker.start()
    m.emit(36.12, -97.07, 10, 1000)
    expect(tracker.ownPosition.value).toMatchObject({ lat: 36.12 })
  })

  it('captures a permission/error state', () => {
    const m = mockGeolocation()
    const tracker = createGeolocationTracker({ geolocation: m.geo as never, send })
    tracker.start()
    m.emitError()
    expect(tracker.error.value).toBeTruthy()
  })

  it('stop() clears the watch', () => {
    const m = mockGeolocation()
    const tracker = createGeolocationTracker({ geolocation: m.geo as never, send })
    tracker.start()
    tracker.stop()
    expect(m.clearWatch).toHaveBeenCalled()
  })

  it('does nothing if geolocation is unavailable', () => {
    const tracker = createGeolocationTracker({ geolocation: undefined, send })
    expect(() => tracker.start()).not.toThrow()
    expect(tracker.error.value).toBeTruthy()
  })
})
