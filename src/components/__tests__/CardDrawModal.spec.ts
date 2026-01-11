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
      ...(i % 3 === 2 ? { curseType: 'duration', effectDescription: 'Curse effect', durationMinutes: 10 } : {}),
    } as CardInstance)
  }
  return cards
}

// Helper to render with Pinia
function renderWithPinia(
  component: typeof CardDrawModal,
  options: { props: { drawnCards: CardInstance[]; keepCount: number } }
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
      // Set up store with filled hand BEFORE rendering
      const pinia = createPinia()
      setActivePinia(pinia)
      const cardStore = useCardStore(pinia)
      cardStore.drawCards(5) // Fill hand to 5 cards (only 1 slot available)

      render(CardDrawModal, {
        props: {
          drawnCards: createMockCards(3),
          keepCount: 2, // Would need 2 slots but only 1 available
        },
        global: {
          plugins: [pinia],
        },
      })

      expect(screen.getByTestId('hand-limit-warning')).toBeInTheDocument()
    })

    it('should indicate how many cards must be discarded to fit hand limit', async () => {
      const { pinia } = renderWithPinia(CardDrawModal, {
        props: {
          drawnCards: createMockCards(3),
          keepCount: 2,
        },
      })

      // Fill hand to 5 cards
      const cardStore = useCardStore(pinia)
      cardStore.drawCards(5)

      // Re-render with filled hand - the reactive state should update
      cleanup()
      const pinia2 = createPinia()
      setActivePinia(pinia2)
      const cardStore2 = useCardStore(pinia2)
      cardStore2.drawCards(5)

      render(CardDrawModal, {
        props: {
          drawnCards: createMockCards(3),
          keepCount: 2,
        },
        global: {
          plugins: [pinia2],
        },
      })

      // Available slots = 1, keeping 2, so need to discard 1 from hand
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
})
