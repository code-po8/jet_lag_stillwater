import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import CurseActivationModal from '../CurseActivationModal.vue'
import { CURSE_CARDS } from '@/types/card'
import { GameSize } from '@/types/question'

describe('CurseActivationModal', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  describe('visibility', () => {
    it('should not render when isOpen is false', () => {
      const wrapper = mount(CurseActivationModal, {
        props: {
          isOpen: false,
          gameSize: GameSize.Small,
        },
      })

      expect(wrapper.find('[data-testid="curse-activation-modal"]').exists()).toBe(false)
    })

    it('should render when isOpen is true', () => {
      const wrapper = mount(CurseActivationModal, {
        props: {
          isOpen: true,
          gameSize: GameSize.Small,
        },
      })

      expect(wrapper.find('[data-testid="curse-activation-modal"]').exists()).toBe(true)
    })
  })

  describe('header and instructions', () => {
    it('should display modal title', () => {
      const wrapper = mount(CurseActivationModal, {
        props: {
          isOpen: true,
          gameSize: GameSize.Small,
        },
      })

      expect(wrapper.text()).toContain('Hider Played Curse')
    })

    it('should display instructions for selecting a curse', () => {
      const wrapper = mount(CurseActivationModal, {
        props: {
          isOpen: true,
          gameSize: GameSize.Small,
        },
      })

      expect(wrapper.text().toLowerCase()).toContain('select')
    })
  })

  describe('curse list display', () => {
    it('should display all available curse cards', () => {
      const wrapper = mount(CurseActivationModal, {
        props: {
          isOpen: true,
          gameSize: GameSize.Small,
        },
      })

      // All 23 curses should be shown
      CURSE_CARDS.forEach((curse) => {
        expect(wrapper.text()).toContain(curse.name)
      })
    })

    it('should display curse name for each curse', () => {
      const wrapper = mount(CurseActivationModal, {
        props: {
          isOpen: true,
          gameSize: GameSize.Small,
        },
      })

      expect(wrapper.text()).toContain('Lemon Phylactery')
      expect(wrapper.text()).toContain('Luxury Car')
      expect(wrapper.text()).toContain('Water Weight')
    })

    it('should display curse description for each curse', () => {
      const wrapper = mount(CurseActivationModal, {
        props: {
          isOpen: true,
          gameSize: GameSize.Small,
        },
      })

      expect(wrapper.text()).toContain('Seekers must find and wear lemons')
    })

    it('should display duration for time-based curses', () => {
      const wrapper = mount(CurseActivationModal, {
        props: {
          isOpen: true,
          gameSize: GameSize.Small,
        },
      })

      // Gambler's Feet has duration: small: 20 min
      expect(wrapper.text()).toContain('20 min')
    })
  })

  describe('curse selection', () => {
    it('should allow selecting a curse by clicking', async () => {
      const wrapper = mount(CurseActivationModal, {
        props: {
          isOpen: true,
          gameSize: GameSize.Small,
        },
      })

      const curseItem = wrapper.find('[data-testid="curse-item-curse-lemon-phylactery"]')
      await curseItem.trigger('click')

      expect(curseItem.classes()).toContain('ring-2')
    })

    it('should allow deselecting a curse by clicking again', async () => {
      const wrapper = mount(CurseActivationModal, {
        props: {
          isOpen: true,
          gameSize: GameSize.Small,
        },
      })

      const curseItem = wrapper.find('[data-testid="curse-item-curse-lemon-phylactery"]')
      await curseItem.trigger('click')
      await curseItem.trigger('click')

      expect(curseItem.classes()).not.toContain('ring-2')
    })

    it('should only allow selecting one curse at a time', async () => {
      const wrapper = mount(CurseActivationModal, {
        props: {
          isOpen: true,
          gameSize: GameSize.Small,
        },
      })

      const curse1 = wrapper.find('[data-testid="curse-item-curse-lemon-phylactery"]')
      const curse2 = wrapper.find('[data-testid="curse-item-curse-luxury-car"]')

      await curse1.trigger('click')
      await curse2.trigger('click')

      expect(curse1.classes()).not.toContain('ring-2')
      expect(curse2.classes()).toContain('ring-2')
    })

    it('should show selection indicator when curse is selected', async () => {
      const wrapper = mount(CurseActivationModal, {
        props: {
          isOpen: true,
          gameSize: GameSize.Small,
        },
      })

      const curseItem = wrapper.find('[data-testid="curse-item-curse-lemon-phylactery"]')
      await curseItem.trigger('click')

      // Should have visual indication of selection
      expect(curseItem.classes()).toContain('ring-purple-500')
    })
  })

  describe('confirm button', () => {
    it('should display confirm button', () => {
      const wrapper = mount(CurseActivationModal, {
        props: {
          isOpen: true,
          gameSize: GameSize.Small,
        },
      })

      expect(wrapper.find('[data-testid="confirm-button"]').exists()).toBe(true)
      expect(wrapper.text()).toContain('Activate Curse')
    })

    it('should disable confirm button when no curse is selected', () => {
      const wrapper = mount(CurseActivationModal, {
        props: {
          isOpen: true,
          gameSize: GameSize.Small,
        },
      })

      const confirmButton = wrapper.find('[data-testid="confirm-button"]')
      expect(confirmButton.attributes('disabled')).toBeDefined()
    })

    it('should enable confirm button when a curse is selected', async () => {
      const wrapper = mount(CurseActivationModal, {
        props: {
          isOpen: true,
          gameSize: GameSize.Small,
        },
      })

      const curseItem = wrapper.find('[data-testid="curse-item-curse-lemon-phylactery"]')
      await curseItem.trigger('click')

      const confirmButton = wrapper.find('[data-testid="confirm-button"]')
      expect(confirmButton.attributes('disabled')).toBeUndefined()
    })

    it('should emit confirm event with curse ID when clicked', async () => {
      const wrapper = mount(CurseActivationModal, {
        props: {
          isOpen: true,
          gameSize: GameSize.Small,
        },
      })

      const curseItem = wrapper.find('[data-testid="curse-item-curse-lemon-phylactery"]')
      await curseItem.trigger('click')

      const confirmButton = wrapper.find('[data-testid="confirm-button"]')
      await confirmButton.trigger('click')

      expect(wrapper.emitted('confirm')).toBeTruthy()
      expect(wrapper.emitted('confirm')![0]).toEqual([{ curseId: 'curse-lemon-phylactery' }])
    })
  })

  describe('cancel button', () => {
    it('should display cancel button', () => {
      const wrapper = mount(CurseActivationModal, {
        props: {
          isOpen: true,
          gameSize: GameSize.Small,
        },
      })

      expect(wrapper.find('[data-testid="cancel-button"]').exists()).toBe(true)
    })

    it('should emit cancel event when clicked', async () => {
      const wrapper = mount(CurseActivationModal, {
        props: {
          isOpen: true,
          gameSize: GameSize.Small,
        },
      })

      const cancelButton = wrapper.find('[data-testid="cancel-button"]')
      await cancelButton.trigger('click')

      expect(wrapper.emitted('cancel')).toBeTruthy()
    })
  })

  describe('curse effect display', () => {
    it('should display effect for each curse', () => {
      const wrapper = mount(CurseActivationModal, {
        props: {
          isOpen: true,
          gameSize: GameSize.Small,
        },
      })

      // Check that effects are shown
      expect(wrapper.text()).toContain('Seekers must each find a lemon')
    })
  })

  describe('mobile-friendly design', () => {
    it('should have touch-friendly curse items (min 44px)', () => {
      const wrapper = mount(CurseActivationModal, {
        props: {
          isOpen: true,
          gameSize: GameSize.Small,
        },
      })

      const curseItem = wrapper.find('[data-testid="curse-item-curse-lemon-phylactery"]')
      expect(curseItem.classes()).toContain('min-h-11')
    })

    it('should have touch-friendly confirm button', () => {
      const wrapper = mount(CurseActivationModal, {
        props: {
          isOpen: true,
          gameSize: GameSize.Small,
        },
      })

      const confirmButton = wrapper.find('[data-testid="confirm-button"]')
      expect(confirmButton.classes()).toContain('min-h-11')
    })

    it('should have scrollable curse list', () => {
      const wrapper = mount(CurseActivationModal, {
        props: {
          isOpen: true,
          gameSize: GameSize.Small,
        },
      })

      const curseList = wrapper.find('[data-testid="curse-list"]')
      expect(curseList.classes()).toContain('overflow-y-auto')
    })
  })

  describe('accessibility', () => {
    it('should have proper ARIA labels for modal', () => {
      const wrapper = mount(CurseActivationModal, {
        props: {
          isOpen: true,
          gameSize: GameSize.Small,
        },
      })

      const modal = wrapper.find('[data-testid="curse-activation-modal"]')
      expect(modal.attributes('role')).toBe('dialog')
      expect(modal.attributes('aria-labelledby')).toBeDefined()
    })

    it('should have proper ARIA labels for curse items', () => {
      const wrapper = mount(CurseActivationModal, {
        props: {
          isOpen: true,
          gameSize: GameSize.Small,
        },
      })

      const curseItem = wrapper.find('[data-testid="curse-item-curse-lemon-phylactery"]')
      expect(curseItem.attributes('aria-label')).toBeDefined()
    })
  })
})
