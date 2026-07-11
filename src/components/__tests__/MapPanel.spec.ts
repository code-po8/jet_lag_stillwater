import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, cleanup, fireEvent } from '@testing-library/vue'
import { createPinia, setActivePinia } from 'pinia'
import { nextTick } from 'vue'
import MapPanel from '../MapPanel.vue'
import { useSync, __resetSyncSession } from '@/composables/useSync'
import { useGameStore, GamePhase } from '@/stores/gameStore'
import { QUARTER_MILE_M } from '@/services/sync/protocol'

// Stub the heavy Leaflet-based BaseMap; expose props + a button to fire pickStop.
vi.mock('../BaseMap.vue', () => ({
  default: {
    name: 'BaseMap',
    props: [
      'zone',
      'breached',
      'markers',
      'shadedCells',
      'busStops',
      'inRangeStopIndices',
      'stopsPickable',
      'dimOtherPois',
    ],
    emits: ['pickStop'],
    template: `<div
      data-testid="base-map-stub"
      :data-marker-count="(markers || []).length"
      :data-breached="String(!!breached)"
      :data-shaded="(shadedCells || []).length"
      :data-busstops="(busStops || []).length"
      :data-inrange="(inRangeStopIndices || []).join(',')"
      :data-pickable="String(!!stopsPickable)"
      :data-dim="String(!!dimOtherPois)"
    ><button
      data-testid="map-pick-first-stop"
      @click="busStops && busStops.length && $emit('pickStop', busStops[0], 0)"
    /></div>`,
  },
}))

// Geolocation is started by MapPanel; stub it so tests don't touch the browser
// API. `position`/`error` let a test drive the in-range computation and the GPS
// status pill (MAP-008).
const geoState = {
  position: null as null | { lat: number; lng: number; ts: number },
  error: null as string | null,
}
vi.mock('@/composables/useGeolocation', () => ({
  useGeolocation: () => ({
    ownPosition: {
      get value() {
        return geoState.position
      },
    },
    error: {
      get value() {
        return geoState.error
      },
    },
    start: vi.fn(),
    stop: vi.fn(),
  }),
}))

describe('MapPanel (MAP-004)', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    __resetSyncSession()
    geoState.position = null
    geoState.error = null
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

  it('shows the shading toolbar (with text labels) for a seeker', async () => {
    const sync = useSync()
    sync.self.value = { id: 's1', name: 'Sue', role: 'seeker', isHost: false, connected: true }
    render(MapPanel)
    await nextTick()
    const toolbar = screen.getByTestId('shade-toolbar')
    expect(toolbar).toBeInTheDocument()
    // Buttons carry visible text labels (not icon-only).
    expect(screen.getByTestId('shade-freehand-btn')).toHaveTextContent(/freehand/i)
    expect(screen.getByTestId('shade-auto-btn')).toHaveTextContent(/auto-shade/i)
    expect(screen.getByTestId('shade-undo-btn')).toHaveTextContent(/undo/i)
  })

  it('disables undo until a shading action has happened', async () => {
    const sync = useSync()
    sync.self.value = { id: 's1', name: 'Sue', role: 'seeker', isHost: false, connected: true }
    render(MapPanel)
    await nextTick()
    expect(screen.getByTestId('shade-undo-btn')).toBeDisabled()
  })

  it('does NOT show the shading toolbar for a hider', async () => {
    const sync = useSync()
    sync.self.value = { id: 'h1', name: 'Hank', role: 'hider', isHost: true, connected: true }
    render(MapPanel)
    await nextTick()
    expect(screen.queryByTestId('shade-toolbar')).not.toBeInTheDocument()
  })

  it('toggles freehand active state', async () => {
    const sync = useSync()
    sync.self.value = { id: 's1', name: 'Sue', role: 'seeker', isHost: false, connected: true }
    render(MapPanel)
    await nextTick()
    const btn = screen.getByTestId('shade-freehand-btn')
    expect(btn.getAttribute('aria-pressed')).toBe('false')
    await fireEvent.click(btn)
    expect(btn.getAttribute('aria-pressed')).toBe('true')
  })

  it('renders synced ruled-out cells onto the map', async () => {
    const sync = useSync()
    sync.self.value = { id: 's1', name: 'Sue', role: 'seeker', isHost: false, connected: true }
    sync.ruledOutCells.value = ['9yd8s', '9yd8t']
    render(MapPanel)
    await nextTick()
    // Toolbar present (seeker) and BaseMap stub receives the cells via prop.
    expect(screen.getByTestId('base-map-stub')).toBeInTheDocument()
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

  // ── Map-based bus-stop picking (MAP-007) ──

  it('passes pickable bus stops to the map for the hider only', async () => {
    const sync = useSync()
    sync.self.value = { id: 'h1', name: 'Hank', role: 'hider', isHost: true, connected: true }
    render(MapPanel)
    await nextTick()
    const stub = screen.getByTestId('base-map-stub')
    expect(stub.getAttribute('data-pickable')).toBe('true')
    expect(Number(stub.getAttribute('data-busstops'))).toBeGreaterThan(0)
    // Dim the other POIs so a highlighted bus stop isn't confused with a
    // same-named school/restaurant dot next to it (MAP-007).
    expect(stub.getAttribute('data-dim')).toBe('true')
  })

  it('does NOT pass pickable bus stops to a seeker', async () => {
    const sync = useSync()
    sync.self.value = { id: 's1', name: 'Sue', role: 'seeker', isHost: false, connected: true }
    render(MapPanel)
    await nextTick()
    const stub = screen.getByTestId('base-map-stub')
    expect(stub.getAttribute('data-pickable')).toBe('false')
    expect(stub.getAttribute('data-busstops')).toBe('0')
    // Seekers see the full POI overlay at full strength.
    expect(stub.getAttribute('data-dim')).toBe('false')
  })

  it('highlights bus stops within ¼ mi of the hider GPS as in-range', async () => {
    const sync = useSync()
    sync.self.value = { id: 'h1', name: 'Hank', role: 'hider', isHost: true, connected: true }
    // Sit essentially on top of the first bus stop (index 0 in the baked overlay).
    geoState.position = { lat: 36.1267339, lng: -97.0643939, ts: 1 }
    render(MapPanel)
    await nextTick()
    const inrange = screen.getByTestId('base-map-stub').getAttribute('data-inrange') ?? ''
    expect(inrange.split(',')).toContain('0')
  })

  it('reports no in-range stops when the hider is far from every stop', async () => {
    const sync = useSync()
    sync.self.value = { id: 'h1', name: 'Hank', role: 'hider', isHost: true, connected: true }
    // Far outside Stillwater — nothing within ¼ mile.
    geoState.position = { lat: 40.0, lng: -100.0, ts: 1 }
    render(MapPanel)
    await nextTick()
    expect(screen.getByTestId('base-map-stub').getAttribute('data-inrange')).toBe('')
  })

  it('sends a zone.set when the hider picks a stop from the map', async () => {
    const sync = useSync()
    sync.self.value = { id: 'h1', name: 'Hank', role: 'hider', isHost: true, connected: true }
    const sent: unknown[] = []
    sync.setZone = (z) => sent.push(z)

    render(MapPanel)
    await nextTick()
    await fireEvent.click(screen.getByTestId('map-pick-first-stop'))

    expect(sent).toHaveLength(1)
    expect(sent[0]).toMatchObject({ radiusM: QUARTER_MILE_M })
  })

  it('shows the tap-a-stop hint to the hider', async () => {
    const sync = useSync()
    sync.self.value = { id: 'h1', name: 'Hank', role: 'hider', isHost: true, connected: true }
    render(MapPanel)
    await nextTick()
    expect(screen.getByTestId('zone-pick-hint')).toHaveTextContent(/tap a bus stop/i)
  })

  // GPS status pill (MAP-008): a missing "you" dot must never be silent.
  it('shows a "locating" status while waiting for the first GPS fix', async () => {
    geoState.position = null
    geoState.error = null
    render(MapPanel)
    await nextTick()
    expect(screen.getByTestId('gps-status')).toHaveTextContent(/locating/i)
  })

  it('surfaces the geolocation error when GPS fails', async () => {
    geoState.position = null
    geoState.error = 'User denied Geolocation'
    render(MapPanel)
    await nextTick()
    expect(screen.getByTestId('gps-status')).toHaveTextContent(/denied/i)
  })

  it('hides the GPS status once a fix arrives', async () => {
    geoState.position = { lat: 36.12, lng: -97.07, ts: 1 }
    render(MapPanel)
    await nextTick()
    expect(screen.queryByTestId('gps-status')).toBeNull()
  })
})
