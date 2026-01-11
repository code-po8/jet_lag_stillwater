import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import PowerupDrawExpandModal from '../PowerupDrawExpandModal.vue'
import { useCardStore, type CardInstance } from '@/stores/cardStore'
import { CardType, PowerupType } from '@/types/card'
import { GameSize } from '@/types/question'

// Create a Draw 1, Expand powerup card
function createDrawExpandCard(instanceId?: string): CardInstance {
  return {
    id: 'powerup-draw-expand',
    instanceId: instanceId ?? `instance-draw-expand-${Date.now()}`,
    type: CardType.Powerup,
    name: 'Draw 1, Expand 1',
    description: 'Draw a card and expand hand size',
    powerupType: PowerupType.DrawExpand,
    effect: 'Draw one card from the hider deck. For the rest of the round, you can hold one additional card in your hand.',
    quantity: 2,
    canPlayDuringEndgame: true,
  } as CardInstance
}

// Helper to create a mock time bonus card
function createMockTimeBonusCard(instanceId?: string): CardInstance {
  return {
    id: 'time-bonus-tier-1',
    instanceId: instanceId ?? `instance-tb-${Date.now()}`,
    type: CardType.TimeBonus,
    name: 'Time Bonus (Tier 1)',
    description: 'Adds 2/3/5 minutes (S/M/L) to hiding duration',
    tier: 1,
    bonusMinutes: {
      [GameSize.Small]: 2,
      [GameSize.Medium]: 3,
      [GameSize.Large]: 5,
    },
  } as CardInstance
}

describe('PowerupDrawExpandModal', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  describe('visibility', () => {
    it('should not render when powerupCard is null', () => {
      const wrapper = mount(PowerupDrawExpandModal, {
        props: {
          powerupCard: null,
          currentHandLimit: 6,
        },
      })

      expect(wrapper.find('[data-testid="draw-expand-modal"]').exists()).toBe(false)
    })

    it('should render when powerupCard is provided', () => {
      const powerupCard = createDrawExpandCard()

      const wrapper = mount(PowerupDrawExpandModal, {
        props: {
          powerupCard,
          currentHandLimit: 6,
        },
      })

      expect(wrapper.find('[data-testid="draw-expand-modal"]').exists()).toBe(true)
    })
  })

  describe('header and content', () => {
    it('should display the powerup card name in header', () => {
      const powerupCard = createDrawExpandCard()

      const wrapper = mount(PowerupDrawExpandModal, {
        props: {
          powerupCard,
          currentHandLimit: 6,
        },
      })

      expect(wrapper.text()).toContain('Draw 1, Expand 1')
    })

    it('should display the card effect description', () => {
      const powerupCard = createDrawExpandCard()

      const wrapper = mount(PowerupDrawExpandModal, {
        props: {
          powerupCard,
          currentHandLimit: 6,
        },
      })

      expect(wrapper.text()).toContain('Draw one card')
      expect(wrapper.text()).toContain('one additional card')
    })

    it('should show current hand limit', () => {
      const powerupCard = createDrawExpandCard()

      const wrapper = mount(PowerupDrawExpandModal, {
        props: {
          powerupCard,
          currentHandLimit: 6,
        },
      })

      expect(wrapper.find('[data-testid="current-hand-limit"]').text()).toContain('6')
    })

    it('should show new hand limit after playing', () => {
      const powerupCard = createDrawExpandCard()

      const wrapper = mount(PowerupDrawExpandModal, {
        props: {
          powerupCard,
          currentHandLimit: 6,
        },
      })

      expect(wrapper.find('[data-testid="new-hand-limit"]').text()).toContain('7')
    })
  })

  describe('confirm button', () => {
    it('should display confirm button', () => {
      const powerupCard = createDrawExpandCard()

      const wrapper = mount(PowerupDrawExpandModal, {
        props: {
          powerupCard,
          currentHandLimit: 6,
        },
      })

      expect(wrapper.find('[data-testid="confirm-draw-expand-btn"]').exists()).toBe(true)
    })

    it('should emit confirm event when clicked', async () => {
      const powerupCard = createDrawExpandCard()

      const wrapper = mount(PowerupDrawExpandModal, {
        props: {
          powerupCard,
          currentHandLimit: 6,
        },
      })

      await wrapper.find('[data-testid="confirm-draw-expand-btn"]').trigger('click')

      expect(wrapper.emitted('confirm')).toBeTruthy()
    })
  })

  describe('cancel button', () => {
    it('should display cancel button', () => {
      const powerupCard = createDrawExpandCard()

      const wrapper = mount(PowerupDrawExpandModal, {
        props: {
          powerupCard,
          currentHandLimit: 6,
        },
      })

      expect(wrapper.find('[data-testid="cancel-btn"]').exists()).toBe(true)
    })

    it('should emit cancel event when clicked', async () => {
      const powerupCard = createDrawExpandCard()

      const wrapper = mount(PowerupDrawExpandModal, {
        props: {
          powerupCard,
          currentHandLimit: 6,
        },
      })

      await wrapper.find('[data-testid="cancel-btn"]').trigger('click')

      expect(wrapper.emitted('cancel')).toBeTruthy()
    })
  })

  describe('mobile-friendly design', () => {
    it('should have touch-friendly confirm button (min 44px)', () => {
      const powerupCard = createDrawExpandCard()

      const wrapper = mount(PowerupDrawExpandModal, {
        props: {
          powerupCard,
          currentHandLimit: 6,
        },
      })

      const btn = wrapper.find('[data-testid="confirm-draw-expand-btn"]')
      expect(btn.classes()).toContain('min-h-11')
    })

    it('should have touch-friendly cancel button (min 44px)', () => {
      const powerupCard = createDrawExpandCard()

      const wrapper = mount(PowerupDrawExpandModal, {
        props: {
          powerupCard,
          currentHandLimit: 6,
        },
      })

      const btn = wrapper.find('[data-testid="cancel-btn"]')
      expect(btn.classes()).toContain('min-h-11')
    })
  })

  describe('accessibility', () => {
    it('should have proper ARIA labels for modal', () => {
      const powerupCard = createDrawExpandCard()

      const wrapper = mount(PowerupDrawExpandModal, {
        props: {
          powerupCard,
          currentHandLimit: 6,
        },
      })

      const modal = wrapper.find('[data-testid="draw-expand-modal"]')
      expect(modal.attributes('role')).toBe('dialog')
      expect(modal.attributes('aria-modal')).toBe('true')
      expect(modal.attributes('aria-labelledby')).toBeTruthy()
    })
  })
})

describe('cardStore playDrawExpandPowerup', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('should draw one card when played', () => {
    const cardStore = useCardStore()
    const powerupCard = createDrawExpandCard('draw-expand-inst')
    cardStore.hand.push(powerupCard)

    const initialDeckSize = cardStore.deckSize
    const result = cardStore.playDrawExpandPowerup(powerupCard.instanceId)

    expect(result.success).toBe(true)
    expect(result.drawnCards).toBeDefined()
    expect(result.drawnCards!.length).toBe(1)
    expect(cardStore.deckSize).toBe(initialDeckSize - 1)
  })

  it('should increase hand limit by 1', () => {
    const cardStore = useCardStore()
    const powerupCard = createDrawExpandCard('draw-expand-inst')
    cardStore.hand.push(powerupCard)

    const initialHandLimit = cardStore.handLimit
    cardStore.playDrawExpandPowerup(powerupCard.instanceId)

    expect(cardStore.handLimit).toBe(initialHandLimit + 1)
  })

  it('should persist increased hand limit', () => {
    const cardStore = useCardStore()
    const powerupCard = createDrawExpandCard('draw-expand-inst')
    cardStore.hand.push(powerupCard)

    cardStore.playDrawExpandPowerup(powerupCard.instanceId)

    // Create a new store instance to check persistence
    const newStore = useCardStore()
    newStore.rehydrate()

    expect(newStore.handLimit).toBe(7)
  })

  it('should remove powerup card after playing', () => {
    const cardStore = useCardStore()
    const powerupCard = createDrawExpandCard('draw-expand-inst')
    cardStore.hand.push(powerupCard)

    cardStore.playDrawExpandPowerup(powerupCard.instanceId)

    const cardInHand = cardStore.hand.find(c => c.instanceId === powerupCard.instanceId)
    expect(cardInHand).toBeUndefined()
  })

  it('should add powerup card to discard pile', () => {
    const cardStore = useCardStore()
    const powerupCard = createDrawExpandCard('draw-expand-inst')
    cardStore.hand.push(powerupCard)

    cardStore.playDrawExpandPowerup(powerupCard.instanceId)

    const cardInDiscard = cardStore.discardPile.find(c => c.instanceId === powerupCard.instanceId)
    expect(cardInDiscard).toBeDefined()
  })

  it('should return error if card not in hand', () => {
    const cardStore = useCardStore()

    const result = cardStore.playDrawExpandPowerup('non-existent-id')

    expect(result.success).toBe(false)
    expect(result.error).toBeDefined()
  })

  it('should return error if card is not a DrawExpand powerup', () => {
    const cardStore = useCardStore()
    const timeBonusCard = createMockTimeBonusCard('tb-inst')
    cardStore.hand.push(timeBonusCard)

    const result = cardStore.playDrawExpandPowerup(timeBonusCard.instanceId)

    expect(result.success).toBe(false)
    expect(result.error).toContain('not a Draw/Expand powerup')
  })

  it('should handle empty deck gracefully', () => {
    const cardStore = useCardStore()
    const powerupCard = createDrawExpandCard('draw-expand-inst')
    cardStore.hand.push(powerupCard)

    // Empty the deck
    cardStore.deckComposition = {
      timeBonusByTier: {},
      powerupByType: {},
      curseById: {},
    }

    const result = cardStore.playDrawExpandPowerup(powerupCard.instanceId)

    // Should still succeed but draw 0 cards
    expect(result.success).toBe(true)
    expect(result.drawnCards).toBeDefined()
    expect(result.drawnCards!.length).toBe(0)
    // Hand limit should still expand
    expect(cardStore.handLimit).toBe(7)
  })
})
