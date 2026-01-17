/**
 * Tests for CardDrawModal component
 *
 * The CardDrawModal handles the "draw X, keep Y" mechanic from the game rules.
 * When a question is answered, the hider draws cards and selects which to keep.
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, fireEvent, within, cleanup } from '@testing-library/vue'
import { createPinia, setActivePinia } from 'pinia'
import CardDrawModal from '../CardDrawModal.vue'
import { useCardStore, type CardInstance } from '@/stores/cardStore'
import { CardType, PowerupType } from '@/types/card'

// Mock card instances for testing
function createMockCards(count: number): CardInstance[] {
  const cards: CardInstance[] = []
  for (let i = 0; i < count; i++) {
    cards.push({
      id: `card-${i}`,
      instanceId: `instance-${i}`,
      type: i % 3 === 0 ? CardType.TimeBonus : i % 3 === 1 ? CardType.Powerup : CardType.Curse,
      name: `Test Card ${i}`,
      description: `Description for card ${i}`,
      ...(i % 3 === 0 ? { tier: 1, bonusMinutes: { small: 5, medium: 10, large: 15 } } : {}),
      ...(i % 3 === 1 ? { powerupType: PowerupType.Veto, effect: 'Veto effect' } : {}),
      ...(i % 3 === 2
        ? { curseType: 'duration', effectDescription: 'Curse effect', durationMinutes: 10 }
        : {}),
    } as CardInstance)
  }
  return cards
}

// Helper to render with Pinia
function renderWithPinia(
  component: typeof CardDrawModal,
  options: { props: { drawnCards: CardInstance[]; keepCount: number } },
) {
  const pinia = createPinia()
  setActivePinia(pinia)

  return {
    ...render(component, {
      ...options,
      global: {
        plugins: [pinia],
      },
    }),
    pinia,
  }
}

describe('CardDrawModal', () => {
  beforeEach(() => {
    cleanup()
  })

  describe('visibility', () => {
    it('should not render when drawnCards is empty', () => {
      renderWithPinia(CardDrawModal, {
        props: {
          drawnCards: [],
          keepCount: 1,
        },
      })

      expect(screen.queryByTestId('card-draw-modal')).not.toBeInTheDocument()
    })

    it('should render when drawnCards has cards', () => {
      const cards = createMockCards(3)
      renderWithPinia(CardDrawModal, {
        props: {
          drawnCards: cards,
          keepCount: 1,
        },
      })

      expect(screen.getByTestId('card-draw-modal')).toBeInTheDocument()
    })
  })

  describe('card display', () => {
    it('should display all drawn cards', () => {
      const cards = createMockCards(3)
      renderWithPinia(CardDrawModal, {
        props: {
          drawnCards: cards,
          keepCount: 1,
        },
      })

      const drawnCardsContainer = screen.getByTestId('drawn-cards-container')
      const cardElements = within(drawnCardsContainer).getAllByTestId(/^drawn-card-/)
      expect(cardElements).toHaveLength(3)
    })

    it('should show card name for each drawn card', () => {
      const cards = createMockCards(3)
      renderWithPinia(CardDrawModal, {
        props: {
          drawnCards: cards,
          keepCount: 1,
        },
      })

      expect(screen.getByText('Test Card 0')).toBeInTheDocument()
      expect(screen.getByText('Test Card 1')).toBeInTheDocument()
      expect(screen.getByText('Test Card 2')).toBeInTheDocument()
    })

    it('should show visual distinction for different card types', () => {
      const cards = createMockCards(3)
      renderWithPinia(CardDrawModal, {
        props: {
          drawnCards: cards,
          keepCount: 1,
        },
      })

      // Card 0 is TimeBonus, Card 1 is Powerup, Card 2 is Curse
      const card0 = screen.getByTestId('drawn-card-instance-0')
      const card1 = screen.getByTestId('drawn-card-instance-1')
      const card2 = screen.getByTestId('drawn-card-instance-2')

      // They should have different styling classes
      expect(card0.className).toMatch(/green|time-bonus/i)
      expect(card1.className).toMatch(/purple|powerup/i)
      expect(card2.className).toMatch(/red|curse/i)
    })
  })

  describe('keep count display', () => {
    it('should display how many cards to keep', () => {
      const cards = createMockCards(3)
      renderWithPinia(CardDrawModal, {
        props: {
          drawnCards: cards,
          keepCount: 1,
        },
      })

      expect(screen.getByText(/select 1 card/i)).toBeInTheDocument()
    })

    it('should display different keep counts correctly', () => {
      const cards = createMockCards(4)
      renderWithPinia(CardDrawModal, {
        props: {
          drawnCards: cards,
          keepCount: 2,
        },
      })

      expect(screen.getByText(/select 2 cards/i)).toBeInTheDocument()
    })

    it('should show selection counter (e.g., "0/1 selected")', () => {
      const cards = createMockCards(3)
      renderWithPinia(CardDrawModal, {
        props: {
          drawnCards: cards,
          keepCount: 1,
        },
      })

      expect(screen.getByTestId('selection-counter')).toHaveTextContent('0/1')
    })
  })

  describe('card selection', () => {
    it('should allow selecting a card by clicking', async () => {
      const cards = createMockCards(3)
      renderWithPinia(CardDrawModal, {
        props: {
          drawnCards: cards,
          keepCount: 1,
        },
      })

      const card0 = screen.getByTestId('drawn-card-instance-0')
      await fireEvent.click(card0)

      expect(card0).toHaveClass('selected')
    })

    it('should update selection counter when card is selected', async () => {
      const cards = createMockCards(3)
      renderWithPinia(CardDrawModal, {
        props: {
          drawnCards: cards,
          keepCount: 1,
        },
      })

      const card0 = screen.getByTestId('drawn-card-instance-0')
      await fireEvent.click(card0)

      expect(screen.getByTestId('selection-counter')).toHaveTextContent('1/1')
    })

    it('should allow deselecting a card by clicking again', async () => {
      const cards = createMockCards(3)
      renderWithPinia(CardDrawModal, {
        props: {
          drawnCards: cards,
          keepCount: 1,
        },
      })

      const card0 = screen.getByTestId('drawn-card-instance-0')
      await fireEvent.click(card0)
      expect(card0).toHaveClass('selected')

      await fireEvent.click(card0)
      expect(card0).not.toHaveClass('selected')
    })

    it('should prevent selecting more cards than keepCount', async () => {
      const cards = createMockCards(3)
      renderWithPinia(CardDrawModal, {
        props: {
          drawnCards: cards,
          keepCount: 1,
        },
      })

      const card0 = screen.getByTestId('drawn-card-instance-0')
      const card1 = screen.getByTestId('drawn-card-instance-1')

      await fireEvent.click(card0)
      await fireEvent.click(card1)

      // Only card0 should be selected
      expect(card0).toHaveClass('selected')
      expect(card1).not.toHaveClass('selected')
      expect(screen.getByTestId('selection-counter')).toHaveTextContent('1/1')
    })

    it('should allow selecting multiple cards when keepCount > 1', async () => {
      const cards = createMockCards(4)
      renderWithPinia(CardDrawModal, {
        props: {
          drawnCards: cards,
          keepCount: 2,
        },
      })

      const card0 = screen.getByTestId('drawn-card-instance-0')
      const card1 = screen.getByTestId('drawn-card-instance-1')

      await fireEvent.click(card0)
      await fireEvent.click(card1)

      expect(card0).toHaveClass('selected')
      expect(card1).toHaveClass('selected')
      expect(screen.getByTestId('selection-counter')).toHaveTextContent('2/2')
    })
  })

  describe('confirm button', () => {
    it('should display confirm button', () => {
      const cards = createMockCards(3)
      renderWithPinia(CardDrawModal, {
        props: {
          drawnCards: cards,
          keepCount: 1,
        },
      })

      expect(screen.getByRole('button', { name: /confirm/i })).toBeInTheDocument()
    })

    it('should disable confirm button when not enough cards selected', () => {
      const cards = createMockCards(3)
      renderWithPinia(CardDrawModal, {
        props: {
          drawnCards: cards,
          keepCount: 1,
        },
      })

      expect(screen.getByRole('button', { name: /confirm/i })).toBeDisabled()
    })

    it('should enable confirm button when correct number of cards selected', async () => {
      const cards = createMockCards(3)
      renderWithPinia(CardDrawModal, {
        props: {
          drawnCards: cards,
          keepCount: 1,
        },
      })

      const card0 = screen.getByTestId('drawn-card-instance-0')
      await fireEvent.click(card0)

      expect(screen.getByRole('button', { name: /confirm/i })).not.toBeDisabled()
    })

    it('should emit confirm event with selected cards when clicked', async () => {
      const cards = createMockCards(3)
      const { emitted } = renderWithPinia(CardDrawModal, {
        props: {
          drawnCards: cards,
          keepCount: 1,
        },
      })

      const card1 = screen.getByTestId('drawn-card-instance-1')
      await fireEvent.click(card1)

      const confirmBtn = screen.getByRole('button', { name: /confirm/i })
      await fireEvent.click(confirmBtn)

      expect(emitted()).toHaveProperty('confirm')
      const confirmEvents = emitted().confirm
      expect(confirmEvents).toBeDefined()
      expect(confirmEvents![0]).toEqual([
        {
          keptCards: [cards[1]],
          discardedCards: [cards[0], cards[2]],
        },
      ])
    })
  })

  describe('auto-confirm when keepCount equals draw count', () => {
    it('should auto-select all cards when keepCount equals drawn count', () => {
      const cards = createMockCards(2)
      renderWithPinia(CardDrawModal, {
        props: {
          drawnCards: cards,
          keepCount: 2,
        },
      })

      const card0 = screen.getByTestId('drawn-card-instance-0')
      const card1 = screen.getByTestId('drawn-card-instance-1')

      expect(card0).toHaveClass('selected')
      expect(card1).toHaveClass('selected')
    })

    it('should show all cards as selected in message when keep equals draw', () => {
      const cards = createMockCards(2)
      renderWithPinia(CardDrawModal, {
        props: {
          drawnCards: cards,
          keepCount: 2,
        },
      })

      expect(screen.getByText(/keeping all cards/i)).toBeInTheDocument()
    })
  })

  describe('animation feedback', () => {
    it('should show draw animation class when modal first appears', () => {
      const cards = createMockCards(3)
      renderWithPinia(CardDrawModal, {
        props: {
          drawnCards: cards,
          keepCount: 1,
        },
      })

      const modal = screen.getByTestId('card-draw-modal')
      expect(modal).toHaveClass('animate-fade-in')
    })

    it('should show card reveal animation on each card', () => {
      const cards = createMockCards(3)
      renderWithPinia(CardDrawModal, {
        props: {
          drawnCards: cards,
          keepCount: 1,
        },
      })

      const card0 = screen.getByTestId('drawn-card-instance-0')
      const card1 = screen.getByTestId('drawn-card-instance-1')
      const card2 = screen.getByTestId('drawn-card-instance-2')

      expect(card0).toHaveClass('animate-card-reveal')
      expect(card1).toHaveClass('animate-card-reveal')
      expect(card2).toHaveClass('animate-card-reveal')
    })
  })

  describe('hand limit enforcement', () => {
    it('should show warning when kept cards would exceed hand limit', async () => {
      // Scenario: Hand limit 6, hand has 5 OTHER cards + 2 drawn cards = 7 total
      // Keeping 2 of 2 drawn = need 7 slots but only have 6
      // This is an edge case that shouldn't happen in normal flow (drawCards respects limit)
      // but we test the warning logic works correctly
      const pinia = createPinia()
      setActivePinia(pinia)
      const cardStore = useCardStore(pinia)

      // Add 5 "other" cards to hand
      const otherCards = createMockCards(5)
      otherCards.forEach((c, i) => {
        c.instanceId = `other-${i}`
        cardStore.$patch((state) => {
          state.hand.push(c)
        })
      })

      // Add 2 "drawn" cards to hand
      const drawnCards = createMockCards(2)
      for (const card of drawnCards) {
        cardStore.$patch((state) => {
          state.hand.push(card)
        })
      }

      // Hand: 7 cards (5 other + 2 drawn), limit is 6
      // Keeping 2 drawn cards: other cards (5) + kept (2) = 7 > 6
      // effectiveAvailable = availableSlots + drawnCards.length = -1 + 2 = 1
      // keepCount (2) > effectiveAvailable (1) = true, show warning

      render(CardDrawModal, {
        props: {
          drawnCards: drawnCards,
          keepCount: 2,
        },
        global: {
          plugins: [pinia],
        },
      })

      expect(screen.getByTestId('hand-limit-warning')).toBeInTheDocument()
    })

    it('should indicate how many cards must be discarded to fit hand limit', async () => {
      // Same scenario as above, but check the message content
      const pinia = createPinia()
      setActivePinia(pinia)
      const cardStore = useCardStore(pinia)

      // Add 5 "other" cards to hand
      const otherCards = createMockCards(5)
      otherCards.forEach((c, i) => {
        c.instanceId = `other-${i}`
        cardStore.$patch((state) => {
          state.hand.push(c)
        })
      })

      // Add 2 "drawn" cards to hand
      const drawnCards = createMockCards(2)
      for (const card of drawnCards) {
        cardStore.$patch((state) => {
          state.hand.push(card)
        })
      }

      // Hand: 7 cards, keepCount: 2, effectiveAvailable: 1
      // cardsToDiscardFromHand = 2 - 1 = 1

      render(CardDrawModal, {
        props: {
          drawnCards: drawnCards,
          keepCount: 2,
        },
        global: {
          plugins: [pinia],
        },
      })

      expect(screen.getByText(/discard 1 card/i)).toBeInTheDocument()
    })
  })

  describe('header and instructions', () => {
    it('should show descriptive header', () => {
      const cards = createMockCards(3)
      renderWithPinia(CardDrawModal, {
        props: {
          drawnCards: cards,
          keepCount: 1,
        },
      })

      expect(screen.getByRole('heading', { name: /cards drawn/i })).toBeInTheDocument()
    })

    it('should show instructions for selection', () => {
      const cards = createMockCards(3)
      renderWithPinia(CardDrawModal, {
        props: {
          drawnCards: cards,
          keepCount: 1,
        },
      })

      expect(screen.getByText(/select.*to keep/i)).toBeInTheDocument()
    })
  })

  describe('mobile-friendly design', () => {
    it('should have touch-friendly card sizes (min 44px touch targets)', () => {
      const cards = createMockCards(3)
      renderWithPinia(CardDrawModal, {
        props: {
          drawnCards: cards,
          keepCount: 1,
        },
      })

      const card0 = screen.getByTestId('drawn-card-instance-0')
      expect(card0).toHaveClass('min-h-[44px]')
    })

    it('should have touch-friendly confirm button', () => {
      const cards = createMockCards(3)
      renderWithPinia(CardDrawModal, {
        props: {
          drawnCards: cards,
          keepCount: 1,
        },
      })

      const confirmBtn = screen.getByRole('button', { name: /confirm/i })
      expect(confirmBtn).toHaveClass('min-h-[44px]')
    })
  })

  describe('accessibility', () => {
    it('should have proper ARIA labels for modal', () => {
      const cards = createMockCards(3)
      renderWithPinia(CardDrawModal, {
        props: {
          drawnCards: cards,
          keepCount: 1,
        },
      })

      const modal = screen.getByTestId('card-draw-modal')
      expect(modal).toHaveAttribute('role', 'dialog')
      expect(modal).toHaveAttribute('aria-modal', 'true')
      expect(modal).toHaveAttribute('aria-labelledby')
    })

    it('should have proper ARIA labels for selectable cards', () => {
      const cards = createMockCards(3)
      renderWithPinia(CardDrawModal, {
        props: {
          drawnCards: cards,
          keepCount: 1,
        },
      })

      const card0 = screen.getByTestId('drawn-card-instance-0')
      expect(card0).toHaveAttribute('role', 'checkbox')
      expect(card0).toHaveAttribute('aria-checked')
    })
  })

  describe('hand limit warning display (BUG-001)', () => {
    it('should NOT show warning when drawn cards are already in hand and there is room', () => {
      // Simulate the real scenario: drawnCards are already counted in the hand
      // Hand limit is 6, we have 3 drawn cards already in hand
      // We're keeping 2 of them - this should NOT show a warning
      const pinia = createPinia()
      setActivePinia(pinia)
      const cardStore = useCardStore(pinia)

      // The drawn cards that will be passed to the modal
      const drawnCards = createMockCards(3)

      // Add the drawn cards to the hand (simulating what drawCards does)
      for (const card of drawnCards) {
        cardStore.$patch((state) => {
          state.hand.push(card)
        })
      }

      // Now hand has 3/6 cards (the drawnCards), availableSlots = 3
      // But modal will calculate: keepCount (2) > availableSlots (3)? No.
      // However, the bug is that if we had other cards too, it would be wrong.
      // Let's add some other cards to make the scenario clearer.

      // Add 2 more cards to hand (not part of drawnCards)
      const otherCards = createMockCards(2)
      otherCards.forEach((c, i) => {
        c.instanceId = `other-${i}`
        cardStore.$patch((state) => {
          state.hand.push(c)
        })
      })

      // Now hand has 5 cards total (3 drawn + 2 other), availableSlots = 1
      // We're keeping 2 of the 3 drawn cards
      // The WARNING should NOT appear because:
      // - Actual available slots for NEW cards = 1
      // - But we're not adding NEW cards, we're KEEPING 2 of the 3 that are ALREADY in hand
      // - So we're effectively removing 1 from the 3 drawn, ending up with 5-1=4 cards
      // - This is well under the limit of 6

      render(CardDrawModal, {
        props: {
          drawnCards: drawnCards,
          keepCount: 2,
        },
        global: {
          plugins: [pinia],
        },
      })

      // The warning should NOT appear
      expect(screen.queryByTestId('hand-limit-warning')).not.toBeInTheDocument()
    })

    it('should NOT show warning when hand has room after discarding unselected drawn cards', () => {
      // Scenario: Hand limit 6, hand has 5 cards (including 3 drawn)
      // Keeping 1 of 3 drawn = 2 will be discarded
      // Final hand: 5 - 2 = 3 cards, well under limit
      const pinia = createPinia()
      setActivePinia(pinia)
      const cardStore = useCardStore(pinia)

      const drawnCards = createMockCards(3)
      for (const card of drawnCards) {
        cardStore.$patch((state) => {
          state.hand.push(card)
        })
      }

      // Add 2 more cards
      const otherCards = createMockCards(2)
      otherCards.forEach((c, i) => {
        c.instanceId = `other-${i}`
        cardStore.$patch((state) => {
          state.hand.push(c)
        })
      })

      // Hand: 5 cards, availableSlots = 1
      // Keeping 1 drawn card, discarding 2 drawn cards
      // Result: 5 - 2 = 3 cards, no warning needed

      render(CardDrawModal, {
        props: {
          drawnCards: drawnCards,
          keepCount: 1,
        },
        global: {
          plugins: [pinia],
        },
      })

      expect(screen.queryByTestId('hand-limit-warning')).not.toBeInTheDocument()
    })

    it('should show warning ONLY when keeping cards would truly exceed hand limit', () => {
      // Scenario: Hand limit 6, hand has 6 cards (including 2 drawn)
      // We have 4 other cards + 2 drawn cards = 6 total
      // Keeping 2 of 2 drawn = 0 discarded from drawn
      // Final hand: 6 cards = exactly at limit, no warning

      // But if we had 5 other + 2 drawn = 7 (exceeds limit by 1)
      // Keeping 2 of 2 = 0 discarded from drawn
      // Final: 7 cards (but this can't happen in practice because drawCards respects limit)

      // The REAL scenario where warning should show:
      // Hand limit 6, we have 4 other cards, drew 3, kept all 3 = 7 cards
      // But drawCards limits to availableSlots, so max drawn would be 2

      // Let me create a scenario where the warning SHOULD legitimately appear:
      // This would require the hand limit to have been exceeded somehow
      // or the keepCount exceeds what can fit after discards

      // Actually, looking at the code flow:
      // - drawCards already respects hand limit (maxDraw = Math.min(count, availableSlots))
      // - So in normal flow, we can never draw more than available slots
      // - The warning might have been designed for a different scenario

      // Let's test the correct case: hand is full (6/6), all 6 are the "drawn" cards
      // keeping all 6 = no warning (they're already in hand)
      const pinia = createPinia()
      setActivePinia(pinia)
      const cardStore = useCardStore(pinia)

      const drawnCards = createMockCards(6)
      for (const card of drawnCards) {
        cardStore.$patch((state) => {
          state.hand.push(card)
        })
      }

      // Hand: 6/6 cards (all drawn), availableSlots = 0
      // Keeping all 6 - they're already in hand, no warning needed

      render(CardDrawModal, {
        props: {
          drawnCards: drawnCards,
          keepCount: 6,
        },
        global: {
          plugins: [pinia],
        },
      })

      expect(screen.queryByTestId('hand-limit-warning')).not.toBeInTheDocument()
    })

    it('should correctly calculate available space excluding already-drawn cards', () => {
      // The fix should make availableSlots effectively = handLimit - (handCount - drawnCards.length)
      // This means: "how many slots would be available if we removed the drawn cards"
      // Or equivalently: "slots available for keeping" = (handLimit - otherCardsCount)

      const pinia = createPinia()
      setActivePinia(pinia)
      const cardStore = useCardStore(pinia)

      // Add 2 "other" cards to hand first
      const otherCards = createMockCards(2)
      otherCards.forEach((c, i) => {
        c.instanceId = `other-${i}`
        cardStore.$patch((state) => {
          state.hand.push(c)
        })
      })

      // Now add 3 drawn cards
      const drawnCards = createMockCards(3)
      for (const card of drawnCards) {
        cardStore.$patch((state) => {
          state.hand.push(card)
        })
      }

      // Hand: 5 cards total (2 other + 3 drawn), availableSlots = 1
      // But effective available for keeping drawn cards = 6 - 2 = 4
      // Keeping 3 drawn cards (need 3 slots for drawn cards to stay)
      // Since 4 > 3, should NOT show warning

      render(CardDrawModal, {
        props: {
          drawnCards: drawnCards,
          keepCount: 3,
        },
        global: {
          plugins: [pinia],
        },
      })

      expect(screen.queryByTestId('hand-limit-warning')).not.toBeInTheDocument()
    })
  })
})
