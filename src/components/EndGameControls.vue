<script setup lang="ts">
import { ref, computed } from 'vue'
import { useGameStore, GamePhase } from '@/stores/gameStore'

const emit = defineEmits<{
  'enter-zone': []
  'hider-found': []
}>()

const gameStore = useGameStore()

// Confirmation dialog state
const showEnterZoneConfirm = ref(false)
const showHiderFoundConfirm = ref(false)

// Computed properties for phase
const isSeeking = computed(() => gameStore.currentPhase === GamePhase.Seeking)
const isEndGame = computed(() => gameStore.currentPhase === GamePhase.EndGame)

// Show/hide buttons based on phase
const showEnterZoneButton = computed(() => isSeeking.value)
const showHiderFoundButton = computed(() => isEndGame.value)
const showAnyButton = computed(() => showEnterZoneButton.value || showHiderFoundButton.value)

/**
 * Handle Enter Hiding Zone button click - show confirmation
 */
function handleEnterZoneClick() {
  showEnterZoneConfirm.value = true
}

/**
 * Confirm entering the hiding zone
 */
function confirmEnterZone() {
  gameStore.enterHidingZone()
  emit('enter-zone')
  showEnterZoneConfirm.value = false
}

/**
 * Cancel entering the hiding zone
 */
function cancelEnterZone() {
  showEnterZoneConfirm.value = false
}

/**
 * Handle Hider Found button click - show confirmation
 */
function handleHiderFoundClick() {
  showHiderFoundConfirm.value = true
}

/**
 * Confirm hider found
 */
function confirmHiderFound() {
  gameStore.hiderFound()
  emit('hider-found')
  showHiderFoundConfirm.value = false
}

/**
 * Cancel hider found
 */
function cancelHiderFound() {
  showHiderFoundConfirm.value = false
}
</script>

<template>
  <div v-if="showAnyButton || isEndGame" class="flex flex-col gap-4">
    <!-- End-game status message -->
    <div
      v-if="isEndGame"
      class="rounded-lg bg-yellow-900/50 p-4 text-center"
    >
      <p class="text-lg font-semibold text-yellow-200">
        In the zone - searching for hider
      </p>
    </div>

    <!-- Enter Hiding Zone Button (visible in seeking phase) -->
    <button
      v-if="showEnterZoneButton && !showEnterZoneConfirm"
      type="button"
      class="min-h-11 rounded-lg bg-amber-600 px-6 py-3 font-semibold text-white transition-colors hover:bg-amber-500"
      aria-label="Enter Hiding Zone"
      @click="handleEnterZoneClick"
    >
      Enter Hiding Zone
    </button>

    <!-- Enter Zone Confirmation Dialog -->
    <div
      v-if="showEnterZoneConfirm"
      class="rounded-lg border border-amber-500/50 bg-amber-900/30 p-4"
    >
      <p class="mb-4 text-center text-amber-200">
        Confirm entering the zone? This means seekers have found the hider's general area and are searching on foot.
      </p>
      <div class="flex gap-2">
        <button
          type="button"
          class="min-h-11 flex-1 rounded-lg bg-slate-600 px-4 py-2 font-medium text-white transition-colors hover:bg-slate-500"
          @click="cancelEnterZone"
        >
          Cancel
        </button>
        <button
          type="button"
          class="min-h-11 flex-1 rounded-lg bg-amber-600 px-4 py-2 font-medium text-white transition-colors hover:bg-amber-500"
          @click="confirmEnterZone"
        >
          Confirm
        </button>
      </div>
    </div>

    <!-- Hider Found Button (visible in end-game phase) -->
    <button
      v-if="showHiderFoundButton && !showHiderFoundConfirm"
      type="button"
      class="min-h-11 rounded-lg bg-green-600 px-6 py-3 font-semibold text-white transition-colors hover:bg-green-500"
      aria-label="Hider Found"
      @click="handleHiderFoundClick"
    >
      Hider Found!
    </button>

    <!-- Hider Found Confirmation Dialog -->
    <div
      v-if="showHiderFoundConfirm"
      class="rounded-lg border border-green-500/50 bg-green-900/30 p-4"
    >
      <p class="mb-4 text-center text-green-200">
        Confirm hider found? This will stop the timer and end the round.
      </p>
      <div class="flex gap-2">
        <button
          type="button"
          class="min-h-11 flex-1 rounded-lg bg-slate-600 px-4 py-2 font-medium text-white transition-colors hover:bg-slate-500"
          @click="cancelHiderFound"
        >
          Cancel
        </button>
        <button
          type="button"
          class="min-h-11 flex-1 rounded-lg bg-green-600 px-4 py-2 font-medium text-white transition-colors hover:bg-green-500"
          @click="confirmHiderFound"
        >
          Confirm
        </button>
      </div>
    </div>
  </div>
</template>
