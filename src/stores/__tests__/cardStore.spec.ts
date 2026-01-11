import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { nextTick } from 'vue'
import { useCardStore, type CardInstance } from '../cardStore'
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

  describe('discardAndDraw', () => {
    it('should discard selected cards and draw new ones', () => {
      const store = useCardStore()
      store.drawCards(4)
      const cardsToDiscard = [store.hand[0]!.instanceId, store.hand[1]!.instanceId]
      const initialDeckSize = store.deckSize

      const result = store.discardAndDraw(cardsToDiscard, 3)

      expect(result.success).toBe(true)
      // Should have: 4 - 2 discarded + 3 drawn = 5 cards
      expect(store.hand.length).toBe(5)
      expect(store.deckSize).toBe(initialDeckSize - 3)
    })

    it('should return the drawn cards', () => {
      const store = useCardStore()
      store.drawCards(2)
      const cardToDiscard = store.hand[0]!.instanceId

      const result = store.discardAndDraw([cardToDiscard], 2)

      expect(result.drawnCards).toBeDefined()
      expect(result.drawnCards!.length).toBe(2)
    })

    it('should add discarded cards to discard pile', () => {
      const store = useCardStore()
      store.drawCards(3)
      const cardsToDiscard = [store.hand[0]!.instanceId, store.hand[1]!.instanceId]
      const initialDiscardSize = store.discardPile.length

      store.discardAndDraw(cardsToDiscard, 2)

      expect(store.discardPile.length).toBe(initialDiscardSize + 2)
    })

    it('should return error if any card not in hand', () => {
      const store = useCardStore()
      store.drawCards(2)

      const result = store.discardAndDraw(['non-existent-id'], 2)

      expect(result.success).toBe(false)
      expect(result.error).toBe('One or more cards not found in hand')
    })

    it('should return error if deck is empty and cannot draw', () => {
      const store = useCardStore()

      // Empty the deck
      for (let i = 0; i < TOTAL_DECK_SIZE; i++) {
        store.drawCards(1)
        if (store.hand.length > 0) {
          store.discardCard(store.hand[0]!.instanceId)
        }
      }
      expect(store.deckSize).toBe(0)

      // Add a card back to hand manually to test
      store.drawCards(0) // no-op but sets up state
      // Since deck is empty, we need to test with no cards available
      store.hand.push({
        id: 'test-card',
        instanceId: 'test-instance',
        type: CardType.TimeBonus,
        name: 'Test Card',
        description: 'Test',
        tier: 1,
        bonusMinutes: { [GameSize.Small]: 2, [GameSize.Medium]: 3, [GameSize.Large]: 5 },
      } as CardInstance)

      const result = store.discardAndDraw(['test-instance'], 2)

      expect(result.success).toBe(false)
      expect(result.error).toBe('Not enough cards in deck')
    })

    it('should work with Discard 1 Draw 2 scenario', () => {
      const store = useCardStore()
      store.drawCards(4)
      const cardToDiscard = store.hand[0]!.instanceId
      const initialHandSize = store.hand.length

      const result = store.discardAndDraw([cardToDiscard], 2)

      expect(result.success).toBe(true)
      // 4 - 1 + 2 = 5 cards
      expect(store.hand.length).toBe(initialHandSize - 1 + 2)
    })

    it('should work with Discard 2 Draw 3 scenario', () => {
      const store = useCardStore()
      store.drawCards(4)
      const cardsToDiscard = [store.hand[0]!.instanceId, store.hand[1]!.instanceId]
      const initialHandSize = store.hand.length

      const result = store.discardAndDraw(cardsToDiscard, 3)

      expect(result.success).toBe(true)
      // 4 - 2 + 3 = 5 cards
      expect(store.hand.length).toBe(initialHandSize - 2 + 3)
    })

    it('should respect hand limit when drawing', () => {
      const store = useCardStore()
      store.drawCards(6) // Fill hand to limit
      const cardToDiscard = store.hand[0]!.instanceId

      const result = store.discardAndDraw([cardToDiscard], 2)

      expect(result.success).toBe(true)
      // After discarding 1, we have 5 slots, so can only add 1 more to reach limit
      expect(store.hand.length).toBeLessThanOrEqual(store.handLimit)
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

describe('cardStore playMovePowerup (CARD-007d)', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  function addMovePowerupToHand(store: ReturnType<typeof useCardStore>) {
    // Manually add a Move powerup card to the hand
    const moveCard: CardInstance = {
      id: 'powerup-move',
      instanceId: 'move-test-instance',
      type: CardType.Powerup,
      name: 'Move',
      description: 'Establish a new hiding zone',
      powerupType: 'move',
      effect: 'Discard your hand and send the seekers the location of your transit station.',
      quantity: 1,
      canPlayDuringEndgame: false,
    } as CardInstance
    store.hand.push(moveCard)
    return moveCard
  }

  it('should clear hand when Move powerup is played', () => {
    const store = useCardStore()
    store.drawCards(4) // Draw some cards first
    const moveCard = addMovePowerupToHand(store)
    expect(store.hand.length).toBe(5)

    const result = store.playMovePowerup(moveCard.instanceId)

    expect(result.success).toBe(true)
    expect(store.hand.length).toBe(0)
  })

  it('should add cleared cards to discard pile', () => {
    const store = useCardStore()
    store.drawCards(3)
    const moveCard = addMovePowerupToHand(store)
    const initialDiscardSize = store.discardPile.length

    store.playMovePowerup(moveCard.instanceId)

    // All cards including Move should be in discard pile
    expect(store.discardPile.length).toBe(initialDiscardSize + 4)
  })

  it('should return the Move powerup card as playedCard', () => {
    const store = useCardStore()
    const moveCard = addMovePowerupToHand(store)

    const result = store.playMovePowerup(moveCard.instanceId)

    expect(result.playedCard).toBeDefined()
    expect(result.playedCard!.id).toBe('powerup-move')
  })

  it('should return error if card not in hand', () => {
    const store = useCardStore()

    const result = store.playMovePowerup('non-existent-id')

    expect(result.success).toBe(false)
    expect(result.error).toBe('Card not found in hand')
  })

  it('should return error if card is not a Move powerup', () => {
    const store = useCardStore()
    // Add a different powerup to hand
    const otherPowerup: CardInstance = {
      id: 'powerup-veto',
      instanceId: 'veto-test-instance',
      type: CardType.Powerup,
      name: 'Veto Question',
      description: 'Decline to answer a question',
      powerupType: 'veto',
      effect: 'Test effect',
      quantity: 4,
      canPlayDuringEndgame: true,
    } as CardInstance
    store.hand.push(otherPowerup)

    const result = store.playMovePowerup(otherPowerup.instanceId)

    expect(result.success).toBe(false)
    expect(result.error).toBe('Card is not a Move powerup')
  })

  it('should return error if card is not a powerup type', () => {
    const store = useCardStore()
    // Add a time bonus card
    const timeBonusCard: CardInstance = {
      id: 'time-bonus-tier-1',
      instanceId: 'time-bonus-test-instance',
      type: CardType.TimeBonus,
      name: 'Time Bonus',
      description: 'Test',
      tier: 1,
      bonusMinutes: { [GameSize.Small]: 2, [GameSize.Medium]: 3, [GameSize.Large]: 5 },
    } as CardInstance
    store.hand.push(timeBonusCard)

    const result = store.playMovePowerup(timeBonusCard.instanceId)

    expect(result.success).toBe(false)
    expect(result.error).toBe('Card is not a Move powerup')
  })

  it('should work even when Move is the only card in hand', () => {
    const store = useCardStore()
    const moveCard = addMovePowerupToHand(store)
    expect(store.hand.length).toBe(1)

    const result = store.playMovePowerup(moveCard.instanceId)

    expect(result.success).toBe(true)
    expect(store.hand.length).toBe(0)
    expect(store.discardPile.length).toBe(1)
  })
})

describe('cardStore Time Trap functionality (CARD-008)', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  function addTimeTrapToHand(store: ReturnType<typeof useCardStore>) {
    // Manually add a Time Trap card to the hand
    const timeTrapCard: CardInstance = {
      id: 'time-trap',
      instanceId: 'time-trap-test-instance',
      type: CardType.TimeTrap,
      name: 'Time Trap',
      description: 'Designate a transit station as a trap. If seekers visit it, you gain bonus time.',
      bonusMinutesWhenTriggered: 15,
    } as CardInstance
    store.hand.push(timeTrapCard)
    return timeTrapCard
  }

  describe('activeTimeTraps initialization', () => {
    it('should initialize with empty active time traps', () => {
      const store = useCardStore()
      expect(store.activeTimeTraps).toEqual([])
    })
  })

  describe('playTimeTrapCard', () => {
    it('should remove Time Trap card from hand', () => {
      const store = useCardStore()
      const timeTrap = addTimeTrapToHand(store)
      const initialHandSize = store.hand.length

      const result = store.playTimeTrapCard(timeTrap.instanceId, 'Main Street Station')

      expect(result.success).toBe(true)
      expect(store.hand.length).toBe(initialHandSize - 1)
    })

    it('should add Time Trap card to discard pile', () => {
      const store = useCardStore()
      const timeTrap = addTimeTrapToHand(store)
      const initialDiscardSize = store.discardPile.length

      store.playTimeTrapCard(timeTrap.instanceId, 'Central Station')

      expect(store.discardPile.length).toBe(initialDiscardSize + 1)
    })

    it('should add trap to active time traps with station name', () => {
      const store = useCardStore()
      const timeTrap = addTimeTrapToHand(store)

      store.playTimeTrapCard(timeTrap.instanceId, 'Library Stop')

      expect(store.activeTimeTraps.length).toBe(1)
      expect(store.activeTimeTraps[0]!.stationName).toBe('Library Stop')
    })

    it('should set isTriggered to false when trap is created', () => {
      const store = useCardStore()
      const timeTrap = addTimeTrapToHand(store)

      store.playTimeTrapCard(timeTrap.instanceId, 'Test Station')

      expect(store.activeTimeTraps[0]!.isTriggered).toBe(false)
    })

    it('should set bonus minutes on the trap', () => {
      const store = useCardStore()
      const timeTrap = addTimeTrapToHand(store)

      store.playTimeTrapCard(timeTrap.instanceId, 'Test Station')

      expect(store.activeTimeTraps[0]!.bonusMinutes).toBe(15)
    })

    it('should assign unique instance ID to trap', () => {
      const store = useCardStore()
      const timeTrap1 = addTimeTrapToHand(store)
      store.playTimeTrapCard(timeTrap1.instanceId, 'Station A')

      const timeTrap2 = addTimeTrapToHand(store)
      store.playTimeTrapCard(timeTrap2.instanceId, 'Station B')

      expect(store.activeTimeTraps[0]!.instanceId).not.toBe(store.activeTimeTraps[1]!.instanceId)
    })

    it('should set createdAt timestamp', () => {
      const store = useCardStore()
      const timeTrap = addTimeTrapToHand(store)
      const beforeTime = new Date()

      store.playTimeTrapCard(timeTrap.instanceId, 'Test Station')

      const afterTime = new Date()
      expect(store.activeTimeTraps[0]!.createdAt.getTime()).toBeGreaterThanOrEqual(beforeTime.getTime())
      expect(store.activeTimeTraps[0]!.createdAt.getTime()).toBeLessThanOrEqual(afterTime.getTime())
    })

    it('should allow multiple traps to be active simultaneously', () => {
      const store = useCardStore()

      const trap1 = addTimeTrapToHand(store)
      store.playTimeTrapCard(trap1.instanceId, 'Station A')

      const trap2 = addTimeTrapToHand(store)
      store.playTimeTrapCard(trap2.instanceId, 'Station B')

      const trap3 = addTimeTrapToHand(store)
      store.playTimeTrapCard(trap3.instanceId, 'Station C')

      expect(store.activeTimeTraps.length).toBe(3)
    })

    it('should return error if card not in hand', () => {
      const store = useCardStore()

      const result = store.playTimeTrapCard('non-existent-id', 'Station X')

      expect(result.success).toBe(false)
      expect(result.error).toBe('Card not found in hand')
    })

    it('should return error if card is not a Time Trap', () => {
      const store = useCardStore()
      // Add a different card type
      const otherCard: CardInstance = {
        id: 'time-bonus-tier-1',
        instanceId: 'test-instance',
        type: CardType.TimeBonus,
        name: 'Time Bonus',
        description: 'Test',
        tier: 1,
        bonusMinutes: { [GameSize.Small]: 2, [GameSize.Medium]: 3, [GameSize.Large]: 5 },
      } as CardInstance
      store.hand.push(otherCard)

      const result = store.playTimeTrapCard(otherCard.instanceId, 'Station X')

      expect(result.success).toBe(false)
      expect(result.error).toBe('Card is not a Time Trap card')
    })

    it('should return error if station name is empty', () => {
      const store = useCardStore()
      const timeTrap = addTimeTrapToHand(store)

      const result = store.playTimeTrapCard(timeTrap.instanceId, '')

      expect(result.success).toBe(false)
      expect(result.error).toBe('Station name is required')
    })

    it('should return error if station name is only whitespace', () => {
      const store = useCardStore()
      const timeTrap = addTimeTrapToHand(store)

      const result = store.playTimeTrapCard(timeTrap.instanceId, '   ')

      expect(result.success).toBe(false)
      expect(result.error).toBe('Station name is required')
    })

    it('should return the played card', () => {
      const store = useCardStore()
      const timeTrap = addTimeTrapToHand(store)

      const result = store.playTimeTrapCard(timeTrap.instanceId, 'Station Y')

      expect(result.playedCard).toBeDefined()
      expect(result.playedCard!.id).toBe('time-trap')
    })
  })

  describe('triggerTimeTrap', () => {
    it('should mark trap as triggered', () => {
      const store = useCardStore()
      const timeTrap = addTimeTrapToHand(store)
      store.playTimeTrapCard(timeTrap.instanceId, 'Test Station')
      const trapId = store.activeTimeTraps[0]!.instanceId

      const result = store.triggerTimeTrap(trapId)

      expect(result.success).toBe(true)
      expect(store.activeTimeTraps[0]!.isTriggered).toBe(true)
    })

    it('should set triggeredAt timestamp', () => {
      const store = useCardStore()
      const timeTrap = addTimeTrapToHand(store)
      store.playTimeTrapCard(timeTrap.instanceId, 'Test Station')
      const trapId = store.activeTimeTraps[0]!.instanceId
      const beforeTime = new Date()

      store.triggerTimeTrap(trapId)

      const afterTime = new Date()
      expect(store.activeTimeTraps[0]!.triggeredAt).toBeDefined()
      expect(store.activeTimeTraps[0]!.triggeredAt!.getTime()).toBeGreaterThanOrEqual(beforeTime.getTime())
      expect(store.activeTimeTraps[0]!.triggeredAt!.getTime()).toBeLessThanOrEqual(afterTime.getTime())
    })

    it('should return bonus minutes when triggered', () => {
      const store = useCardStore()
      const timeTrap = addTimeTrapToHand(store)
      store.playTimeTrapCard(timeTrap.instanceId, 'Test Station')
      const trapId = store.activeTimeTraps[0]!.instanceId

      const result = store.triggerTimeTrap(trapId)

      expect(result.bonusMinutes).toBe(15)
    })

    it('should return error if trap not found', () => {
      const store = useCardStore()

      const result = store.triggerTimeTrap('non-existent-trap')

      expect(result.success).toBe(false)
      expect(result.error).toBe('Time trap not found')
    })

    it('should return error if trap already triggered', () => {
      const store = useCardStore()
      const timeTrap = addTimeTrapToHand(store)
      store.playTimeTrapCard(timeTrap.instanceId, 'Test Station')
      const trapId = store.activeTimeTraps[0]!.instanceId

      store.triggerTimeTrap(trapId)
      const result = store.triggerTimeTrap(trapId)

      expect(result.success).toBe(false)
      expect(result.error).toBe('Time trap has already been triggered')
    })
  })

  describe('getActiveTraps getter', () => {
    it('should return only untriggered traps when filtered', () => {
      const store = useCardStore()

      const trap1 = addTimeTrapToHand(store)
      store.playTimeTrapCard(trap1.instanceId, 'Station A')

      const trap2 = addTimeTrapToHand(store)
      store.playTimeTrapCard(trap2.instanceId, 'Station B')

      // Trigger one trap
      store.triggerTimeTrap(store.activeTimeTraps[0]!.instanceId)

      const untriggeredTraps = store.untriggeredTraps

      expect(untriggeredTraps.length).toBe(1)
      expect(untriggeredTraps[0]!.stationName).toBe('Station B')
    })

    it('should return only triggered traps when filtered', () => {
      const store = useCardStore()

      const trap1 = addTimeTrapToHand(store)
      store.playTimeTrapCard(trap1.instanceId, 'Station A')

      const trap2 = addTimeTrapToHand(store)
      store.playTimeTrapCard(trap2.instanceId, 'Station B')

      // Trigger one trap
      store.triggerTimeTrap(store.activeTimeTraps[0]!.instanceId)

      const triggeredTraps = store.triggeredTraps

      expect(triggeredTraps.length).toBe(1)
      expect(triggeredTraps[0]!.stationName).toBe('Station A')
    })
  })

  describe('totalTimeTrapBonus getter', () => {
    it('should return 0 when no traps have been triggered', () => {
      const store = useCardStore()
      const trap = addTimeTrapToHand(store)
      store.playTimeTrapCard(trap.instanceId, 'Station A')

      expect(store.totalTimeTrapBonus).toBe(0)
    })

    it('should return sum of triggered trap bonuses', () => {
      const store = useCardStore()

      const trap1 = addTimeTrapToHand(store)
      store.playTimeTrapCard(trap1.instanceId, 'Station A')

      const trap2 = addTimeTrapToHand(store)
      store.playTimeTrapCard(trap2.instanceId, 'Station B')

      // Trigger both traps
      store.triggerTimeTrap(store.activeTimeTraps[0]!.instanceId)
      store.triggerTimeTrap(store.activeTimeTraps[1]!.instanceId)

      expect(store.totalTimeTrapBonus).toBe(30) // 15 + 15
    })
  })

  describe('reset clears time traps', () => {
    it('should clear active time traps on reset', () => {
      const store = useCardStore()
      const trap = addTimeTrapToHand(store)
      store.playTimeTrapCard(trap.instanceId, 'Station A')
      expect(store.activeTimeTraps.length).toBe(1)

      store.reset()

      expect(store.activeTimeTraps).toEqual([])
    })
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

  it('should persist active time traps to localStorage', async () => {
    const store = useCardStore()

    // Add a time trap to hand and play it
    const timeTrapCard: CardInstance = {
      id: 'time-trap',
      instanceId: 'time-trap-persist-test',
      type: CardType.TimeTrap,
      name: 'Time Trap',
      description: 'Test trap',
      bonusMinutesWhenTriggered: 15,
    } as CardInstance
    store.hand.push(timeTrapCard)
    store.playTimeTrapCard(timeTrapCard.instanceId, 'Persisted Station')

    // Wait for Vue's watcher to trigger
    await nextTick()

    // State should be persisted to localStorage
    expect(localStorage.setItem).toHaveBeenCalled()

    // Verify persisted data includes time traps
    const persistedKey = Object.keys(mockStorage).find(key => key.includes('cards'))
    expect(persistedKey).toBeDefined()

    const persistedData = JSON.parse(mockStorage[persistedKey!]!)
    expect(persistedData.activeTimeTraps).toBeDefined()
    expect(persistedData.activeTimeTraps.length).toBe(1)
    expect(persistedData.activeTimeTraps[0].stationName).toBe('Persisted Station')
  })

  it('should rehydrate time traps with correct date objects', () => {
    const testDate = new Date('2025-01-15T10:30:00.000Z')
    const triggeredDate = new Date('2025-01-15T11:00:00.000Z')

    mockStorage['jet-lag-stillwater:cards'] = JSON.stringify({
      hand: [],
      handLimit: 6,
      discardPile: [],
      deckComposition: {},
      activeTimeTraps: [{
        instanceId: 'trap-rehydrate-test',
        stationName: 'Rehydrated Station',
        bonusMinutes: 15,
        isTriggered: true,
        createdAt: testDate.toISOString(),
        triggeredAt: triggeredDate.toISOString(),
      }],
    })

    const store = useCardStore()
    store.rehydrate()

    expect(store.activeTimeTraps.length).toBe(1)
    expect(store.activeTimeTraps[0]!.stationName).toBe('Rehydrated Station')
    expect(store.activeTimeTraps[0]!.createdAt).toBeInstanceOf(Date)
    expect(store.activeTimeTraps[0]!.createdAt.toISOString()).toBe(testDate.toISOString())
    expect(store.activeTimeTraps[0]!.triggeredAt).toBeInstanceOf(Date)
    expect(store.activeTimeTraps[0]!.triggeredAt!.toISOString()).toBe(triggeredDate.toISOString())
  })
})
