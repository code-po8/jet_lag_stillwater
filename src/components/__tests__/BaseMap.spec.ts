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
  const circle = { addTo: vi.fn().mockReturnThis(), remove: vi.fn() }
  const group = { addLayer: vi.fn(), addTo: vi.fn().mockReturnThis(), remove: vi.fn() }
  const L = {
    map: vi.fn().mockReturnValue(map),
    geoJSON: vi.fn().mockReturnValue(layer),
    circleMarker: vi.fn().mockReturnValue({ bindTooltip: vi.fn().mockReturnThis() }),
    circle: vi.fn().mockReturnValue(circle),
    layerGroup: vi.fn().mockReturnValue(group),
    rectangle: vi.fn().mockReturnValue({ addTo: vi.fn() }),
  }
  return { L, map, layer, circle, group }
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

  it('renders the baked GeoJSON base + POI overlay as layers', async () => {
    render(BaseMap, { props: { leaflet: fake.L as never } })
    await nextTick()
    // base layer + POI overlay
    expect(fake.L.geoJSON).toHaveBeenCalledTimes(2)
    const baseData = fake.L.geoJSON.mock.calls[0]![0] as { type: string; features: unknown[] }
    expect(baseData.type).toBe('FeatureCollection')
    expect(baseData.features.length).toBeGreaterThan(100)
    const poiData = fake.L.geoJSON.mock.calls[1]![0] as {
      features: { properties: { kind: string } }[]
    }
    const kinds = new Set(poiData.features.map((f) => f.properties.kind))
    expect(kinds.has('bus-stop')).toBe(true)
  })

  it('shows a legend with text labels for overlay categories', async () => {
    render(BaseMap, { props: { leaflet: fake.L as never } })
    await nextTick()
    const legend = screen.getByTestId('map-legend')
    expect(legend).toHaveTextContent(/bus stop/i)
    expect(legend).toHaveTextContent(/restaurant/i)
    expect(legend).toHaveTextContent(/school/i)
    expect(legend).toHaveTextContent(/park/i)
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

  it('draws a zone circle when a zone prop is provided (MAP-004)', async () => {
    render(BaseMap, {
      props: {
        leaflet: fake.L as never,
        zone: { lat: 36.12, lng: -97.07, radiusM: 402, label: 'Union' },
      },
    })
    await nextTick()
    expect(fake.L.circle).toHaveBeenCalledTimes(1)
    const [center, opts] = fake.L.circle.mock.calls[0]! as [number[], { radius: number }]
    expect(center).toEqual([36.12, -97.07])
    expect(opts.radius).toBe(402)
  })

  it('does not draw a zone when none is provided', async () => {
    render(BaseMap, { props: { leaflet: fake.L as never } })
    await nextTick()
    expect(fake.L.circle).not.toHaveBeenCalled()
  })

  it('draws live position markers (MAP-003)', async () => {
    render(BaseMap, {
      props: {
        leaflet: fake.L as never,
        markers: [
          { id: 's1', name: 'Sue', role: 'seeker', pos: { lat: 36.1, lng: -97.0, ts: 1 } },
          {
            id: 'me',
            name: 'Me',
            role: 'seeker',
            pos: { lat: 36.11, lng: -97.01, ts: 1 },
            isSelf: true,
          },
        ],
      },
    })
    await nextTick()
    expect(fake.L.layerGroup).toHaveBeenCalled()
    // one circleMarker per marker
    expect(fake.L.circleMarker).toHaveBeenCalledTimes(2)
  })

  it('colors hider and seeker markers differently', async () => {
    render(BaseMap, {
      props: {
        leaflet: fake.L as never,
        markers: [
          { id: 'h', name: 'H', role: 'hider', pos: { lat: 1, lng: 2, ts: 1 } },
          { id: 's', name: 'S', role: 'seeker', pos: { lat: 1, lng: 2, ts: 1 } },
        ],
      },
    })
    await nextTick()
    const fills = fake.L.circleMarker.mock.calls.map(
      (c) => (c[1] as { fillColor: string }).fillColor,
    )
    expect(new Set(fills).size).toBe(2) // hider vs seeker color differ
  })

  it('shades ruled-out geohash cells as rectangles (MAP-005)', async () => {
    render(BaseMap, {
      props: {
        leaflet: fake.L as never,
        shadedCells: ['9yd8s', '9yd8t', '9yd8w'],
      },
    })
    await nextTick()
    expect(fake.L.rectangle).toHaveBeenCalledTimes(3)
  })

  it('does not shade when there are no ruled-out cells', async () => {
    render(BaseMap, { props: { leaflet: fake.L as never } })
    await nextTick()
    expect(fake.L.rectangle).not.toHaveBeenCalled()
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
