<script setup lang="ts">
import { ref, computed } from 'vue'
import { type CardInstance } from '@/stores/cardStore'
import { CardType, type TimeTrapCard } from '@/types/card'

// Props
const props = defineProps<{
  timeTrapCard: CardInstance | null
}>()

// Events
const emit = defineEmits<{
  confirm: [stationName: string]
  cancel: []
}>()

// State
const stationName = ref('')

// Type guard to check if card is a Time Trap
function isTimeTrapCard(card: CardInstance | null): card is CardInstance & TimeTrapCard {
  return card !== null && card.type === CardType.TimeTrap
}

// Computed properties
const isVisible = computed(() => isTimeTrapCard(props.timeTrapCard))

const bonusMinutes = computed(() => {
  if (!isTimeTrapCard(props.timeTrapCard)) return 0
  return props.timeTrapCard.bonusMinutesWhenTriggered
})

const isValidStationName = computed(() => stationName.value.trim().length > 0)

// Methods
function handleConfirm() {
  if (isValidStationName.value) {
    emit('confirm', stationName.value.trim())
    stationName.value = ''
  }
}

function handleCancel() {
  stationName.value = ''
  emit('cancel')
}
</script>

<template>
  <div
    v-if="isVisible"
    data-testid="time-trap-modal"
    role="dialog"
    aria-modal="true"
    aria-labelledby="modal-title"
    class="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
  >
    <div class="w-full max-w-md rounded-lg bg-slate-800 p-6 shadow-xl">
      <!-- Header -->
      <h2
        id="modal-title"
        class="mb-4 text-xl font-bold text-white"
      >
        {{ timeTrapCard?.name }}
      </h2>

      <!-- Description -->
      <p class="mb-4 text-slate-300">
        Designate a transit station as a trap. If seekers visit it, you gain
        <span class="font-bold text-orange-400">{{ bonusMinutes }} minutes</span> of bonus time.
      </p>

      <!-- Public Warning -->
      <div class="mb-4 rounded-lg bg-orange-900/30 border border-orange-500/30 p-3 text-orange-200 text-sm">
        <strong>Note:</strong> This trap is <strong>publicly visible</strong> to seekers. They will see the station name but must decide whether to risk triggering it.
      </div>

      <!-- Station Name Input -->
      <div class="mb-6">
        <label
          for="station-name"
          class="mb-2 block text-sm font-medium text-slate-300"
        >
          Enter the station name to trap:
        </label>
        <input
          id="station-name"
          v-model="stationName"
          data-testid="station-name-input"
          type="text"
          placeholder="e.g., Main Street Station"
          aria-label="Station name"
          class="min-h-11 w-full rounded-lg bg-slate-700 p-3 text-white placeholder-slate-400 border border-slate-600 focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
        />
      </div>

      <!-- Info about triggering -->
      <div class="mb-6 rounded-lg bg-slate-700/50 p-4 text-sm text-slate-300">
        <ul class="list-disc list-inside space-y-1">
          <li>Trap becomes active immediately</li>
          <li>If any seeker visits this station, you gain <strong>{{ bonusMinutes }} minutes</strong></li>
          <li>Traps can be used as misdirection</li>
        </ul>
      </div>

      <!-- Action Buttons -->
      <div class="flex gap-3">
        <button
          data-testid="cancel-btn"
          class="min-h-11 flex-1 rounded-lg bg-slate-600 px-4 py-3 font-medium text-white transition-colors hover:bg-slate-500"
          @click="handleCancel"
        >
          Cancel
        </button>
        <button
          data-testid="confirm-trap-btn"
          :disabled="!isValidStationName"
          class="min-h-11 flex-1 rounded-lg px-4 py-3 font-medium text-white transition-colors"
          :class="isValidStationName
            ? 'bg-orange-500 hover:bg-orange-400'
            : 'bg-slate-500 cursor-not-allowed opacity-50'"
          @click="handleConfirm"
        >
          Set Trap
        </button>
      </div>
    </div>
  </div>
</template>
