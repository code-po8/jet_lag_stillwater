import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, cleanup, fireEvent } from '@testing-library/vue'
import { createPinia, setActivePinia } from 'pinia'
import { nextTick } from 'vue'
import MapPanel from '../MapPanel.vue'
import { useSync, __resetSyncSession } from '@/composables/useSync'
import { useGameStore, GamePhase } from '@/stores/gameStore'
import { QUARTER_MILE_M } from '@/services/sync/protocol'

// Stub the heavy Leaflet-based BaseMap; expose the markers count for assertions.
vi.mock('../BaseMap.vue', () => ({
  default: {
    name: 'BaseMap',
    props: ['zone', 'breached', 'markers'],
    template:
      '<div data-testid="base-map-stub" :data-marker-count="(markers || []).length" :data-breached="String(!!breached)" />',
  },
}))

// Geolocation is started by MapPanel; stub it so tests don't touch the browser API.
vi.mock('@/composables/useGeolocation', () => ({
  useGeolocation: () => ({
    ownPosition: { value: null },
    error: { value: null },
    start: vi.fn(),
    stop: vi.fn(),
  }),
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

  it('passes synced position markers to the map', async () => {
    const sync = useSync()
    sync.self.value = { id: 's1', name: 'Sue', role: 'seeker', isHost: false, connected: true }
    sync.players.value = [{ id: 's2', name: 'Sam', role: 'seeker', isHost: false, connected: true }]
    sync.positions.value = new Map([['s2', { lat: 36.1, lng: -97.0, ts: 1 }]])

    render(MapPanel)
    await nextTick()
    const stub = screen.getByTestId('base-map-stub')
    // One marker for the other seeker (self has no geolocation in this stub).
    expect(stub.getAttribute('data-marker-count')).toBe('1')
  })

  it('shows no breach banner when no seeker has breached', () => {
    render(MapPanel)
    expect(screen.queryByTestId('breach-banner')).not.toBeInTheDocument()
  })

  it('shows the breach banner (alert) when a seeker enters the zone (MAP-006)', async () => {
    const sync = useSync()
    sync.breachedSeekers.value = ['s2']
    render(MapPanel)
    await nextTick()
    const banner = screen.getByTestId('breach-banner')
    expect(banner).toBeInTheDocument()
    expect(banner).toHaveAttribute('role', 'alert')
  })

  it('advances the game to end-game on first breach during seeking', async () => {
    const game = useGameStore()
    game.currentPhase = GamePhase.Seeking
    const sync = useSync()
    render(MapPanel)
    await nextTick()
    sync.breachedSeekers.value = ['s2'] // breach arrives
    await nextTick()
    expect(game.currentPhase).toBe(GamePhase.EndGame)
  })

  it('passes breached=true to the map so the zone pulses red', async () => {
    const sync = useSync()
    sync.breachedSeekers.value = ['s2']
    render(MapPanel)
    await nextTick()
    expect(screen.getByTestId('base-map-stub').getAttribute('data-breached')).toBe('true')
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
