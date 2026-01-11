import { describe, it, expect, beforeEach } from 'vitest'
import { mount, VueWrapper } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import TimeTrapModal from '../TimeTrapModal.vue'
import { CardType } from '@/types/card'
import { type CardInstance } from '@/stores/cardStore'

describe('TimeTrapModal', () => {
  let wrapper: VueWrapper

  function createTimeTrapCard(): CardInstance {
    return {
      id: 'time-trap',
      instanceId: 'time-trap-test-instance',
      type: CardType.TimeTrap,
      name: 'Time Trap',
      description: 'Designate a transit station as a trap. If seekers visit it, you gain bonus time.',
      bonusMinutesWhenTriggered: 15,
    } as CardInstance
  }

  beforeEach(() => {
    setActivePinia(createPinia())
  })

  describe('visibility', () => {
    it('should not render when timeTrapCard is null', () => {
      wrapper = mount(TimeTrapModal, {
        props: {
          timeTrapCard: null,
        },
      })

      expect(wrapper.find('[data-testid="time-trap-modal"]').exists()).toBe(false)
    })

    it('should render when timeTrapCard is provided', () => {
      wrapper = mount(TimeTrapModal, {
        props: {
          timeTrapCard: createTimeTrapCard(),
        },
      })

      expect(wrapper.find('[data-testid="time-trap-modal"]').exists()).toBe(true)
    })
  })

  describe('header and content', () => {
    it('should display the card name in header', () => {
      wrapper = mount(TimeTrapModal, {
        props: {
          timeTrapCard: createTimeTrapCard(),
        },
      })

      expect(wrapper.text()).toContain('Time Trap')
    })

    it('should display instructions for entering station name', () => {
      wrapper = mount(TimeTrapModal, {
        props: {
          timeTrapCard: createTimeTrapCard(),
        },
      })

      expect(wrapper.text()).toContain('station')
    })

    it('should display the bonus minutes', () => {
      wrapper = mount(TimeTrapModal, {
        props: {
          timeTrapCard: createTimeTrapCard(),
        },
      })

      expect(wrapper.text()).toContain('15')
    })
  })

  describe('station name input', () => {
    it('should have an input field for station name', () => {
      wrapper = mount(TimeTrapModal, {
        props: {
          timeTrapCard: createTimeTrapCard(),
        },
      })

      expect(wrapper.find('[data-testid="station-name-input"]').exists()).toBe(true)
    })

    it('should allow typing in the station name input', async () => {
      wrapper = mount(TimeTrapModal, {
        props: {
          timeTrapCard: createTimeTrapCard(),
        },
      })

      const input = wrapper.find('[data-testid="station-name-input"]')
      await input.setValue('Main Street Station')

      expect((input.element as HTMLInputElement).value).toBe('Main Street Station')
    })

    it('should have a placeholder text', () => {
      wrapper = mount(TimeTrapModal, {
        props: {
          timeTrapCard: createTimeTrapCard(),
        },
      })

      const input = wrapper.find('[data-testid="station-name-input"]')
      expect(input.attributes('placeholder')).toBeDefined()
    })
  })

  describe('confirm button', () => {
    it('should display confirm button', () => {
      wrapper = mount(TimeTrapModal, {
        props: {
          timeTrapCard: createTimeTrapCard(),
        },
      })

      expect(wrapper.find('[data-testid="confirm-trap-btn"]').exists()).toBe(true)
    })

    it('should disable confirm button when station name is empty', () => {
      wrapper = mount(TimeTrapModal, {
        props: {
          timeTrapCard: createTimeTrapCard(),
        },
      })

      const confirmBtn = wrapper.find('[data-testid="confirm-trap-btn"]')
      expect(confirmBtn.attributes('disabled')).toBeDefined()
    })

    it('should enable confirm button when station name is entered', async () => {
      wrapper = mount(TimeTrapModal, {
        props: {
          timeTrapCard: createTimeTrapCard(),
        },
      })

      const input = wrapper.find('[data-testid="station-name-input"]')
      await input.setValue('Library Stop')

      const confirmBtn = wrapper.find('[data-testid="confirm-trap-btn"]')
      expect(confirmBtn.attributes('disabled')).toBeUndefined()
    })

    it('should emit confirm event with station name when clicked', async () => {
      wrapper = mount(TimeTrapModal, {
        props: {
          timeTrapCard: createTimeTrapCard(),
        },
      })

      const input = wrapper.find('[data-testid="station-name-input"]')
      await input.setValue('Central Station')

      const confirmBtn = wrapper.find('[data-testid="confirm-trap-btn"]')
      await confirmBtn.trigger('click')

      expect(wrapper.emitted('confirm')).toBeTruthy()
      expect(wrapper.emitted('confirm')![0]).toEqual(['Central Station'])
    })

    it('should not emit confirm when station name is only whitespace', async () => {
      wrapper = mount(TimeTrapModal, {
        props: {
          timeTrapCard: createTimeTrapCard(),
        },
      })

      const input = wrapper.find('[data-testid="station-name-input"]')
      await input.setValue('   ')

      const confirmBtn = wrapper.find('[data-testid="confirm-trap-btn"]')
      expect(confirmBtn.attributes('disabled')).toBeDefined()
    })
  })

  describe('cancel button', () => {
    it('should display cancel button', () => {
      wrapper = mount(TimeTrapModal, {
        props: {
          timeTrapCard: createTimeTrapCard(),
        },
      })

      expect(wrapper.find('[data-testid="cancel-btn"]').exists()).toBe(true)
    })

    it('should emit cancel event when clicked', async () => {
      wrapper = mount(TimeTrapModal, {
        props: {
          timeTrapCard: createTimeTrapCard(),
        },
      })

      const cancelBtn = wrapper.find('[data-testid="cancel-btn"]')
      await cancelBtn.trigger('click')

      expect(wrapper.emitted('cancel')).toBeTruthy()
    })
  })

  describe('mobile-friendly design', () => {
    it('should have touch-friendly confirm button (min 44px)', () => {
      wrapper = mount(TimeTrapModal, {
        props: {
          timeTrapCard: createTimeTrapCard(),
        },
      })

      const confirmBtn = wrapper.find('[data-testid="confirm-trap-btn"]')
      expect(confirmBtn.classes().some(c => c.includes('min-h-11') || c.includes('py-3'))).toBe(true)
    })

    it('should have touch-friendly cancel button (min 44px)', () => {
      wrapper = mount(TimeTrapModal, {
        props: {
          timeTrapCard: createTimeTrapCard(),
        },
      })

      const cancelBtn = wrapper.find('[data-testid="cancel-btn"]')
      expect(cancelBtn.classes().some(c => c.includes('min-h-11') || c.includes('py-3'))).toBe(true)
    })

    it('should have touch-friendly input field', () => {
      wrapper = mount(TimeTrapModal, {
        props: {
          timeTrapCard: createTimeTrapCard(),
        },
      })

      const input = wrapper.find('[data-testid="station-name-input"]')
      expect(input.classes().some(c => c.includes('min-h-11') || c.includes('py-3') || c.includes('p-3'))).toBe(true)
    })
  })

  describe('accessibility', () => {
    it('should have proper ARIA labels for modal', () => {
      wrapper = mount(TimeTrapModal, {
        props: {
          timeTrapCard: createTimeTrapCard(),
        },
      })

      const modal = wrapper.find('[data-testid="time-trap-modal"]')
      expect(modal.attributes('role')).toBe('dialog')
      expect(modal.attributes('aria-modal')).toBe('true')
    })

    it('should have proper label for input field', () => {
      wrapper = mount(TimeTrapModal, {
        props: {
          timeTrapCard: createTimeTrapCard(),
        },
      })

      // Either aria-label on input or associated label element
      const input = wrapper.find('[data-testid="station-name-input"]')
      const hasAriaLabel = input.attributes('aria-label') !== undefined
      const hasLabel = wrapper.find('label[for]').exists()
      expect(hasAriaLabel || hasLabel).toBe(true)
    })
  })

  describe('trap information display', () => {
    it('should display that trap is publicly visible', () => {
      wrapper = mount(TimeTrapModal, {
        props: {
          timeTrapCard: createTimeTrapCard(),
        },
      })

      expect(wrapper.text().toLowerCase()).toContain('public')
    })

    it('should explain what happens when trap is triggered', () => {
      wrapper = mount(TimeTrapModal, {
        props: {
          timeTrapCard: createTimeTrapCard(),
        },
      })

      expect(wrapper.text().toLowerCase()).toContain('seeker')
    })
  })
})
