import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, cleanup } from '@testing-library/vue'
import { nextTick } from 'vue'
import BaseMap from '../BaseMap.vue'

// A minimal Leaflet stand-in (jsdom can't run real Leaflet rendering).
function fakeLeaflet() {
  const map = {
    addTo: vi.fn(),
    fitBounds: vi.fn(),
    remove: vi.fn(),
    setView: vi.fn(),
  }
  const layer = {
    addTo: vi.fn().mockReturnThis(),
    getBounds: vi.fn().mockReturnValue({ isValid: () => true }),
  }
  const L = {
    map: vi.fn().mockReturnValue(map),
    geoJSON: vi.fn().mockReturnValue(layer),
  }
  return { L, map, layer }
}

describe('BaseMap (MAP-001)', () => {
  let fake: ReturnType<typeof fakeLeaflet>

  beforeEach(() => {
    fake = fakeLeaflet()
  })
  afterEach(() => cleanup())

  it('renders a map region with an accessible label', () => {
    render(BaseMap, { props: { leaflet: fake.L as never } })
    expect(screen.getByRole('region', { name: /stillwater game map/i })).toBeInTheDocument()
    expect(screen.getByTestId('base-map-canvas')).toBeInTheDocument()
  })

  it('initializes Leaflet on the canvas centered on Stillwater', async () => {
    render(BaseMap, { props: { leaflet: fake.L as never } })
    await nextTick()
    expect(fake.L.map).toHaveBeenCalledTimes(1)
    const opts = fake.L.map.mock.calls[0]![1] as { center: [number, number] }
    expect(opts.center[0]).toBeCloseTo(36.11, 1)
    expect(opts.center[1]).toBeCloseTo(-97.05, 1)
  })

  it('renders the baked GeoJSON base as a layer', async () => {
    render(BaseMap, { props: { leaflet: fake.L as never } })
    await nextTick()
    expect(fake.L.geoJSON).toHaveBeenCalledTimes(1)
    // The styled base data is a FeatureCollection with features.
    const data = fake.L.geoJSON.mock.calls[0]![0] as { type: string; features: unknown[] }
    expect(data.type).toBe('FeatureCollection')
    expect(data.features.length).toBeGreaterThan(100)
  })

  it('fits the view to the base layer bounds', async () => {
    render(BaseMap, { props: { leaflet: fake.L as never } })
    await nextTick()
    expect(fake.map.fitBounds).toHaveBeenCalled()
  })

  it('emits ready with the map instance', async () => {
    const { emitted } = render(BaseMap, { props: { leaflet: fake.L as never } })
    await nextTick()
    expect(emitted().ready).toBeTruthy()
  })

  it('styles city-limits distinctly from roads', async () => {
    render(BaseMap, { props: { leaflet: fake.L as never } })
    await nextTick()
    const styleFn = (fake.L.geoJSON.mock.calls[0]![1] as { style: (f: unknown) => unknown }).style
    const cityStyle = styleFn({ properties: { kind: 'city-limits' } }) as { dashArray?: string }
    const roadStyle = styleFn({ properties: { kind: 'road' } }) as { dashArray?: string }
    expect(cityStyle.dashArray).toBeTruthy() // dashed boundary
    expect(roadStyle.dashArray).toBeUndefined() // solid roads
  })
})
