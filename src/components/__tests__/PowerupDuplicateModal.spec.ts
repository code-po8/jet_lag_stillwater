import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import PowerupDuplicateModal from '../PowerupDuplicateModal.vue'
import { useCardStore, type CardInstance } from '@/stores/cardStore'
import { CardType, PowerupType } from '@/types/card'
import { GameSize } from '@/types/question'

// Create a Duplicate powerup card
function createDuplicateCard(instanceId?: string): CardInstance {
  return {
    id: 'powerup-duplicate',
    instanceId: instanceId ?? `instance-duplicate-${Date.now()}`,
    type: CardType.Powerup,
    name: 'Duplicate Another Card',
    description: 'Copy another card in hand',
    powerupType: PowerupType.Duplicate,
    effect: 'Play this card as a copy of any other card in your hand. This may be used to duplicate a time bonus at the end of your round.',
    quantity: 2,
    canPlayDuringEndgame: true,
  } as CardInstance
}

// Helper to create a mock time bonus card
function createMockTimeBonusCard(instanceId?: string, tier: number = 1): CardInstance {
  const tierData: Record<number, { small: number; medium: number; large: number }> = {
    1: { small: 2, medium: 3, large: 5 },
    2: { small: 4, medium: 6, large: 10 },
    3: { small: 6, medium: 9, large: 15 },
    4: { small: 8, medium: 12, large: 20 },
    5: { small: 12, medium: 18, large: 30 },
  }
  const minutes = tierData[tier] ?? tierData[1]!
  return {
    id: `time-bonus-tier-${tier}`,
    instanceId: instanceId ?? `instance-tb-${Date.now()}`,
    type: CardType.TimeBonus,
    name: `Time Bonus (Tier ${tier})`,
    description: `Adds ${minutes.small}/${minutes.medium}/${minutes.large} minutes (S/M/L) to hiding duration`,
    tier,
    bonusMinutes: {
      [GameSize.Small]: minutes.small,
      [GameSize.Medium]: minutes.medium,
      [GameSize.Large]: minutes.large,
    },
  } as CardInstance
}

// Helper to create a mock curse card
function createMockCurseCard(instanceId?: string): CardInstance {
  return {
    id: 'curse-test',
    instanceId: instanceId ?? `instance-curse-${Date.now()}`,
    type: CardType.Curse,
    name: 'Test Curse',
    description: 'A test curse',
    effect: 'Test effect',
    castingCost: 'Test cost',
    blocksQuestions: false,
    blocksTransit: false,
    canPlayDuringEndgame: true,
  } as CardInstance
}

// Helper to create a mock powerup card (non-Duplicate)
function createMockPowerupCard(instanceId?: string): CardInstance {
  return {
    id: 'powerup-veto',
    instanceId: instanceId ?? `instance-powerup-${Date.now()}`,
    type: CardType.Powerup,
    name: 'Veto Question',
    description: 'Decline to answer a question',
    powerupType: PowerupType.Veto,
    effect: 'Play instead of answering a question.',
    quantity: 4,
    canPlayDuringEndgame: true,
  } as CardInstance
}

describe('PowerupDuplicateModal', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  describe('visibility', () => {
    it('should not render when powerupCard is null', () => {
      const wrapper = mount(PowerupDuplicateModal, {
        props: {
          powerupCard: null,
          selectableCards: [],
          gameSize: GameSize.Small,
        },
      })

      expect(wrapper.find('[data-testid="duplicate-modal"]').exists()).toBe(false)
    })

    it('should render when powerupCard is provided', () => {
      const powerupCard = createDuplicateCard()
      const timeBonusCard = createMockTimeBonusCard()

      const wrapper = mount(PowerupDuplicateModal, {
        props: {
          powerupCard,
          selectableCards: [timeBonusCard],
          gameSize: GameSize.Small,
        },
      })

      expect(wrapper.find('[data-testid="duplicate-modal"]').exists()).toBe(true)
    })
  })

  describe('header and instructions', () => {
    it('should display the powerup card name in header', () => {
      const powerupCard = createDuplicateCard()
      const timeBonusCard = createMockTimeBonusCard()

      const wrapper = mount(PowerupDuplicateModal, {
        props: {
          powerupCard,
          selectableCards: [timeBonusCard],
          gameSize: GameSize.Small,
        },
      })

      expect(wrapper.text()).toContain('Duplicate Another Card')
    })

    it('should display instructions for selecting a card to copy', () => {
      const powerupCard = createDuplicateCard()
      const timeBonusCard = createMockTimeBonusCard()

      const wrapper = mount(PowerupDuplicateModal, {
        props: {
          powerupCard,
          selectableCards: [timeBonusCard],
          gameSize: GameSize.Small,
        },
      })

      expect(wrapper.text()).toContain('Select a card to copy')
    })
  })

  describe('card selection', () => {
    it('should display all selectable cards', () => {
      const powerupCard = createDuplicateCard()
      const timeBonusCard1 = createMockTimeBonusCard('tb-1')
      const timeBonusCard2 = createMockTimeBonusCard('tb-2', 2)

      const wrapper = mount(PowerupDuplicateModal, {
        props: {
          powerupCard,
          selectableCards: [timeBonusCard1, timeBonusCard2],
          gameSize: GameSize.Small,
        },
      })

      expect(wrapper.find('[data-testid="selectable-card-tb-1"]').exists()).toBe(true)
      expect(wrapper.find('[data-testid="selectable-card-tb-2"]').exists()).toBe(true)
    })

    it('should allow selecting a card to duplicate', async () => {
      const powerupCard = createDuplicateCard()
      const timeBonusCard = createMockTimeBonusCard('tb-1')

      const wrapper = mount(PowerupDuplicateModal, {
        props: {
          powerupCard,
          selectableCards: [timeBonusCard],
          gameSize: GameSize.Small,
        },
      })

      await wrapper.find('[data-testid="selectable-card-tb-1"]').trigger('click')

      const card = wrapper.find('[data-testid="selectable-card-tb-1"]')
      expect(card.classes()).toContain('selected')
    })

    it('should allow deselecting a card', async () => {
      const powerupCard = createDuplicateCard()
      const timeBonusCard = createMockTimeBonusCard('tb-1')

      const wrapper = mount(PowerupDuplicateModal, {
        props: {
          powerupCard,
          selectableCards: [timeBonusCard],
          gameSize: GameSize.Small,
        },
      })

      await wrapper.find('[data-testid="selectable-card-tb-1"]').trigger('click')
      await wrapper.find('[data-testid="selectable-card-tb-1"]').trigger('click')

      const card = wrapper.find('[data-testid="selectable-card-tb-1"]')
      expect(card.classes()).not.toContain('selected')
    })

    it('should only allow selecting one card at a time', async () => {
      const powerupCard = createDuplicateCard()
      const timeBonusCard1 = createMockTimeBonusCard('tb-1')
      const timeBonusCard2 = createMockTimeBonusCard('tb-2', 2)

      const wrapper = mount(PowerupDuplicateModal, {
        props: {
          powerupCard,
          selectableCards: [timeBonusCard1, timeBonusCard2],
          gameSize: GameSize.Small,
        },
      })

      await wrapper.find('[data-testid="selectable-card-tb-1"]').trigger('click')
      await wrapper.find('[data-testid="selectable-card-tb-2"]').trigger('click')

      const card1 = wrapper.find('[data-testid="selectable-card-tb-1"]')
      const card2 = wrapper.find('[data-testid="selectable-card-tb-2"]')
      expect(card1.classes()).not.toContain('selected')
      expect(card2.classes()).toContain('selected')
    })

    it('should show selection indicator when card is selected', async () => {
      const powerupCard = createDuplicateCard()
      const timeBonusCard = createMockTimeBonusCard('tb-1')

      const wrapper = mount(PowerupDuplicateModal, {
        props: {
          powerupCard,
          selectableCards: [timeBonusCard],
          gameSize: GameSize.Small,
        },
      })

      await wrapper.find('[data-testid="selectable-card-tb-1"]').trigger('click')

      expect(wrapper.find('[data-testid="selection-indicator"]').exists()).toBe(true)
    })
  })

  describe('time bonus duplication display', () => {
    it('should show doubled time bonus value for time bonus cards', () => {
      const powerupCard = createDuplicateCard()
      const timeBonusCard = createMockTimeBonusCard('tb-1', 1) // Tier 1 = 2 min for Small

      const wrapper = mount(PowerupDuplicateModal, {
        props: {
          powerupCard,
          selectableCards: [timeBonusCard],
          gameSize: GameSize.Small,
        },
      })

      // Should show original value and doubled value
      expect(wrapper.text()).toContain('+2 min')
      expect(wrapper.text()).toContain('+4 min') // Doubled
    })

    it('should show "creates copy" indicator for non-time-bonus cards', () => {
      const powerupCard = createDuplicateCard()
      const curseCard = createMockCurseCard('curse-1')

      const wrapper = mount(PowerupDuplicateModal, {
        props: {
          powerupCard,
          selectableCards: [curseCard],
          gameSize: GameSize.Small,
        },
      })

      expect(wrapper.text()).toContain('Creates copy')
    })

    it('should show correct doubled value for different tiers', () => {
      const powerupCard = createDuplicateCard()
      const tier3Card = createMockTimeBonusCard('tb-3', 3) // Tier 3 = 6 min for Small

      const wrapper = mount(PowerupDuplicateModal, {
        props: {
          powerupCard,
          selectableCards: [tier3Card],
          gameSize: GameSize.Small,
        },
      })

      expect(wrapper.text()).toContain('+6 min') // Original
      expect(wrapper.text()).toContain('+12 min') // Doubled
    })

    it('should update doubled value based on game size', () => {
      const powerupCard = createDuplicateCard()
      const tier1Card = createMockTimeBonusCard('tb-1', 1) // Tier 1 = 3 min for Medium

      const wrapper = mount(PowerupDuplicateModal, {
        props: {
          powerupCard,
          selectableCards: [tier1Card],
          gameSize: GameSize.Medium,
        },
      })

      expect(wrapper.text()).toContain('+3 min') // Original for Medium
      expect(wrapper.text()).toContain('+6 min') // Doubled for Medium
    })
  })

  describe('confirm button', () => {
    it('should display confirm button', () => {
      const powerupCard = createDuplicateCard()
      const timeBonusCard = createMockTimeBonusCard()

      const wrapper = mount(PowerupDuplicateModal, {
        props: {
          powerupCard,
          selectableCards: [timeBonusCard],
          gameSize: GameSize.Small,
        },
      })

      expect(wrapper.find('[data-testid="confirm-duplicate-btn"]').exists()).toBe(true)
    })

    it('should disable confirm button when no card is selected', () => {
      const powerupCard = createDuplicateCard()
      const timeBonusCard = createMockTimeBonusCard()

      const wrapper = mount(PowerupDuplicateModal, {
        props: {
          powerupCard,
          selectableCards: [timeBonusCard],
          gameSize: GameSize.Small,
        },
      })

      const btn = wrapper.find('[data-testid="confirm-duplicate-btn"]')
      expect(btn.attributes('disabled')).toBeDefined()
    })

    it('should enable confirm button when a card is selected', async () => {
      const powerupCard = createDuplicateCard()
      const timeBonusCard = createMockTimeBonusCard('tb-1')

      const wrapper = mount(PowerupDuplicateModal, {
        props: {
          powerupCard,
          selectableCards: [timeBonusCard],
          gameSize: GameSize.Small,
        },
      })

      await wrapper.find('[data-testid="selectable-card-tb-1"]').trigger('click')

      const btn = wrapper.find('[data-testid="confirm-duplicate-btn"]')
      expect(btn.attributes('disabled')).toBeUndefined()
    })

    it('should emit confirm event with selected card when clicked', async () => {
      const powerupCard = createDuplicateCard()
      const timeBonusCard = createMockTimeBonusCard('tb-1')

      const wrapper = mount(PowerupDuplicateModal, {
        props: {
          powerupCard,
          selectableCards: [timeBonusCard],
          gameSize: GameSize.Small,
        },
      })

      await wrapper.find('[data-testid="selectable-card-tb-1"]').trigger('click')
      await wrapper.find('[data-testid="confirm-duplicate-btn"]').trigger('click')

      expect(wrapper.emitted('confirm')).toBeTruthy()
      expect(wrapper.emitted('confirm')![0]).toEqual([timeBonusCard])
    })
  })

  describe('cancel button', () => {
    it('should display cancel button', () => {
      const powerupCard = createDuplicateCard()
      const timeBonusCard = createMockTimeBonusCard()

      const wrapper = mount(PowerupDuplicateModal, {
        props: {
          powerupCard,
          selectableCards: [timeBonusCard],
          gameSize: GameSize.Small,
        },
      })

      expect(wrapper.find('[data-testid="cancel-btn"]').exists()).toBe(true)
    })

    it('should emit cancel event when clicked', async () => {
      const powerupCard = createDuplicateCard()
      const timeBonusCard = createMockTimeBonusCard()

      const wrapper = mount(PowerupDuplicateModal, {
        props: {
          powerupCard,
          selectableCards: [timeBonusCard],
          gameSize: GameSize.Small,
        },
      })

      await wrapper.find('[data-testid="cancel-btn"]').trigger('click')

      expect(wrapper.emitted('cancel')).toBeTruthy()
    })
  })

  describe('not enough cards warning', () => {
    it('should show warning when no other cards available to duplicate', () => {
      const powerupCard = createDuplicateCard()

      const wrapper = mount(PowerupDuplicateModal, {
        props: {
          powerupCard,
          selectableCards: [],
          gameSize: GameSize.Small,
        },
      })

      expect(wrapper.find('[data-testid="no-cards-warning"]').exists()).toBe(true)
      expect(wrapper.text()).toContain('No cards available to duplicate')
    })
  })

  describe('mobile-friendly design', () => {
    it('should have touch-friendly card sizes (min 44px)', () => {
      const powerupCard = createDuplicateCard()
      const timeBonusCard = createMockTimeBonusCard('tb-1')

      const wrapper = mount(PowerupDuplicateModal, {
        props: {
          powerupCard,
          selectableCards: [timeBonusCard],
          gameSize: GameSize.Small,
        },
      })

      const card = wrapper.find('[data-testid="selectable-card-tb-1"]')
      expect(card.classes()).toContain('min-h-11')
    })

    it('should have touch-friendly confirm button (min 44px)', () => {
      const powerupCard = createDuplicateCard()
      const timeBonusCard = createMockTimeBonusCard()

      const wrapper = mount(PowerupDuplicateModal, {
        props: {
          powerupCard,
          selectableCards: [timeBonusCard],
          gameSize: GameSize.Small,
        },
      })

      const btn = wrapper.find('[data-testid="confirm-duplicate-btn"]')
      expect(btn.classes()).toContain('min-h-11')
    })
  })

  describe('accessibility', () => {
    it('should have proper ARIA labels for modal', () => {
      const powerupCard = createDuplicateCard()
      const timeBonusCard = createMockTimeBonusCard()

      const wrapper = mount(PowerupDuplicateModal, {
        props: {
          powerupCard,
          selectableCards: [timeBonusCard],
          gameSize: GameSize.Small,
        },
      })

      const modal = wrapper.find('[data-testid="duplicate-modal"]')
      expect(modal.attributes('role')).toBe('dialog')
      expect(modal.attributes('aria-modal')).toBe('true')
      expect(modal.attributes('aria-labelledby')).toBeTruthy()
    })

    it('should have proper ARIA labels for selectable cards', () => {
      const powerupCard = createDuplicateCard()
      const timeBonusCard = createMockTimeBonusCard('tb-1')

      const wrapper = mount(PowerupDuplicateModal, {
        props: {
          powerupCard,
          selectableCards: [timeBonusCard],
          gameSize: GameSize.Small,
        },
      })

      const card = wrapper.find('[data-testid="selectable-card-tb-1"]')
      expect(card.attributes('role')).toBe('radio')
      expect(card.attributes('aria-checked')).toBeDefined()
    })
  })
})

describe('cardStore playDuplicatePowerup', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('should create a copy of the selected card', () => {
    const cardStore = useCardStore()
    const duplicateCard = createDuplicateCard('duplicate-inst')
    const timeBonusCard = createMockTimeBonusCard('tb-inst')
    cardStore.hand.push(duplicateCard)
    cardStore.hand.push(timeBonusCard)

    const initialHandCount = cardStore.handCount
    const result = cardStore.playDuplicatePowerup(duplicateCard.instanceId, timeBonusCard.instanceId)

    expect(result.success).toBe(true)
    // Hand count should stay same: -1 (duplicate played) +1 (copy created)
    expect(cardStore.handCount).toBe(initialHandCount)
  })

  it('should double time bonus value when duplicating time bonus card', () => {
    const cardStore = useCardStore()
    const duplicateCard = createDuplicateCard('duplicate-inst')
    const timeBonusCard = createMockTimeBonusCard('tb-inst', 1) // Tier 1 = 2 min Small
    cardStore.hand.push(duplicateCard)
    cardStore.hand.push(timeBonusCard)

    const result = cardStore.playDuplicatePowerup(duplicateCard.instanceId, timeBonusCard.instanceId)

    expect(result.success).toBe(true)
    expect(result.duplicatedCard).toBeDefined()
    // The duplicated card should have doubled bonus
    const dupCard = result.duplicatedCard as CardInstance & { bonusMinutes: Record<GameSize, number> }
    expect(dupCard.bonusMinutes[GameSize.Small]).toBe(4) // Doubled from 2
    expect(dupCard.bonusMinutes[GameSize.Medium]).toBe(6) // Doubled from 3
    expect(dupCard.bonusMinutes[GameSize.Large]).toBe(10) // Doubled from 5
  })

  it('should create exact copy for non-time-bonus cards', () => {
    const cardStore = useCardStore()
    const duplicateCard = createDuplicateCard('duplicate-inst')
    const curseCard = createMockCurseCard('curse-inst')
    cardStore.hand.push(duplicateCard)
    cardStore.hand.push(curseCard)

    const result = cardStore.playDuplicatePowerup(duplicateCard.instanceId, curseCard.instanceId)

    expect(result.success).toBe(true)
    expect(result.duplicatedCard).toBeDefined()
    expect(result.duplicatedCard!.name).toBe(curseCard.name)
    expect(result.duplicatedCard!.type).toBe(CardType.Curse)
  })

  it('should remove duplicate powerup card from hand after playing', () => {
    const cardStore = useCardStore()
    const duplicateCard = createDuplicateCard('duplicate-inst')
    const timeBonusCard = createMockTimeBonusCard('tb-inst')
    cardStore.hand.push(duplicateCard)
    cardStore.hand.push(timeBonusCard)

    cardStore.playDuplicatePowerup(duplicateCard.instanceId, timeBonusCard.instanceId)

    const cardInHand = cardStore.hand.find(c => c.instanceId === duplicateCard.instanceId)
    expect(cardInHand).toBeUndefined()
  })

  it('should add duplicate powerup card to discard pile', () => {
    const cardStore = useCardStore()
    const duplicateCard = createDuplicateCard('duplicate-inst')
    const timeBonusCard = createMockTimeBonusCard('tb-inst')
    cardStore.hand.push(duplicateCard)
    cardStore.hand.push(timeBonusCard)

    cardStore.playDuplicatePowerup(duplicateCard.instanceId, timeBonusCard.instanceId)

    const cardInDiscard = cardStore.discardPile.find(c => c.instanceId === duplicateCard.instanceId)
    expect(cardInDiscard).toBeDefined()
  })

  it('should assign unique instance ID to duplicated card', () => {
    const cardStore = useCardStore()
    const duplicateCard = createDuplicateCard('duplicate-inst')
    const timeBonusCard = createMockTimeBonusCard('tb-inst')
    cardStore.hand.push(duplicateCard)
    cardStore.hand.push(timeBonusCard)

    const result = cardStore.playDuplicatePowerup(duplicateCard.instanceId, timeBonusCard.instanceId)

    expect(result.duplicatedCard!.instanceId).not.toBe(timeBonusCard.instanceId)
  })

  it('should keep original card in hand after duplication', () => {
    const cardStore = useCardStore()
    const duplicateCard = createDuplicateCard('duplicate-inst')
    const timeBonusCard = createMockTimeBonusCard('tb-inst')
    cardStore.hand.push(duplicateCard)
    cardStore.hand.push(timeBonusCard)

    cardStore.playDuplicatePowerup(duplicateCard.instanceId, timeBonusCard.instanceId)

    const originalInHand = cardStore.hand.find(c => c.instanceId === timeBonusCard.instanceId)
    expect(originalInHand).toBeDefined()
  })

  it('should return error if duplicate powerup card not in hand', () => {
    const cardStore = useCardStore()
    const timeBonusCard = createMockTimeBonusCard('tb-inst')
    cardStore.hand.push(timeBonusCard)

    const result = cardStore.playDuplicatePowerup('non-existent-id', timeBonusCard.instanceId)

    expect(result.success).toBe(false)
    expect(result.error).toContain('not found in hand')
  })

  it('should return error if target card not in hand', () => {
    const cardStore = useCardStore()
    const duplicateCard = createDuplicateCard('duplicate-inst')
    cardStore.hand.push(duplicateCard)

    const result = cardStore.playDuplicatePowerup(duplicateCard.instanceId, 'non-existent-target')

    expect(result.success).toBe(false)
    expect(result.error).toContain('Target card not found')
  })

  it('should return error if card is not a Duplicate powerup', () => {
    const cardStore = useCardStore()
    const vetoCard = createMockPowerupCard('veto-inst')
    const timeBonusCard = createMockTimeBonusCard('tb-inst')
    cardStore.hand.push(vetoCard)
    cardStore.hand.push(timeBonusCard)

    const result = cardStore.playDuplicatePowerup(vetoCard.instanceId, timeBonusCard.instanceId)

    expect(result.success).toBe(false)
    expect(result.error).toContain('not a Duplicate powerup')
  })

  it('should return error if trying to duplicate itself', () => {
    const cardStore = useCardStore()
    const duplicateCard = createDuplicateCard('duplicate-inst')
    cardStore.hand.push(duplicateCard)

    const result = cardStore.playDuplicatePowerup(duplicateCard.instanceId, duplicateCard.instanceId)

    expect(result.success).toBe(false)
    expect(result.error).toContain('Cannot duplicate itself')
  })

  it('should mark duplicated time bonus card as doubled', () => {
    const cardStore = useCardStore()
    const duplicateCard = createDuplicateCard('duplicate-inst')
    const timeBonusCard = createMockTimeBonusCard('tb-inst', 1)
    cardStore.hand.push(duplicateCard)
    cardStore.hand.push(timeBonusCard)

    const result = cardStore.playDuplicatePowerup(duplicateCard.instanceId, timeBonusCard.instanceId)

    const dupCard = result.duplicatedCard as CardInstance & { isDuplicate?: boolean }
    expect(dupCard.isDuplicate).toBe(true)
  })
})
