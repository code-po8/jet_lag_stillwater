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
export type CardInstance = Card & { instanceId: string }

/**
 * Active curse - a curse card that has been played and is affecting seekers
 */
export interface ActiveCurse {
  /** Unique instance ID for this active curse */
  instanceId: string
  /** ID of the curse card definition */
  curseId: string
  /** Display name of the curse */
  name: string
  /** Short description */
  description: string
  /** Full effect text */
  effect: string
  /** What the hider had to do to cast this curse */
  castingCost: string
  /** Whether this curse blocks asking questions */
  blocksQuestions: boolean
  /** Whether this curse blocks using transit */
  blocksTransit: boolean
  /** When the curse was activated */
  activatedAt: Date
  /** Whether this curse lasts until the hider is found */
  untilFound?: boolean
  /** Duration in minutes by game size (for time-based curses) */
  durationMinutes?: {
    small: number
    medium: number
    large: number
  }
  /** Penalty minutes by game size (if seekers fail to comply) */
  penaltyMinutes?: {
    small: number
    medium: number
    large: number
  }
}

/**
 * Time bonus card instance
 */
export type TimeBonusCardInstance = TimeBonusCard & { instanceId: string }

/**
 * Powerup card instance
 */
export type PowerupCardInstance = PowerupCard & { instanceId: string }

/**
 * Curse card instance
 */
export type CurseCardInstance = CurseCard & { instanceId: string }

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
 * Persisted active curse - dates stored as ISO strings
 */
interface PersistedActiveCurse extends Omit<ActiveCurse, 'activatedAt'> {
  activatedAt: string
}

/**
 * Persisted state shape for localStorage
 */
interface PersistedCardState {
  hand: CardInstance[]
  handLimit: number
  discardPile: CardInstance[]
  deckComposition: DeckComposition
  activeCurses?: PersistedActiveCurse[]
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
      const tierData = TIME_BONUS_TIERS.find(t => t.tier === tier)
      if (!tierData) continue
      const currentCount = composition.timeBonusByTier[tier]
      if (currentCount !== undefined) {
        composition.timeBonusByTier[tier] = currentCount - 1
      }
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
      const card = POWERUP_CARDS.find(c => c.powerupType === powerupType)
      if (!card) continue
      const currentCount = composition.powerupByType[powerupType]
      if (currentCount !== undefined) {
        composition.powerupByType[powerupType] = currentCount - 1
      }
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
      const card = CURSE_CARDS.find(c => c.id === curseId)
      if (!card) continue
      const currentCount = composition.curseById[curseId]
      if (currentCount !== undefined) {
        composition.curseById[curseId] = currentCount - 1
      }
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
  const activeCurses = ref<ActiveCurse[]>([])

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
      activeCurses: activeCurses.value.map(curse => ({
        ...curse,
        activatedAt: curse.activatedAt.toISOString(),
      })),
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
        // Rehydrate active curses with date conversion
        if (persisted.activeCurses) {
          activeCurses.value = persisted.activeCurses.map(curse => ({
            ...curse,
            activatedAt: new Date(curse.activatedAt),
          }))
        }
      }
    } catch {
      // If rehydration fails, keep default state
    }
  }

  // Watch for state changes and persist automatically
  watch(
    [hand, handLimit, discardPile, deckComposition, activeCurses],
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
   * Play a curse card from hand - adds it to active curses affecting seekers
   */
  function playCurseCard(instanceId: string): CardActionResult {
    const cardIndex = hand.value.findIndex(c => c.instanceId === instanceId)
    if (cardIndex === -1) {
      return { success: false, error: 'Card not found in hand' }
    }

    const card = hand.value[cardIndex]
    if (card?.type !== CardType.Curse) {
      return { success: false, error: 'Card is not a curse card' }
    }

    // Remove from hand and add to discard pile
    const [playedCard] = hand.value.splice(cardIndex, 1)
    discardPile.value.push(playedCard!)

    // Create active curse from the card
    const curseCard = playedCard as CurseCardInstance
    const activeCurse: ActiveCurse = {
      instanceId: generateInstanceId(),
      curseId: curseCard.id,
      name: curseCard.name,
      description: curseCard.description,
      effect: curseCard.effect,
      castingCost: curseCard.castingCost,
      blocksQuestions: curseCard.blocksQuestions,
      blocksTransit: curseCard.blocksTransit,
      activatedAt: new Date(),
    }

    // Add optional fields if they exist on the curse card
    if (curseCard.durationMinutes) {
      activeCurse.durationMinutes = {
        small: curseCard.durationMinutes[GameSize.Small],
        medium: curseCard.durationMinutes[GameSize.Medium],
        large: curseCard.durationMinutes[GameSize.Large],
      }
    }

    if (curseCard.penaltyMinutes) {
      activeCurse.penaltyMinutes = {
        small: curseCard.penaltyMinutes[GameSize.Small],
        medium: curseCard.penaltyMinutes[GameSize.Medium],
        large: curseCard.penaltyMinutes[GameSize.Large],
      }
    }

    // Mark as until-found for certain curses (those that say "rest of run")
    if (curseCard.effect.toLowerCase().includes('rest of run')) {
      activeCurse.untilFound = true
    }

    activeCurses.value.push(activeCurse)

    return {
      success: true,
      playedCard: playedCard!,
    }
  }

  /**
   * Clear a curse (remove from active curses)
   */
  function clearCurse(instanceId: string): CardActionResult {
    const curseIndex = activeCurses.value.findIndex(c => c.instanceId === instanceId)
    if (curseIndex === -1) {
      return { success: false, error: 'Curse not found in active curses' }
    }

    activeCurses.value.splice(curseIndex, 1)
    return { success: true }
  }

  /**
   * Reset the store to initial state (for new round)
   */
  function reset(): void {
    hand.value = []
    handLimit.value = DEFAULT_HAND_LIMIT
    discardPile.value = []
    deckComposition.value = createInitialDeckComposition()
    activeCurses.value = []
  }

  return {
    // State
    hand,
    handLimit,
    discardPile,
    activeCurses,
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
    playCurseCard,
    clearCurse,
    reset,
    // Persistence
    rehydrate,
  }
})
