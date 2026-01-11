<script setup lang="ts">
import { computed, ref } from 'vue'
import { type CardInstance } from '@/stores/cardStore'
import { CardType, PowerupType } from '@/types/card'
import { GameSize } from '@/types/question'

// Props
const props = defineProps<{
  powerupCard: CardInstance | null
  selectableCards: CardInstance[]
}>()

// Events
const emit = defineEmits<{
  confirm: [selectedCards: CardInstance[]]
  cancel: []
}>()

// State
const selectedCardIds = ref<Set<string>>(new Set())

// Type guard to check if card is a powerup with powerupType
function isPowerupCard(card: CardInstance | null): card is CardInstance & { powerupType: PowerupType } {
  return card !== null && card.type === CardType.Powerup && 'powerupType' in card
}

// Computed properties
const isVisible = computed(() => props.powerupCard !== null)

const discardCount = computed(() => {
  if (!isPowerupCard(props.powerupCard)) return 0
  if (props.powerupCard.powerupType === PowerupType.Discard1Draw2) return 1
  if (props.powerupCard.powerupType === PowerupType.Discard2Draw3) return 2
  return 0
})

const drawCount = computed(() => {
  if (!isPowerupCard(props.powerupCard)) return 0
  if (props.powerupCard.powerupType === PowerupType.Discard1Draw2) return 2
  if (props.powerupCard.powerupType === PowerupType.Discard2Draw3) return 3
  return 0
})

const hasEnoughCards = computed(() => {
  return props.selectableCards.length >= discardCount.value
})

const canConfirm = computed(() => {
  return selectedCardIds.value.size === discardCount.value && hasEnoughCards.value
})

const selectionCounter = computed(() => {
  return `${selectedCardIds.value.size}/${discardCount.value}`
})

// Methods
function isSelected(card: CardInstance): boolean {
  return selectedCardIds.value.has(card.instanceId)
}

function toggleSelection(card: CardInstance) {
  if (isSelected(card)) {
    selectedCardIds.value.delete(card.instanceId)
  } else if (selectedCardIds.value.size < discardCount.value) {
    selectedCardIds.value.add(card.instanceId)
  }
}

function handleConfirm() {
  const selectedCards = props.selectableCards.filter(card =>
    selectedCardIds.value.has(card.instanceId)
  )
  emit('confirm', selectedCards)
  selectedCardIds.value.clear()
}

function handleCancel() {
  selectedCardIds.value.clear()
  emit('cancel')
}

function getCardTypeClass(card: CardInstance): string {
  switch (card.type) {
    case CardType.TimeBonus:
      return 'border-green-400 bg-green-900/30'
    case CardType.Powerup:
      return 'border-blue-400 bg-blue-900/30'
    case CardType.Curse:
      return 'border-purple-400 bg-purple-900/30'
    default:
      return 'border-gray-400 bg-gray-900/30'
  }
}

function getCardTypeLabel(card: CardInstance): string {
  switch (card.type) {
    case CardType.TimeBonus:
      return 'Time Bonus'
    case CardType.Powerup:
      return 'Powerup'
    case CardType.Curse:
      return 'Curse'
    default:
      return 'Unknown'
  }
}

function getBonusMinutes(card: CardInstance): number | null {
  if (card.type !== CardType.TimeBonus) return null
  const timeBonusCard = card as CardInstance & { bonusMinutes: Record<GameSize, number> }
  return timeBonusCard.bonusMinutes?.[GameSize.Small] ?? null
}
</script>

<template>
  <div
    v-if="isVisible"
    data-testid="discard-draw-modal"
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

      <!-- Instructions -->
      <p class="mb-4 text-slate-300">
        Select {{ discardCount }} card{{ discardCount > 1 ? 's' : '' }} to discard, then draw {{ drawCount }}.
      </p>

      <!-- Selection Counter -->
      <div
        data-testid="selection-counter"
        class="mb-4 text-center text-lg font-semibold text-amber-400"
      >
        Selected: {{ selectionCounter }}
      </div>

      <!-- Not enough cards warning -->
      <div
        v-if="!hasEnoughCards"
        data-testid="not-enough-cards-warning"
        class="mb-4 rounded-lg bg-red-900/50 p-3 text-red-200"
      >
        Not enough cards to play this powerup. You need at least {{ discardCount }} other card{{ discardCount > 1 ? 's' : '' }}.
      </div>

      <!-- Selectable Cards -->
      <div class="mb-6 max-h-64 space-y-2 overflow-y-auto">
        <div
          v-for="card in selectableCards"
          :key="card.instanceId"
          :data-testid="`selectable-card-${card.instanceId}`"
          role="checkbox"
          :aria-checked="isSelected(card)"
          :aria-label="`${card.name}, ${getCardTypeLabel(card)}`"
          tabindex="0"
          :class="[
            'min-h-11 cursor-pointer rounded-lg border-2 p-3 transition-all',
            getCardTypeClass(card),
            isSelected(card)
              ? 'selected ring-2 ring-amber-400 ring-offset-2 ring-offset-slate-800'
              : 'hover:border-slate-400',
          ]"
          @click="toggleSelection(card)"
          @keydown.enter.prevent="toggleSelection(card)"
          @keydown.space.prevent="toggleSelection(card)"
        >
          <div class="flex items-center justify-between">
            <div>
              <span class="font-medium text-white">{{ card.name }}</span>
              <span class="ml-2 text-xs text-slate-400">{{ getCardTypeLabel(card) }}</span>
            </div>
            <div v-if="getBonusMinutes(card) !== null" class="text-green-400 font-semibold">
              +{{ getBonusMinutes(card) }} min
            </div>
            <div v-if="isSelected(card)" class="text-amber-400">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
              </svg>
            </div>
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
          data-testid="confirm-discard-btn"
          :disabled="!canConfirm"
          :class="[
            'min-h-11 flex-1 rounded-lg px-4 py-3 font-medium transition-colors',
            canConfirm
              ? 'bg-amber-500 text-white hover:bg-amber-400'
              : 'cursor-not-allowed bg-slate-700 text-slate-500',
          ]"
          @click="handleConfirm"
        >
          Confirm &amp; Draw {{ drawCount }}
        </button>
      </div>
    </div>
  </div>
</template>
