import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, cleanup, fireEvent } from '@testing-library/vue'
import { createPinia, setActivePinia } from 'pinia'
import { nextTick } from 'vue'
import MapPanel from '../MapPanel.vue'
import { useSync, __resetSyncSession } from '@/composables/useSync'
import { QUARTER_MILE_M } from '@/services/sync/protocol'

// Stub the heavy Leaflet-based BaseMap.
vi.mock('../BaseMap.vue', () => ({
  default: {
    name: 'BaseMap',
    props: ['zone', 'breached'],
    template: '<div data-testid="base-map-stub" />',
  },
}))

describe('MapPanel (MAP-004)', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    __resetSyncSession()
  })
  afterEach(() => {
    cleanup()
    __resetSyncSession()
  })

  it('shows the zone sheet with an empty state initially', () => {
    render(MapPanel)
    expect(screen.getByTestId('zone-sheet')).toBeInTheDocument()
    expect(screen.getByTestId('zone-empty')).toBeInTheDocument()
  })

  it('shows zone center + radius once a zone is synced', async () => {
    const sync = useSync()
    sync.zone.value = { lat: 36.12, lng: -97.07, radiusM: QUARTER_MILE_M, label: 'Student Union' }
    render(MapPanel)
    await nextTick()
    expect(screen.getByTestId('zone-center')).toHaveTextContent('Student Union')
    expect(screen.getByTestId('zone-radius')).toHaveTextContent(/¼ mi/)
  })

  it('shows the bus-stop picker only for the hider', async () => {
    const sync = useSync()
    sync.self.value = { id: 'h1', name: 'Hank', role: 'hider', isHost: true, connected: true }
    render(MapPanel)
    await nextTick()
    expect(screen.getByTestId('zone-stop-select')).toBeInTheDocument()
  })

  it('does NOT show the picker for a seeker', async () => {
    const sync = useSync()
    sync.self.value = { id: 's1', name: 'Sue', role: 'seeker', isHost: false, connected: true }
    render(MapPanel)
    await nextTick()
    expect(screen.queryByTestId('zone-stop-select')).not.toBeInTheDocument()
  })

  it('sends a zone.set when the hider picks a bus stop', async () => {
    const sync = useSync()
    sync.self.value = { id: 'h1', name: 'Hank', role: 'hider', isHost: true, connected: true }
    const sent: unknown[] = []
    sync.setZone = (z) => sent.push(z)

    render(MapPanel)
    await nextTick()
    const select = screen.getByTestId('zone-stop-select') as HTMLSelectElement
    // Pick the first bus stop option.
    await fireEvent.update(select, '0')

    expect(sent).toHaveLength(1)
    expect(sent[0]).toMatchObject({ radiusM: QUARTER_MILE_M })
  })
})
