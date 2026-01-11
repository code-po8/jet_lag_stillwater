<script setup lang="ts">
import { computed } from 'vue'
import { useCardStore, type CardInstance } from '@/stores/cardStore'
import { CardType } from '@/types/card'
import { GameSize } from '@/types/question'

// Props
const props = withDefaults(
  defineProps<{
    gameSize?: GameSize
  }>(),
  {
    gameSize: GameSize.Small,
  }
)

// Emit event when card is selected
const emit = defineEmits<{
  cardSelect: [card: CardInstance]
}>()

const cardStore = useCardStore()

// Computed properties
const cards = computed(() => cardStore.hand)
const handCount = computed(() => cardStore.handCount)
const handLimit = computed(() => cardStore.handLimit)
const isHandFull = computed(() => cardStore.isHandFull)

/**
 * Get CSS class for card type visual distinction
 */
function getCardTypeClass(card: CardInstance): string {
  switch (card.type) {
    case CardType.TimeBonus:
      return 'card-time-bonus border-green-300 bg-green-50'
    case CardType.Powerup:
      return 'card-powerup border-blue-300 bg-blue-50'
    case CardType.Curse:
      return 'card-curse border-purple-300 bg-purple-50'
    case CardType.TimeTrap:
      return 'card-time-trap border-orange-300 bg-orange-50'
    default:
      return ''
  }
}

/**
 * Get the card type label
 */
function getCardTypeLabel(card: CardInstance): string {
  switch (card.type) {
    case CardType.TimeBonus:
      return 'Time Bonus'
    case CardType.Powerup:
      return 'Powerup'
    case CardType.Curse:
      return 'Curse'
    case CardType.TimeTrap:
      return 'Time Trap'
    default:
      return 'Unknown'
  }
}

/**
 * Get effect summary for display
 */
function getEffectSummary(card: CardInstance): string {
  if (card.type === CardType.TimeBonus) {
    return card.description
  }
  if (card.type === CardType.Powerup || card.type === CardType.Curse) {
    // Return description which contains the effect summary
    return card.description
  }
  return card.description
}

/**
 * Get bonus minutes display for time bonus cards
 */
function getBonusMinutes(card: CardInstance): number | null {
  if (card.type !== CardType.TimeBonus) return null
  const timeBonusCard = card as CardInstance & { bonusMinutes: Record<GameSize, number> }
  return timeBonusCard.bonusMinutes?.[props.gameSize] ?? null
}

/**
 * Get ARIA label for accessibility
 */
function getAriaLabel(card: CardInstance): string {
  const typeLabel = getCardTypeLabel(card)
  const bonusMinutes = getBonusMinutes(card)
  if (bonusMinutes !== null) {
    return `${card.name}, ${typeLabel}, adds ${bonusMinutes} minutes`
  }
  return `${card.name}, ${typeLabel}`
}

/**
 * Handle card click
 */
function handleCardClick(card: CardInstance) {
  emit('cardSelect', card)
}

/**
 * Handle keyboard navigation
 */
function handleKeyDown(event: KeyboardEvent, card: CardInstance) {
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault()
    emit('cardSelect', card)
  }
}
</script>

<template>
  <div class="flex flex-col gap-4">
    <!-- Hand limit indicator -->
    <div
      data-testid="hand-limit-indicator"
      :class="[
        'flex items-center justify-between rounded-lg bg-gray-100 px-4 py-2',
        { 'hand-full bg-amber-100': isHandFull },
      ]"
    >
      <span class="font-medium">Cards in Hand</span>
      <span :class="['text-lg font-bold', { 'text-amber-600': isHandFull }]">
        {{ handCount }}/{{ handLimit }}
      </span>
    </div>

    <!-- Card container -->
    <div
      data-testid="card-hand-container"
      class="grid grid-cols-1 gap-3 overflow-y-auto sm:grid-cols-2 lg:grid-cols-3"
    >
      <!-- Empty state -->
      <div
        v-if="cards.length === 0"
        class="col-span-full flex flex-col items-center justify-center py-12 text-gray-400"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          class="mb-2 h-12 w-12"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
          />
        </svg>
        <p class="text-sm">No cards in hand</p>
      </div>

      <!-- Card items -->
      <div
        v-for="card in cards"
        :key="card.instanceId"
        :data-testid="`card-${card.instanceId}`"
        :class="[
          'cursor-pointer rounded-lg border-2 p-4 shadow-sm transition-all hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500',
          getCardTypeClass(card),
        ]"
        role="button"
        tabindex="0"
        :aria-label="getAriaLabel(card)"
        @click="handleCardClick(card)"
        @keydown="handleKeyDown($event, card)"
      >
        <!-- Card type badge -->
        <div class="mb-2 flex items-center justify-between">
          <span
            :class="[
              'rounded px-2 py-0.5 text-xs font-medium',
              {
                'bg-green-100 text-green-800': card.type === CardType.TimeBonus,
                'bg-blue-100 text-blue-800': card.type === CardType.Powerup,
                'bg-purple-100 text-purple-800': card.type === CardType.Curse,
                'bg-orange-100 text-orange-800': card.type === CardType.TimeTrap,
              },
            ]"
          >
            {{ getCardTypeLabel(card) }}
          </span>

          <!-- Bonus minutes for time bonus cards -->
          <span
            v-if="getBonusMinutes(card) !== null"
            class="font-bold text-green-600"
          >
            +{{ getBonusMinutes(card) }} min
          </span>
        </div>

        <!-- Card name -->
        <h3 class="mb-1 font-semibold">{{ card.name }}</h3>

        <!-- Effect summary -->
        <p class="text-sm text-gray-600">{{ getEffectSummary(card) }}</p>
      </div>
    </div>
  </div>
</template>
