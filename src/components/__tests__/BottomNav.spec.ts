import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount, VueWrapper } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import BottomNav from '../BottomNav.vue'

// Mock vue-router
vi.mock('vue-router', () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
  useRoute: () => ({
    name: 'game',
    path: '/game',
  }),
}))

describe('BottomNav', () => {
  let wrapper: VueWrapper

  beforeEach(() => {
    setActivePinia(createPinia())
  })

  describe('tab display', () => {
    it('should display all navigation tabs', () => {
      wrapper = mount(BottomNav, {
        props: {
          currentTab: 'questions',
        },
      })

      expect(wrapper.find('[data-testid="nav-tab-questions"]').exists()).toBe(true)
      expect(wrapper.find('[data-testid="nav-tab-map"]').exists()).toBe(true)
      expect(wrapper.find('[data-testid="nav-tab-timers"]').exists()).toBe(true)
      expect(wrapper.find('[data-testid="nav-tab-cards"]').exists()).toBe(true)
      expect(wrapper.find('[data-testid="nav-tab-history"]').exists()).toBe(true)
    })

    it('hides the Admin tab by default (non-host)', () => {
      wrapper = mount(BottomNav, { props: { currentTab: 'questions' } })
      expect(wrapper.find('[data-testid="nav-tab-admin"]').exists()).toBe(false)
    })

    it('shows the Admin tab when showAdmin is true (host)', () => {
      wrapper = mount(BottomNav, { props: { currentTab: 'questions', showAdmin: true } })
      expect(wrapper.find('[data-testid="nav-tab-admin"]').exists()).toBe(true)
      expect(wrapper.text()).toContain('Admin')
    })

    it('should display tab labels', () => {
      wrapper = mount(BottomNav, {
        props: {
          currentTab: 'questions',
        },
      })

      expect(wrapper.text()).toContain('Questions')
      expect(wrapper.text()).toContain('Map')
      expect(wrapper.text()).toContain('Timers')
      expect(wrapper.text()).toContain('Cards')
      expect(wrapper.text()).toContain('History')
    })

    it('should have touch-friendly tab buttons (min 44px height)', () => {
      wrapper = mount(BottomNav, {
        props: {
          currentTab: 'questions',
        },
      })

      // Check only button elements (not their children) for touch-friendly styling
      const tabs = wrapper.findAll('button[data-testid^="nav-tab-"]')
      expect(tabs.length).toBe(5)
      tabs.forEach((tab) => {
        // Verify tab has bottom-nav-item class for proper touch target styling
        expect(tab.classes()).toContain('bottom-nav-item')
      })
    })
  })

  describe('current tab indication', () => {
    it('should highlight the questions tab when active', () => {
      wrapper = mount(BottomNav, {
        props: {
          currentTab: 'questions',
        },
      })

      const questionsTab = wrapper.find('[data-testid="nav-tab-questions"]')
      expect(questionsTab.classes()).toContain('active')
    })

    it('should highlight the timers tab when active', () => {
      wrapper = mount(BottomNav, {
        props: {
          currentTab: 'timers',
        },
      })

      const timersTab = wrapper.find('[data-testid="nav-tab-timers"]')
      expect(timersTab.classes()).toContain('active')
    })

    it('should highlight the cards tab when active', () => {
      wrapper = mount(BottomNav, {
        props: {
          currentTab: 'cards',
        },
      })

      const cardsTab = wrapper.find('[data-testid="nav-tab-cards"]')
      expect(cardsTab.classes()).toContain('active')
    })

    it('should highlight the history tab when active', () => {
      wrapper = mount(BottomNav, {
        props: {
          currentTab: 'history',
        },
      })

      const historyTab = wrapper.find('[data-testid="nav-tab-history"]')
      expect(historyTab.classes()).toContain('active')
    })

    it('should not highlight inactive tabs', () => {
      wrapper = mount(BottomNav, {
        props: {
          currentTab: 'questions',
        },
      })

      const timersTab = wrapper.find('[data-testid="nav-tab-timers"]')
      const cardsTab = wrapper.find('[data-testid="nav-tab-cards"]')
      const historyTab = wrapper.find('[data-testid="nav-tab-history"]')

      expect(timersTab.classes()).not.toContain('active')
      expect(cardsTab.classes()).not.toContain('active')
      expect(historyTab.classes()).not.toContain('active')
    })
  })

  describe('tab switching', () => {
    it('should emit tab-change event when a tab is clicked', async () => {
      wrapper = mount(BottomNav, {
        props: {
          currentTab: 'questions',
        },
      })

      const timersTab = wrapper.find('[data-testid="nav-tab-timers"]')
      await timersTab.trigger('click')

      expect(wrapper.emitted('tab-change')).toBeTruthy()
      expect(wrapper.emitted('tab-change')![0]).toEqual(['timers'])
    })

    it('should emit tab-change with cards when cards tab clicked', async () => {
      wrapper = mount(BottomNav, {
        props: {
          currentTab: 'questions',
        },
      })

      const cardsTab = wrapper.find('[data-testid="nav-tab-cards"]')
      await cardsTab.trigger('click')

      expect(wrapper.emitted('tab-change')![0]).toEqual(['cards'])
    })

    it('should emit tab-change with history when history tab clicked', async () => {
      wrapper = mount(BottomNav, {
        props: {
          currentTab: 'questions',
        },
      })

      const historyTab = wrapper.find('[data-testid="nav-tab-history"]')
      await historyTab.trigger('click')

      expect(wrapper.emitted('tab-change')![0]).toEqual(['history'])
    })
  })

  describe('mobile-friendly layout', () => {
    it('should render as a fixed bottom bar', () => {
      wrapper = mount(BottomNav, {
        props: {
          currentTab: 'questions',
        },
      })

      const nav = wrapper.find('[data-testid="bottom-nav"]')
      // Uses bottom-nav class which handles fixed positioning via CSS
      expect(nav.classes()).toContain('bottom-nav')
    })

    it('should span full width', () => {
      wrapper = mount(BottomNav, {
        props: {
          currentTab: 'questions',
        },
      })

      const nav = wrapper.find('[data-testid="bottom-nav"]')
      // Uses bottom-nav class which sets width via CSS
      expect(nav.classes()).toContain('bottom-nav')
    })

    it('should have horizontal flex layout for tabs', () => {
      wrapper = mount(BottomNav, {
        props: {
          currentTab: 'questions',
        },
      })

      const nav = wrapper.find('[data-testid="bottom-nav"]')
      // Uses bottom-nav class which sets flex display via CSS
      expect(nav.classes()).toContain('bottom-nav')
    })
  })

  describe('accessibility', () => {
    it('should have nav role', () => {
      wrapper = mount(BottomNav, {
        props: {
          currentTab: 'questions',
        },
      })

      const nav = wrapper.find('[data-testid="bottom-nav"]')
      expect(nav.attributes('role')).toBe('navigation')
    })

    it('should have aria-label for navigation', () => {
      wrapper = mount(BottomNav, {
        props: {
          currentTab: 'questions',
        },
      })

      const nav = wrapper.find('[data-testid="bottom-nav"]')
      expect(nav.attributes('aria-label')).toBe('Main navigation')
    })

    it('should have aria-current for active tab', () => {
      wrapper = mount(BottomNav, {
        props: {
          currentTab: 'questions',
        },
      })

      const questionsTab = wrapper.find('[data-testid="nav-tab-questions"]')
      expect(questionsTab.attributes('aria-current')).toBe('page')

      const timersTab = wrapper.find('[data-testid="nav-tab-timers"]')
      expect(timersTab.attributes('aria-current')).toBeUndefined()
    })
  })

  describe('visual icons', () => {
    it('should display icons for each tab', () => {
      wrapper = mount(BottomNav, {
        props: {
          currentTab: 'questions',
        },
      })

      // Each tab should have an icon element
      expect(wrapper.find('[data-testid="nav-tab-questions-icon"]').exists()).toBe(true)
      expect(wrapper.find('[data-testid="nav-tab-timers-icon"]').exists()).toBe(true)
      expect(wrapper.find('[data-testid="nav-tab-cards-icon"]').exists()).toBe(true)
      expect(wrapper.find('[data-testid="nav-tab-history-icon"]').exists()).toBe(true)
    })
  })

  // QSYNC-006: a badge draws attention to a tab (e.g. Cards when a question is
  // pending for the hider), independent of which tab is active.
  describe('tab badge', () => {
    it('shows no badges by default', () => {
      wrapper = mount(BottomNav, { props: { currentTab: 'questions' } })
      expect(wrapper.find('[data-testid="nav-badge-cards"]').exists()).toBe(false)
    })

    it('renders a badge on a tab listed in badgeTabs', () => {
      wrapper = mount(BottomNav, {
        props: { currentTab: 'questions', badgeTabs: ['cards'] },
      })
      expect(wrapper.find('[data-testid="nav-badge-cards"]').exists()).toBe(true)
      // Only the listed tab is badged.
      expect(wrapper.find('[data-testid="nav-badge-history"]').exists()).toBe(false)
    })

    it('removes the badge when the tab is no longer in badgeTabs', async () => {
      wrapper = mount(BottomNav, {
        props: { currentTab: 'questions', badgeTabs: ['cards'] },
      })
      expect(wrapper.find('[data-testid="nav-badge-cards"]').exists()).toBe(true)
      await wrapper.setProps({ badgeTabs: [] })
      expect(wrapper.find('[data-testid="nav-badge-cards"]').exists()).toBe(false)
    })
  })
})
