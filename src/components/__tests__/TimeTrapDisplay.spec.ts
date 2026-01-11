import { describe, it, expect, beforeEach } from 'vitest'
import { mount, VueWrapper } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import TimeTrapDisplay from '../TimeTrapDisplay.vue'
import { type ActiveTimeTrap } from '@/stores/cardStore'

describe('TimeTrapDisplay', () => {
  let wrapper: VueWrapper

  function createTrap(overrides: Partial<ActiveTimeTrap> = {}): ActiveTimeTrap {
    return {
      instanceId: 'trap-test-id',
      stationName: 'Test Station',
      bonusMinutes: 15,
      isTriggered: false,
      createdAt: new Date(),
      ...overrides,
    }
  }

  beforeEach(() => {
    setActivePinia(createPinia())
  })

  describe('with no traps', () => {
    it('should not render when traps array is empty', () => {
      wrapper = mount(TimeTrapDisplay, {
        props: {
          traps: [],
          isHider: true,
        },
      })

      expect(wrapper.find('[data-testid="time-trap-display"]').exists()).toBe(false)
    })
  })

  describe('with active traps', () => {
    it('should render when there are traps', () => {
      wrapper = mount(TimeTrapDisplay, {
        props: {
          traps: [createTrap()],
          isHider: true,
        },
      })

      expect(wrapper.find('[data-testid="time-trap-display"]').exists()).toBe(true)
    })

    it('should display all traps', () => {
      const traps = [
        createTrap({ instanceId: '1', stationName: 'Station A' }),
        createTrap({ instanceId: '2', stationName: 'Station B' }),
      ]

      wrapper = mount(TimeTrapDisplay, {
        props: {
          traps,
          isHider: true,
        },
      })

      expect(wrapper.text()).toContain('Station A')
      expect(wrapper.text()).toContain('Station B')
    })

    it('should show header indicating active traps', () => {
      wrapper = mount(TimeTrapDisplay, {
        props: {
          traps: [createTrap()],
          isHider: true,
        },
      })

      expect(wrapper.text().toLowerCase()).toContain('trap')
    })

    it('should display station name for each trap', () => {
      wrapper = mount(TimeTrapDisplay, {
        props: {
          traps: [createTrap({ stationName: 'Main Street Station' })],
          isHider: true,
        },
      })

      expect(wrapper.text()).toContain('Main Street Station')
    })

    it('should show bonus minutes for untriggered traps', () => {
      wrapper = mount(TimeTrapDisplay, {
        props: {
          traps: [createTrap({ bonusMinutes: 15, isTriggered: false })],
          isHider: true,
        },
      })

      expect(wrapper.text()).toContain('15')
    })
  })

  describe('triggered vs untriggered traps', () => {
    it('should visually differentiate untriggered traps', () => {
      wrapper = mount(TimeTrapDisplay, {
        props: {
          traps: [createTrap({ isTriggered: false })],
          isHider: true,
        },
      })

      const trapItem = wrapper.find('[data-testid="trap-item"]')
      expect(trapItem.exists()).toBe(true)
      // Check for some styling indication (orange for active trap)
      expect(trapItem.classes().some(c => c.includes('orange') || c.includes('yellow'))).toBe(true)
    })

    it('should visually differentiate triggered traps', () => {
      wrapper = mount(TimeTrapDisplay, {
        props: {
          traps: [createTrap({ isTriggered: true })],
          isHider: true,
        },
      })

      const trapItem = wrapper.find('[data-testid="trap-item"]')
      expect(trapItem.exists()).toBe(true)
      // Check for some styling indication (green for triggered/success)
      expect(trapItem.classes().some(c => c.includes('green'))).toBe(true)
    })

    it('should show triggered indicator for triggered traps', () => {
      wrapper = mount(TimeTrapDisplay, {
        props: {
          traps: [createTrap({ isTriggered: true })],
          isHider: true,
        },
      })

      expect(wrapper.text().toLowerCase()).toContain('triggered')
    })
  })

  describe('hider vs seeker view', () => {
    it('should show trigger button for seekers on untriggered traps', () => {
      wrapper = mount(TimeTrapDisplay, {
        props: {
          traps: [createTrap({ isTriggered: false })],
          isHider: false,
        },
      })

      expect(wrapper.find('[data-testid="trigger-trap-btn"]').exists()).toBe(true)
    })

    it('should not show trigger button for hiders', () => {
      wrapper = mount(TimeTrapDisplay, {
        props: {
          traps: [createTrap({ isTriggered: false })],
          isHider: true,
        },
      })

      expect(wrapper.find('[data-testid="trigger-trap-btn"]').exists()).toBe(false)
    })

    it('should not show trigger button for already triggered traps', () => {
      wrapper = mount(TimeTrapDisplay, {
        props: {
          traps: [createTrap({ isTriggered: true })],
          isHider: false,
        },
      })

      expect(wrapper.find('[data-testid="trigger-trap-btn"]').exists()).toBe(false)
    })

    it('should emit trigger event when seeker clicks trigger button', async () => {
      const trap = createTrap({ isTriggered: false })
      wrapper = mount(TimeTrapDisplay, {
        props: {
          traps: [trap],
          isHider: false,
        },
      })

      const triggerBtn = wrapper.find('[data-testid="trigger-trap-btn"]')
      await triggerBtn.trigger('click')

      expect(wrapper.emitted('trigger')).toBeTruthy()
      expect(wrapper.emitted('trigger')![0]).toEqual([trap.instanceId])
    })
  })

  describe('accessibility', () => {
    it('should have proper ARIA labeling', () => {
      wrapper = mount(TimeTrapDisplay, {
        props: {
          traps: [createTrap()],
          isHider: true,
        },
      })

      const display = wrapper.find('[data-testid="time-trap-display"]')
      expect(display.attributes('role') || display.attributes('aria-label')).toBeDefined()
    })
  })

  describe('mobile-friendly design', () => {
    it('should have touch-friendly trigger buttons (min 44px)', () => {
      wrapper = mount(TimeTrapDisplay, {
        props: {
          traps: [createTrap({ isTriggered: false })],
          isHider: false,
        },
      })

      const triggerBtn = wrapper.find('[data-testid="trigger-trap-btn"]')
      expect(triggerBtn.classes().some(c => c.includes('min-h-11') || c.includes('py-2') || c.includes('p-2'))).toBe(true)
    })
  })
})
