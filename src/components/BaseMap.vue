<script setup lang="ts">
/**
 * Base map (MAP-001): renders the pre-baked, offline Stillwater base
 * (MAP-000 GeoJSON) with Leaflet. No tile server / API key — the city-limits
 * polygon and roads are drawn as styled vector layers on a brand-navy canvas.
 * Game overlays (markers, zone, shading) draw on top in later MAP stories via
 * the exposed `map` instance.
 */
import { onMounted, onBeforeUnmount, ref, shallowRef, watch } from 'vue'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import baseGeo from '../assets/map/stillwater-base.json'
import poiGeo from '../assets/map/stillwater-poi.json'
import { BRAND_COLORS } from '@/design/colors'
import type { Position, Role, Zone } from '@/services/sync/protocol'
import { geohashBounds } from '@/utils/geohash'
import type { VectorShade } from '@/composables/useVectorShades'

/** A temporary placement pin the seeker drops for a shade tool (MAP-010). */
export interface TempPin {
  lat: number
  lng: number
}

/** Meters per degree latitude (approx); longitude scales by cos(lat). */
const M_PER_DEG_LAT = 111_320

/**
 * Approximate a geodesic circle as a ring of lat/lng points — used for the HOLE
 * in the "outside" mask polygon (the disc itself renders as a smooth L.circle;
 * only the hole needs this approximation). 64 segments is visually round.
 */
function circleRing(
  center: { lat: number; lng: number },
  radiusM: number,
  segments = 64,
): [number, number][] {
  const dLat = radiusM / M_PER_DEG_LAT
  const dLng = radiusM / (M_PER_DEG_LAT * Math.cos((center.lat * Math.PI) / 180))
  const ring: [number, number][] = []
  for (let i = 0; i < segments; i++) {
    const t = (i / segments) * 2 * Math.PI
    ring.push([center.lat + dLat * Math.sin(t), center.lng + dLng * Math.cos(t)])
  }
  return ring
}

/** A live position marker to draw (MAP-003). */
export interface PlayerMarker {
  id: string
  name: string
  role: Role
  pos: Position
  isSelf?: boolean
}

/** A pickable bus stop (MAP-007): the hider taps it to declare the zone. */
export interface BusStop {
  lat: number
  lng: number
  name?: string | null
}

/**
 * A seeker's ask-time position pin (MAP-009): where a seeker was when they asked
 * a question. Shown on the hider's map, distinct from the live seeker dot.
 */
export interface AskedFromMarker {
  /** Stable id (e.g. the question id) for reconciliation. */
  id: string
  lat: number
  lng: number
  /** Tooltip label, e.g. "Radar asked here". */
  label?: string
}

/** Game-data overlay categories (MAP-002) and their legend colors. */
const POI_STYLE: Record<string, { color: string; label: string }> = {
  'bus-stop': { color: '#ffffff', label: 'Bus stop' },
  restaurant: { color: '#f07d2e', label: 'Restaurant' },
  school: { color: '#f5b830', label: 'School' },
  park: { color: '#2d8a4e', label: 'Park' },
}
const LEGEND = Object.entries(POI_STYLE).map(([kind, s]) => ({ kind, ...s }))

const props = withDefaults(
  defineProps<{
    /** Inject a Leaflet-like factory for tests. Defaults to real Leaflet. */
    leaflet?: typeof L
    /** Hiding zone to draw (MAP-004). Null = no zone. */
    zone?: Zone | null
    /** When true, the zone circle renders in a breached (red) style (MAP-006). */
    breached?: boolean
    /** Live player position markers to draw (MAP-003). */
    markers?: PlayerMarker[]
    /** Ruled-out geohash cells to shade (MAP-005). */
    shadedCells?: string[]
    /**
     * Bus stops the hider can tap to declare the zone (MAP-007). When provided,
     * they render as an interactive layer (name popup + pick button) instead of
     * the generic POI dots. Indices into this array that are in end-game range
     * of the hider are highlighted via `inRangeStopIndices`.
     */
    busStops?: BusStop[]
    /** Indices of `busStops` within end-game range of the hider (MAP-007). */
    inRangeStopIndices?: number[]
    /** When true, tapping a bus stop opens a popup with a pick button (hider). */
    stopsPickable?: boolean
    /**
     * Seeker ask-time position pins (MAP-009), shown to the hider. Rendered as a
     * distinct teardrop "?" pin, above the live position dots.
     */
    askedFromMarkers?: AskedFromMarker[]
    /**
     * Vector shades to render (MAP-010/011): smooth circle/half-plane regions a
     * seeker has committed. Coexists with the geohash `shadedCells`.
     */
    vectorShades?: VectorShade[]
    /**
     * When true, tapping the map drops/moves a temporary placement pin for a
     * shade tool (MAP-010). `maxPins` bounds how many (1 for radius, 2 for line).
     * The current pins are surfaced via `tempPinsChange`.
     */
    placementMode?: boolean
    /** Max temp pins to keep while placing (radius=1, line=2). */
    maxPins?: number
  }>(),
  {
    zone: null,
    breached: false,
    markers: () => [],
    shadedCells: () => [],
    busStops: () => [],
    inRangeStopIndices: () => [],
    stopsPickable: false,
    askedFromMarkers: () => [],
    vectorShades: () => [],
    placementMode: false,
    maxPins: 1,
  },
)

const emit = defineEmits<{
  ready: [map: L.Map]
  /** The hider tapped a bus stop's pick button (MAP-007). */
  pickStop: [stop: BusStop, index: number]
  /** The temporary placement pins changed (dropped/moved/cleared) — MAP-010. */
  tempPinsChange: [pins: TempPin[]]
}>()

const container = ref<HTMLElement | null>(null)
const mapInstance = shallowRef<L.Map | null>(null)

// Stillwater, OK center + sane zoom for a single small town.
const STILLWATER_CENTER: [number, number] = [36.1156, -97.0584]
const DEFAULT_ZOOM = 13

function styleFor(feature?: GeoJSON.Feature) {
  const kind = feature?.properties?.kind
  if (kind === 'city-limits') {
    return {
      color: BRAND_COLORS.cyan,
      weight: 2,
      dashArray: '6 5',
      fill: true,
      fillColor: BRAND_COLORS.navy,
      fillOpacity: 0.15,
    }
  }
  // roads
  return { color: '#3a4a63', weight: 2, opacity: 0.9 }
}

onMounted(() => {
  if (!container.value) return
  const leaflet = props.leaflet ?? L

  const map = leaflet.map(container.value, {
    center: STILLWATER_CENTER,
    zoom: DEFAULT_ZOOM,
    // Offline base — no tile layer. Disable attribution control clutter.
    attributionControl: false,
    zoomControl: true,
  })

  const layer = leaflet.geoJSON(baseGeo as unknown as GeoJSON.GeoJsonObject, {
    style: styleFor,
  })
  layer.addTo(map)

  // Game-data overlay (MAP-002): POIs as category-colored markers. When the
  // interactive bus-stop layer is in use (MAP-007), skip bus stops here so they
  // aren't drawn twice.
  const skipBusStops = props.busStops.length > 0
  const poiLayer = leaflet.geoJSON(poiGeo as unknown as GeoJSON.GeoJsonObject, {
    filter: (feature) =>
      !(skipBusStops && (feature.properties as { kind?: string })?.kind === 'bus-stop'),
    pointToLayer: (feature, latlng) => {
      const kind = (feature.properties as { kind?: string })?.kind ?? ''
      const style = POI_STYLE[kind] ?? { color: '#94a3b8', label: kind }
      return leaflet.circleMarker(latlng, {
        radius: kind === 'bus-stop' ? 4 : 5,
        color: '#0f172a',
        weight: 1,
        fillColor: style.color,
        fillOpacity: 0.9,
      })
    },
    onEachFeature: (feature, lyr) => {
      const p = feature.properties as { kind?: string; name?: string }
      const kindLabel = POI_STYLE[p?.kind ?? '']?.label ?? p?.kind ?? ''
      const name = p?.name ?? kindLabel
      // Hover tooltip on desktop; tap-to-open popup on touch devices (no hover).
      if (name) lyr.bindTooltip(String(name))
      // Popup names the POI (and its category) so a tap on mobile identifies it.
      const popup =
        p?.name && kindLabel && p.name !== kindLabel
          ? `${p.name} · ${kindLabel}`
          : String(name || kindLabel)
      if (popup) lyr.bindPopup(popup)
    },
  })
  poiLayer.addTo(map)

  // Fit to the city limits so the whole town is in view.
  try {
    map.fitBounds(layer.getBounds(), { padding: [16, 16] })
  } catch {
    // getBounds can throw if empty; keep the default center/zoom.
  }

  mapInstance.value = map
  drawShading()
  drawZone()
  drawBusStops()
  drawMarkers()
  drawAskedFrom()
  drawVectorShades()

  // Temp-pin placement (MAP-010): while placing, a map tap drops a pin (or moves
  // the pin once maxPins is reached, dropping the oldest). Ignored otherwise, so
  // the hider's bus-stop taps and normal panning are unaffected.
  map.on('click', (e: L.LeafletMouseEvent) => {
    if (!props.placementMode) return
    dropTempPin(e.latlng.lat, e.latlng.lng)
  })

  emit('ready', map)
})

// ── Interactive bus stops (MAP-007) ──
// The hider taps a stop to declare the zone. Stops within end-game range of the
// hider's GPS are highlighted (larger, cyan) so they don't have to know names.
// Rebuilt whenever the stop set, range set, or pickable flag changes.
let busStopLayer: L.LayerGroup | null = null

function busStopStyle(inRange: boolean): L.CircleMarkerOptions {
  // In-range stops stay WHITE (like every bus stop) but larger with a bold dark
  // outline — size, not color, signals "highlighted". Cyan/blue is reserved for
  // GPS player pins and orange for schools, so neither is used here to avoid the
  // stop being misread as a location/school marker (MAP-007).
  return inRange
    ? { radius: 9, color: '#0f172a', weight: 3, fillColor: '#ffffff', fillOpacity: 1 }
    : { radius: 4, color: '#0f172a', weight: 1, fillColor: '#ffffff', fillOpacity: 0.9 }
}

function drawBusStops() {
  const map = mapInstance.value
  if (!map) return
  const leaflet = props.leaflet ?? L

  if (busStopLayer) {
    busStopLayer.remove()
    busStopLayer = null
  }
  if (props.busStops.length === 0) return

  busStopLayer = leaflet.layerGroup()
  const inRange = new Set(props.inRangeStopIndices)

  props.busStops.forEach((stop, i) => {
    const isInRange = inRange.has(i)
    const marker = leaflet.circleMarker([stop.lat, stop.lng], busStopStyle(isInRange))
    const name = stop.name ?? `Bus stop ${i + 1}`
    marker.bindTooltip(isInRange ? `${name} (in range)` : name)

    if (props.stopsPickable) {
      // Popup: name + a labeled button to declare this stop as the hiding zone.
      const el = leaflet.DomUtil.create('div', 'busstop-popup')
      const title = leaflet.DomUtil.create('div', 'busstop-popup-name', el)
      title.textContent = name
      if (isInRange) {
        const badge = leaflet.DomUtil.create('div', 'busstop-popup-badge', el)
        badge.textContent = '✓ In end-game range of you'
      }
      const btn = leaflet.DomUtil.create('button', 'busstop-popup-btn', el)
      btn.setAttribute('type', 'button')
      btn.textContent = 'Set as my hiding zone'
      leaflet.DomEvent.on(btn, 'click', (e) => {
        leaflet.DomEvent.stop(e)
        emit('pickStop', stop, i)
        marker.closePopup()
      })
      marker.bindPopup(el)
    }

    busStopLayer!.addLayer(marker)
  })
  busStopLayer.addTo(map)
}

watch(
  () => [props.busStops, props.inRangeStopIndices, props.stopsPickable],
  () => drawBusStops(),
  { deep: true },
)

// ── Ruled-out shading (MAP-005): one rectangle per geohash cell ──
// Incrementally reconciled: a `ruledout` broadcast carries the full unioned set,
// so we add rectangles only for newly-shaded cells and remove those no longer
// present (local undo) — never rebuild the whole layer (MAP-005 perf).
let shadeLayer: L.LayerGroup | null = null
const shadeRectsByCell = new Map<string, L.Rectangle>()

function drawShading() {
  const map = mapInstance.value
  if (!map) return
  const leaflet = props.leaflet ?? L

  if (!shadeLayer) {
    shadeLayer = leaflet.layerGroup()
    shadeLayer.addTo(map)
  }

  const next = new Set(props.shadedCells)
  // Remove rectangles for cells that are no longer shaded.
  for (const [cell, rect] of shadeRectsByCell) {
    if (!next.has(cell)) {
      shadeLayer.removeLayer(rect)
      shadeRectsByCell.delete(cell)
    }
  }
  // Add rectangles only for cells we aren't already drawing.
  for (const cell of next) {
    if (shadeRectsByCell.has(cell)) continue
    const b = geohashBounds(cell)
    const rect = leaflet.rectangle(
      [
        [b.south, b.west],
        [b.north, b.east],
      ],
      { color: '#64748b', weight: 0, fillColor: '#475569', fillOpacity: 0.4 },
    )
    shadeLayer.addLayer(rect)
    shadeRectsByCell.set(cell, rect)
  }
}

// Identity change is enough — `shadedCells` is a fresh array on each update;
// no deep walk needed (it would scan every cell just to detect the change).
watch(() => props.shadedCells, drawShading)

// ── Hiding zone circle (MAP-004 / MAP-006) ──
let zoneCircle: L.Circle | null = null

function drawZone() {
  const map = mapInstance.value
  if (!map) return
  const leaflet = props.leaflet ?? L

  if (zoneCircle) {
    zoneCircle.remove()
    zoneCircle = null
  }
  if (!props.zone) return

  const breached = props.breached
  zoneCircle = leaflet.circle([props.zone.lat, props.zone.lng], {
    radius: props.zone.radiusM,
    color: BRAND_COLORS.red,
    weight: breached ? 3 : 2,
    fillColor: BRAND_COLORS.red,
    fillOpacity: breached ? 0.25 : 0.12,
    className: breached ? 'zone-breached' : 'zone-normal',
  })
  zoneCircle.addTo(map)
}

watch(
  () => [props.zone, props.breached],
  () => drawZone(),
  { deep: true },
)

// ── Live position markers (MAP-003) ──
// Position batches arrive ~1/s; reconcile in place (move existing markers via
// setLatLng, add new, remove gone) rather than rebuilding the whole group every
// tick (MAP-003 perf).
let markerLayer: L.LayerGroup | null = null
const markersById = new Map<string, { marker: L.CircleMarker; entry: PlayerMarker }>()

// Player pins are both shades of BLUE so a "you"/player dot is never confused
// with an orange school/restaurant POI — but the two roles use distinct blues
// so hider and seeker stay tell-apart-able (deep indigo hider vs bright cyan
// seeker).
const HIDER_PIN = '#4f46e5' // indigo
const SEEKER_PIN = BRAND_COLORS.cyan // bright cyan

function markerColor(m: PlayerMarker): string {
  return m.role === 'hider' ? HIDER_PIN : SEEKER_PIN
}

function tooltipFor(m: PlayerMarker): string {
  return m.isSelf ? `${m.name} (you)` : m.name
}

function createMarker(leaflet: typeof L, m: PlayerMarker): L.CircleMarker {
  const marker = leaflet.circleMarker([m.pos.lat, m.pos.lng], {
    radius: m.isSelf ? 9 : 7,
    color: '#ffffff',
    weight: 2,
    fillColor: markerColor(m),
    fillOpacity: 0.95,
  })
  // Text label so markers are identifiable (accessibility).
  marker.bindTooltip(tooltipFor(m), { permanent: false, direction: 'top' })
  return marker
}

function drawMarkers() {
  const map = mapInstance.value
  if (!map) return
  const leaflet = props.leaflet ?? L

  if (!markerLayer) {
    markerLayer = leaflet.layerGroup()
    markerLayer.addTo(map)
  }

  const next = new Map(props.markers.map((m) => [m.id, m]))
  // Remove markers for players no longer present.
  for (const [id, { marker }] of markersById) {
    if (!next.has(id)) {
      markerLayer.removeLayer(marker)
      markersById.delete(id)
    }
  }
  // Add or update the rest.
  for (const m of props.markers) {
    const existing = markersById.get(m.id)
    if (!existing) {
      const marker = createMarker(leaflet, m)
      markerLayer.addLayer(marker)
      markersById.set(m.id, { marker, entry: m })
      continue
    }
    const { marker, entry } = existing
    marker.setLatLng([m.pos.lat, m.pos.lng])
    // Role drives color; update style only when it actually changed.
    if (entry.role !== m.role || entry.isSelf !== m.isSelf) {
      marker.setStyle({ radius: m.isSelf ? 9 : 7, fillColor: markerColor(m) })
    }
    if (entry.name !== m.name || entry.isSelf !== m.isSelf) {
      marker.setTooltipContent(tooltipFor(m))
    }
    existing.entry = m
  }
}

// Identity change suffices — `markers` is rebuilt each batch; a deep watch would
// walk every PlayerMarker each tick just to detect the change.
watch(() => props.markers, drawMarkers)

// ── Ask-time position pins (MAP-009) ──
// Where a seeker was when they asked a question, shown to the hider as a distinct
// teardrop "?" pin so it reads differently from the round live seeker dot (and
// sits ABOVE it when they overlap). Muted cyan ties it to "the seeker, earlier",
// staying clear of the live-seeker bright cyan, POI warm colors, and zone red.
const ASKED_FROM_PIN = '#4a7f8c' // muted/desaturated cyan
let askedFromLayer: L.LayerGroup | null = null
const askedFromById = new Map<string, { marker: L.Marker; entry: AskedFromMarker }>()

/** Build the teardrop-with-"?" divIcon (distinct silhouette from the live dot). */
function askedFromIcon(leaflet: typeof L): L.DivIcon {
  const html =
    `<span class="askedfrom-pin" style="--pin:${ASKED_FROM_PIN}" aria-hidden="true">` +
    `<svg viewBox="0 0 24 32" width="24" height="32">` +
    `<path d="M12 0C5.4 0 0 5.2 0 11.6 0 20.3 12 32 12 32s12-11.7 12-20.4C24 5.2 18.6 0 12 0z" ` +
    `fill="${ASKED_FROM_PIN}" stroke="#ffffff" stroke-width="1.5"/>` +
    `<text x="12" y="16" text-anchor="middle" font-size="13" font-weight="700" fill="#ffffff">?</text>` +
    `</svg></span>`
  return leaflet.divIcon({
    html,
    className: 'askedfrom-pin-icon',
    iconSize: [24, 32],
    iconAnchor: [12, 32], // tip of the teardrop points at the position
  })
}

function drawAskedFrom() {
  const map = mapInstance.value
  if (!map) return
  const leaflet = props.leaflet ?? L

  if (!askedFromLayer) {
    askedFromLayer = leaflet.layerGroup()
    askedFromLayer.addTo(map)
  }

  const next = new Map(props.askedFromMarkers.map((m) => [m.id, m]))
  // Remove pins whose question is no longer active.
  for (const [id, { marker }] of askedFromById) {
    if (!next.has(id)) {
      askedFromLayer.removeLayer(marker)
      askedFromById.delete(id)
    }
  }
  // Add or move the rest.
  for (const m of props.askedFromMarkers) {
    const existing = askedFromById.get(m.id)
    if (!existing) {
      const marker = leaflet.marker([m.lat, m.lng], {
        icon: askedFromIcon(leaflet),
        // Precedence on overlap (MAP-009): an L.marker lives in Leaflet's marker
        // pane, which renders ABOVE the overlay pane holding the live-position
        // circleMarkers — so the ask-time pin already sits on top of the current
        // dot. A high zIndexOffset keeps it above other markers too.
        zIndexOffset: 1000,
      })
      if (m.label) marker.bindTooltip(m.label, { direction: 'top' })
      askedFromLayer.addLayer(marker)
      askedFromById.set(m.id, { marker, entry: m })
      continue
    }
    const { marker, entry } = existing
    marker.setLatLng([m.lat, m.lng])
    if (entry.label !== m.label && m.label) marker.bindTooltip(m.label, { direction: 'top' })
    existing.entry = m
  }
}

watch(() => props.askedFromMarkers, drawAskedFrom)

// ── Temp placement pins (MAP-010) ──
// Draggable markers the seeker drops to anchor a shade (radius center, or line
// start/end). Kept as a small ordered list; committing/clearing happens in
// MapPanel, which reads pins via `tempPinsChange`.
let tempPinLayer: L.LayerGroup | null = null
const tempPins: L.Marker[] = []

function emitTempPins() {
  emit(
    'tempPinsChange',
    tempPins.map((m) => {
      const ll = m.getLatLng()
      return { lat: ll.lat, lng: ll.lng }
    }),
  )
}

function dropTempPin(lat: number, lng: number) {
  const map = mapInstance.value
  if (!map) return
  const leaflet = props.leaflet ?? L
  if (!tempPinLayer) {
    tempPinLayer = leaflet.layerGroup()
    tempPinLayer.addTo(map)
  }
  // At capacity: drop the oldest so a tap re-places rather than piling up.
  while (tempPins.length >= props.maxPins) {
    const old = tempPins.shift()
    if (old) tempPinLayer.removeLayer(old)
  }
  const marker = leaflet.marker([lat, lng], { draggable: true })
  // Dragging a pin updates the committed geometry preview live.
  marker.on?.('drag', emitTempPins)
  marker.on?.('dragend', emitTempPins)
  tempPinLayer.addLayer(marker)
  tempPins.push(marker)
  emitTempPins()
}

/** Remove all temp pins (called when a tool is cancelled/committed). */
function clearTempPins() {
  if (tempPinLayer) for (const m of tempPins) tempPinLayer.removeLayer(m)
  tempPins.length = 0
  emitTempPins()
}

// Leaving placement mode clears the pins so a stale pin can't linger on the map.
watch(
  () => props.placementMode,
  (on) => {
    if (!on) clearTempPins()
  },
)

// ── Vector shades (MAP-010/011): smooth circle / half-plane regions ──
const VECTOR_SHADE_STYLE = {
  color: '#64748b',
  weight: 1,
  fillColor: '#475569',
  fillOpacity: 0.4,
}
// A generous span (deg) for the "outside" mask and (later) half-planes — large
// enough to cover the whole playable area at Stillwater's scale.
const MASK_SPAN_DEG = 2

let vectorShadeLayer: L.LayerGroup | null = null
const vectorShapesById = new Map<string, L.Layer>()

/** Build the Leaflet layer for one vector shade. */
function vectorShapeFor(leaflet: typeof L, shade: VectorShade): L.Layer | null {
  if (shade.kind === 'radius') {
    if (shade.mode === 'inside') {
      // Shade the disc itself — a smooth native circle (accurate circumference).
      return leaflet.circle([shade.center.lat, shade.center.lng], {
        radius: shade.radiusM,
        ...VECTOR_SHADE_STYLE,
      })
    }
    // "outside": shade everything beyond the disc. A big rectangle with the disc
    // punched out as a polygon hole. The circle is approximated as a ring of
    // points for the hole (Leaflet polygons don't take a circular hole directly).
    const outer: [number, number][] = [
      [shade.center.lat - MASK_SPAN_DEG, shade.center.lng - MASK_SPAN_DEG],
      [shade.center.lat - MASK_SPAN_DEG, shade.center.lng + MASK_SPAN_DEG],
      [shade.center.lat + MASK_SPAN_DEG, shade.center.lng + MASK_SPAN_DEG],
      [shade.center.lat + MASK_SPAN_DEG, shade.center.lng - MASK_SPAN_DEG],
    ]
    const hole = circleRing(shade.center, shade.radiusM)
    return leaflet.polygon([outer, hole], VECTOR_SHADE_STYLE)
  }
  // Line half-plane rendering lands in MAP-011.
  return null
}

function drawVectorShades() {
  const map = mapInstance.value
  if (!map) return
  const leaflet = props.leaflet ?? L
  if (!vectorShadeLayer) {
    vectorShadeLayer = leaflet.layerGroup()
    vectorShadeLayer.addTo(map)
  }
  const next = new Map(props.vectorShades.map((s) => [s.id, s]))
  // Remove shapes for shades that are gone (undo/clear).
  for (const [id, layer] of vectorShapesById) {
    if (!next.has(id)) {
      vectorShadeLayer.removeLayer(layer)
      vectorShapesById.delete(id)
    }
  }
  // Add shapes for new shades (existing ones are immutable once committed).
  for (const shade of props.vectorShades) {
    if (vectorShapesById.has(shade.id)) continue
    const shape = vectorShapeFor(leaflet, shade)
    if (shape) {
      vectorShadeLayer.addLayer(shape)
      vectorShapesById.set(shade.id, shape)
    }
  }
}

watch(() => props.vectorShades, drawVectorShades)

defineExpose({ map: mapInstance, clearTempPins })

onBeforeUnmount(() => {
  mapInstance.value?.remove()
  mapInstance.value = null
})
</script>

<template>
  <div class="base-map" role="region" aria-label="Stillwater game map">
    <div ref="container" class="base-map-canvas" data-testid="base-map-canvas"></div>

    <!-- Map legend (MAP-002): text labels for each overlay category. -->
    <ul class="base-map-legend" data-testid="map-legend" aria-label="Map legend">
      <li v-for="item in LEGEND" :key="item.kind" class="base-map-legend-item">
        <span
          class="base-map-legend-dot"
          :style="{ backgroundColor: item.color }"
          aria-hidden="true"
        ></span>
        {{ item.label }}
      </li>
    </ul>

    <!-- Overlay controls / children draw on top (later MAP stories) -->
    <slot :map="mapInstance" />
  </div>
</template>

<style scoped>
.base-map {
  position: relative;
  width: 100%;
  height: 100%;
  min-height: 320px;
  background: var(--color-brand-navy, #1a1a2e);
}
.base-map-canvas {
  position: absolute;
  inset: 0;
}
/* Brand-tint the Leaflet container background (shows around the GeoJSON). */
.base-map :deep(.leaflet-container) {
  background: var(--color-brand-navy, #1a1a2e);
}
/* Larger, readable zoom controls for outdoor / touch use. */
.base-map :deep(.leaflet-control-zoom a) {
  width: 40px;
  height: 40px;
  line-height: 40px;
  font-size: 1.2rem;
}

/* Bus-stop pick popup (MAP-007). Leaflet renders popups outside the scoped
   tree, so target globally. */
:global(.busstop-popup-name) {
  font-weight: 700;
  font-size: 0.9rem;
  margin-bottom: 4px;
}
:global(.busstop-popup-badge) {
  font-size: 0.72rem;
  color: #0369a1;
  margin-bottom: 6px;
}
:global(.busstop-popup-btn) {
  min-height: 40px;
  width: 100%;
  padding: 0 12px;
  border-radius: 8px;
  border: none;
  background: var(--color-brand-cyan, #00aaff);
  color: #06263a;
  font-size: 0.85rem;
  font-weight: 700;
  cursor: pointer;
}
/* Ask-time position pin (MAP-009). Leaflet's default divIcon has a white box
   background; strip it so only the teardrop SVG shows. Rendered outside the
   scoped tree, so target globally. */
:global(.askedfrom-pin-icon) {
  background: transparent;
  border: none;
}
:global(.askedfrom-pin) {
  display: block;
  line-height: 0;
  filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.5));
}
/* Breached hiding-zone circle pulses (MAP-006). Leaflet renders the SVG path
   outside the scoped tree, so target it globally. */
:global(.zone-breached) {
  animation: zone-breach-pulse 1.2s ease-in-out infinite;
}
@keyframes zone-breach-pulse {
  0%,
  100% {
    stroke-opacity: 1;
    fill-opacity: 0.25;
  }
  50% {
    stroke-opacity: 0.4;
    fill-opacity: 0.4;
  }
}

/* Legend with text labels (no icon-only controls). */
.base-map-legend {
  position: absolute;
  left: 10px;
  bottom: 10px;
  z-index: 500;
  margin: 0;
  padding: 8px 10px;
  list-style: none;
  background: rgba(15, 23, 42, 0.85);
  border: 1px solid var(--color-ui-border, #475569);
  border-radius: 8px;
  font-size: 0.72rem;
  color: var(--color-ui-text-primary, #f8fafc);
  backdrop-filter: blur(4px);
}
.base-map-legend-item {
  display: flex;
  align-items: center;
  gap: 6px;
  line-height: 1.6;
}
.base-map-legend-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  border: 1px solid #0f172a;
  flex: none;
}
</style>
