/**
 * Card Store
 *
 * Pinia store for managing the hider's card hand.
 * Tracks hand, deck composition, and provides card drawing/playing actions.
 * Persists state to localStorage via the persistence service.
 */

import { defineStore } from 'pinia'
import { computed, ref, watch } from 'vue'
import {
  type Card,
  type TimeBonusCard,
  type PowerupCard,
  type CurseCard,
  CardType,
  TIME_BONUS_TIERS,
  POWERUP_CARDS,
  CURSE_CARDS,
} from '@/types/card'
import { GameSize } from '@/types/question'
import { createPersistenceService } from '@/services/persistence'

const STORAGE_KEY = 'cards'
const DEFAULT_HAND_LIMIT = 6

/**
 * Card instance in hand - includes unique instance ID for tracking
 */
export interface CardInstance extends Card {
  instanceId: string
}

/**
 * Time bonus card instance
 */
export interface TimeBonusCardInstance extends TimeBonusCard {
  instanceId: string
}

/**
 * Powerup card instance
 */
export interface PowerupCardInstance extends PowerupCard {
  instanceId: string
}

/**
 * Curse card instance
 */
export interface CurseCardInstance extends CurseCard {
  instanceId: string
}

/**
 * Result type for card actions
 */
export interface CardActionResult {
  success: boolean
  error?: string
  drawnCards?: CardInstance[]
  playedCard?: CardInstance
}

/**
 * Deck composition tracking - how many of each card remain
 */
interface DeckComposition {
  timeBonusByTier: Record<number, number>
  powerupByType: Record<string, number>
  curseById: Record<string, number>
}

/**
 * Persisted state shape for localStorage
 */
interface PersistedCardState {
  hand: CardInstance[]
  handLimit: number
  discardPile: CardInstance[]
  deckComposition: DeckComposition
}

/**
 * Generate a unique instance ID
 */
function generateInstanceId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
}

/**
 * Create initial deck composition based on official card counts
 */
function createInitialDeckComposition(): DeckComposition {
  const composition: DeckComposition = {
    timeBonusByTier: {},
    powerupByType: {},
    curseById: {},
  }

  // Time bonus tiers (55 total)
  TIME_BONUS_TIERS.forEach(tier => {
    composition.timeBonusByTier[tier.tier] = tier.quantity
  })

  // Powerup cards (21 total)
  POWERUP_CARDS.forEach(card => {
    composition.powerupByType[card.powerupType] = card.quantity
  })

  // Curse cards (24 total, each is unique)
  CURSE_CARDS.forEach(card => {
    composition.curseById[card.id] = 1
  })

  return composition
}

/**
 * Get total cards remaining in deck from composition
 */
function getTotalRemainingCards(composition: DeckComposition): number {
  const timeBonusCount = Object.values(composition.timeBonusByTier).reduce((sum, count) => sum + count, 0)
  const powerupCount = Object.values(composition.powerupByType).reduce((sum, count) => sum + count, 0)
  const curseCount = Object.values(composition.curseById).reduce((sum, count) => sum + count, 0)
  return timeBonusCount + powerupCount + curseCount
}

/**
 * Draw a single card from the deck based on remaining composition
 */
function drawSingleCard(composition: DeckComposition): CardInstance | null {
  const totalRemaining = getTotalRemainingCards(composition)
  if (totalRemaining === 0) return null

  // Random selection weighted by remaining cards
  let roll = Math.floor(Math.random() * totalRemaining)

  // Check time bonus tiers
  for (const [tierStr, count] of Object.entries(composition.timeBonusByTier)) {
    if (count <= 0) continue
    if (roll < count) {
      const tier = parseInt(tierStr, 10)
      const tierData = TIME_BONUS_TIERS.find(t => t.tier === tier)!
      composition.timeBonusByTier[tier]--
      return {
        id: `time-bonus-tier-${tier}`,
        instanceId: generateInstanceId(),
        type: CardType.TimeBonus,
        name: `Time Bonus (Tier ${tier})`,
        description: `Adds ${tierData.minutes[GameSize.Small]}/${tierData.minutes[GameSize.Medium]}/${tierData.minutes[GameSize.Large]} minutes (S/M/L) to hiding duration`,
        tier,
        bonusMinutes: tierData.minutes,
      } as TimeBonusCardInstance
    }
    roll -= count
  }

  // Check powerup cards
  for (const [powerupType, count] of Object.entries(composition.powerupByType)) {
    if (count <= 0) continue
    if (roll < count) {
      const card = POWERUP_CARDS.find(c => c.powerupType === powerupType)!
      composition.powerupByType[powerupType]--
      return {
        ...card,
        instanceId: generateInstanceId(),
      } as PowerupCardInstance
    }
    roll -= count
  }

  // Check curse cards
  for (const [curseId, count] of Object.entries(composition.curseById)) {
    if (count <= 0) continue
    if (roll < count) {
      const card = CURSE_CARDS.find(c => c.id === curseId)!
      composition.curseById[curseId]--
      return {
        ...card,
        instanceId: generateInstanceId(),
      } as CurseCardInstance
    }
    roll -= count
  }

  return null
}

export const useCardStore = defineStore('cards', () => {
  // Persistence service
  const persistenceService = createPersistenceService()

  // State
  const hand = ref<CardInstance[]>([])
  const handLimit = ref(DEFAULT_HAND_LIMIT)
  const discardPile = ref<CardInstance[]>([])
  const deckComposition = ref<DeckComposition>(createInitialDeckComposition())

  // Getters
  const handCount = computed(() => hand.value.length)
  const isHandFull = computed(() => hand.value.length >= handLimit.value)
  const availableSlots = computed(() => handLimit.value - hand.value.length)
  const deckSize = computed(() => getTotalRemainingCards(deckComposition.value))

  const timeBonusCards = computed(() =>
    hand.value.filter((card): card is TimeBonusCardInstance => card.type === CardType.TimeBonus)
  )

  const powerupCards = computed(() =>
    hand.value.filter((card): card is PowerupCardInstance => card.type === CardType.Powerup)
  )

  const curseCards = computed(() =>
    hand.value.filter((card): card is CurseCardInstance => card.type === CardType.Curse)
  )

  /**
   * Calculate total time bonus value for a given game size
   */
  function totalTimeBonus(gameSize: GameSize): number {
    return timeBonusCards.value.reduce((sum, card) => {
      return sum + card.bonusMinutes[gameSize]
    }, 0)
  }

  /**
   * Persist current state to localStorage
   */
  function persist(): void {
    const state: PersistedCardState = {
      hand: hand.value,
      handLimit: handLimit.value,
      discardPile: discardPile.value,
      deckComposition: deckComposition.value,
    }
    persistenceService.save(STORAGE_KEY, state)
  }

  /**
   * Rehydrate state from localStorage
   */
  function rehydrate(): void {
    try {
      const persisted = persistenceService.load<PersistedCardState>(STORAGE_KEY)
      if (persisted) {
        hand.value = persisted.hand || []
        handLimit.value = persisted.handLimit || DEFAULT_HAND_LIMIT
        discardPile.value = persisted.discardPile || []
        if (persisted.deckComposition && Object.keys(persisted.deckComposition).length > 0) {
          deckComposition.value = persisted.deckComposition
        }
      }
    } catch {
      // If rehydration fails, keep default state
    }
  }

  // Watch for state changes and persist automatically
  watch(
    [hand, handLimit, discardPile, deckComposition],
    () => {
      persist()
    },
    { deep: true }
  )

  /**
   * Draw cards from the deck into hand
   */
  function drawCards(count: number): CardActionResult {
    if (deckSize.value === 0) {
      return { success: false, error: 'Deck is empty' }
    }

    const drawnCards: CardInstance[] = []
    const maxDraw = Math.min(count, availableSlots.value, deckSize.value)

    for (let i = 0; i < maxDraw; i++) {
      const card = drawSingleCard(deckComposition.value)
      if (card) {
        drawnCards.push(card)
        hand.value.push(card)
      }
    }

    return {
      success: true,
      drawnCards,
    }
  }

  /**
   * Play a card from hand (removes it and adds to discard)
   */
  function playCard(instanceId: string): CardActionResult {
    const cardIndex = hand.value.findIndex(c => c.instanceId === instanceId)
    if (cardIndex === -1) {
      return { success: false, error: 'Card not found in hand' }
    }

    const [playedCard] = hand.value.splice(cardIndex, 1)
    discardPile.value.push(playedCard!)

    return {
      success: true,
      playedCard: playedCard!,
    }
  }

  /**
   * Discard a card from hand (removes it and adds to discard)
   */
  function discardCard(instanceId: string): CardActionResult {
    const cardIndex = hand.value.findIndex(c => c.instanceId === instanceId)
    if (cardIndex === -1) {
      return { success: false, error: 'Card not found in hand' }
    }

    const [discardedCard] = hand.value.splice(cardIndex, 1)
    discardPile.value.push(discardedCard!)

    return {
      success: true,
      playedCard: discardedCard!,
    }
  }

  /**
   * Expand the hand limit
   */
  function expandHandLimit(amount: number = 1): void {
    handLimit.value += amount
  }

  /**
   * Clear hand (discard all cards)
   */
  function clearHand(): void {
    discardPile.value.push(...hand.value)
    hand.value = []
  }

  /**
   * Reset the store to initial state (for new round)
   */
  function reset(): void {
    hand.value = []
    handLimit.value = DEFAULT_HAND_LIMIT
    discardPile.value = []
    deckComposition.value = createInitialDeckComposition()
  }

  return {
    // State
    hand,
    handLimit,
    discardPile,
    // Getters
    handCount,
    isHandFull,
    availableSlots,
    deckSize,
    timeBonusCards,
    powerupCards,
    curseCards,
    // Methods
    totalTimeBonus,
    drawCards,
    playCard,
    discardCard,
    expandHandLimit,
    clearHand,
    reset,
    // Persistence
    rehydrate,
  }
})
