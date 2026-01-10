import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { nextTick } from 'vue'
import { useCardStore } from '../cardStore'
import {
  CardType,
  TOTAL_DECK_SIZE,
} from '@/types/card'
import { GameSize } from '@/types/question'

describe('cardStore core', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  describe('initialization', () => {
    it('should initialize with empty hand', () => {
      const store = useCardStore()

      expect(store.hand).toEqual([])
    })

    it('should initialize with default hand limit of 6', () => {
      const store = useCardStore()

      expect(store.handLimit).toBe(6)
    })

    it('should initialize with full deck', () => {
      const store = useCardStore()

      // Deck should contain TOTAL_DECK_SIZE cards (100)
      expect(store.deckSize).toBe(TOTAL_DECK_SIZE)
    })

    it('should initialize with no discarded cards', () => {
      const store = useCardStore()

      expect(store.discardPile).toEqual([])
    })
  })

  describe('hand management getters', () => {
    it('should return current hand count', () => {
      const store = useCardStore()

      expect(store.handCount).toBe(0)
    })

    it('should return true when hand is full', () => {
      const store = useCardStore()

      // Fill the hand to the limit
      for (let i = 0; i < store.handLimit; i++) {
        store.drawCards(1)
      }

      expect(store.isHandFull).toBe(true)
    })

    it('should return false when hand is not full', () => {
      const store = useCardStore()

      store.drawCards(1)

      expect(store.isHandFull).toBe(false)
    })

    it('should return available hand slots', () => {
      const store = useCardStore()

      store.drawCards(2)

      expect(store.availableSlots).toBe(4) // 6 - 2 = 4
    })
  })

  describe('card filtering getters', () => {
    it('should return time bonus cards in hand', () => {
      const store = useCardStore()

      // Draw cards until we have at least one time bonus
      // Since draws are weighted, we need enough draws
      for (let i = 0; i < 10; i++) {
        store.drawCards(1)
      }

      // Check if time bonus getter works (may or may not have any)
      const timeBonuses = store.timeBonusCards
      expect(Array.isArray(timeBonuses)).toBe(true)
      timeBonuses.forEach(card => {
        expect(card.type).toBe(CardType.TimeBonus)
      })
    })

    it('should return powerup cards in hand', () => {
      const store = useCardStore()

      const powerups = store.powerupCards
      expect(Array.isArray(powerups)).toBe(true)
    })

    it('should return curse cards in hand', () => {
      const store = useCardStore()

      const curses = store.curseCards
      expect(Array.isArray(curses)).toBe(true)
    })

    it('should calculate total time bonus value', () => {
      const store = useCardStore()

      // Initially zero
      expect(store.totalTimeBonus(GameSize.Small)).toBe(0)
    })
  })
})

describe('cardStore actions', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  describe('drawCards', () => {
    it('should add cards to hand', () => {
      const store = useCardStore()

      const result = store.drawCards(2)

      expect(result.success).toBe(true)
      expect(store.hand.length).toBe(2)
    })

    it('should return drawn cards', () => {
      const store = useCardStore()

      const result = store.drawCards(3)

      expect(result.drawnCards).toHaveLength(3)
      expect(result.drawnCards!.every(card => card.id && card.type)).toBe(true)
    })

    it('should reduce deck size', () => {
      const store = useCardStore()
      const initialDeckSize = store.deckSize

      store.drawCards(5)

      expect(store.deckSize).toBe(initialDeckSize - 5)
    })

    it('should respect hand limit', () => {
      const store = useCardStore()

      // Try to draw more than hand limit
      const result = store.drawCards(10)

      // Should only draw up to hand limit
      expect(store.hand.length).toBe(store.handLimit)
      expect(result.drawnCards!.length).toBe(store.handLimit)
    })

    it('should return error when deck is empty', () => {
      const store = useCardStore()

      // Draw all cards from deck
      for (let i = 0; i < TOTAL_DECK_SIZE; i++) {
        store.drawCards(1)
        // Discard to make room for more draws
        if (store.hand.length > 0) {
          store.discardCard(store.hand[0]!.instanceId)
        }
      }

      // Deck should now be empty
      expect(store.deckSize).toBe(0)

      const result = store.drawCards(1)
      expect(result.success).toBe(false)
      expect(result.error).toBe('Deck is empty')
    })

    it('should draw weighted by card quantities in deck', () => {
      const store = useCardStore()

      // Draw many cards to check distribution
      const drawnTypes: CardType[] = []
      for (let i = 0; i < 50; i++) {
        store.drawCards(1)
        if (store.hand.length > 0) {
          drawnTypes.push(store.hand[0]!.type)
          store.discardCard(store.hand[0]!.instanceId)
        }
      }

      // Time bonus should be most common (55 of 100 cards)
      const timeBonusCount = drawnTypes.filter(t => t === CardType.TimeBonus).length
      expect(timeBonusCount).toBeGreaterThan(15) // Should be roughly 55%
    })

    it('should assign unique instance IDs to each drawn card', () => {
      const store = useCardStore()

      store.drawCards(6)

      const instanceIds = store.hand.map(card => card.instanceId)
      const uniqueIds = new Set(instanceIds)
      expect(uniqueIds.size).toBe(6) // All IDs should be unique
    })
  })

  describe('playCard', () => {
    it('should remove card from hand', () => {
      const store = useCardStore()
      store.drawCards(3)
      const cardToPlay = store.hand[0]!

      const result = store.playCard(cardToPlay.instanceId)

      expect(result.success).toBe(true)
      expect(store.hand.length).toBe(2)
      expect(store.hand.find(c => c.instanceId === cardToPlay.instanceId)).toBeUndefined()
    })

    it('should return the played card', () => {
      const store = useCardStore()
      store.drawCards(1)
      const cardToPlay = store.hand[0]!

      const result = store.playCard(cardToPlay.instanceId)

      expect(result.playedCard).toEqual(cardToPlay)
    })

    it('should add card to discard pile', () => {
      const store = useCardStore()
      store.drawCards(1)
      const cardToPlay = store.hand[0]!

      store.playCard(cardToPlay.instanceId)

      expect(store.discardPile.length).toBe(1)
      expect(store.discardPile[0]).toEqual(cardToPlay)
    })

    it('should return error if card not in hand', () => {
      const store = useCardStore()

      const result = store.playCard('non-existent-id')

      expect(result.success).toBe(false)
      expect(result.error).toBe('Card not found in hand')
    })
  })

  describe('discardCard', () => {
    it('should remove card from hand', () => {
      const store = useCardStore()
      store.drawCards(2)
      const cardToDiscard = store.hand[1]!

      const result = store.discardCard(cardToDiscard.instanceId)

      expect(result.success).toBe(true)
      expect(store.hand.length).toBe(1)
    })

    it('should add card to discard pile', () => {
      const store = useCardStore()
      store.drawCards(1)
      const card = store.hand[0]!

      store.discardCard(card.instanceId)

      expect(store.discardPile.length).toBe(1)
    })

    it('should return error if card not in hand', () => {
      const store = useCardStore()

      const result = store.discardCard('non-existent-id')

      expect(result.success).toBe(false)
      expect(result.error).toBe('Card not found in hand')
    })
  })

  describe('expandHandLimit', () => {
    it('should increase hand limit by specified amount', () => {
      const store = useCardStore()
      const initialLimit = store.handLimit

      store.expandHandLimit(1)

      expect(store.handLimit).toBe(initialLimit + 1)
    })

    it('should default to increasing by 1', () => {
      const store = useCardStore()
      const initialLimit = store.handLimit

      store.expandHandLimit()

      expect(store.handLimit).toBe(initialLimit + 1)
    })
  })

  describe('clearHand', () => {
    it('should remove all cards from hand', () => {
      const store = useCardStore()
      store.drawCards(5)

      store.clearHand()

      expect(store.hand).toEqual([])
    })

    it('should add cleared cards to discard pile', () => {
      const store = useCardStore()
      store.drawCards(3)
      const handSize = store.hand.length

      store.clearHand()

      expect(store.discardPile.length).toBe(handSize)
    })
  })

  describe('reset', () => {
    it('should reset hand to empty', () => {
      const store = useCardStore()
      store.drawCards(5)

      store.reset()

      expect(store.hand).toEqual([])
    })

    it('should reset hand limit to default', () => {
      const store = useCardStore()
      store.expandHandLimit(3)

      store.reset()

      expect(store.handLimit).toBe(6)
    })

    it('should reset deck to full size', () => {
      const store = useCardStore()
      store.drawCards(10)

      store.reset()

      expect(store.deckSize).toBe(TOTAL_DECK_SIZE)
    })

    it('should clear discard pile', () => {
      const store = useCardStore()
      store.drawCards(3)
      store.clearHand()

      store.reset()

      expect(store.discardPile).toEqual([])
    })
  })
})

describe('cardStore time bonus calculations', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('should calculate total time bonus for small game', () => {
    const store = useCardStore()

    // Manually add a time bonus card to test calculation
    // We'll need to use the internal addCardToHand if exposed, or draw and check
    store.drawCards(6)

    const timeBonusInHand = store.timeBonusCards
    const expectedTotal = timeBonusInHand.reduce((sum, card) => {
      return sum + card.bonusMinutes[GameSize.Small]
    }, 0)

    expect(store.totalTimeBonus(GameSize.Small)).toBe(expectedTotal)
  })

  it('should calculate total time bonus for medium game', () => {
    const store = useCardStore()
    store.drawCards(6)

    const timeBonusInHand = store.timeBonusCards
    const expectedTotal = timeBonusInHand.reduce((sum, card) => {
      return sum + card.bonusMinutes[GameSize.Medium]
    }, 0)

    expect(store.totalTimeBonus(GameSize.Medium)).toBe(expectedTotal)
  })

  it('should calculate total time bonus for large game', () => {
    const store = useCardStore()
    store.drawCards(6)

    const timeBonusInHand = store.timeBonusCards
    const expectedTotal = timeBonusInHand.reduce((sum, card) => {
      return sum + card.bonusMinutes[GameSize.Large]
    }, 0)

    expect(store.totalTimeBonus(GameSize.Large)).toBe(expectedTotal)
  })
})

describe('cardStore persistence', () => {
  let mockStorage: Record<string, string>

  beforeEach(() => {
    mockStorage = {}

    vi.stubGlobal('localStorage', {
      getItem: vi.fn((key: string) => mockStorage[key] ?? null),
      setItem: vi.fn((key: string, value: string) => {
        mockStorage[key] = value
      }),
      removeItem: vi.fn((key: string) => {
        delete mockStorage[key]
      }),
      clear: vi.fn(() => {
        mockStorage = {}
      }),
    })

    setActivePinia(createPinia())
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('should persist state to localStorage', async () => {
    const store = useCardStore()

    // Draw some cards to create state
    store.drawCards(3)

    // Wait for Vue's watcher to trigger
    await nextTick()

    // State should be persisted to localStorage
    expect(localStorage.setItem).toHaveBeenCalled()

    // Verify persisted data
    const persistedKey = Object.keys(mockStorage).find(key => key.includes('cards'))
    expect(persistedKey).toBeDefined()

    const persistedData = JSON.parse(mockStorage[persistedKey!]!)
    expect(persistedData.hand).toBeDefined()
    expect(persistedData.hand.length).toBe(3)
  })

  it('should rehydrate state on load', () => {
    // Pre-populate localStorage with persisted state
    const testHand = [
      {
        id: 'time-bonus-tier-1',
        instanceId: 'test-instance-1',
        type: CardType.TimeBonus,
        name: 'Time Bonus (Tier 1)',
        description: 'Test card',
        tier: 1,
        bonusMinutes: { [GameSize.Small]: 2, [GameSize.Medium]: 3, [GameSize.Large]: 5 },
      },
    ]

    mockStorage['jet-lag-stillwater:cards'] = JSON.stringify({
      hand: testHand,
      handLimit: 7,
      discardPile: [],
      deckComposition: {}, // Simplified for test
    })

    const store = useCardStore()
    store.rehydrate()

    expect(store.hand.length).toBe(1)
    expect(store.hand[0]!.instanceId).toBe('test-instance-1')
    expect(store.handLimit).toBe(7)
  })

  it('should preserve expanded hand limit across restart', () => {
    mockStorage['jet-lag-stillwater:cards'] = JSON.stringify({
      hand: [],
      handLimit: 8,
      discardPile: [],
      deckComposition: {},
    })

    const store = useCardStore()
    store.rehydrate()

    expect(store.handLimit).toBe(8)
  })

  it('should handle empty localStorage gracefully', () => {
    const store = useCardStore()
    store.rehydrate()

    expect(store.hand).toEqual([])
    expect(store.handLimit).toBe(6)
  })

  it('should handle corrupted localStorage data gracefully', () => {
    mockStorage['jet-lag-stillwater:cards'] = 'not valid json {'

    const store = useCardStore()

    expect(() => store.rehydrate()).not.toThrow()
    expect(store.hand).toEqual([])
    expect(store.handLimit).toBe(6)
  })
})
