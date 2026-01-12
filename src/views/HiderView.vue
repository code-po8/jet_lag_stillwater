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
import AddCardModal from '@/components/AddCardModal.vue'
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
  <div data-testid="hider-view" class="flex flex-col gap-4 p-4">
    <!-- Role Indicator -->
    <div data-testid="role-indicator" class="text-center text-xl font-bold text-amber-400">
      Hider
    </div>

    <!-- Phase Status -->
    <div data-testid="phase-status" class="rounded-lg bg-slate-800 p-3 text-center text-slate-300">
      {{ getPhaseDisplayText() }}
    </div>

    <!-- Move In Progress Banner -->
    <div
      v-if="gameStore.isHiderMoving"
      data-testid="move-in-progress-banner"
      class="rounded-lg bg-amber-900 p-4"
    >
      <div class="mb-3 flex items-center gap-2">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          class="h-6 w-6 text-amber-400"
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path
            fill-rule="evenodd"
            d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
            clip-rule="evenodd"
          />
        </svg>
        <span class="text-lg font-bold text-amber-200">Moving to New Zone</span>
      </div>
      <p class="mb-4 text-amber-200">
        Travel to your new hiding spot. The hiding timer is paused and seekers are frozen.
      </p>
      <button
        data-testid="confirm-new-zone-btn"
        class="min-h-11 w-full rounded-lg bg-amber-500 px-4 py-3 font-bold text-white transition-colors hover:bg-amber-400"
        @click="handleConfirmNewZone"
      >
        Confirm New Zone
      </button>
    </div>

    <!-- Hiding Period Timer -->
    <HidingPeriodTimer v-if="isHidingPeriod" role="hider" />

    <!-- Question Response Timer -->
    <QuestionResponseTimer role="hider" :game-size="props.gameSize ?? GameSize.Small" />

    <!-- Time Bonus Total -->
    <div
      data-testid="time-bonus-total"
      class="flex items-center justify-between rounded-lg bg-green-900/50 p-4"
    >
      <span class="text-lg font-medium text-green-200">Total Time Bonus</span>
      <span class="text-2xl font-bold text-green-400">+{{ totalTimeBonus }} min</span>
    </div>

    <!-- Cards Section -->
    <section data-testid="hider-cards-section" class="flex-1">
      <div class="mb-3 flex items-center justify-between">
        <h2 class="text-lg font-semibold text-white">Your Cards</h2>
        <button
          data-testid="add-card-btn"
          class="min-h-11 rounded-lg bg-slate-700 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-slate-600 disabled:cursor-not-allowed disabled:opacity-50"
          :disabled="cardStore.isHandFull"
          @click="openAddCardModal"
        >
          + Add Card
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
  </div>
</template>
