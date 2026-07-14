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
    setStyle: vi.fn().mockReturnThis(),
  }
  const circle = { addTo: vi.fn().mockReturnThis(), remove: vi.fn() }
  const group = {
    addLayer: vi.fn(),
    removeLayer: vi.fn(),
    addTo: vi.fn().mockReturnThis(),
    remove: vi.fn(),
  }
  // Each circleMarker/rectangle is a distinct object so per-layer ops (setLatLng,
  // remove) can be asserted; record them for inspection.
  const markers: Array<{
    setLatLng: ReturnType<typeof vi.fn>
    bindPopup: ReturnType<typeof vi.fn>
    bindTooltip: ReturnType<typeof vi.fn>
  }> = []
  const rects: unknown[] = []
  // Ask-time pins (MAP-009) use L.marker + L.divIcon. Record each so tests can
  // assert the icon html + precedence ops (setLatLng, bringToFront, zIndex).
  const pins: Array<{
    opts: unknown
    setLatLng: ReturnType<typeof vi.fn>
    bindTooltip: ReturnType<typeof vi.fn>
  }> = []
  const divIcons: Array<{ options: { html?: string } }> = []
  // Capture click handlers registered via DomEvent.on so tests can fire them.
  const domClicks: Array<(e: unknown) => void> = []
  const L = {
    map: vi.fn().mockReturnValue(map),
    geoJSON: vi.fn().mockReturnValue(layer),
    circleMarker: vi.fn(() => {
      const m = {
        setLatLng: vi.fn().mockReturnThis(),
        setStyle: vi.fn().mockReturnThis(),
        bindTooltip: vi.fn().mockReturnThis(),
        setTooltipContent: vi.fn().mockReturnThis(),
        bindPopup: vi.fn().mockReturnThis(),
        closePopup: vi.fn().mockReturnThis(),
      }
      markers.push(m)
      return m
    }),
    marker: vi.fn((_latlng: unknown, opts: unknown) => {
      const m = {
        opts,
        setLatLng: vi.fn().mockReturnThis(),
        bindTooltip: vi.fn().mockReturnThis(),
      }
      pins.push(m)
      return m
    }),
    divIcon: vi.fn((options: { html?: string }) => {
      const icon = { options }
      divIcons.push(icon)
      return icon
    }),
    circle: vi.fn().mockReturnValue(circle),
    layerGroup: vi.fn().mockReturnValue(group),
    rectangle: vi.fn(() => {
      const r = { addTo: vi.fn() }
      rects.push(r)
      return r
    }),
    DomUtil: {
      create: (tag: string, cls?: string, parent?: HTMLElement) => {
        const el = document.createElement(tag)
        if (cls) el.className = cls
        if (parent) parent.appendChild(el)
        return el
      },
    },
    DomEvent: {
      on: (el: unknown, type: string, fn: (e: unknown) => void) => {
        void el
        if (type === 'click') domClicks.push(fn)
      },
      stop: vi.fn(),
    },
  }
  return { L, map, layer, circle, group, markers, rects, pins, divIcons, domClicks }
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
      (c) => (c as unknown as [unknown, { fillColor: string }])[1].fillColor,
    )
    expect(new Set(fills).size).toBe(2) // hider vs seeker color differ
  })

  it('updates existing markers in place instead of rebuilding (MAP-003 perf)', async () => {
    const { rerender } = render(BaseMap, {
      props: {
        leaflet: fake.L as never,
        markers: [{ id: 's1', name: 'Sue', role: 'seeker', pos: { lat: 36.1, lng: -97.0, ts: 1 } }],
      },
    })
    await nextTick()
    expect(fake.L.circleMarker).toHaveBeenCalledTimes(1)
    const created = fake.markers.length

    // A new position batch for the SAME player must move the existing marker,
    // not allocate a new circleMarker (the ~1s hot path).
    await rerender({
      leaflet: fake.L as never,
      markers: [{ id: 's1', name: 'Sue', role: 'seeker', pos: { lat: 36.2, lng: -97.1, ts: 2 } }],
    })
    await nextTick()
    expect(fake.L.circleMarker).toHaveBeenCalledTimes(created) // no new marker
    expect(fake.markers[0]!.setLatLng).toHaveBeenCalledWith([36.2, -97.1])
  })

  it('removes only markers for players who left', async () => {
    const { rerender } = render(BaseMap, {
      props: {
        leaflet: fake.L as never,
        markers: [
          { id: 'a', name: 'A', role: 'seeker', pos: { lat: 1, lng: 1, ts: 1 } },
          { id: 'b', name: 'B', role: 'seeker', pos: { lat: 2, lng: 2, ts: 1 } },
        ],
      },
    })
    await nextTick()
    await rerender({
      leaflet: fake.L as never,
      markers: [{ id: 'a', name: 'A', role: 'seeker', pos: { lat: 1, lng: 1, ts: 2 } }],
    })
    await nextTick()
    // 'b' was removed from the group; 'a' was not re-created.
    expect(fake.group.removeLayer).toHaveBeenCalledTimes(1)
    expect(fake.L.circleMarker).toHaveBeenCalledTimes(2)
  })

  // ── Ask-time position pins (MAP-009) ──

  it('renders a seeker ask-time pin as a distinct teardrop "?" divIcon marker', async () => {
    render(BaseMap, {
      props: {
        leaflet: fake.L as never,
        askedFromMarkers: [{ id: 'q1', lat: 36.12, lng: -97.07, label: 'Radar asked here' }],
      },
    })
    await nextTick()

    // Uses L.marker (not circleMarker) with a divIcon — a distinct silhouette.
    expect(fake.L.marker).toHaveBeenCalledTimes(1)
    expect(fake.L.divIcon).toHaveBeenCalledTimes(1)
    // The icon html carries the "?" glyph and the muted-cyan pin color.
    const html = fake.divIcons[0]!.options.html ?? ''
    expect(html).toContain('>?<')
    expect(html.toLowerCase()).toContain('#4a7f8c')
    // Accessible label bound as a tooltip.
    expect(fake.pins[0]!.bindTooltip).toHaveBeenCalledWith('Radar asked here', expect.anything())
  })

  it('draws the ask-time pin ABOVE the live dot (precedence on overlap)', async () => {
    render(BaseMap, {
      props: {
        leaflet: fake.L as never,
        // Same coordinates: the seeker has not moved since asking.
        markers: [
          { id: 's1', name: 'Sue', role: 'seeker', pos: { lat: 36.12, lng: -97.07, ts: 1 } },
        ],
        askedFromMarkers: [{ id: 'q1', lat: 36.12, lng: -97.07, label: 'asked here' }],
      },
    })
    await nextTick()

    // The ask-time pin is an L.marker (marker pane, above the overlay pane that
    // holds the live circleMarker dot) with a high zIndexOffset — so an
    // overlapping pin is never hidden by the current-position dot.
    expect(fake.pins).toHaveLength(1)
    expect((fake.pins[0]!.opts as { zIndexOffset?: number }).zIndexOffset).toBeGreaterThan(0)
  })

  it('does not render an ask-time pin when there are none', async () => {
    render(BaseMap, { props: { leaflet: fake.L as never } })
    await nextTick()
    expect(fake.L.marker).not.toHaveBeenCalled()
  })

  it('removes an ask-time pin when its question is no longer active', async () => {
    const { rerender } = render(BaseMap, {
      props: {
        leaflet: fake.L as never,
        askedFromMarkers: [{ id: 'q1', lat: 1, lng: 1 }],
      },
    })
    await nextTick()
    await rerender({ leaflet: fake.L as never, askedFromMarkers: [] })
    await nextTick()
    // The single pin was removed from its group; L.marker not re-created.
    expect(fake.group.removeLayer).toHaveBeenCalled()
    expect(fake.L.marker).toHaveBeenCalledTimes(1)
  })

  it('adds only new shading rectangles on a union update (MAP-005 perf)', async () => {
    const { rerender } = render(BaseMap, {
      props: { leaflet: fake.L as never, shadedCells: ['9yd8s', '9yd8t'] },
    })
    await nextTick()
    expect(fake.L.rectangle).toHaveBeenCalledTimes(2)

    // A broadcast adds one new cell; only the new cell gets a rectangle.
    await rerender({ leaflet: fake.L as never, shadedCells: ['9yd8s', '9yd8t', '9yd8w'] })
    await nextTick()
    expect(fake.L.rectangle).toHaveBeenCalledTimes(3) // +1, not +3
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

  it('draws pickable bus stops as an interactive layer (MAP-007)', async () => {
    render(BaseMap, {
      props: {
        leaflet: fake.L as never,
        busStops: [
          { lat: 36.12, lng: -97.07, name: 'Union' },
          { lat: 36.13, lng: -97.08, name: 'Library' },
        ],
        stopsPickable: true,
      },
    })
    await nextTick()
    // One circleMarker per stop, each with a bound popup (pick button).
    expect(fake.markers).toHaveLength(2)
    expect(fake.markers[0]!.bindPopup).toHaveBeenCalled()
    expect(fake.markers[1]!.bindPopup).toHaveBeenCalled()
  })

  it('highlights in-range stops with a distinct style (MAP-007)', async () => {
    render(BaseMap, {
      props: {
        leaflet: fake.L as never,
        busStops: [
          { lat: 36.12, lng: -97.07, name: 'Union' },
          { lat: 36.13, lng: -97.08, name: 'Library' },
        ],
        inRangeStopIndices: [0],
      },
    })
    await nextTick()
    const fills = fake.L.circleMarker.mock.calls.map(
      (c) => (c as unknown as [unknown, { fillColor: string; radius: number; weight: number }])[1],
    )
    // In-range stop (index 0) is distinguished by SIZE + a bolder outline, not
    // color: it stays white (like all bus stops) so it isn't misread as a blue
    // GPS pin or an orange school marker (MAP-007).
    expect(fills[0]!.radius).toBeGreaterThan(fills[1]!.radius)
    expect(fills[0]!.weight).toBeGreaterThan(fills[1]!.weight)
    expect(fills[0]!.fillColor).toBe('#ffffff')
    expect(fills[1]!.fillColor).toBe('#ffffff')
  })

  it('renders the generic POI dots at full opacity', async () => {
    render(BaseMap, { props: { leaflet: fake.L as never } })
    await nextTick()
    // The POI overlay is the 2nd geoJSON layer; its pointToLayer builds the
    // category-colored circle markers.
    const poiOpts = fake.L.geoJSON.mock.calls[1]![1] as {
      pointToLayer: (f: unknown, latlng: unknown) => unknown
    }
    poiOpts.pointToLayer({ properties: { kind: 'school' } }, [36.1, -97.0])
    const lastCall = fake.L.circleMarker.mock.calls.at(-1) as unknown as [
      unknown,
      { fillColor: string; fillOpacity: number },
    ]
    expect(lastCall[1].fillOpacity).toBeGreaterThan(0.5)
    expect(lastCall[1].fillColor).toBe('#f5b830') // school gold
  })

  it('binds a clickable popup naming each POI', async () => {
    render(BaseMap, { props: { leaflet: fake.L as never } })
    await nextTick()
    const poiOpts = fake.L.geoJSON.mock.calls[1]![1] as {
      onEachFeature: (f: unknown, lyr: unknown) => void
    }
    const lyr = { bindTooltip: vi.fn().mockReturnThis(), bindPopup: vi.fn().mockReturnThis() }
    poiOpts.onEachFeature({ properties: { kind: 'restaurant', name: "Eskimo Joe's" } }, lyr)
    expect(lyr.bindPopup).toHaveBeenCalledWith("Eskimo Joe's · Restaurant")
  })

  it('emits pickStop when a stop popup button is clicked (MAP-007)', async () => {
    const { emitted } = render(BaseMap, {
      props: {
        leaflet: fake.L as never,
        busStops: [{ lat: 36.12, lng: -97.07, name: 'Union' }],
        stopsPickable: true,
      },
    })
    await nextTick()
    // Fire the captured DomEvent click handler for the pick button.
    expect(fake.domClicks).toHaveLength(1)
    fake.domClicks[0]!({ type: 'click' })
    expect(emitted().pickStop).toBeTruthy()
    const [stop, index] = emitted().pickStop![0] as [{ name: string }, number]
    expect(stop.name).toBe('Union')
    expect(index).toBe(0)
  })

  it('does not bind a pick popup when stops are not pickable (MAP-007)', async () => {
    render(BaseMap, {
      props: {
        leaflet: fake.L as never,
        busStops: [{ lat: 36.12, lng: -97.07, name: 'Union' }],
        stopsPickable: false,
      },
    })
    await nextTick()
    expect(fake.markers[0]!.bindPopup).not.toHaveBeenCalled()
    expect(fake.domClicks).toHaveLength(0)
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
