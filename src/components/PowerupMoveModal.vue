<script setup lang="ts">
import { computed } from 'vue'
import { type CardInstance, type PowerupCardInstance } from '@/stores/cardStore'
import { CardType, PowerupType } from '@/types/card'
import { GameSize } from '@/types/question'

// Props
const props = defineProps<{
  powerupCard: CardInstance | null
  handSize: number
  gameSize: GameSize
}>()

// Events
const emit = defineEmits<{
  confirm: []
  cancel: []
}>()

// Type guard to check if card is a Move powerup
function isMovePowerup(card: CardInstance | null): card is PowerupCardInstance {
  return (
    card !== null &&
    card.type === CardType.Powerup &&
    'powerupType' in card &&
    (card as PowerupCardInstance).powerupType === PowerupType.Move
  )
}

// Get the powerup card with correct type
const movePowerup = computed(() => {
  if (isMovePowerup(props.powerupCard)) {
    return props.powerupCard
  }
  return null
})

// Computed properties
const isVisible = computed(() => isMovePowerup(props.powerupCard))

// Number of other cards that will be discarded (total hand size - 1 for the Move card itself)
const discardCount = computed(() => Math.max(0, props.handSize - 1))

// New hiding period duration based on game size
const newHidingPeriodMinutes = computed(() => {
  switch (props.gameSize) {
    case GameSize.Small:
      return 10
    case GameSize.Medium:
      return 20
    case GameSize.Large:
      return 60
    default:
      return 10
  }
})

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
    data-testid="move-modal"
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
        {{ movePowerup?.name }}
      </h2>

      <!-- Effect Description -->
      <p class="mb-4 text-slate-300">
        {{ movePowerup?.effect }}
      </p>

      <!-- Warning Section -->
      <div class="mb-4 rounded-lg bg-amber-900/50 p-3">
        <div class="flex items-start gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 flex-shrink-0 text-amber-400" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
          </svg>
          <div>
            <p class="font-medium text-amber-200">This will discard your entire hand!</p>
            <p data-testid="discard-count" class="text-sm text-amber-300">
              {{ discardCount }} other card{{ discardCount !== 1 ? 's' : '' }} will be discarded.
            </p>
          </div>
        </div>
      </div>

      <!-- New Hiding Period Info -->
      <div class="mb-4 rounded-lg bg-blue-900/50 p-3">
        <div class="flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clip-rule="evenodd" />
          </svg>
          <p class="text-blue-200">
            You will have <span class="font-bold text-blue-100">{{ newHidingPeriodMinutes }} minutes</span> to establish a new hiding zone.
          </p>
        </div>
      </div>

      <!-- Seekers Notification Info -->
      <div class="mb-6 rounded-lg bg-purple-900/50 p-3">
        <div class="flex items-start gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 flex-shrink-0 text-purple-400" viewBox="0 0 20 20" fill="currentColor">
            <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z" />
          </svg>
          <div>
            <p class="text-purple-200">
              Seekers will be notified of your current station location and must stay put/wait until you confirm your new zone.
            </p>
            <p class="mt-1 text-sm text-purple-300">
              Seekers will be frozen and the hiding timer will be paused.
            </p>
          </div>
        </div>
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
          data-testid="confirm-move-btn"
          class="min-h-11 flex-1 rounded-lg bg-amber-500 px-4 py-3 font-medium text-white transition-colors hover:bg-amber-400"
          @click="handleConfirm"
        >
          Play Move
        </button>
      </div>
    </div>
  </div>
</template>
