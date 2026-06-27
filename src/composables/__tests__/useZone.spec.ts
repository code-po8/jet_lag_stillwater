import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useZone } from '../useZone'
import { useSync, __resetSyncSession } from '@/composables/useSync'
import { QUARTER_MILE_M } from '@/services/sync/protocol'

describe('useZone (MAP-004)', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    __resetSyncSession()
  })
  afterEach(() => __resetSyncSession())

  it('exposes the synced zone (null initially)', () => {
    const { zone } = useZone()
    expect(zone.value).toBeNull()
  })

  it('setFromBusStop sends a zone.set with the ¼-mile radius', () => {
    const sync = useSync()
    const sent: unknown[] = []
    sync.setZone = (z) => sent.push(z)

    const { setFromBusStop } = useZone()
    setFromBusStop({ lat: 36.12, lng: -97.07, name: 'Student Union' })

    expect(sent).toHaveLength(1)
    expect(sent[0]).toMatchObject({
      lat: 36.12,
      lng: -97.07,
      radiusM: QUARTER_MILE_M,
      label: 'Student Union',
    })
  })

  it('reflects an inbound synced zone', () => {
    const sync = useSync()
    const { zone } = useZone()
    sync.zone.value = { lat: 1, lng: 2, radiusM: QUARTER_MILE_M, label: 'X' }
    expect(zone.value).toMatchObject({ radiusM: QUARTER_MILE_M, label: 'X' })
  })

  it('hasZone is true once a zone is set', () => {
    const sync = useSync()
    const { hasZone } = useZone()
    expect(hasZone.value).toBe(false)
    sync.zone.value = { lat: 1, lng: 2, radiusM: QUARTER_MILE_M }
    expect(hasZone.value).toBe(true)
  })
})
