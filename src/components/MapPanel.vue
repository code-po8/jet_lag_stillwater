<script setup lang="ts">
/**
 * Map panel (MAP-004): the BaseMap plus the hiding-zone UI. The hider picks a
 * bus stop to declare a ¼-mile zone (synced via zone.set); everyone sees the
 * declared zone drawn on the map and described in a labeled sheet.
 */
import { computed, onMounted, onBeforeUnmount, ref, watch } from 'vue'
import BaseMap, {
  type PlayerMarker,
  type BusStop,
  type AskedFromMarker,
  type ThermometerVector,
} from './BaseMap.vue'
import { useZone, type BusStopLike } from '@/composables/useZone'
import { useSync } from '@/composables/useSync'
import { useGeolocation } from '@/composables/useGeolocation'
import { useShading } from '@/composables/useShading'
import { useVectorShades, type LatLng } from '@/composables/useVectorShades'
import { useQuestionCurseSync } from '@/composables/useQuestionCurseSync'
import { useGameStore, GamePhase } from '@/stores/gameStore'
import { useQuestionStore } from '@/stores/questionStore'
import { getCategoryById, QuestionCategoryId } from '@/types/question'
import {
  DISTANCE_UNITS,
  DEFAULT_DISTANCE_UNIT,
  toMeters,
  type DistanceUnit,
} from '@/utils/distanceUnits'
import { QUARTER_MILE_M } from '@/services/sync/protocol'
import { distanceMeters } from '@jet-lag-stillwater/shared'
import poiGeo from '../assets/map/stillwater-poi.json'

const { zone, hasZone, setFromBusStop } = useZone()
const sync = useSync()
const geo = useGeolocation()
const gameStore = useGameStore()
const questionStore = useQuestionStore()
const { cells: shadedCells, shadeFreehand, autoShadeRadar, unshadeLocal } = useShading()
const vectorShades = useVectorShades()
const questionSync = useQuestionCurseSync()

const isHider = computed(() => sync.role.value === 'hider')
const isSeeker = computed(() => sync.role.value === 'seeker')

// Ref to BaseMap so tools can drop/clear the temporary placement pins it owns.
const baseMap = ref<InstanceType<typeof BaseMap> | null>(null)

// Manual freehand shading state (seeker tool).
const freehandActive = ref(false)
const undoStack = ref<string[]>([]) // last applied set of cells (for undo)

function toggleFreehand() {
  freehandActive.value = !freehandActive.value
  if (freehandActive.value) {
    radiusActive.value = false // one tool at a time
    lineActive.value = false
    thermoActive.value = false
  }
}

// ── Vector shade tools (MAP-010/011) share temp-pin placement + undo/clear ──
// Ids of vector shades this device committed, for order-independent undo.
const vectorUndo = ref<string[]>([])
// Placement mode / pin capacity depend on the active tool (radius=1, line=2,
// thermometer send=2 — issue #29).
const placementMode = computed(() => radiusActive.value || lineActive.value || thermoActive.value)
const maxPins = computed(() => (lineActive.value || thermoActive.value ? 2 : 1))

/** BaseMap reports the current temp pin(s); route them to the active tool. */
function onTempPins(pins: LatLng[]) {
  if (thermoActive.value) {
    thermoStart.value = pins[0] ?? null
    thermoEnd.value = pins[1] ?? null
  } else if (lineActive.value) {
    lineStart.value = pins[0] ?? null
    lineEnd.value = pins[1] ?? null
  } else {
    radiusPin.value = pins[0] ?? null
  }
}

// ── Radius shader (MAP-010): vector-shade a configurable disc, inside/outside ──
const radiusActive = ref(false)
// Radius as a value + unit (issue #28): default 0.5 miles — a common radar
// distance, and miles is the most common question unit, so a "25 mile radar"
// is a straight entry instead of a hand-conversion to feet.
const radiusValue = ref(0.5)
const radiusUnit = ref<DistanceUnit>(DEFAULT_DISTANCE_UNIT)
const radiusMode = ref<'inside' | 'outside'>('inside')
const radiusPin = ref<LatLng | null>(null) // temp placement pin (center)

function toggleRadiusTool() {
  radiusActive.value = !radiusActive.value
  if (radiusActive.value) {
    freehandActive.value = false
    lineActive.value = false
    thermoActive.value = false
  } else {
    radiusPin.value = null // leaving the tool clears the pending pin
  }
}

const canApplyRadius = computed(() => radiusActive.value && radiusPin.value !== null)

/** Commit the pending disc as a vector shade. */
function applyRadius() {
  if (!radiusPin.value) return
  const meters = toMeters(radiusValue.value, radiusUnit.value)
  const id = vectorShades.addRadiusShade(
    { lat: radiusPin.value.lat, lng: radiusPin.value.lng },
    meters,
    radiusMode.value,
  )
  vectorUndo.value = [...vectorUndo.value, id]
  radiusPin.value = null // ready to place the next one
}

// ── Line (thermometer) shader (MAP-011): shade one side of the perpendicular ──
const lineActive = ref(false)
const lineSide = ref<'toward' | 'away'>('away') // 'away' = colder half (behind start)
const lineStart = ref<LatLng | null>(null)
const lineEnd = ref<LatLng | null>(null)

function toggleLineTool() {
  lineActive.value = !lineActive.value
  if (lineActive.value) {
    freehandActive.value = false
    radiusActive.value = false
    thermoActive.value = false
  } else {
    lineStart.value = null
    lineEnd.value = null
  }
}

// Both pins are needed to define the perpendicular.
const canApplyLine = computed(
  () => lineActive.value && lineStart.value !== null && lineEnd.value !== null,
)

/** Commit the chosen half-plane as a vector shade. */
function applyLine() {
  if (!lineStart.value || !lineEnd.value) return
  const id = vectorShades.addLineShade(
    { lat: lineStart.value.lat, lng: lineStart.value.lng },
    { lat: lineEnd.value.lat, lng: lineEnd.value.lng },
    lineSide.value,
  )
  vectorUndo.value = [...vectorUndo.value, id]
  lineStart.value = null
  lineEnd.value = null
}

// ── Thermometer send-vector tool (issue #29): the seeker places START + END
// pins for a pending thermometer question and sends them to the hider. Distinct
// from the seeker's own line-shading tool (which is a local deduction aid).
const thermoActive = ref(false)
const thermoStart = ref<LatLng | null>(null)
const thermoEnd = ref<LatLng | null>(null)

/** The seeker's pending thermometer question, if any (drives the send panel). */
const pendingThermometer = computed(() => {
  const p = questionStore.pendingQuestion
  return isSeeker.value && p?.categoryId === QuestionCategoryId.Thermometer ? p : null
})

function toggleThermoTool() {
  thermoActive.value = !thermoActive.value
  if (thermoActive.value) {
    freehandActive.value = false
    radiusActive.value = false
    lineActive.value = false
  } else {
    thermoStart.value = null
    thermoEnd.value = null
  }
}

const canSendThermo = computed(
  () => !!pendingThermometer.value && thermoStart.value !== null && thermoEnd.value !== null,
)

/** Send the placed start→end vector to the hider (broadcasts question.vector). */
function sendThermometerVector() {
  const q = pendingThermometer.value
  if (!q || !thermoStart.value || !thermoEnd.value) return
  questionSync.setThermometerVector(
    q.questionId,
    { lat: thermoStart.value.lat, lng: thermoStart.value.lng },
    { lat: thermoEnd.value.lat, lng: thermoEnd.value.lng },
  )
  thermoStart.value = null
  thermoEnd.value = null
  thermoActive.value = false
}

/**
 * Clear the placed start/end pins so the seeker can re-place them before sending
 * (issue #29): recovers from a misplaced tap. Stays in placement mode so a fresh
 * tap drops a new pin immediately.
 */
function clearThermoPins() {
  thermoStart.value = null
  thermoEnd.value = null
  baseMap.value?.clearTempPins()
}

const canClearThermo = computed(() => thermoStart.value !== null || thermoEnd.value !== null)

/** Undo the most recent vector shade this device added. */
function undoVector() {
  const last = vectorUndo.value[vectorUndo.value.length - 1]
  if (!last) return
  vectorShades.removeShade(last)
  vectorUndo.value = vectorUndo.value.slice(0, -1)
}

const canUndoVector = computed(() => vectorUndo.value.length > 0)

/** Clear all vector shades (this device's local set). */
function clearVector() {
  vectorShades.clearShades()
  vectorUndo.value = []
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

// Ask-time position pins (MAP-009): where a seeker was when they asked. Shown to
// the HIDER only — it's the seeker's position (synced via the question relay),
// which is context for answering, not something the seeker needs re-shown. Covers
// the pending question plus any answered questions that carry an ask-time
// position, so the hider keeps the picture of what recent answers were measured
// against. Keyed by question id for stable reconciliation.
const askedFromMarkers = computed<AskedFromMarker[]>(() => {
  if (!isHider.value) return []
  const out: AskedFromMarker[] = []
  const seen = new Set<string>()
  const add = (q: {
    questionId: string
    categoryId: string
    askedFrom?: { lat: number; lng: number }
  }) => {
    if (!q.askedFrom || seen.has(q.questionId)) return
    seen.add(q.questionId)
    const cat = getCategoryById(q.categoryId as never)
    out.push({
      id: q.questionId,
      lat: q.askedFrom.lat,
      lng: q.askedFrom.lng,
      label: cat ? `${cat.name} asked here` : 'Asked here',
    })
  }
  if (questionStore.pendingQuestion) add(questionStore.pendingQuestion)
  for (const q of questionStore.askedQuestions) add(q)
  return out
})

// Thermometer travel vectors (issue #29): the seeker's start→end pins for a
// thermometer question, shown to the HIDER only (it's the seeker's measurement,
// context for judging hotter/colder). Covers the pending question plus any
// answered ones that carry a vector. Keyed by question id for stable
// reconciliation.
const thermometerVectors = computed<ThermometerVector[]>(() => {
  if (!isHider.value) return []
  const out: ThermometerVector[] = []
  const seen = new Set<string>()
  const add = (q: { questionId: string; thermometerVector?: { start: LatLng; end: LatLng } }) => {
    if (!q.thermometerVector || seen.has(q.questionId)) return
    seen.add(q.questionId)
    const question = questionStore.getQuestionById(q.questionId)
    // Prefer the question's distance text (e.g. "0.5 miles") for the label.
    const distance = question?.text.match(/([\d.]+\s*miles?)/i)?.[1]
    out.push({
      id: q.questionId,
      start: q.thermometerVector.start,
      end: q.thermometerVector.end,
      label: distance ? `Thermometer ${distance}` : 'Thermometer',
    })
  }
  if (questionStore.pendingQuestion) add(questionStore.pendingQuestion)
  for (const q of questionStore.askedQuestions) add(q)
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

// GPS status for the "you" dot (MAP-008): surfaces WHY the dot is missing so a
// silent geolocation failure (denied permission, insecure origin, timeout) is
// visible instead of just an absent marker. Null message = healthy/have a fix.
const gpsStatus = computed<string | null>(() => {
  if (geo.ownPosition.value) return null // have a fix — dot is drawn
  if (geo.error.value) return geo.error.value // permission denied / unavailable
  return 'Locating you…' // started, waiting for the first fix
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

    <!-- GPS status (MAP-008): tells the player why their "you" dot is missing,
         rather than failing silently. Hidden once a fix arrives. -->
    <div
      v-if="gpsStatus"
      data-testid="gps-status"
      class="gps-status"
      :class="{ 'gps-status-error': !!geo.error.value }"
      role="status"
      aria-live="polite"
    >
      <span class="gps-status-dot" aria-hidden="true"></span>
      {{ gpsStatus }}
    </div>

    <BaseMap
      ref="baseMap"
      :zone="isSeeker ? null : zone"
      :markers="markers"
      :breached="isBreached"
      :shaded-cells="shadedCells"
      :bus-stops="isHider ? busStops : []"
      :in-range-stop-indices="inRangeStopIndices"
      :stops-pickable="isHider"
      :asked-from-markers="askedFromMarkers"
      :thermometer-vectors="thermometerVectors"
      :vector-shades="vectorShades.shades.value"
      :placement-mode="placementMode"
      :max-pins="maxPins"
      @pick-stop="pickStopFromMap"
      @temp-pins-change="onTempPins"
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
        :class="{ 'shade-btn-active': radiusActive }"
        data-testid="shade-radius-btn"
        :aria-pressed="radiusActive"
        title="Radius shade — drop a pin and shade a circle from a Radar answer"
        @click="toggleRadiusTool"
      >
        ⊙ <span class="shade-btn-label">Radius</span>
      </button>
      <button
        type="button"
        class="shade-btn"
        :class="{ 'shade-btn-active': lineActive }"
        data-testid="shade-line-btn"
        :aria-pressed="lineActive"
        title="Line shade — start + end pins, shade one side (Thermometer hotter/colder)"
        @click="toggleLineTool"
      >
        ⇥ <span class="shade-btn-label">Line</span>
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

    <!-- Radius shader control panel (MAP-010): shown while the tool is active. -->
    <div
      v-if="isSeeker && radiusActive"
      class="radius-panel"
      data-testid="radius-panel"
      role="group"
      aria-label="Radius shade options"
    >
      <p class="radius-panel-hint" data-testid="radius-hint">
        {{
          radiusPin
            ? 'Pin placed. Adjust the radius, then apply.'
            : 'Tap the map to place the center pin.'
        }}
      </p>
      <label class="radius-field">
        <span>Radius</span>
        <div class="radius-field-inputs">
          <input
            v-model.number="radiusValue"
            type="number"
            min="0"
            step="any"
            inputmode="decimal"
            data-testid="radius-input"
            class="radius-input"
            aria-label="Radius value"
          />
          <select
            v-model="radiusUnit"
            data-testid="radius-unit"
            class="radius-unit-select"
            aria-label="Radius unit"
          >
            <option v-for="u in DISTANCE_UNITS" :key="u.id" :value="u.id">{{ u.label }}</option>
          </select>
        </div>
      </label>
      <div class="radius-mode" role="radiogroup" aria-label="Shade inside or outside">
        <button
          type="button"
          class="radius-mode-btn"
          :class="{ 'radius-mode-active': radiusMode === 'inside' }"
          :aria-pressed="radiusMode === 'inside'"
          data-testid="radius-mode-inside"
          title="Shade the disc (Radar miss / not within)"
          @click="radiusMode = 'inside'"
        >
          Inside
        </button>
        <button
          type="button"
          class="radius-mode-btn"
          :class="{ 'radius-mode-active': radiusMode === 'outside' }"
          :aria-pressed="radiusMode === 'outside'"
          data-testid="radius-mode-outside"
          title="Shade everything outside the disc (Radar hit / within)"
          @click="radiusMode = 'outside'"
        >
          Outside
        </button>
      </div>
      <div class="radius-actions">
        <button
          type="button"
          class="radius-apply"
          data-testid="radius-apply-btn"
          :disabled="!canApplyRadius"
          @click="applyRadius"
        >
          Apply
        </button>
        <button
          type="button"
          class="radius-clear"
          data-testid="vector-undo-btn"
          :disabled="!canUndoVector"
          title="Undo the last radius/line shade"
          @click="undoVector"
        >
          Undo
        </button>
        <button
          type="button"
          class="radius-clear"
          data-testid="vector-clear-btn"
          :disabled="!canUndoVector"
          title="Clear all radius/line shades"
          @click="clearVector"
        >
          Clear
        </button>
      </div>
    </div>

    <!-- Line (thermometer) shader control panel (MAP-011). -->
    <div
      v-if="isSeeker && lineActive"
      class="radius-panel"
      data-testid="line-panel"
      role="group"
      aria-label="Line shade options"
    >
      <p class="radius-panel-hint" data-testid="line-hint">
        {{
          !lineStart
            ? 'Tap to place the START pin (where you took the reading).'
            : !lineEnd
              ? 'Tap to place the END pin (the direction you traveled).'
              : 'Pick which side the answer ruled out, then apply.'
        }}
      </p>
      <div class="radius-mode" role="radiogroup" aria-label="Shade which half-plane">
        <button
          type="button"
          class="radius-mode-btn"
          :class="{ 'radius-mode-active': lineSide === 'away' }"
          :aria-pressed="lineSide === 'away'"
          data-testid="line-side-away"
          title="Shade the half BEHIND the start pin (away from travel)"
          @click="lineSide = 'away'"
        >
          Behind start
        </button>
        <button
          type="button"
          class="radius-mode-btn"
          :class="{ 'radius-mode-active': lineSide === 'toward' }"
          :aria-pressed="lineSide === 'toward'"
          data-testid="line-side-toward"
          title="Shade the half TOWARD the end pin (direction of travel)"
          @click="lineSide = 'toward'"
        >
          Toward end
        </button>
      </div>
      <div class="radius-actions">
        <button
          type="button"
          class="radius-apply"
          data-testid="line-apply-btn"
          :disabled="!canApplyLine"
          @click="applyLine"
        >
          Apply
        </button>
        <button
          type="button"
          class="radius-clear"
          data-testid="line-undo-btn"
          :disabled="!canUndoVector"
          title="Undo the last radius/line shade"
          @click="undoVector"
        >
          Undo
        </button>
        <button
          type="button"
          class="radius-clear"
          data-testid="line-clear-btn"
          :disabled="!canUndoVector"
          title="Clear all radius/line shades"
          @click="clearVector"
        >
          Clear
        </button>
      </div>
    </div>

    <!-- Thermometer send-vector panel (issue #29). Shown to the seeker while a
         thermometer question is pending: place start + end pins and send the
         travel vector to the hider. -->
    <div
      v-if="pendingThermometer"
      class="radius-panel"
      data-testid="thermo-panel"
      role="group"
      aria-label="Thermometer travel vector"
    >
      <p class="radius-panel-hint" data-testid="thermo-hint">
        {{
          !thermoActive
            ? 'Send your start + end pins so the hider can judge hotter/colder.'
            : !thermoStart
              ? 'Tap the map to place your START pin (where you began).'
              : !thermoEnd
                ? 'Tap the map to place your END pin (where you traveled to).'
                : 'Both pins placed — drag to adjust, Clear to redo, or send.'
        }}
      </p>
      <div class="radius-actions">
        <button
          type="button"
          class="radius-mode-btn"
          :class="{ 'radius-mode-active': thermoActive }"
          :aria-pressed="thermoActive"
          data-testid="thermo-place-btn"
          title="Place the start and end pins on the map"
          @click="toggleThermoTool"
        >
          {{ thermoActive ? 'Placing…' : 'Place pins' }}
        </button>
        <button
          type="button"
          class="radius-clear"
          data-testid="thermo-clear-btn"
          :disabled="!canClearThermo"
          title="Clear the placed pins and start over"
          @click="clearThermoPins"
        >
          Clear
        </button>
        <button
          type="button"
          class="radius-apply"
          data-testid="thermo-send-btn"
          :disabled="!canSendThermo"
          title="Send the travel vector to the hider"
          @click="sendThermometerVector"
        >
          Send to hider
        </button>
      </div>
    </div>

    <!-- Hiding-zone sheet (labeled). Hider-only: the zone is the hider's secret,
         so a seeker never sees its center/radius (defense-in-depth — the server
         also withholds the zone coords from seekers). -->
    <section v-if="!isSeeker" class="zone-sheet" data-testid="zone-sheet" aria-label="Hiding zone">
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
/* Radius shader control panel (MAP-010). Bottom-right, clear of the toolbar
   (which sits at bottom: 10px) — stacked just above it. Mobile-friendly at
   320px: a compact card. */
.radius-panel {
  position: absolute;
  right: 10px;
  bottom: 210px;
  z-index: 600;
  width: 190px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  background: rgba(15, 23, 42, 0.92);
  border: 1px solid var(--color-ui-border, #475569);
  border-radius: 10px;
  padding: 10px;
  color: var(--color-ui-text-primary, #f8fafc);
  font-size: 0.8rem;
}
.radius-panel-hint {
  margin: 0;
  font-size: 0.72rem;
  line-height: 1.35;
  color: var(--color-ui-text-secondary, #94a3b8);
}
.radius-field {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.radius-field-inputs {
  display: flex;
  gap: 6px;
}
.radius-input {
  flex: 1;
  min-width: 0;
  min-height: 36px;
  border-radius: 6px;
  border: 1px solid var(--color-ui-border, #475569);
  background: var(--color-ui-bg, #0f172a);
  color: inherit;
  padding: 0 8px;
  font-size: 0.85rem;
}
.radius-unit-select {
  min-height: 36px;
  border-radius: 6px;
  border: 1px solid var(--color-ui-border, #475569);
  background: var(--color-ui-bg, #0f172a);
  color: inherit;
  padding: 0 6px;
  font-size: 0.85rem;
}
.radius-mode {
  display: flex;
  gap: 6px;
}
.radius-mode-btn {
  flex: 1;
  min-height: 34px;
  border-radius: 6px;
  border: 1px solid var(--color-ui-border, #475569);
  background: rgba(30, 41, 59, 0.9);
  color: inherit;
  font-size: 0.78rem;
  cursor: pointer;
}
.radius-mode-active {
  border-color: var(--color-brand-cyan, #00aaff);
  box-shadow: 0 0 0 2px rgba(0, 170, 255, 0.35);
}
.radius-actions {
  display: flex;
  gap: 6px;
}
.radius-apply,
.radius-clear {
  flex: 1;
  min-height: 36px;
  border-radius: 6px;
  border: none;
  font-size: 0.78rem;
  font-weight: 600;
  cursor: pointer;
}
.radius-apply {
  background: var(--color-brand-cyan, #00aaff);
  color: #06263a;
}
.radius-clear {
  background: rgba(51, 65, 85, 0.9);
  color: var(--color-ui-text-primary, #f8fafc);
  border: 1px solid var(--color-ui-border, #475569);
}
.radius-apply:disabled,
.radius-clear:disabled {
  opacity: 0.5;
  cursor: not-allowed;
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
/* GPS status pill (MAP-008): top-left, clear of the zone sheet (top-right) and
   the seeker toolbar (bottom). Shown only while there's no fix. */
.gps-status {
  position: absolute;
  left: 10px;
  top: 10px;
  z-index: 650;
  display: flex;
  align-items: center;
  gap: 8px;
  max-width: 220px;
  background: rgba(15, 23, 42, 0.9);
  border: 1px solid var(--color-ui-border, #475569);
  border-radius: 999px;
  padding: 6px 12px;
  color: var(--color-ui-text-primary, #f8fafc);
  font-size: 0.78rem;
  line-height: 1.3;
}
.gps-status-error {
  border-color: #ff8a8a;
  background: rgba(120, 30, 30, 0.92);
}
.gps-status-dot {
  flex: 0 0 auto;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--color-brand-cyan, #00aaff);
  animation: gps-pulse 1.2s ease-in-out infinite;
}
.gps-status-error .gps-status-dot {
  background: #ff8a8a;
  animation: none;
}
@keyframes gps-pulse {
  0%,
  100% {
    opacity: 0.4;
  }
  50% {
    opacity: 1;
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
