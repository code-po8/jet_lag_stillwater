import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import PowerupDiscardDrawModal from '../PowerupDiscardDrawModal.vue'
import { useCardStore, type CardInstance } from '@/stores/cardStore'
import { CardType, PowerupType } from '@/types/card'
import { GameSize } from '@/types/question'

// Helper to create a mock card instance
function createMockCard(
  type: CardType,
  id: string,
  name: string,
  instanceId?: string
): CardInstance {
  const base = {
    id,
    instanceId: instanceId ?? `instance-${id}-${Date.now()}`,
    name,
    description: `Test ${name}`,
  }

  if (type === CardType.TimeBonus) {
    return {
      ...base,
      type: CardType.TimeBonus,
      tier: 1,
      bonusMinutes: {
        [GameSize.Small]: 2,
        [GameSize.Medium]: 3,
        [GameSize.Large]: 5,
      },
    } as CardInstance
  }

  if (type === CardType.Powerup) {
    return {
      ...base,
      type: CardType.Powerup,
      powerupType: PowerupType.Discard1Draw2,
      effect: 'Discard 1, draw 2',
      quantity: 4,
      canPlayDuringEndgame: true,
    } as CardInstance
  }

  return {
    ...base,
    type: CardType.Curse,
    effect: 'Test curse effect',
    castingCost: 'Discard a card',
    blocksQuestions: false,
    blocksTransit: false,
    canPlayDuringEndgame: true,
  } as CardInstance
}

// Create a Discard 1 Draw 2 powerup card
function createDiscard1Draw2Card(instanceId?: string): CardInstance {
  return {
    id: 'powerup-discard-1-draw-2',
    instanceId: instanceId ?? `instance-d1d2-${Date.now()}`,
    type: CardType.Powerup,
    name: 'Discard 1, Draw 2',
    description: 'Trade one card for two',
    powerupType: PowerupType.Discard1Draw2,
    effect: 'Discard one other card from your hand. Then, draw and keep two cards from the hider deck.',
    quantity: 4,
    canPlayDuringEndgame: true,
  } as CardInstance
}

// Create a Discard 2 Draw 3 powerup card
function createDiscard2Draw3Card(instanceId?: string): CardInstance {
  return {
    id: 'powerup-discard-2-draw-3',
    instanceId: instanceId ?? `instance-d2d3-${Date.now()}`,
    type: CardType.Powerup,
    name: 'Discard 2, Draw 3',
    description: 'Trade two cards for three',
    powerupType: PowerupType.Discard2Draw3,
    effect: 'Discard two other cards from your hand. Then, draw and keep three cards from the hider deck.',
    quantity: 4,
    canPlayDuringEndgame: true,
  } as CardInstance
}

describe('PowerupDiscardDrawModal', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  describe('visibility', () => {
    it('should not render when powerupCard is null', () => {
      const wrapper = mount(PowerupDiscardDrawModal, {
        props: {
          powerupCard: null,
          selectableCards: [],
        },
      })

      expect(wrapper.find('[data-testid="discard-draw-modal"]').exists()).toBe(false)
    })

    it('should render when powerupCard is provided', () => {
      const powerupCard = createDiscard1Draw2Card()
      const cardStore = useCardStore()
      // Add some cards to the hand
      cardStore.hand.push(createMockCard(CardType.TimeBonus, 'tb-1', 'Time Bonus 1'))
      cardStore.hand.push(createMockCard(CardType.TimeBonus, 'tb-2', 'Time Bonus 2'))

      const wrapper = mount(PowerupDiscardDrawModal, {
        props: {
          powerupCard,
          selectableCards: cardStore.hand,
        },
      })

      expect(wrapper.find('[data-testid="discard-draw-modal"]').exists()).toBe(true)
    })
  })

  describe('header and instructions', () => {
    it('should display the powerup card name in header', () => {
      const powerupCard = createDiscard1Draw2Card()
      const wrapper = mount(PowerupDiscardDrawModal, {
        props: {
          powerupCard,
          selectableCards: [createMockCard(CardType.TimeBonus, 'tb-1', 'Time Bonus 1')],
        },
      })

      expect(wrapper.text()).toContain('Discard 1, Draw 2')
    })

    it('should display instructions for Discard 1 Draw 2', () => {
      const powerupCard = createDiscard1Draw2Card()
      const wrapper = mount(PowerupDiscardDrawModal, {
        props: {
          powerupCard,
          selectableCards: [createMockCard(CardType.TimeBonus, 'tb-1', 'Time Bonus 1')],
        },
      })

      expect(wrapper.text()).toContain('Select 1 card to discard')
    })

    it('should display instructions for Discard 2 Draw 3', () => {
      const powerupCard = createDiscard2Draw3Card()
      const cards = [
        createMockCard(CardType.TimeBonus, 'tb-1', 'Time Bonus 1'),
        createMockCard(CardType.TimeBonus, 'tb-2', 'Time Bonus 2'),
      ]
      const wrapper = mount(PowerupDiscardDrawModal, {
        props: {
          powerupCard,
          selectableCards: cards,
        },
      })

      expect(wrapper.text()).toContain('Select 2 cards to discard')
    })
  })

  describe('card selection for discard', () => {
    it('should display all selectable cards', () => {
      const powerupCard = createDiscard1Draw2Card()
      const cards = [
        createMockCard(CardType.TimeBonus, 'tb-1', 'Time Bonus 1', 'inst-1'),
        createMockCard(CardType.TimeBonus, 'tb-2', 'Time Bonus 2', 'inst-2'),
        createMockCard(CardType.Curse, 'curse-1', 'Test Curse', 'inst-3'),
      ]

      const wrapper = mount(PowerupDiscardDrawModal, {
        props: {
          powerupCard,
          selectableCards: cards,
        },
      })

      expect(wrapper.findAll('[data-testid^="selectable-card-"]').length).toBe(3)
    })

    it('should allow selecting a card for discard', async () => {
      const powerupCard = createDiscard1Draw2Card()
      const cards = [
        createMockCard(CardType.TimeBonus, 'tb-1', 'Time Bonus 1', 'inst-1'),
        createMockCard(CardType.TimeBonus, 'tb-2', 'Time Bonus 2', 'inst-2'),
      ]

      const wrapper = mount(PowerupDiscardDrawModal, {
        props: {
          powerupCard,
          selectableCards: cards,
        },
      })

      await wrapper.find('[data-testid="selectable-card-inst-1"]').trigger('click')

      expect(wrapper.find('[data-testid="selectable-card-inst-1"]').classes()).toContain('selected')
    })

    it('should allow deselecting a card', async () => {
      const powerupCard = createDiscard1Draw2Card()
      const cards = [
        createMockCard(CardType.TimeBonus, 'tb-1', 'Time Bonus 1', 'inst-1'),
      ]

      const wrapper = mount(PowerupDiscardDrawModal, {
        props: {
          powerupCard,
          selectableCards: cards,
        },
      })

      // Select then deselect
      await wrapper.find('[data-testid="selectable-card-inst-1"]').trigger('click')
      await wrapper.find('[data-testid="selectable-card-inst-1"]').trigger('click')

      expect(wrapper.find('[data-testid="selectable-card-inst-1"]').classes()).not.toContain('selected')
    })

    it('should prevent selecting more cards than required for Discard 1 Draw 2', async () => {
      const powerupCard = createDiscard1Draw2Card()
      const cards = [
        createMockCard(CardType.TimeBonus, 'tb-1', 'Time Bonus 1', 'inst-1'),
        createMockCard(CardType.TimeBonus, 'tb-2', 'Time Bonus 2', 'inst-2'),
        createMockCard(CardType.TimeBonus, 'tb-3', 'Time Bonus 3', 'inst-3'),
      ]

      const wrapper = mount(PowerupDiscardDrawModal, {
        props: {
          powerupCard,
          selectableCards: cards,
        },
      })

      // Select first card
      await wrapper.find('[data-testid="selectable-card-inst-1"]').trigger('click')
      // Try to select second card (should not be allowed for Discard 1 Draw 2)
      await wrapper.find('[data-testid="selectable-card-inst-2"]').trigger('click')

      // Only first card should be selected
      expect(wrapper.find('[data-testid="selectable-card-inst-1"]').classes()).toContain('selected')
      expect(wrapper.find('[data-testid="selectable-card-inst-2"]').classes()).not.toContain('selected')
    })

    it('should allow selecting two cards for Discard 2 Draw 3', async () => {
      const powerupCard = createDiscard2Draw3Card()
      const cards = [
        createMockCard(CardType.TimeBonus, 'tb-1', 'Time Bonus 1', 'inst-1'),
        createMockCard(CardType.TimeBonus, 'tb-2', 'Time Bonus 2', 'inst-2'),
        createMockCard(CardType.TimeBonus, 'tb-3', 'Time Bonus 3', 'inst-3'),
      ]

      const wrapper = mount(PowerupDiscardDrawModal, {
        props: {
          powerupCard,
          selectableCards: cards,
        },
      })

      await wrapper.find('[data-testid="selectable-card-inst-1"]').trigger('click')
      await wrapper.find('[data-testid="selectable-card-inst-2"]').trigger('click')

      expect(wrapper.find('[data-testid="selectable-card-inst-1"]').classes()).toContain('selected')
      expect(wrapper.find('[data-testid="selectable-card-inst-2"]').classes()).toContain('selected')
    })

    it('should show selection counter', () => {
      const powerupCard = createDiscard1Draw2Card()
      const cards = [
        createMockCard(CardType.TimeBonus, 'tb-1', 'Time Bonus 1', 'inst-1'),
      ]

      const wrapper = mount(PowerupDiscardDrawModal, {
        props: {
          powerupCard,
          selectableCards: cards,
        },
      })

      expect(wrapper.find('[data-testid="selection-counter"]').text()).toContain('0/1')
    })

    it('should update selection counter when card is selected', async () => {
      const powerupCard = createDiscard1Draw2Card()
      const cards = [
        createMockCard(CardType.TimeBonus, 'tb-1', 'Time Bonus 1', 'inst-1'),
      ]

      const wrapper = mount(PowerupDiscardDrawModal, {
        props: {
          powerupCard,
          selectableCards: cards,
        },
      })

      await wrapper.find('[data-testid="selectable-card-inst-1"]').trigger('click')

      expect(wrapper.find('[data-testid="selection-counter"]').text()).toContain('1/1')
    })
  })

  describe('confirm button', () => {
    it('should display confirm button', () => {
      const powerupCard = createDiscard1Draw2Card()
      const cards = [createMockCard(CardType.TimeBonus, 'tb-1', 'Time Bonus 1', 'inst-1')]

      const wrapper = mount(PowerupDiscardDrawModal, {
        props: {
          powerupCard,
          selectableCards: cards,
        },
      })

      expect(wrapper.find('[data-testid="confirm-discard-btn"]').exists()).toBe(true)
    })

    it('should disable confirm button when not enough cards selected', () => {
      const powerupCard = createDiscard1Draw2Card()
      const cards = [createMockCard(CardType.TimeBonus, 'tb-1', 'Time Bonus 1', 'inst-1')]

      const wrapper = mount(PowerupDiscardDrawModal, {
        props: {
          powerupCard,
          selectableCards: cards,
        },
      })

      expect(wrapper.find('[data-testid="confirm-discard-btn"]').attributes('disabled')).toBeDefined()
    })

    it('should enable confirm button when correct number of cards selected', async () => {
      const powerupCard = createDiscard1Draw2Card()
      const cards = [createMockCard(CardType.TimeBonus, 'tb-1', 'Time Bonus 1', 'inst-1')]

      const wrapper = mount(PowerupDiscardDrawModal, {
        props: {
          powerupCard,
          selectableCards: cards,
        },
      })

      await wrapper.find('[data-testid="selectable-card-inst-1"]').trigger('click')

      expect(wrapper.find('[data-testid="confirm-discard-btn"]').attributes('disabled')).toBeUndefined()
    })

    it('should emit confirm event with selected cards when clicked', async () => {
      const powerupCard = createDiscard1Draw2Card()
      const card1 = createMockCard(CardType.TimeBonus, 'tb-1', 'Time Bonus 1', 'inst-1')
      const cards = [card1]

      const wrapper = mount(PowerupDiscardDrawModal, {
        props: {
          powerupCard,
          selectableCards: cards,
        },
      })

      await wrapper.find('[data-testid="selectable-card-inst-1"]').trigger('click')
      await wrapper.find('[data-testid="confirm-discard-btn"]').trigger('click')

      expect(wrapper.emitted('confirm')).toBeTruthy()
      expect(wrapper.emitted('confirm')![0]).toEqual([[card1]])
    })
  })

  describe('cancel button', () => {
    it('should display cancel button', () => {
      const powerupCard = createDiscard1Draw2Card()
      const cards = [createMockCard(CardType.TimeBonus, 'tb-1', 'Time Bonus 1', 'inst-1')]

      const wrapper = mount(PowerupDiscardDrawModal, {
        props: {
          powerupCard,
          selectableCards: cards,
        },
      })

      expect(wrapper.find('[data-testid="cancel-btn"]').exists()).toBe(true)
    })

    it('should emit cancel event when clicked', async () => {
      const powerupCard = createDiscard1Draw2Card()
      const cards = [createMockCard(CardType.TimeBonus, 'tb-1', 'Time Bonus 1', 'inst-1')]

      const wrapper = mount(PowerupDiscardDrawModal, {
        props: {
          powerupCard,
          selectableCards: cards,
        },
      })

      await wrapper.find('[data-testid="cancel-btn"]').trigger('click')

      expect(wrapper.emitted('cancel')).toBeTruthy()
    })
  })

  describe('not enough cards warning', () => {
    it('should show warning when not enough cards to play Discard 2 Draw 3', () => {
      const powerupCard = createDiscard2Draw3Card()
      // Only 1 card available, but need 2 to discard
      const cards = [createMockCard(CardType.TimeBonus, 'tb-1', 'Time Bonus 1', 'inst-1')]

      const wrapper = mount(PowerupDiscardDrawModal, {
        props: {
          powerupCard,
          selectableCards: cards,
        },
      })

      expect(wrapper.find('[data-testid="not-enough-cards-warning"]').exists()).toBe(true)
    })

    it('should not show warning when enough cards available', () => {
      const powerupCard = createDiscard2Draw3Card()
      const cards = [
        createMockCard(CardType.TimeBonus, 'tb-1', 'Time Bonus 1', 'inst-1'),
        createMockCard(CardType.TimeBonus, 'tb-2', 'Time Bonus 2', 'inst-2'),
      ]

      const wrapper = mount(PowerupDiscardDrawModal, {
        props: {
          powerupCard,
          selectableCards: cards,
        },
      })

      expect(wrapper.find('[data-testid="not-enough-cards-warning"]').exists()).toBe(false)
    })
  })

  describe('draw count display', () => {
    it('should display how many cards will be drawn for Discard 1 Draw 2', () => {
      const powerupCard = createDiscard1Draw2Card()
      const cards = [createMockCard(CardType.TimeBonus, 'tb-1', 'Time Bonus 1', 'inst-1')]

      const wrapper = mount(PowerupDiscardDrawModal, {
        props: {
          powerupCard,
          selectableCards: cards,
        },
      })

      expect(wrapper.text()).toContain('draw 2')
    })

    it('should display how many cards will be drawn for Discard 2 Draw 3', () => {
      const powerupCard = createDiscard2Draw3Card()
      const cards = [
        createMockCard(CardType.TimeBonus, 'tb-1', 'Time Bonus 1', 'inst-1'),
        createMockCard(CardType.TimeBonus, 'tb-2', 'Time Bonus 2', 'inst-2'),
      ]

      const wrapper = mount(PowerupDiscardDrawModal, {
        props: {
          powerupCard,
          selectableCards: cards,
        },
      })

      expect(wrapper.text()).toContain('draw 3')
    })
  })

  describe('mobile-friendly design', () => {
    it('should have touch-friendly card sizes (min 44px)', () => {
      const powerupCard = createDiscard1Draw2Card()
      const cards = [createMockCard(CardType.TimeBonus, 'tb-1', 'Time Bonus 1', 'inst-1')]

      const wrapper = mount(PowerupDiscardDrawModal, {
        props: {
          powerupCard,
          selectableCards: cards,
        },
      })

      const card = wrapper.find('[data-testid="selectable-card-inst-1"]')
      expect(card.classes()).toContain('min-h-11') // 44px = h-11 in Tailwind
    })

    it('should have touch-friendly confirm button', () => {
      const powerupCard = createDiscard1Draw2Card()
      const cards = [createMockCard(CardType.TimeBonus, 'tb-1', 'Time Bonus 1', 'inst-1')]

      const wrapper = mount(PowerupDiscardDrawModal, {
        props: {
          powerupCard,
          selectableCards: cards,
        },
      })

      const btn = wrapper.find('[data-testid="confirm-discard-btn"]')
      expect(btn.classes()).toContain('min-h-11')
    })
  })

  describe('accessibility', () => {
    it('should have proper ARIA labels for modal', () => {
      const powerupCard = createDiscard1Draw2Card()
      const cards = [createMockCard(CardType.TimeBonus, 'tb-1', 'Time Bonus 1', 'inst-1')]

      const wrapper = mount(PowerupDiscardDrawModal, {
        props: {
          powerupCard,
          selectableCards: cards,
        },
      })

      const modal = wrapper.find('[data-testid="discard-draw-modal"]')
      expect(modal.attributes('role')).toBe('dialog')
      expect(modal.attributes('aria-modal')).toBe('true')
      expect(modal.attributes('aria-labelledby')).toBeTruthy()
    })

    it('should have proper ARIA labels for selectable cards', () => {
      const powerupCard = createDiscard1Draw2Card()
      const cards = [createMockCard(CardType.TimeBonus, 'tb-1', 'Time Bonus 1', 'inst-1')]

      const wrapper = mount(PowerupDiscardDrawModal, {
        props: {
          powerupCard,
          selectableCards: cards,
        },
      })

      const card = wrapper.find('[data-testid="selectable-card-inst-1"]')
      expect(card.attributes('role')).toBe('checkbox')
      expect(card.attributes('aria-checked')).toBeTruthy()
    })
  })
})
