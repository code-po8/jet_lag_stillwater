import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, cleanup, fireEvent } from '@testing-library/vue'
import { createPinia, setActivePinia } from 'pinia'
import { nextTick } from 'vue'
import MapPanel from '../MapPanel.vue'
import { useSync, __resetSyncSession } from '@/composables/useSync'
import { useVectorShades, __resetVectorShades } from '@/composables/useVectorShades'
import { useGameStore, GamePhase } from '@/stores/gameStore'
import { useQuestionStore } from '@/stores/questionStore'
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
      'askedFromMarkers',
      'vectorShades',
      'placementMode',
      'maxPins',
    ],
    emits: ['pickStop', 'tempPinsChange'],
    template: `<div
      data-testid="base-map-stub"
      :data-marker-count="(markers || []).length"
      :data-breached="String(!!breached)"
      :data-shaded="(shadedCells || []).length"
      :data-busstops="(busStops || []).length"
      :data-inrange="(inRangeStopIndices || []).join(',')"
      :data-pickable="String(!!stopsPickable)"
      :data-askedfrom="(askedFromMarkers || []).length"
      :data-askedfrom-label="(askedFromMarkers || []).map(m => m.label).join('|')"
      :data-vectorshades="(vectorShades || []).length"
      :data-vectormode="(vectorShades || []).map(s => s.mode).join(',')"
      :data-placement="String(!!placementMode)"
      :data-maxpins="maxPins"
    ><button
      data-testid="map-pick-first-stop"
      @click="busStops && busStops.length && $emit('pickStop', busStops[0], 0)"
    /><button
      data-testid="map-drop-pin"
      @click="$emit('tempPinsChange', [{ lat: 36.12, lng: -97.07 }])"
    /><button
      data-testid="map-drop-two-pins"
      @click="$emit('tempPinsChange', [{ lat: 36.12, lng: -97.07 }, { lat: 36.13, lng: -97.07 }])"
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
    __resetVectorShades()
    geoState.position = null
    geoState.error = null
  })
  afterEach(() => {
    cleanup()
    __resetSyncSession()
    __resetVectorShades()
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
  })

  it('does NOT pass pickable bus stops to a seeker', async () => {
    const sync = useSync()
    sync.self.value = { id: 's1', name: 'Sue', role: 'seeker', isHost: false, connected: true }
    render(MapPanel)
    await nextTick()
    const stub = screen.getByTestId('base-map-stub')
    expect(stub.getAttribute('data-pickable')).toBe('false')
    expect(stub.getAttribute('data-busstops')).toBe('0')
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

  // ── Ask-time position pins (MAP-009) ──

  it('passes ask-time pins to the map for the HIDER, labeled by category', async () => {
    const sync = useSync()
    sync.self.value = { id: 'h1', name: 'Hank', role: 'hider', isHost: true, connected: true }
    const questions = useQuestionStore()
    // A synced radar question the seeker asked, with their ask-time position.
    questions.askQuestion('radar-0.5-miles', { lat: 36.12, lng: -97.07 })

    render(MapPanel)
    await nextTick()

    const stub = screen.getByTestId('base-map-stub')
    expect(stub).toHaveAttribute('data-askedfrom', '1')
    expect(stub).toHaveAttribute('data-askedfrom-label', 'Radar asked here')
  })

  it('does NOT show ask-time pins to a seeker', async () => {
    const sync = useSync()
    sync.self.value = { id: 's1', name: 'Sue', role: 'seeker', isHost: false, connected: true }
    const questions = useQuestionStore()
    questions.askQuestion('radar-0.5-miles', { lat: 36.12, lng: -97.07 })

    render(MapPanel)
    await nextTick()

    expect(screen.getByTestId('base-map-stub')).toHaveAttribute('data-askedfrom', '0')
  })

  it('omits a pin for a question that has no ask-time position', async () => {
    const sync = useSync()
    sync.self.value = { id: 'h1', name: 'Hank', role: 'hider', isHost: true, connected: true }
    const questions = useQuestionStore()
    questions.askQuestion('radar-0.5-miles') // no askedFrom

    render(MapPanel)
    await nextTick()

    expect(screen.getByTestId('base-map-stub')).toHaveAttribute('data-askedfrom', '0')
  })

  // ── Radius shader (MAP-010) ──

  function asSeeker() {
    const sync = useSync()
    sync.self.value = { id: 's1', name: 'Sue', role: 'seeker', isHost: false, connected: true }
  }

  it('shows a Radius tool button in the seeker toolbar', async () => {
    asSeeker()
    render(MapPanel)
    await nextTick()
    expect(screen.getByTestId('shade-radius-btn')).toHaveTextContent(/radius/i)
  })

  it('opens the radius control panel and enables placement mode when the tool is toggled', async () => {
    asSeeker()
    render(MapPanel)
    await nextTick()

    expect(screen.queryByTestId('radius-panel')).toBeNull()
    expect(screen.getByTestId('base-map-stub')).toHaveAttribute('data-placement', 'false')

    await fireEvent.click(screen.getByTestId('shade-radius-btn'))

    expect(screen.getByTestId('radius-panel')).toBeInTheDocument()
    expect(screen.getByTestId('base-map-stub')).toHaveAttribute('data-placement', 'true')
    expect(screen.getByTestId('base-map-stub')).toHaveAttribute('data-maxpins', '1')
  })

  it('commits an inside radius shade after placing a pin and applying', async () => {
    asSeeker()
    const v = useVectorShades()
    render(MapPanel)
    await nextTick()

    await fireEvent.click(screen.getByTestId('shade-radius-btn'))
    // Apply is disabled until a pin is placed.
    expect(screen.getByTestId('radius-apply-btn')).toBeDisabled()

    // Simulate BaseMap reporting a dropped pin, then apply.
    await fireEvent.click(screen.getByTestId('map-drop-pin'))
    await fireEvent.click(screen.getByTestId('radius-apply-btn'))

    expect(v.shades.value).toHaveLength(1)
    expect(v.shades.value[0]).toMatchObject({ kind: 'radius', mode: 'inside' })
    // Radius input default 500 ft → meters.
    expect((v.shades.value[0] as { radiusM: number }).radiusM).toBeCloseTo(500 * 0.3048, 1)
    // The committed shade is passed back down to the map.
    expect(screen.getByTestId('base-map-stub')).toHaveAttribute('data-vectorshades', '1')
  })

  it('commits an OUTSIDE shade when the outside mode is selected', async () => {
    asSeeker()
    const v = useVectorShades()
    render(MapPanel)
    await nextTick()

    await fireEvent.click(screen.getByTestId('shade-radius-btn'))
    await fireEvent.click(screen.getByTestId('radius-mode-outside'))
    await fireEvent.click(screen.getByTestId('map-drop-pin'))
    await fireEvent.click(screen.getByTestId('radius-apply-btn'))

    expect(v.shades.value[0]).toMatchObject({ mode: 'outside' })
    expect(screen.getByTestId('base-map-stub')).toHaveAttribute('data-vectormode', 'outside')
  })

  it('undoes and clears vector shades', async () => {
    asSeeker()
    const v = useVectorShades()
    render(MapPanel)
    await nextTick()
    await fireEvent.click(screen.getByTestId('shade-radius-btn'))

    // Commit two shades.
    await fireEvent.click(screen.getByTestId('map-drop-pin'))
    await fireEvent.click(screen.getByTestId('radius-apply-btn'))
    await fireEvent.click(screen.getByTestId('map-drop-pin'))
    await fireEvent.click(screen.getByTestId('radius-apply-btn'))
    expect(v.shades.value).toHaveLength(2)

    await fireEvent.click(screen.getByTestId('vector-undo-btn'))
    expect(v.shades.value).toHaveLength(1)

    await fireEvent.click(screen.getByTestId('vector-clear-btn'))
    expect(v.shades.value).toHaveLength(0)
  })

  it('does not show the radius tool for a hider', async () => {
    const sync = useSync()
    sync.self.value = { id: 'h1', name: 'Hank', role: 'hider', isHost: true, connected: true }
    render(MapPanel)
    await nextTick()
    expect(screen.queryByTestId('shade-radius-btn')).toBeNull()
  })

  // ── Line (thermometer) shader (MAP-011) ──

  it('shows a Line tool button in the seeker toolbar', async () => {
    asSeeker()
    render(MapPanel)
    await nextTick()
    expect(screen.getByTestId('shade-line-btn')).toHaveTextContent(/line/i)
  })

  it('opens the line panel and requests TWO pins when the tool is toggled', async () => {
    asSeeker()
    render(MapPanel)
    await nextTick()

    await fireEvent.click(screen.getByTestId('shade-line-btn'))

    expect(screen.getByTestId('line-panel')).toBeInTheDocument()
    const stub = screen.getByTestId('base-map-stub')
    expect(stub).toHaveAttribute('data-placement', 'true')
    expect(stub).toHaveAttribute('data-maxpins', '2')
  })

  it('commits a line shade after placing start+end pins and applying', async () => {
    asSeeker()
    const v = useVectorShades()
    render(MapPanel)
    await nextTick()

    await fireEvent.click(screen.getByTestId('shade-line-btn'))
    // Apply disabled until BOTH pins exist.
    expect(screen.getByTestId('line-apply-btn')).toBeDisabled()

    await fireEvent.click(screen.getByTestId('map-drop-two-pins'))
    await fireEvent.click(screen.getByTestId('line-apply-btn'))

    expect(v.shades.value).toHaveLength(1)
    expect(v.shades.value[0]).toMatchObject({
      kind: 'line',
      side: 'away', // default: shade the half behind the start
      start: { lat: 36.12, lng: -97.07 },
      end: { lat: 36.13, lng: -97.07 },
    })
    expect(screen.getByTestId('base-map-stub')).toHaveAttribute('data-vectorshades', '1')
  })

  it('lets the seeker pick which half to shade', async () => {
    asSeeker()
    const v = useVectorShades()
    render(MapPanel)
    await nextTick()

    await fireEvent.click(screen.getByTestId('shade-line-btn'))
    await fireEvent.click(screen.getByTestId('line-side-toward'))
    await fireEvent.click(screen.getByTestId('map-drop-two-pins'))
    await fireEvent.click(screen.getByTestId('line-apply-btn'))

    expect(v.shades.value[0]).toMatchObject({ kind: 'line', side: 'toward' })
  })

  it('radius and line tools are mutually exclusive', async () => {
    asSeeker()
    render(MapPanel)
    await nextTick()

    await fireEvent.click(screen.getByTestId('shade-radius-btn'))
    expect(screen.getByTestId('radius-panel')).toBeInTheDocument()

    // Activating the line tool closes the radius panel.
    await fireEvent.click(screen.getByTestId('shade-line-btn'))
    expect(screen.queryByTestId('radius-panel')).toBeNull()
    expect(screen.getByTestId('line-panel')).toBeInTheDocument()
  })

  it('does not show the line tool for a hider', async () => {
    const sync = useSync()
    sync.self.value = { id: 'h1', name: 'Hank', role: 'hider', isHost: true, connected: true }
    render(MapPanel)
    await nextTick()
    expect(screen.queryByTestId('shade-line-btn')).toBeNull()
  })
})
