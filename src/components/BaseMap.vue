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

/** A live position marker to draw (MAP-003). */
export interface PlayerMarker {
  id: string
  name: string
  role: Role
  pos: Position
  isSelf?: boolean
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
  }>(),
  { zone: null, breached: false, markers: () => [], shadedCells: () => [] },
)

const emit = defineEmits<{ ready: [map: L.Map] }>()

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

  // Game-data overlay (MAP-002): bus stops + POIs as category-colored markers.
  const poiLayer = leaflet.geoJSON(poiGeo as unknown as GeoJSON.GeoJsonObject, {
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
      const props = feature.properties as { kind?: string; name?: string }
      const label = props?.name ?? POI_STYLE[props?.kind ?? '']?.label ?? props?.kind ?? ''
      if (label) lyr.bindTooltip(String(label))
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
  drawMarkers()
  emit('ready', map)
})

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

function markerColor(m: PlayerMarker): string {
  return m.role === 'hider' ? BRAND_COLORS.orange : BRAND_COLORS.cyan
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

onBeforeUnmount(() => {
  mapInstance.value?.remove()
  mapInstance.value = null
})

defineExpose({ map: mapInstance })
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
