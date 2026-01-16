<script setup lang="ts">
import { computed } from 'vue'
import { useCardStore, type CardInstance } from '@/stores/cardStore'
import { CardType } from '@/types/card'
import { GameSize } from '@/types/question'
import { getCardTypeColor } from '@/design/colors'

// Props
const props = withDefaults(
  defineProps<{
    gameSize?: GameSize
  }>(),
  {
    gameSize: GameSize.Small,
  },
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
 * Get CSS class for card type (for test selectors and hover states)
 */
function getCardTypeClass(card: CardInstance): string {
  switch (card.type) {
    case CardType.TimeBonus:
      return 'card-time-bonus'
    case CardType.Powerup:
      return 'card-powerup'
    case CardType.Curse:
      return 'card-curse'
    case CardType.TimeTrap:
      return 'card-time-trap'
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
  <div class="card-hand">
    <!-- Hand limit indicator -->
    <div
      data-testid="hand-limit-indicator"
      class="card-hand-limit"
      :class="{ 'card-hand-limit-full': isHandFull }"
    >
      <div class="card-hand-limit-info">
        <svg class="card-hand-limit-icon" viewBox="0 0 24 24" fill="currentColor">
          <path
            d="M21.47 4.35l-1.34-.56v9.03l2.43-5.86c.41-1.02-.06-2.19-1.09-2.61zm-19.5 3.7L6.93 20a2.01 2.01 0 001.81 1.26c.26 0 .53-.05.79-.16l7.37-3.05c.75-.31 1.21-1.05 1.23-1.79.01-.26-.04-.55-.13-.81L13 3.5c-.29-.72-.97-1.17-1.73-1.17-.27 0-.54.05-.79.15L3.11 5.54c-1.03.42-1.51 1.6-1.14 2.51z"
          />
        </svg>
        <span>Cards in Hand</span>
      </div>
      <span class="card-hand-limit-count"> {{ handCount }}/{{ handLimit }} </span>
    </div>

    <!-- Card container -->
    <div data-testid="card-hand-container" class="card-hand-grid">
      <!-- Empty state -->
      <div v-if="cards.length === 0" class="card-hand-empty">
        <svg class="card-hand-empty-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="1.5"
            d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
          />
        </svg>
        <p class="card-hand-empty-text">No cards in hand</p>
        <p class="card-hand-empty-hint">Draw cards from questions</p>
      </div>

      <!-- Card items -->
      <div
        v-for="card in cards"
        :key="card.instanceId"
        :data-testid="`card-${card.instanceId}`"
        class="playing-card"
        :class="getCardTypeClass(card)"
        role="button"
        tabindex="0"
        :aria-label="getAriaLabel(card)"
        @click="handleCardClick(card)"
        @keydown="handleKeyDown($event, card)"
      >
        <!-- Card corner decoration -->
        <div
          class="playing-card-corner"
          :style="{ background: getCardTypeColor(card.type).accent }"
        ></div>

        <!-- Card header -->
        <div class="playing-card-header">
          <span class="playing-card-badge" :class="`playing-card-badge-${card.type}`">
            {{ getCardTypeLabel(card) }}
          </span>

          <!-- Bonus minutes for time bonus cards -->
          <span v-if="getBonusMinutes(card) !== null" class="playing-card-bonus">
            +{{ getBonusMinutes(card) }} min
          </span>
        </div>

        <!-- Card name -->
        <h3 class="playing-card-name">{{ card.name }}</h3>

        <!-- Effect summary -->
        <p class="playing-card-effect">{{ getEffectSummary(card) }}</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.card-hand {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 1rem;
}

/* Hand limit indicator */
.card-hand-limit {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.875rem 1rem;
  background: linear-gradient(135deg, rgba(30, 41, 59, 0.6) 0%, rgba(15, 23, 42, 0.8) 100%);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 10px;
  transition: all 0.3s ease;
}

.card-hand-limit-full {
  background: linear-gradient(135deg, rgba(245, 158, 11, 0.15) 0%, rgba(217, 119, 6, 0.1) 100%);
  border-color: rgba(245, 158, 11, 0.3);
}

.card-hand-limit-info {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: var(--color-ui-text-secondary);
  font-weight: 500;
  font-size: 0.875rem;
}

.card-hand-limit-icon {
  width: 1.25rem;
  height: 1.25rem;
  opacity: 0.7;
}

.card-hand-limit-count {
  font-family: var(--font-display);
  font-size: 1.5rem;
  letter-spacing: 0.05em;
  color: white;
}

.card-hand-limit-full .card-hand-limit-count {
  color: var(--color-brand-gold);
}

/* Card grid */
.card-hand-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  gap: 0.75rem;
}

/* Empty state */
.card-hand-empty {
  grid-column: 1 / -1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem 1rem;
  text-align: center;
}

.card-hand-empty-icon {
  width: 3rem;
  height: 3rem;
  color: var(--color-ui-text-muted);
  margin-bottom: 0.75rem;
}

.card-hand-empty-text {
  color: var(--color-ui-text-secondary);
  font-weight: 500;
  margin-bottom: 0.25rem;
}

.card-hand-empty-hint {
  color: var(--color-ui-text-muted);
  font-size: 0.875rem;
}

/* Playing card */
.playing-card {
  position: relative;
  padding: 1rem;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.97) 0%, rgba(248, 250, 252, 0.95) 100%);
  border-radius: 12px;
  border: 2px solid rgba(0, 0, 0, 0.1);
  box-shadow:
    0 4px 6px rgba(0, 0, 0, 0.08),
    0 2px 4px rgba(0, 0, 0, 0.04),
    inset 0 1px 0 rgba(255, 255, 255, 0.8);
  cursor: pointer;
  transition: all 0.2s ease;
  overflow: hidden;
}

.playing-card:hover {
  transform: translateY(-4px) rotate(-1deg);
  box-shadow:
    0 8px 16px rgba(0, 0, 0, 0.15),
    0 4px 8px rgba(0, 0, 0, 0.08),
    inset 0 1px 0 rgba(255, 255, 255, 0.8);
}

.playing-card:focus {
  outline: none;
  box-shadow:
    0 0 0 3px rgba(0, 170, 255, 0.5),
    0 8px 16px rgba(0, 0, 0, 0.15);
}

.playing-card-corner {
  position: absolute;
  top: 0;
  right: 0;
  width: 2rem;
  height: 2rem;
  clip-path: polygon(100% 0, 0 0, 100% 100%);
  opacity: 0.9;
}

.playing-card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.75rem;
}

.playing-card-badge {
  display: inline-flex;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.625rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.playing-card-badge-time-bonus {
  background: var(--color-card-time-bonus-bg);
  color: var(--color-card-time-bonus-text);
}

.playing-card-badge-powerup {
  background: var(--color-card-powerup-bg);
  color: var(--color-card-powerup-text);
}

.playing-card-badge-curse {
  background: var(--color-card-curse-bg);
  color: var(--color-card-curse-text);
}

.playing-card-badge-time-trap {
  background: var(--color-card-time-trap-bg);
  color: var(--color-card-time-trap-text);
}

.playing-card-bonus {
  font-family: var(--font-display);
  font-size: 1rem;
  color: var(--color-card-time-bonus-accent);
  letter-spacing: 0.02em;
}

.playing-card-name {
  font-weight: 700;
  font-size: 0.9375rem;
  color: #1e293b;
  margin-bottom: 0.375rem;
  line-height: 1.3;
}

.playing-card-effect {
  font-size: 0.75rem;
  color: #64748b;
  line-height: 1.4;
}

/* Card type accents */
.card-time-bonus {
  border-color: var(--color-card-time-bonus-border);
}

.card-powerup {
  border-color: var(--color-card-powerup-border);
}

.card-curse {
  border-color: var(--color-card-curse-border);
}

.card-time-trap {
  border-color: var(--color-card-time-trap-border);
}
</style>
