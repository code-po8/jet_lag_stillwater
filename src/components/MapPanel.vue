<script setup lang="ts">
/**
 * Map panel (MAP-004): the BaseMap plus the hiding-zone UI. The hider picks a
 * bus stop to declare a ¼-mile zone (synced via zone.set); everyone sees the
 * declared zone drawn on the map and described in a labeled sheet.
 */
import { computed, onMounted, onBeforeUnmount, ref, watch } from 'vue'
import BaseMap, { type PlayerMarker, type BusStop } from './BaseMap.vue'
import { useZone, type BusStopLike } from '@/composables/useZone'
import { useSync } from '@/composables/useSync'
import { useGeolocation } from '@/composables/useGeolocation'
import { useShading } from '@/composables/useShading'
import { useGameStore, GamePhase } from '@/stores/gameStore'
import { QUARTER_MILE_M } from '@/services/sync/protocol'
import { distanceMeters } from '@jet-lag-stillwater/shared'
import poiGeo from '../assets/map/stillwater-poi.json'

const { zone, hasZone, setFromBusStop } = useZone()
const sync = useSync()
const geo = useGeolocation()
const gameStore = useGameStore()
const { cells: shadedCells, shadeFreehand, autoShadeRadar, unshadeLocal } = useShading()

const isHider = computed(() => sync.role.value === 'hider')
const isSeeker = computed(() => sync.role.value === 'seeker')

// Manual freehand shading state (seeker tool).
const freehandActive = ref(false)
const undoStack = ref<string[]>([]) // last applied set of cells (for undo)

function toggleFreehand() {
  freehandActive.value = !freehandActive.value
}

/** Auto-shade from the most recent ¼-mile radar "no" relative to our position. */
function autoShade() {
  const pos = geo.ownPosition.value
  if (!pos) return
  // Track the exact cells added (not a slice of the server-unioned set, whose
  // order/length aren't an append-only log) so undo removes only these.
  undoStack.value = autoShadeRadar({ lat: pos.lat, lng: pos.lng }, 0.5, false)
}

/** Apply a freehand path (called by the map drawing handler). */
function applyFreehand(points: { lat: number; lng: number }[]) {
  undoStack.value = shadeFreehand(points)
}

/** Undo the last shading action (client-local; see STORIES MAP-005). */
function undo() {
  if (undoStack.value.length) {
    unshadeLocal(undoStack.value)
    undoStack.value = []
  }
}
const canUndo = computed(() => undoStack.value.length > 0)

defineExpose({ applyFreehand })

// End-game breach (MAP-006): a seeker entered the hiding zone.
const isBreached = computed(() => sync.breachedSeekers.value.length > 0)

// When the first breach arrives during seeking, advance to end-game.
watch(isBreached, (breached) => {
  if (breached && gameStore.currentPhase === GamePhase.Seeking) {
    gameStore.enterHidingZone()
  }
})

// Build position markers from the synced positions + roster. The server already
// withholds the hider's position from seekers (SYNC-003), so a seeker's
// `positions` map simply won't contain the hider.
const markers = computed<PlayerMarker[]>(() => {
  const out: PlayerMarker[] = []
  const players = sync.players.value
  for (const [playerId, pos] of sync.positions.value) {
    const p = players.find((pl) => pl.id === playerId)
    out.push({
      id: playerId,
      name: p?.name ?? 'Player',
      role: p?.role ?? 'seeker',
      pos,
      isSelf: false,
    })
  }
  // Add own position (from geolocation) if we have it.
  const self = sync.self.value
  if (self && geo.ownPosition.value) {
    out.push({
      id: self.id,
      name: self.name,
      role: self.role,
      pos: geo.ownPosition.value,
      isSelf: true,
    })
  }
  return out
})

onMounted(() => geo.start())
onBeforeUnmount(() => geo.stop())

// Bus stops the hider can choose as the zone center.
const busStops = computed<BusStopLike[]>(() =>
  (
    poiGeo.features as Array<{
      properties: { kind: string; name?: string | null }
      geometry: { coordinates: number[] }
    }>
  )
    .filter((f) => f.properties.kind === 'bus-stop')
    .map((f) => ({
      lng: f.geometry.coordinates[0]!,
      lat: f.geometry.coordinates[1]!,
      name: f.properties.name ?? null,
    })),
)

const radiusMiles = computed(() => (zone.value ? (zone.value.radiusM / 1609.34).toFixed(2) : null))

// Indices of bus stops within end-game range (¼ mi) of the hider's current GPS.
// These are highlighted on the map: if declared, the hider stands inside their
// own zone. Empty when we have no fix or aren't the hider.
const inRangeStopIndices = computed<number[]>(() => {
  const pos = geo.ownPosition.value
  if (!pos || !isHider.value) return []
  const out: number[] = []
  busStops.value.forEach((stop, i) => {
    if (distanceMeters(pos.lat, pos.lng, stop.lat, stop.lng) <= QUARTER_MILE_M) out.push(i)
  })
  return out
})

function pickStop(event: Event) {
  const idx = Number((event.target as HTMLSelectElement).value)
  const stop = busStops.value[idx]
  if (stop) setFromBusStop(stop)
}

/** A stop was tapped + confirmed on the map (MAP-007). */
function pickStopFromMap(stop: BusStop) {
  setFromBusStop(stop)
}
</script>

<template>
  <div class="map-panel">
    <!-- End-game breach alert (MAP-006): announced for screen readers. -->
    <div
      v-if="isBreached"
      data-testid="breach-banner"
      class="breach-banner"
      role="alert"
      aria-live="assertive"
    >
      ⚠️ Seekers in your zone — end game triggered!
    </div>

    <BaseMap
      :zone="zone"
      :markers="markers"
      :breached="isBreached"
      :shaded-cells="shadedCells"
      :bus-stops="isHider ? busStops : []"
      :in-range-stop-indices="inRangeStopIndices"
      :stops-pickable="isHider"
      @pick-stop="pickStopFromMap"
    />

    <!-- Seeker shading toolbar (MAP-005): all controls have text labels. -->
    <div
      v-if="isSeeker"
      class="shade-toolbar"
      data-testid="shade-toolbar"
      role="group"
      aria-label="Shading tools"
    >
      <button
        type="button"
        class="shade-btn"
        :class="{ 'shade-btn-active': freehandActive }"
        data-testid="shade-freehand-btn"
        :aria-pressed="freehandActive"
        title="Freehand shade — draw to rule out an area"
        @click="toggleFreehand"
      >
        ✎ <span class="shade-btn-label">Freehand</span>
      </button>
      <button
        type="button"
        class="shade-btn"
        data-testid="shade-auto-btn"
        title="Auto-shade ½-mile disc around me from a Radar 'no'"
        @click="autoShade"
      >
        ◎ <span class="shade-btn-label">Auto-shade</span>
      </button>
      <button
        type="button"
        class="shade-btn"
        data-testid="shade-undo-btn"
        :disabled="!canUndo"
        title="Undo the last shading action"
        @click="undo"
      >
        ↺ <span class="shade-btn-label">Undo</span>
      </button>
    </div>

    <!-- Hiding-zone sheet (labeled) -->
    <section class="zone-sheet" data-testid="zone-sheet" aria-label="Hiding zone">
      <h3 class="zone-sheet-title">Hiding Zone</h3>

      <template v-if="hasZone">
        <p class="zone-sheet-row">
          <span class="zone-sheet-key">Center:</span>
          <span data-testid="zone-center">{{ zone?.label ?? 'Chosen bus stop' }}</span>
        </p>
        <p class="zone-sheet-row">
          <span class="zone-sheet-key">Radius:</span>
          <span data-testid="zone-radius"
            >¼ mi ({{ zone?.radiusM }} m{{ radiusMiles ? `, ${radiusMiles} mi` : '' }})</span
          >
        </p>
      </template>
      <p v-else class="zone-sheet-empty" data-testid="zone-empty">No hiding zone set yet.</p>

      <!-- Hider-only: pick a bus stop to declare the zone. Tapping a stop on the
           map is the primary flow (MAP-007); this dropdown is a fallback. -->
      <div v-if="isHider" class="zone-picker">
        <p class="zone-picker-hint" data-testid="zone-pick-hint">
          Tap a bus stop on the map to set your zone.
          <template v-if="inRangeStopIndices.length">
            {{ inRangeStopIndices.length }} highlighted stop{{
              inRangeStopIndices.length === 1 ? ' is' : 's are'
            }}
            within range of you now.
          </template>
        </p>
        <label class="zone-picker-label" for="zone-stop-select">Or choose by name (bus stop)</label>
        <select
          id="zone-stop-select"
          data-testid="zone-stop-select"
          class="zone-picker-select"
          @change="pickStop"
        >
          <option value="" disabled selected>Choose a bus stop…</option>
          <option v-for="(stop, i) in busStops" :key="i" :value="i">
            {{ stop.name ?? `Bus stop ${i + 1}` }}
          </option>
        </select>
      </div>
    </section>
  </div>
</template>

<style scoped>
.map-panel {
  position: relative;
  width: 100%;
  height: 100%;
}
.shade-toolbar {
  position: absolute;
  right: 10px;
  bottom: 10px;
  z-index: 600;
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.shade-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  min-height: 40px;
  padding: 0 10px;
  border-radius: 8px;
  border: 1px solid var(--color-ui-border, #475569);
  background: rgba(30, 41, 59, 0.92);
  color: var(--color-ui-text-primary, #f8fafc);
  font-size: 0.82rem;
  cursor: pointer;
}
.shade-btn-active {
  border-color: var(--color-brand-cyan, #00aaff);
  box-shadow: 0 0 0 2px rgba(0, 170, 255, 0.35);
}
.shade-btn-label {
  font-weight: 600;
}
.breach-banner {
  position: absolute;
  left: 10px;
  right: 10px;
  top: 10px;
  z-index: 700;
  background: rgba(199, 62, 62, 0.95);
  border: 1px solid #ff8a8a;
  border-radius: 10px;
  padding: 10px 12px;
  color: #fff;
  font-weight: 700;
  font-size: 0.9rem;
  text-align: center;
  animation: breach-pulse 1.1s ease-in-out infinite;
}
@keyframes breach-pulse {
  0%,
  100% {
    box-shadow: 0 0 0 0 rgba(255, 80, 80, 0.6);
  }
  50% {
    box-shadow: 0 0 0 8px rgba(255, 80, 80, 0);
  }
}
.zone-sheet {
  position: absolute;
  right: 10px;
  top: 10px;
  z-index: 600;
  max-width: 240px;
  background: rgba(15, 23, 42, 0.9);
  border: 1px solid var(--color-ui-border, #475569);
  border-radius: 10px;
  padding: 10px 12px;
  color: var(--color-ui-text-primary, #f8fafc);
  font-size: 0.82rem;
  backdrop-filter: blur(4px);
}
.zone-sheet-title {
  margin: 0 0 6px;
  font-size: 0.8rem;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--color-ui-text-secondary, #94a3b8);
}
.zone-sheet-row {
  margin: 2px 0;
  display: flex;
  gap: 6px;
}
.zone-sheet-key {
  color: var(--color-ui-text-secondary, #94a3b8);
}
.zone-sheet-empty {
  margin: 2px 0;
  color: var(--color-ui-text-secondary, #94a3b8);
}
.zone-picker {
  margin-top: 8px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.zone-picker-hint {
  margin: 0;
  font-size: 0.72rem;
  line-height: 1.4;
  color: var(--color-ui-text-secondary, #94a3b8);
}
.zone-picker-label {
  font-size: 0.72rem;
  color: var(--color-ui-text-secondary, #94a3b8);
}
.zone-picker-select {
  min-height: 40px;
  border-radius: 8px;
  border: 1px solid var(--color-ui-border, #475569);
  background: var(--color-ui-bg, #0f172a);
  color: inherit;
  padding: 0 8px;
  font-size: 0.85rem;
}
</style>
