import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import AddCardModal from '../AddCardModal.vue'
import { useCardStore } from '@/stores/cardStore'
import { CardType, PowerupType, CURSE_CARDS } from '@/types/card'

describe('AddCardModal', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  describe('visibility', () => {
    it('should not render when isOpen is false', () => {
      const wrapper = mount(AddCardModal, {
        props: {
          isOpen: false,
        },
      })

      expect(wrapper.find('[data-testid="add-card-modal"]').exists()).toBe(false)
    })

    it('should render when isOpen is true', () => {
      const wrapper = mount(AddCardModal, {
        props: {
          isOpen: true,
        },
      })

      expect(wrapper.find('[data-testid="add-card-modal"]').exists()).toBe(true)
    })
  })

  describe('header and instructions', () => {
    it('should display the modal header', () => {
      const wrapper = mount(AddCardModal, {
        props: {
          isOpen: true,
        },
      })

      expect(wrapper.text()).toContain('Add Card')
    })

    it('should display instructions for selecting a card type', () => {
      const wrapper = mount(AddCardModal, {
        props: {
          isOpen: true,
        },
      })

      expect(wrapper.text()).toContain('Select a card type')
    })
  })

  describe('card type selection', () => {
    it('should show card type options', () => {
      const wrapper = mount(AddCardModal, {
        props: {
          isOpen: true,
        },
      })

      expect(wrapper.find('[data-testid="card-type-time-bonus"]').exists()).toBe(true)
      expect(wrapper.find('[data-testid="card-type-powerup"]').exists()).toBe(true)
      expect(wrapper.find('[data-testid="card-type-curse"]').exists()).toBe(true)
      expect(wrapper.find('[data-testid="card-type-time-trap"]').exists()).toBe(true)
    })

    it('should highlight selected card type', async () => {
      const wrapper = mount(AddCardModal, {
        props: {
          isOpen: true,
        },
      })

      const timeBonusBtn = wrapper.find('[data-testid="card-type-time-bonus"]')
      await timeBonusBtn.trigger('click')

      expect(timeBonusBtn.classes()).toContain('ring-2')
    })
  })

  describe('time bonus tier selection', () => {
    it('should show tier options when Time Bonus is selected', async () => {
      const wrapper = mount(AddCardModal, {
        props: {
          isOpen: true,
        },
      })

      await wrapper.find('[data-testid="card-type-time-bonus"]').trigger('click')

      expect(wrapper.find('[data-testid="tier-options"]').exists()).toBe(true)
      // Should show all 5 tiers
      for (let tier = 1; tier <= 5; tier++) {
        expect(wrapper.find(`[data-testid="tier-option-${tier}"]`).exists()).toBe(true)
      }
    })

    it('should not show tier options when other types are selected', async () => {
      const wrapper = mount(AddCardModal, {
        props: {
          isOpen: true,
        },
      })

      await wrapper.find('[data-testid="card-type-powerup"]').trigger('click')

      expect(wrapper.find('[data-testid="tier-options"]').exists()).toBe(false)
    })

    it('should allow selecting a tier', async () => {
      const wrapper = mount(AddCardModal, {
        props: {
          isOpen: true,
        },
      })

      await wrapper.find('[data-testid="card-type-time-bonus"]').trigger('click')
      await wrapper.find('[data-testid="tier-option-3"]').trigger('click')

      expect(wrapper.find('[data-testid="tier-option-3"]').classes()).toContain('ring-2')
    })
  })

  describe('powerup type selection', () => {
    it('should show powerup type options when Powerup is selected', async () => {
      const wrapper = mount(AddCardModal, {
        props: {
          isOpen: true,
        },
      })

      await wrapper.find('[data-testid="card-type-powerup"]').trigger('click')

      expect(wrapper.find('[data-testid="powerup-options"]').exists()).toBe(true)
    })

    it('should list all powerup types', async () => {
      const wrapper = mount(AddCardModal, {
        props: {
          isOpen: true,
        },
      })

      await wrapper.find('[data-testid="card-type-powerup"]').trigger('click')

      // Check for each powerup type
      const powerupTypes = Object.values(PowerupType)
      for (const pType of powerupTypes) {
        expect(wrapper.find(`[data-testid="powerup-option-${pType}"]`).exists()).toBe(true)
      }
    })

    it('should allow selecting a powerup type', async () => {
      const wrapper = mount(AddCardModal, {
        props: {
          isOpen: true,
        },
      })

      await wrapper.find('[data-testid="card-type-powerup"]').trigger('click')
      await wrapper.find('[data-testid="powerup-option-veto"]').trigger('click')

      expect(wrapper.find('[data-testid="powerup-option-veto"]').classes()).toContain('ring-2')
    })
  })

  describe('curse selection', () => {
    it('should show curse list when Curse is selected', async () => {
      const wrapper = mount(AddCardModal, {
        props: {
          isOpen: true,
        },
      })

      await wrapper.find('[data-testid="card-type-curse"]').trigger('click')

      expect(wrapper.find('[data-testid="curse-options"]').exists()).toBe(true)
    })

    it('should list all curse cards', async () => {
      const wrapper = mount(AddCardModal, {
        props: {
          isOpen: true,
        },
      })

      await wrapper.find('[data-testid="card-type-curse"]').trigger('click')

      // Check that at least some curses are listed
      expect(wrapper.findAll('[data-testid^="curse-option-"]').length).toBe(CURSE_CARDS.length)
    })

    it('should allow selecting a curse', async () => {
      const wrapper = mount(AddCardModal, {
        props: {
          isOpen: true,
        },
      })

      await wrapper.find('[data-testid="card-type-curse"]').trigger('click')
      const firstCurse = wrapper.find('[data-testid^="curse-option-"]')
      await firstCurse.trigger('click')

      expect(firstCurse.classes()).toContain('ring-2')
    })
  })

  describe('time trap selection', () => {
    it('should allow Time Trap selection without additional options', async () => {
      const wrapper = mount(AddCardModal, {
        props: {
          isOpen: true,
        },
      })

      await wrapper.find('[data-testid="card-type-time-trap"]').trigger('click')

      // Time trap doesn't need additional options
      expect(wrapper.find('[data-testid="tier-options"]').exists()).toBe(false)
      expect(wrapper.find('[data-testid="powerup-options"]').exists()).toBe(false)
      expect(wrapper.find('[data-testid="curse-options"]').exists()).toBe(false)
    })
  })

  describe('confirm button', () => {
    it('should display confirm button', () => {
      const wrapper = mount(AddCardModal, {
        props: {
          isOpen: true,
        },
      })

      expect(wrapper.find('[data-testid="add-card-confirm-btn"]').exists()).toBe(true)
    })

    it('should disable confirm button when card type is not selected', () => {
      const wrapper = mount(AddCardModal, {
        props: {
          isOpen: true,
        },
      })

      expect(
        wrapper.find('[data-testid="add-card-confirm-btn"]').attributes('disabled'),
      ).toBeDefined()
    })

    it('should disable confirm button when time bonus selected but tier not selected', async () => {
      const wrapper = mount(AddCardModal, {
        props: {
          isOpen: true,
        },
      })

      await wrapper.find('[data-testid="card-type-time-bonus"]').trigger('click')

      expect(
        wrapper.find('[data-testid="add-card-confirm-btn"]').attributes('disabled'),
      ).toBeDefined()
    })

    it('should enable confirm button when time bonus and tier are selected', async () => {
      const wrapper = mount(AddCardModal, {
        props: {
          isOpen: true,
        },
      })

      await wrapper.find('[data-testid="card-type-time-bonus"]').trigger('click')
      await wrapper.find('[data-testid="tier-option-2"]').trigger('click')

      expect(
        wrapper.find('[data-testid="add-card-confirm-btn"]').attributes('disabled'),
      ).toBeUndefined()
    })

    it('should enable confirm button when powerup type is selected', async () => {
      const wrapper = mount(AddCardModal, {
        props: {
          isOpen: true,
        },
      })

      await wrapper.find('[data-testid="card-type-powerup"]').trigger('click')
      await wrapper.find('[data-testid="powerup-option-veto"]').trigger('click')

      expect(
        wrapper.find('[data-testid="add-card-confirm-btn"]').attributes('disabled'),
      ).toBeUndefined()
    })

    it('should enable confirm button when curse is selected', async () => {
      const wrapper = mount(AddCardModal, {
        props: {
          isOpen: true,
        },
      })

      await wrapper.find('[data-testid="card-type-curse"]').trigger('click')
      const firstCurse = wrapper.find('[data-testid^="curse-option-"]')
      await firstCurse.trigger('click')

      expect(
        wrapper.find('[data-testid="add-card-confirm-btn"]').attributes('disabled'),
      ).toBeUndefined()
    })

    it('should enable confirm button when time trap is selected', async () => {
      const wrapper = mount(AddCardModal, {
        props: {
          isOpen: true,
        },
      })

      await wrapper.find('[data-testid="card-type-time-trap"]').trigger('click')

      expect(
        wrapper.find('[data-testid="add-card-confirm-btn"]').attributes('disabled'),
      ).toBeUndefined()
    })

    it('should emit confirm event with card details when clicked', async () => {
      const wrapper = mount(AddCardModal, {
        props: {
          isOpen: true,
        },
      })

      await wrapper.find('[data-testid="card-type-time-bonus"]').trigger('click')
      await wrapper.find('[data-testid="tier-option-3"]').trigger('click')
      await wrapper.find('[data-testid="add-card-confirm-btn"]').trigger('click')

      expect(wrapper.emitted('confirm')).toBeTruthy()
      expect(wrapper.emitted('confirm')![0]).toEqual([
        {
          cardType: CardType.TimeBonus,
          options: { tier: 3 },
        },
      ])
    })
  })

  describe('cancel button', () => {
    it('should display cancel button', () => {
      const wrapper = mount(AddCardModal, {
        props: {
          isOpen: true,
        },
      })

      expect(wrapper.find('[data-testid="add-card-cancel-btn"]').exists()).toBe(true)
    })

    it('should emit cancel event when clicked', async () => {
      const wrapper = mount(AddCardModal, {
        props: {
          isOpen: true,
        },
      })

      await wrapper.find('[data-testid="add-card-cancel-btn"]').trigger('click')

      expect(wrapper.emitted('cancel')).toBeTruthy()
    })
  })

  describe('hand full warning', () => {
    it('should show warning when hand is full', () => {
      const cardStore = useCardStore()
      // Fill the hand to limit
      for (let i = 0; i < cardStore.handLimit; i++) {
        cardStore.addCardToHand(CardType.TimeBonus, { tier: 1 })
      }

      const wrapper = mount(AddCardModal, {
        props: {
          isOpen: true,
        },
      })

      expect(wrapper.text()).toContain('Hand is full')
    })

    it('should disable confirm button when hand is full', () => {
      const cardStore = useCardStore()
      // Fill the hand to limit
      for (let i = 0; i < cardStore.handLimit; i++) {
        cardStore.addCardToHand(CardType.TimeBonus, { tier: 1 })
      }

      const wrapper = mount(AddCardModal, {
        props: {
          isOpen: true,
        },
      })

      expect(
        wrapper.find('[data-testid="add-card-confirm-btn"]').attributes('disabled'),
      ).toBeDefined()
    })
  })

  describe('mobile-friendly design', () => {
    it('should have touch-friendly button sizes (min 44px)', () => {
      const wrapper = mount(AddCardModal, {
        props: {
          isOpen: true,
        },
      })

      const confirmBtn = wrapper.find('[data-testid="add-card-confirm-btn"]')
      expect(confirmBtn.classes()).toContain('min-h-11')
    })
  })

  describe('accessibility', () => {
    it('should have proper ARIA labels for modal', () => {
      const wrapper = mount(AddCardModal, {
        props: {
          isOpen: true,
        },
      })

      const modal = wrapper.find('[data-testid="add-card-modal"]')
      expect(modal.attributes('role')).toBe('dialog')
      expect(modal.attributes('aria-modal')).toBe('true')
    })
  })
})
