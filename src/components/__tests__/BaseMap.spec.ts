import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, cleanup } from '@testing-library/vue'
import { nextTick } from 'vue'
import BaseMap from '../BaseMap.vue'

// A minimal Leaflet stand-in (jsdom can't run real Leaflet rendering).
function fakeLeaflet() {
  // Capture map event handlers (e.g. 'click') so tests can fire a map tap.
  const mapHandlers: Record<string, Array<(e: unknown) => void>> = {}
  const map = {
    addTo: vi.fn(),
    fitBounds: vi.fn(),
    remove: vi.fn(),
    setView: vi.fn(),
    on: vi.fn((type: string, fn: (e: unknown) => void) => {
      ;(mapHandlers[type] ??= []).push(fn)
    }),
  }
  /** Fire a captured map event (e.g. a click at a latlng). */
  function fireMapEvent(type: string, e: unknown) {
    for (const fn of mapHandlers[type] ?? []) fn(e)
  }
  const layer = {
    addTo: vi.fn().mockReturnThis(),
    getBounds: vi.fn().mockReturnValue({ isValid: () => true }),
    setStyle: vi.fn().mockReturnThis(),
  }
  // The hiding-zone circle is a single shared stub; vector-shade circles are
  // recorded separately (see `circles` below) since there can be many.
  const circle = { addTo: vi.fn().mockReturnThis(), remove: vi.fn() }
  const circles: Array<{ latlng: unknown; opts: unknown }> = []
  const polygons: Array<{ latlngs: unknown; opts: unknown }> = []
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
  // Thermometer vector arrows (issue #29): a polyline from start→end pin.
  const polylines: Array<{ latlngs: unknown; opts: unknown }> = []
  // Ask-time pins (MAP-009) use L.marker + L.divIcon. Record each so tests can
  // assert the icon html + precedence ops (setLatLng, bringToFront, zIndex).
  const pins: Array<{
    opts: unknown
    setLatLng: ReturnType<typeof vi.fn>
    bindTooltip: ReturnType<typeof vi.fn>
  }> = []
  const divIcons: Array<{ options: { html?: string } }> = []
  // Draggable temp placement pins (MAP-010): record latlng + captured drag
  // handlers so tests can move a pin and assert tempPinsChange.
  const tempPins: Array<{
    latlng: { lat: number; lng: number }
    opts: { draggable?: boolean }
    handlers: Record<string, Array<() => void>>
  }> = []
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
    marker: vi.fn((latlng: [number, number], opts: { draggable?: boolean; icon?: unknown }) => {
      // Draggable pins are the MAP-010 temp pins; icon'd pins are MAP-009 ask pins.
      if (opts?.draggable) {
        const state = {
          latlng: { lat: latlng[0], lng: latlng[1] },
          opts,
          handlers: {} as Record<string, Array<() => void>>,
        }
        const m = {
          ...state,
          on: vi.fn((type: string, fn: () => void) => {
            ;(state.handlers[type] ??= []).push(fn)
          }),
          getLatLng: () => state.latlng,
        }
        tempPins.push(state)
        return m
      }
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
    circle: vi.fn((latlng: unknown, opts: unknown) => {
      circles.push({ latlng, opts })
      return { ...circle }
    }),
    polygon: vi.fn((latlngs: unknown, opts: unknown) => {
      polygons.push({ latlngs, opts })
      return { addTo: vi.fn().mockReturnThis() }
    }),
    polyline: vi.fn((latlngs: unknown, opts: unknown) => {
      polylines.push({ latlngs, opts })
      return { addTo: vi.fn().mockReturnThis(), setLatLngs: vi.fn().mockReturnThis() }
    }),
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
  return {
    L,
    map,
    layer,
    circle,
    circles,
    polygons,
    polylines,
    group,
    markers,
    rects,
    pins,
    divIcons,
    tempPins,
    domClicks,
    fireMapEvent,
  }
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

  // ── Thermometer travel vector (issue #29) ──

  it('draws a start pin, an end pin, and a connecting arrow line', async () => {
    render(BaseMap, {
      props: {
        leaflet: fake.L as never,
        thermometerVectors: [
          {
            id: 'q1',
            start: { lat: 36.12, lng: -97.07 },
            end: { lat: 36.13, lng: -97.06 },
            label: 'Thermometer',
          },
        ],
      },
    })
    await nextTick()

    // Two labeled pins (start + end) via divIcon markers...
    expect(fake.L.marker).toHaveBeenCalledTimes(2)
    const iconHtml = fake.divIcons.map((d) => (d.options.html ?? '').toUpperCase())
    expect(iconHtml.some((h) => h.includes('>S<'))).toBe(true)
    expect(iconHtml.some((h) => h.includes('>E<'))).toBe(true)
    // ...connected by a travel polyline from start to end, PLUS a short
    // perpendicular divider through the start (the hotter/colder boundary).
    expect(fake.L.polyline).toHaveBeenCalledTimes(2)
    // The travel line runs start→end.
    expect(fake.polylines[0]!.latlngs).toEqual([
      [36.12, -97.07],
      [36.13, -97.06],
    ])
    // The perpendicular divider is a 2-point segment centered on the start pin.
    const divider = fake.polylines[1]!.latlngs as [number, number][]
    expect(divider).toHaveLength(2)
    expect((divider[0]![0] + divider[1]![0]) / 2).toBeCloseTo(36.12, 4)
    expect((divider[0]![1] + divider[1]![1]) / 2).toBeCloseTo(-97.07, 4)
  })

  it('does not draw a thermometer vector when there are none', async () => {
    render(BaseMap, { props: { leaflet: fake.L as never } })
    await nextTick()
    expect(fake.L.polyline).not.toHaveBeenCalled()
  })

  it('removes a thermometer vector when its question is no longer active', async () => {
    const { rerender } = render(BaseMap, {
      props: {
        leaflet: fake.L as never,
        thermometerVectors: [{ id: 'q1', start: { lat: 1, lng: 1 }, end: { lat: 2, lng: 2 } }],
      },
    })
    await nextTick()
    await rerender({ leaflet: fake.L as never, thermometerVectors: [] })
    await nextTick()
    // The vector's layers were removed from its group; not re-created. Two
    // polylines were created (travel line + perpendicular divider).
    expect(fake.group.removeLayer).toHaveBeenCalled()
    expect(fake.L.polyline).toHaveBeenCalledTimes(2)
  })

  // ── Temp-pin placement + vector shades (MAP-010) ──

  it('drops a draggable temp pin on map click while placing, and emits tempPinsChange', async () => {
    const onTempPinsChange = vi.fn()
    render(BaseMap, {
      props: { leaflet: fake.L as never, placementMode: true, maxPins: 1, onTempPinsChange },
    })
    await nextTick()

    fake.fireMapEvent('click', { latlng: { lat: 36.12, lng: -97.07 } })

    expect(fake.tempPins).toHaveLength(1)
    expect(fake.tempPins[0]!.opts.draggable).toBe(true)
    expect(onTempPinsChange).toHaveBeenLastCalledWith([{ lat: 36.12, lng: -97.07 }])
  })

  it('ignores map clicks when not in placement mode', async () => {
    render(BaseMap, { props: { leaflet: fake.L as never, placementMode: false } })
    await nextTick()
    fake.fireMapEvent('click', { latlng: { lat: 1, lng: 1 } })
    expect(fake.tempPins).toHaveLength(0)
  })

  it('at capacity (maxPins=1) a new tap replaces the old pin', async () => {
    render(BaseMap, { props: { leaflet: fake.L as never, placementMode: true, maxPins: 1 } })
    await nextTick()
    fake.fireMapEvent('click', { latlng: { lat: 1, lng: 1 } })
    fake.fireMapEvent('click', { latlng: { lat: 2, lng: 2 } })
    // Both markers were created, but the old one was removed from the group.
    expect(fake.tempPins).toHaveLength(2)
    expect(fake.group.removeLayer).toHaveBeenCalled()
  })

  it('renders an inside radius shade as a smooth L.circle', async () => {
    render(BaseMap, {
      props: {
        leaflet: fake.L as never,
        vectorShades: [
          {
            kind: 'radius',
            id: 'r1',
            center: { lat: 36.12, lng: -97.07 },
            radiusM: 800,
            mode: 'inside',
          },
        ],
      },
    })
    await nextTick()

    expect(fake.circles).toHaveLength(1)
    expect(fake.circles[0]!.latlng).toEqual([36.12, -97.07])
    expect((fake.circles[0]!.opts as { radius: number }).radius).toBe(800)
    // Inside mode does not need the polygon mask.
    expect(fake.polygons).toHaveLength(0)
  })

  it('renders an outside radius shade as a polygon with a circular hole', async () => {
    render(BaseMap, {
      props: {
        leaflet: fake.L as never,
        vectorShades: [
          {
            kind: 'radius',
            id: 'r1',
            center: { lat: 36.12, lng: -97.07 },
            radiusM: 800,
            mode: 'outside',
          },
        ],
      },
    })
    await nextTick()

    expect(fake.polygons).toHaveLength(1)
    // Two rings: the outer mask + the circular hole.
    const rings = fake.polygons[0]!.latlngs as unknown[][]
    expect(rings).toHaveLength(2)
    expect(rings[1]!.length).toBeGreaterThan(16) // hole approximated as a ring
  })

  it('renders a line (thermometer) shade as a half-plane polygon (MAP-011)', async () => {
    render(BaseMap, {
      props: {
        leaflet: fake.L as never,
        vectorShades: [
          {
            kind: 'line',
            id: 'l1',
            start: { lat: 36.12, lng: -97.07 },
            end: { lat: 36.13, lng: -97.07 },
            side: 'toward',
          },
        ],
      },
    })
    await nextTick()

    expect(fake.polygons).toHaveLength(1)
    // A single ring (the half-plane), unlike the outside-radius mask (2 rings).
    const ring = fake.polygons[0]!.latlngs as [number, number][]
    expect(Array.isArray(ring[0])).toBe(true)
    expect(ring.length).toBeGreaterThanOrEqual(3)
  })

  it('does not render a degenerate line shade (start === end)', async () => {
    render(BaseMap, {
      props: {
        leaflet: fake.L as never,
        vectorShades: [
          {
            kind: 'line',
            id: 'l1',
            start: { lat: 36.12, lng: -97.07 },
            end: { lat: 36.12, lng: -97.07 },
            side: 'toward',
          },
        ],
      },
    })
    await nextTick()
    expect(fake.polygons).toHaveLength(0)
  })

  it('removes a vector shade shape when the shade is gone (undo/clear)', async () => {
    const shade = {
      kind: 'radius' as const,
      id: 'r1',
      center: { lat: 1, lng: 1 },
      radiusM: 100,
      mode: 'inside' as const,
    }
    const { rerender } = render(BaseMap, {
      props: { leaflet: fake.L as never, vectorShades: [shade] },
    })
    await nextTick()
    await rerender({ leaflet: fake.L as never, vectorShades: [] })
    await nextTick()
    expect(fake.group.removeLayer).toHaveBeenCalled()
    // Not re-created on removal.
    expect(fake.circles).toHaveLength(1)
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
