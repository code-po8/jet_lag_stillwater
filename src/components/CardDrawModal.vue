<script setup lang="ts">
/**
 * CardDrawModal Component
 *
 * Handles the "draw X, keep Y" mechanic from the game rules.
 * When a question is answered, the hider draws cards and selects which to keep.
 */

import { ref, computed, watch } from 'vue'
import { useCardStore, type CardInstance } from '@/stores/cardStore'
import { CardType } from '@/types/card'

interface Props {
  drawnCards: CardInstance[]
  keepCount: number
}

const props = defineProps<Props>()

const emit = defineEmits<{
  confirm: [{ keptCards: CardInstance[]; discardedCards: CardInstance[] }]
}>()

const cardStore = useCardStore()

// Track selected card instance IDs
const selectedCardIds = ref<Set<string>>(new Set())

// Whether we're keeping all cards (auto-select mode)
const keepingAll = computed(() => props.keepCount >= props.drawnCards.length)

// How many cards are currently selected
const selectedCount = computed(() => selectedCardIds.value.size)

// Available hand slots
const availableSlots = computed(() => cardStore.availableSlots)

// Warning when kept cards would exceed hand limit
const handLimitExceeded = computed(() => props.keepCount > availableSlots.value)

// How many extra cards need to be discarded from hand
const cardsToDiscardFromHand = computed(() => {
  if (!handLimitExceeded.value) return 0
  return props.keepCount - availableSlots.value
})

// Is confirm button enabled?
const canConfirm = computed(() => selectedCount.value === props.keepCount)

// Auto-select all when keeping all
watch(
  () => props.drawnCards,
  (cards) => {
    if (keepingAll.value && cards.length > 0) {
      selectedCardIds.value = new Set(cards.map((c) => c.instanceId))
    } else {
      selectedCardIds.value = new Set()
    }
  },
  { immediate: true }
)

/**
 * Check if a card is selected
 */
function isSelected(card: CardInstance): boolean {
  return selectedCardIds.value.has(card.instanceId)
}

/**
 * Toggle card selection
 */
function toggleCard(card: CardInstance): void {
  if (keepingAll.value) return // Can't change selection when keeping all

  if (isSelected(card)) {
    selectedCardIds.value.delete(card.instanceId)
    // Trigger reactivity
    selectedCardIds.value = new Set(selectedCardIds.value)
  } else if (selectedCount.value < props.keepCount) {
    selectedCardIds.value.add(card.instanceId)
    // Trigger reactivity
    selectedCardIds.value = new Set(selectedCardIds.value)
  }
  // If already at keepCount and trying to add, do nothing
}

/**
 * Get card type styling class
 */
function getCardTypeClass(card: CardInstance): string {
  switch (card.type) {
    case CardType.TimeBonus:
      return 'border-green-500 bg-green-900/30 time-bonus'
    case CardType.Powerup:
      return 'border-purple-500 bg-purple-900/30 powerup'
    case CardType.Curse:
      return 'border-red-500 bg-red-900/30 curse'
    default:
      return 'border-slate-500 bg-slate-900/30'
  }
}

/**
 * Get card type label
 */
function getCardTypeLabel(card: CardInstance): string {
  switch (card.type) {
    case CardType.TimeBonus:
      return 'Time Bonus'
    case CardType.Powerup:
      return 'Powerup'
    case CardType.Curse:
      return 'Curse'
    default:
      return 'Card'
  }
}

/**
 * Confirm selection and emit event
 */
function handleConfirm(): void {
  const keptCards = props.drawnCards.filter((c) => selectedCardIds.value.has(c.instanceId))
  const discardedCards = props.drawnCards.filter((c) => !selectedCardIds.value.has(c.instanceId))

  emit('confirm', { keptCards, discardedCards })
}
</script>

<template>
  <div
    v-if="drawnCards.length > 0"
    data-testid="card-draw-modal"
    role="dialog"
    aria-modal="true"
    aria-labelledby="card-draw-title"
    class="animate-fade-in fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
  >
    <div class="w-full max-w-lg rounded-lg bg-slate-800 shadow-xl">
      <!-- Header -->
      <div class="border-b border-slate-700 px-6 py-4">
        <h2 id="card-draw-title" class="text-xl font-bold text-white">Cards Drawn!</h2>
        <p class="mt-1 text-sm text-slate-300">
          <template v-if="keepingAll">
            Keeping all cards!
          </template>
          <template v-else>
            Select {{ keepCount }} card{{ keepCount > 1 ? 's' : '' }} to keep
          </template>
        </p>
        <div
          data-testid="selection-counter"
          class="mt-2 inline-block rounded-full bg-slate-700 px-3 py-1 text-sm font-medium"
          :class="canConfirm ? 'text-green-400' : 'text-slate-400'"
        >
          {{ selectedCount }}/{{ keepCount }}
        </div>
      </div>

      <!-- Hand limit warning -->
      <div
        v-if="handLimitExceeded"
        data-testid="hand-limit-warning"
        class="mx-6 mt-4 rounded-lg border border-yellow-500/50 bg-yellow-900/30 p-3 text-sm text-yellow-200"
      >
        <span class="font-medium">Hand limit reached!</span>
        You must discard {{ cardsToDiscardFromHand }} card{{ cardsToDiscardFromHand > 1 ? 's' : '' }} from hand to fit these.
      </div>

      <!-- Cards Container -->
      <div data-testid="drawn-cards-container" class="grid gap-3 p-6 sm:grid-cols-2">
        <div
          v-for="(card, index) in drawnCards"
          :key="card.instanceId"
          :data-testid="`drawn-card-${card.instanceId}`"
          role="checkbox"
          :aria-checked="isSelected(card)"
          :tabindex="keepingAll ? -1 : 0"
          :class="[
            'min-h-[44px] cursor-pointer rounded-lg border-2 p-3 transition-all animate-card-reveal',
            getCardTypeClass(card),
            isSelected(card) ? 'selected ring-2 ring-white ring-offset-2 ring-offset-slate-800' : 'opacity-70 hover:opacity-100',
            keepingAll ? 'cursor-default' : '',
          ]"
          :style="{ animationDelay: `${index * 100}ms` }"
          @click="toggleCard(card)"
          @keydown.enter="toggleCard(card)"
          @keydown.space.prevent="toggleCard(card)"
        >
          <div class="flex items-start justify-between">
            <div>
              <div class="text-xs font-medium uppercase tracking-wide text-slate-400">
                {{ getCardTypeLabel(card) }}
              </div>
              <div class="mt-1 font-semibold text-white">{{ card.name }}</div>
              <div class="mt-1 text-sm text-slate-300">{{ card.description }}</div>
            </div>
            <div
              v-if="isSelected(card)"
              class="flex h-6 w-6 items-center justify-center rounded-full bg-green-500 text-white"
            >
              <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      <!-- Footer -->
      <div class="border-t border-slate-700 px-6 py-4">
        <button
          type="button"
          :disabled="!canConfirm"
          class="min-h-[44px] w-full rounded-lg bg-blue-600 px-4 py-3 font-medium text-white transition-colors disabled:cursor-not-allowed disabled:opacity-50 hover:bg-blue-700"
          @click="handleConfirm"
        >
          Confirm Selection
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.animate-fade-in {
  animation: fadeIn 0.2s ease-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.animate-card-reveal {
  animation: cardReveal 0.3s ease-out forwards;
  opacity: 0;
}

@keyframes cardReveal {
  from {
    opacity: 0;
    transform: translateY(10px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}
</style>
