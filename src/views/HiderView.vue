<script setup lang="ts">
import { computed, ref } from 'vue'
import { useGameStore, GamePhase } from '@/stores/gameStore'
import { useCardStore, type CardInstance } from '@/stores/cardStore'
import CardHand from '@/components/CardHand.vue'
import CardDrawModal from '@/components/CardDrawModal.vue'
import PowerupDiscardDrawModal from '@/components/PowerupDiscardDrawModal.vue'
import PowerupDrawExpandModal from '@/components/PowerupDrawExpandModal.vue'
import PowerupDuplicateModal from '@/components/PowerupDuplicateModal.vue'
import PowerupMoveModal from '@/components/PowerupMoveModal.vue'
import HidingPeriodTimer from '@/components/HidingPeriodTimer.vue'
import QuestionResponseTimer from '@/components/QuestionResponseTimer.vue'
import HiderAnswerPrompt from '@/components/HiderAnswerPrompt.vue'
import AddCardModal from '@/components/AddCardModal.vue'
import DevSkipHidingPeriod from '@/components/DevSkipHidingPeriod.vue'
import HiderGuide from '@/components/HiderGuide.vue'
import type { AddCardOptions } from '@/stores/cardStore'
import { GameSize } from '@/types/question'
import { CardType, PowerupType } from '@/types/card'

// Props
const props = defineProps<{
  gameSize?: GameSize
}>()

const gameStore = useGameStore()
const cardStore = useCardStore()

// State for powerup modals
const selectedPowerupCard = ref<CardInstance | null>(null)
const selectedDrawExpandCard = ref<CardInstance | null>(null)
const selectedDuplicateCard = ref<CardInstance | null>(null)
const selectedMoveCard = ref<CardInstance | null>(null)
const drawnCards = ref<CardInstance[]>([])
const keepCount = ref(0)

// State for AddCardModal (PHYS-001)
const isAddCardModalOpen = ref(false)

// State for HiderGuide (GUIDE-001)
const isHiderGuideOpen = ref(false)

// Computed properties
const currentPhase = computed(() => gameStore.currentPhase)
const isHidingPeriod = computed(() => gameStore.currentPhase === GamePhase.HidingPeriod)
const totalTimeBonus = computed(() => cardStore.totalTimeBonus(props.gameSize ?? GameSize.Small))

// Get selectable cards for discard/draw (all cards except the powerup being played)
const selectableCardsForDiscard = computed(() => {
  if (!selectedPowerupCard.value) return []
  return cardStore.hand.filter((card) => card.instanceId !== selectedPowerupCard.value?.instanceId)
})

// Get selectable cards for duplicate (all cards except the duplicate powerup being played)
const selectableCardsForDuplicate = computed(() => {
  if (!selectedDuplicateCard.value) return []
  return cardStore.hand.filter(
    (card) => card.instanceId !== selectedDuplicateCard.value?.instanceId,
  )
})

/**
 * Get display text for the current phase
 */
function getPhaseDisplayText(): string {
  switch (currentPhase.value) {
    case 'hiding-period':
      return 'Hiding Period - Find your spot!'
    case 'seeking':
      return 'Seekers are on the move'
    case 'end-game':
      return 'Seekers in your zone!'
    default:
      return currentPhase.value
  }
}

/**
 * Handle card selection from CardHand
 */
function handleCardSelect(card: CardInstance) {
  // Check if it's a powerup card
  if (card.type === CardType.Powerup && 'powerupType' in card) {
    const powerupType = (card as CardInstance & { powerupType: PowerupType }).powerupType

    // Handle Discard/Draw powerups
    if (powerupType === PowerupType.Discard1Draw2 || powerupType === PowerupType.Discard2Draw3) {
      selectedPowerupCard.value = card
      return
    }

    // Handle Draw 1, Expand powerup
    if (powerupType === PowerupType.DrawExpand) {
      selectedDrawExpandCard.value = card
      return
    }

    // Handle Duplicate powerup
    if (powerupType === PowerupType.Duplicate) {
      selectedDuplicateCard.value = card
      return
    }

    // Handle Move powerup (only if can start move)
    if (powerupType === PowerupType.Move && gameStore.canStartMove) {
      selectedMoveCard.value = card
      return
    }
  }
  // For other cards, just show a basic confirmation (future feature)
}

/**
 * Handle confirm from discard/draw modal
 */
function handleDiscardDrawConfirm(cardsToDiscard: CardInstance[]) {
  if (!selectedPowerupCard.value) return

  // Determine draw count based on powerup type
  const powerupType = (selectedPowerupCard.value as CardInstance & { powerupType: PowerupType })
    .powerupType
  const drawCountNum = powerupType === PowerupType.Discard1Draw2 ? 2 : 3

  // First, play the powerup card (remove it from hand)
  cardStore.playCard(selectedPowerupCard.value.instanceId)

  // Then discard selected cards and draw new ones
  const result = cardStore.discardAndDraw(
    cardsToDiscard.map((c) => c.instanceId),
    drawCountNum,
  )

  // Show drawn cards in CardDrawModal (keep all of them)
  if (result.success && result.drawnCards && result.drawnCards.length > 0) {
    drawnCards.value = result.drawnCards
    keepCount.value = result.drawnCards.length // Keep all drawn cards
  }

  // Close the powerup modal
  selectedPowerupCard.value = null
}

/**
 * Handle cancel from discard/draw modal
 */
function handleDiscardDrawCancel() {
  selectedPowerupCard.value = null
}

/**
 * Handle confirm from card draw modal (after powerup effect)
 */
function handleCardDrawConfirm() {
  // Cards are already in hand from discardAndDraw, just close the modal
  drawnCards.value = []
  keepCount.value = 0
}

/**
 * Handle confirm from draw/expand modal
 */
function handleDrawExpandConfirm() {
  if (!selectedDrawExpandCard.value) return

  // Play the powerup (draws 1 card, expands hand limit)
  const result = cardStore.playDrawExpandPowerup(selectedDrawExpandCard.value.instanceId)

  // Show drawn card in CardDrawModal (keep it - it's already in hand)
  if (result.success && result.drawnCards && result.drawnCards.length > 0) {
    drawnCards.value = result.drawnCards
    keepCount.value = result.drawnCards.length
  }

  // Close the draw/expand modal
  selectedDrawExpandCard.value = null
}

/**
 * Handle cancel from draw/expand modal
 */
function handleDrawExpandCancel() {
  selectedDrawExpandCard.value = null
}

/**
 * Handle confirm from duplicate modal
 */
function handleDuplicateConfirm(targetCard: CardInstance) {
  if (!selectedDuplicateCard.value) return

  // Play the powerup (duplicates the target card)
  cardStore.playDuplicatePowerup(selectedDuplicateCard.value.instanceId, targetCard.instanceId)

  // Close the duplicate modal
  selectedDuplicateCard.value = null
}

/**
 * Handle cancel from duplicate modal
 */
function handleDuplicateCancel() {
  selectedDuplicateCard.value = null
}

/**
 * Handle confirm from move modal
 */
function handleMoveConfirm() {
  if (!selectedMoveCard.value) return

  // Play the powerup (discards entire hand)
  cardStore.playMovePowerup(selectedMoveCard.value.instanceId)

  // Start the move in game state (notifies seekers, pauses timer)
  gameStore.startMove()

  // Close the move modal
  selectedMoveCard.value = null
}

/**
 * Handle cancel from move modal
 */
function handleMoveCancel() {
  selectedMoveCard.value = null
}

/**
 * Handle confirming the new hiding zone after a move
 */
function handleConfirmNewZone() {
  gameStore.confirmNewZone()
}

/**
 * Open the Add Card modal (PHYS-001)
 */
function openAddCardModal() {
  isAddCardModalOpen.value = true
}

/**
 * Handle Add Card confirmation (PHYS-001)
 */
function handleAddCardConfirm(payload: { cardType: CardType; options: AddCardOptions }) {
  cardStore.addCardToHand(payload.cardType, payload.options)
  isAddCardModalOpen.value = false
}

/**
 * Handle Add Card cancel (PHYS-001)
 */
function handleAddCardCancel() {
  isAddCardModalOpen.value = false
}
</script>

<template>
  <div data-testid="hider-view" class="hider-view">
    <!-- Role Indicator with Help Button -->
    <div class="hider-header-row">
      <div data-testid="role-indicator" class="hider-role-indicator">
        <svg class="hider-role-icon" viewBox="0 0 24 24" fill="currentColor">
          <path
            d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"
          />
        </svg>
        <span>Hider</span>
      </div>
      <button
        data-testid="hider-help-btn"
        class="hider-help-btn"
        aria-label="Open hider guide"
        @click="isHiderGuideOpen = true"
      >
        <svg viewBox="0 0 24 24" fill="currentColor">
          <path
            d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17h-2v-2h2v2zm2.07-7.75l-.9.92C13.45 12.9 13 13.5 13 15h-2v-.5c0-1.1.45-2.1 1.17-2.83l1.24-1.26c.37-.36.59-.86.59-1.41 0-1.1-.9-2-2-2s-2 .9-2 2H8c0-2.21 1.79-4 4-4s4 1.79 4 4c0 .88-.36 1.68-.93 2.25z"
          />
        </svg>
      </button>
    </div>

    <!-- Phase Status -->
    <div data-testid="phase-status" class="hider-phase-status">
      {{ getPhaseDisplayText() }}
    </div>

    <!-- Hider answer prompt (QSYNC-005): answer a seeker's pending question
         in-app. Renders itself only when a question is pending. -->
    <HiderAnswerPrompt />

    <!-- Move In Progress Banner -->
    <div
      v-if="gameStore.isHiderMoving"
      data-testid="move-in-progress-banner"
      class="hider-move-banner"
    >
      <div class="hider-move-header">
        <svg class="hider-move-icon" viewBox="0 0 20 20" fill="currentColor">
          <path
            fill-rule="evenodd"
            d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
            clip-rule="evenodd"
          />
        </svg>
        <span class="hider-move-title">Moving to New Zone</span>
      </div>
      <p class="hider-move-text">
        Travel to your new hiding spot. The hiding timer is paused and seekers are frozen.
      </p>
      <button
        data-testid="confirm-new-zone-btn"
        class="btn-show btn-show-hider hider-move-btn"
        @click="handleConfirmNewZone"
      >
        Confirm New Zone
      </button>
    </div>

    <!-- Hiding Period Timer -->
    <HidingPeriodTimer v-if="isHidingPeriod" role="hider" />

    <!-- Dev Skip Button (only in dev mode during hiding period) -->
    <DevSkipHidingPeriod />

    <!-- Question Response Timer -->
    <QuestionResponseTimer role="hider" :game-size="props.gameSize ?? GameSize.Small" />

    <!-- Time Bonus Total -->
    <div data-testid="time-bonus-total" class="stat-card stat-card-green hider-time-bonus">
      <div class="hider-time-bonus-info">
        <svg class="hider-time-bonus-icon" viewBox="0 0 24 24" fill="currentColor">
          <path
            d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z"
          />
        </svg>
        <span class="stat-card-label">Total Time Bonus</span>
      </div>
      <span class="stat-card-value hider-time-value">+{{ totalTimeBonus }} min</span>
    </div>

    <!-- Cards Section -->
    <section data-testid="hider-cards-section" class="hider-cards-section">
      <div class="hider-cards-header">
        <h2 class="hider-cards-title">
          <svg class="hider-cards-title-icon" viewBox="0 0 24 24" fill="currentColor">
            <path
              d="M21.47 4.35l-1.34-.56v9.03l2.43-5.86c.41-1.02-.06-2.19-1.09-2.61zm-19.5 3.7L6.93 20a2.01 2.01 0 001.81 1.26c.26 0 .53-.05.79-.16l7.37-3.05c.75-.31 1.21-1.05 1.23-1.79.01-.26-.04-.55-.13-.81L13 3.5c-.29-.72-.97-1.17-1.73-1.17-.27 0-.54.05-.79.15L3.11 5.54c-1.03.42-1.51 1.6-1.14 2.51z"
            />
          </svg>
          Your Cards
        </h2>
        <button
          data-testid="add-card-btn"
          class="btn-show btn-show-secondary hider-add-card-btn"
          :disabled="cardStore.isHandFull"
          @click="openAddCardModal"
        >
          <svg viewBox="0 0 24 24" fill="currentColor" class="hider-add-icon">
            <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
          </svg>
          Add Card
        </button>
      </div>
      <CardHand :game-size="props.gameSize ?? GameSize.Small" @card-select="handleCardSelect" />
    </section>

    <!-- Powerup Discard/Draw Modal -->
    <PowerupDiscardDrawModal
      :powerup-card="selectedPowerupCard"
      :selectable-cards="selectableCardsForDiscard"
      @confirm="handleDiscardDrawConfirm"
      @cancel="handleDiscardDrawCancel"
    />

    <!-- Powerup Draw/Expand Modal -->
    <PowerupDrawExpandModal
      :powerup-card="selectedDrawExpandCard"
      :current-hand-limit="cardStore.handLimit"
      @confirm="handleDrawExpandConfirm"
      @cancel="handleDrawExpandCancel"
    />

    <!-- Powerup Duplicate Modal -->
    <PowerupDuplicateModal
      :powerup-card="selectedDuplicateCard"
      :selectable-cards="selectableCardsForDuplicate"
      :game-size="props.gameSize ?? GameSize.Small"
      @confirm="handleDuplicateConfirm"
      @cancel="handleDuplicateCancel"
    />

    <!-- Powerup Move Modal -->
    <PowerupMoveModal
      :powerup-card="selectedMoveCard"
      :hand-size="cardStore.handCount"
      :game-size="props.gameSize ?? GameSize.Small"
      @confirm="handleMoveConfirm"
      @cancel="handleMoveCancel"
    />

    <!-- Card Draw Modal (shows drawn cards after powerup effect) -->
    <CardDrawModal
      :drawn-cards="drawnCards"
      :keep-count="keepCount"
      @confirm="handleCardDrawConfirm"
    />

    <!-- Add Card Modal (PHYS-001 - Manual card entry for physical deck players) -->
    <AddCardModal
      :is-open="isAddCardModalOpen"
      @confirm="handleAddCardConfirm"
      @cancel="handleAddCardCancel"
    />

    <!-- Hider Guide (GUIDE-001) -->
    <HiderGuide :is-open="isHiderGuideOpen" @close="isHiderGuideOpen = false" />
  </div>
</template>

<style scoped>
.hider-view {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 1rem;
}

/* Header row with role indicator and help button */
.hider-header-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

/* Role indicator */
.hider-role-indicator {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem;
  font-family: var(--font-display);
  font-size: 1.25rem;
  letter-spacing: 0.1em;
  color: var(--color-role-hider);
}

/* Help button */
.hider-help-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2.5rem;
  height: 2.5rem;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 8px;
  color: var(--color-ui-text-secondary);
  cursor: pointer;
  transition: all 0.2s;
}

.hider-help-btn:hover {
  background: rgba(255, 255, 255, 0.15);
  color: white;
}

.hider-help-btn svg {
  width: 1.25rem;
  height: 1.25rem;
}

.hider-role-icon {
  width: 1.5rem;
  height: 1.5rem;
}

/* Phase status */
.hider-phase-status {
  padding: 0.875rem 1rem;
  background: linear-gradient(135deg, rgba(30, 41, 59, 0.6) 0%, rgba(15, 23, 42, 0.8) 100%);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 10px;
  text-align: center;
  color: var(--color-ui-text-secondary);
  font-weight: 500;
}

/* Move banner */
.hider-move-banner {
  padding: 1.25rem;
  background: linear-gradient(135deg, rgba(245, 158, 11, 0.15) 0%, rgba(180, 83, 9, 0.15) 100%);
  border: 1px solid rgba(245, 158, 11, 0.3);
  border-radius: 12px;
}

.hider-move-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
}

.hider-move-icon {
  width: 1.5rem;
  height: 1.5rem;
  color: var(--color-role-hider);
}

.hider-move-title {
  font-family: var(--font-display);
  font-size: 1.125rem;
  letter-spacing: 0.05em;
  color: var(--color-role-hider);
}

.hider-move-text {
  color: rgba(255, 255, 255, 0.8);
  font-size: 0.875rem;
  line-height: 1.5;
  margin-bottom: 1rem;
}

.hider-move-btn {
  width: 100%;
}

/* Time bonus card */
.hider-time-bonus {
  padding: 1rem 1.25rem;
}

.hider-time-bonus-info {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.hider-time-bonus-icon {
  width: 1.25rem;
  height: 1.25rem;
  color: var(--color-status-success);
}

.hider-time-value {
  color: var(--color-status-success);
}

/* Cards section */
.hider-cards-section {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.hider-cards-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.75rem;
  padding: 0 0.25rem;
}

.hider-cards-title {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-family: var(--font-display);
  font-size: 1.125rem;
  letter-spacing: 0.05em;
  color: white;
}

.hider-cards-title-icon {
  width: 1.25rem;
  height: 1.25rem;
  color: var(--color-brand-gold);
}

.hider-add-card-btn {
  padding: 0.625rem 1rem;
  font-size: 0.8125rem;
}

.hider-add-icon {
  width: 1rem;
  height: 1rem;
}
</style>
