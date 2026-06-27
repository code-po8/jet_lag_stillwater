<script setup lang="ts">
/**
 * Base map (MAP-001): renders the pre-baked, offline Stillwater base
 * (MAP-000 GeoJSON) with Leaflet. No tile server / API key — the city-limits
 * polygon and roads are drawn as styled vector layers on a brand-navy canvas.
 * Game overlays (markers, zone, shading) draw on top in later MAP stories via
 * the exposed `map` instance.
 */
import { onMounted, onBeforeUnmount, ref, shallowRef } from 'vue'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import baseGeo from '../assets/map/stillwater-base.json'
import poiGeo from '../assets/map/stillwater-poi.json'
import { BRAND_COLORS } from '@/design/colors'

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
  }>(),
  {},
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
  emit('ready', map)
})

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
