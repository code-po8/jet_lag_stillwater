import { describe, it, expect, afterEach, beforeEach, vi } from 'vitest'
import { render, screen, cleanup, within, fireEvent } from '@testing-library/vue'
import { createPinia, setActivePinia } from 'pinia'
import { nextTick } from 'vue'
import CardHand from '../CardHand.vue'
import { useCardStore, type CardInstance } from '@/stores/cardStore'
import { CardType, PowerupType } from '@/types/card'
import { GameSize } from '@/types/question'

// Helper to create card instances for testing
function createTimeBonusCardInstance(tier: number = 1): CardInstance {
  return {
    id: `time-bonus-tier-${tier}`,
    instanceId: `test-time-bonus-${tier}-${Date.now()}`,
    type: CardType.TimeBonus,
    name: `Time Bonus (Tier ${tier})`,
    description: `Adds 2/3/5 minutes (S/M/L) to hiding duration`,
    tier,
    bonusMinutes: {
      [GameSize.Small]: 2 * tier,
      [GameSize.Medium]: 3 * tier,
      [GameSize.Large]: 5 * tier,
    },
  } as CardInstance
}

function createPowerupCardInstance(powerupType: PowerupType = PowerupType.Veto): CardInstance {
  const powerupNames: Record<PowerupType, string> = {
    [PowerupType.Veto]: 'Veto Question',
    [PowerupType.Randomize]: 'Randomize Question',
    [PowerupType.Discard1Draw2]: 'Discard 1, Draw 2',
    [PowerupType.Discard2Draw3]: 'Discard 2, Draw 3',
    [PowerupType.DrawExpand]: 'Draw 1, Expand 1',
    [PowerupType.Duplicate]: 'Duplicate Another Card',
    [PowerupType.Move]: 'Move',
  }

  return {
    id: `powerup-${powerupType}`,
    instanceId: `test-powerup-${powerupType}-${Date.now()}`,
    type: CardType.Powerup,
    name: powerupNames[powerupType],
    description: 'Test powerup description',
    powerupType,
    effect: 'Test effect',
    quantity: 4,
    canPlayDuringEndgame: true,
  } as CardInstance
}

function createCurseCardInstance(id: string = 'curse-test'): CardInstance {
  return {
    id,
    instanceId: `test-curse-${id}-${Date.now()}`,
    type: CardType.Curse,
    name: 'Test Curse',
    description: 'A test curse card',
    effect: 'Test curse effect',
    castingCost: 'Discard a card',
    blocksQuestions: true,
    blocksTransit: false,
    canPlayDuringEndgame: true,
  } as CardInstance
}

describe('CardHand', () => {
  beforeEach(() => {
    // Create a fresh Pinia instance before each test
    setActivePinia(createPinia())
  })

  afterEach(() => {
    cleanup()
  })

  describe('empty hand display', () => {
    it('should show empty state when hand is empty', () => {
      render(CardHand)

      expect(screen.getByText(/no cards in hand/i)).toBeInTheDocument()
    })

    it('should show hand limit indicator when empty', () => {
      render(CardHand)

      // Should show "0/6 cards" or similar
      expect(screen.getByText(/0\/6/)).toBeInTheDocument()
    })
  })

  describe('card display', () => {
    it('should display cards in hand', async () => {
      render(CardHand)
      const store = useCardStore()

      // Manually add cards to the hand
      const timeBonus = createTimeBonusCardInstance(1)
      store.hand.push(timeBonus)

      await nextTick()

      // Should show the card
      expect(screen.getByTestId(`card-${timeBonus.instanceId}`)).toBeInTheDocument()
    })

    it('should show card type for each card', async () => {
      render(CardHand)
      const store = useCardStore()

      const timeBonus = createTimeBonusCardInstance(1)
      store.hand.push(timeBonus)

      await nextTick()

      // Should indicate it's a time bonus card (the badge text)
      const cardElement = screen.getByTestId(`card-${timeBonus.instanceId}`)
      // Look for the badge specifically - it's the span with specific classes
      const badges = within(cardElement).getAllByText(/time bonus/i)
      // Should have at least one (the type badge)
      expect(badges.length).toBeGreaterThan(0)
    })

    it('should show card name for each card', async () => {
      render(CardHand)
      const store = useCardStore()

      const powerup = createPowerupCardInstance(PowerupType.Veto)
      store.hand.push(powerup)

      await nextTick()

      // Should show the card name
      const cardElement = screen.getByTestId(`card-${powerup.instanceId}`)
      expect(within(cardElement).getByText(/veto question/i)).toBeInTheDocument()
    })

    it('should show effect summary for powerup cards', async () => {
      render(CardHand)
      const store = useCardStore()

      const powerup = createPowerupCardInstance(PowerupType.Veto)
      // Update description to match what we expect to find
      powerup.description = 'Decline to answer a question'
      store.hand.push(powerup)

      await nextTick()

      // Should show the effect or description
      const cardElement = screen.getByTestId(`card-${powerup.instanceId}`)
      expect(within(cardElement).getByText(/decline to answer/i)).toBeInTheDocument()
    })

    it('should show effect summary for curse cards', async () => {
      render(CardHand)
      const store = useCardStore()

      const curse = createCurseCardInstance('curse-lemon-phylactery')
      curse.name = 'Lemon Phylactery'
      curse.description = 'Seekers must find and wear lemons'
      store.hand.push(curse)

      await nextTick()

      const cardElement = screen.getByTestId(`card-${curse.instanceId}`)
      expect(within(cardElement).getByText(/seekers must find and wear lemons/i)).toBeInTheDocument()
    })
  })

  describe('visual distinction by card type', () => {
    it('should visually distinguish time bonus cards', async () => {
      render(CardHand)
      const store = useCardStore()

      const timeBonus = createTimeBonusCardInstance(1)
      store.hand.push(timeBonus)

      await nextTick()

      const cardElement = screen.getByTestId(`card-${timeBonus.instanceId}`)
      // Time bonus cards should have a distinct color class (green)
      expect(cardElement).toHaveClass('card-time-bonus')
    })

    it('should visually distinguish powerup cards', async () => {
      render(CardHand)
      const store = useCardStore()

      const powerup = createPowerupCardInstance(PowerupType.Veto)
      store.hand.push(powerup)

      await nextTick()

      const cardElement = screen.getByTestId(`card-${powerup.instanceId}`)
      // Powerup cards should have a distinct color class (blue)
      expect(cardElement).toHaveClass('card-powerup')
    })

    it('should visually distinguish curse cards', async () => {
      render(CardHand)
      const store = useCardStore()

      const curse = createCurseCardInstance()
      store.hand.push(curse)

      await nextTick()

      const cardElement = screen.getByTestId(`card-${curse.instanceId}`)
      // Curse cards should have a distinct color class (purple/red)
      expect(cardElement).toHaveClass('card-curse')
    })
  })

  describe('hand limit indicator', () => {
    it('should show current card count and limit', async () => {
      render(CardHand)
      const store = useCardStore()

      // Add 3 cards
      store.hand.push(createTimeBonusCardInstance(1))
      store.hand.push(createPowerupCardInstance(PowerupType.Veto))
      store.hand.push(createCurseCardInstance())

      await nextTick()

      // Should show "3/6 cards"
      expect(screen.getByText(/3\/6/)).toBeInTheDocument()
    })

    it('should update when hand limit is expanded', async () => {
      render(CardHand)
      const store = useCardStore()

      // Add 3 cards and expand hand limit
      store.hand.push(createTimeBonusCardInstance(1))
      store.hand.push(createPowerupCardInstance(PowerupType.Veto))
      store.hand.push(createCurseCardInstance())
      store.expandHandLimit(2) // Now limit is 8

      await nextTick()

      // Should show "3/8 cards"
      expect(screen.getByText(/3\/8/)).toBeInTheDocument()
    })

    it('should indicate when hand is full', async () => {
      render(CardHand)
      const store = useCardStore()

      // Fill the hand to capacity (6 cards)
      for (let i = 0; i < 6; i++) {
        store.hand.push(createTimeBonusCardInstance(i + 1))
      }

      await nextTick()

      // Should show "6/6" and some visual indicator of full
      expect(screen.getByText(/6\/6/)).toBeInTheDocument()
      expect(screen.getByTestId('hand-limit-indicator')).toHaveClass('hand-full')
    })
  })

  describe('card selection and details', () => {
    it('should emit cardSelect event when card is tapped', async () => {
      const onCardSelect = vi.fn()
      render(CardHand, {
        props: {
          onCardSelect,
        },
      })
      const store = useCardStore()

      const timeBonus = createTimeBonusCardInstance(1)
      store.hand.push(timeBonus)

      await nextTick()

      const cardElement = screen.getByTestId(`card-${timeBonus.instanceId}`)
      await fireEvent.click(cardElement)

      expect(onCardSelect).toHaveBeenCalledWith(timeBonus)
    })

    it('should have touch-friendly card elements', async () => {
      render(CardHand)
      const store = useCardStore()

      const timeBonus = createTimeBonusCardInstance(1)
      store.hand.push(timeBonus)

      await nextTick()

      const cardElement = screen.getByTestId(`card-${timeBonus.instanceId}`)
      // Should be clickable/tappable
      expect(cardElement.getAttribute('role')).toBe('button')
      expect(cardElement.getAttribute('tabindex')).toBe('0')
    })
  })

  describe('mobile-friendly layout', () => {
    it('should render cards in a grid/scrollable layout', () => {
      render(CardHand)

      const container = screen.getByTestId('card-hand-container')
      expect(container).toBeInTheDocument()
      // Container should have proper scrolling/grid classes
      expect(container.className).toMatch(/grid|flex|overflow/)
    })

    it('should be scrollable when many cards in hand', async () => {
      render(CardHand)
      const store = useCardStore()

      // Expand hand limit and add many cards
      store.expandHandLimit(10)
      for (let i = 0; i < 10; i++) {
        store.hand.push(createTimeBonusCardInstance((i % 5) + 1))
      }

      await nextTick()

      // Container should allow scrolling
      const container = screen.getByTestId('card-hand-container')
      expect(container.className).toMatch(/overflow/)
    })
  })

  describe('time bonus display', () => {
    it('should show bonus minutes for time bonus cards', async () => {
      render(CardHand, {
        props: {
          gameSize: GameSize.Small,
        },
      })
      const store = useCardStore()

      const timeBonus = createTimeBonusCardInstance(2)
      timeBonus.bonusMinutes = {
        [GameSize.Small]: 4,
        [GameSize.Medium]: 6,
        [GameSize.Large]: 10,
      }
      store.hand.push(timeBonus)

      await nextTick()

      const cardElement = screen.getByTestId(`card-${timeBonus.instanceId}`)
      // Should show "+4 min" for small game size
      expect(within(cardElement).getByText(/\+4\s*min/i)).toBeInTheDocument()
    })
  })

  describe('accessibility', () => {
    it('should have proper ARIA labels', async () => {
      render(CardHand)
      const store = useCardStore()

      const timeBonus = createTimeBonusCardInstance(1)
      store.hand.push(timeBonus)

      await nextTick()

      const cardElement = screen.getByTestId(`card-${timeBonus.instanceId}`)
      expect(cardElement).toHaveAttribute('aria-label')
    })

    it('should support keyboard navigation', async () => {
      const onCardSelect = vi.fn()
      render(CardHand, {
        props: {
          onCardSelect,
        },
      })
      const store = useCardStore()

      const timeBonus = createTimeBonusCardInstance(1)
      store.hand.push(timeBonus)

      await nextTick()

      const cardElement = screen.getByTestId(`card-${timeBonus.instanceId}`)
      await fireEvent.keyDown(cardElement, { key: 'Enter' })

      expect(onCardSelect).toHaveBeenCalledWith(timeBonus)
    })
  })
})
