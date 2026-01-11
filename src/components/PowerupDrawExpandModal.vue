<script setup lang="ts">
import { computed } from 'vue'
import { type CardInstance } from '@/stores/cardStore'
import { CardType, PowerupType } from '@/types/card'

// Props
const props = defineProps<{
  powerupCard: CardInstance | null
  currentHandLimit: number
}>()

// Events
const emit = defineEmits<{
  confirm: []
  cancel: []
}>()

// Type guard to check if card is a Draw/Expand powerup
function isDrawExpandPowerup(card: CardInstance | null): card is CardInstance & { powerupType: PowerupType } {
  return (
    card !== null &&
    card.type === CardType.Powerup &&
    'powerupType' in card &&
    (card as CardInstance & { powerupType: PowerupType }).powerupType === PowerupType.DrawExpand
  )
}

// Computed properties
const isVisible = computed(() => isDrawExpandPowerup(props.powerupCard))

const newHandLimit = computed(() => props.currentHandLimit + 1)

// Methods
function handleConfirm() {
  emit('confirm')
}

function handleCancel() {
  emit('cancel')
}
</script>

<template>
  <div
    v-if="isVisible"
    data-testid="draw-expand-modal"
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
        {{ powerupCard?.name }}
      </h2>

      <!-- Effect Description -->
      <p class="mb-6 text-slate-300">
        Draw one card from the hider deck and hold one additional card in your hand for the rest of the round.
      </p>

      <!-- Hand Limit Change Display -->
      <div class="mb-6 rounded-lg bg-slate-700/50 p-4">
        <div class="flex items-center justify-between">
          <div class="text-center">
            <div class="text-sm text-slate-400">Current Limit</div>
            <div
              data-testid="current-hand-limit"
              class="text-2xl font-bold text-slate-300"
            >
              {{ currentHandLimit }}
            </div>
          </div>
          <div class="text-2xl text-blue-400">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </div>
          <div class="text-center">
            <div class="text-sm text-slate-400">New Limit</div>
            <div
              data-testid="new-hand-limit"
              class="text-2xl font-bold text-green-400"
            >
              {{ newHandLimit }}
            </div>
          </div>
        </div>
      </div>

      <!-- Summary -->
      <div class="mb-6 rounded-lg bg-blue-900/30 border border-blue-500/30 p-3 text-blue-200 text-sm">
        <ul class="list-disc list-inside space-y-1">
          <li>You will draw <strong>1 card</strong> immediately</li>
          <li>Your hand limit increases from <strong>{{ currentHandLimit }}</strong> to <strong>{{ newHandLimit }}</strong></li>
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
          data-testid="confirm-draw-expand-btn"
          class="min-h-11 flex-1 rounded-lg bg-blue-500 px-4 py-3 font-medium text-white transition-colors hover:bg-blue-400"
          @click="handleConfirm"
        >
          Play Powerup
        </button>
      </div>
    </div>
  </div>
</template>
