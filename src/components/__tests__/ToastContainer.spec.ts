import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mount, config } from '@vue/test-utils'
import { nextTick } from 'vue'
import ToastContainer from '../ToastContainer.vue'
import { useNotifications } from '@/composables/useNotifications'

// Mock navigator.vibrate
Object.defineProperty(navigator, 'vibrate', {
  value: vi.fn(),
  writable: true,
  configurable: true,
})

// Stub Teleport so it renders inline
config.global.stubs = {
  ...config.global.stubs,
  Teleport: true,
}

describe('ToastContainer', () => {
  let notifications: ReturnType<typeof useNotifications>

  beforeEach(() => {
    vi.useFakeTimers()
    notifications = useNotifications()
    notifications._reset()
    notifications.clearAllToasts()
  })

  afterEach(() => {
    notifications.clearAllToasts()
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  // Helper to find the actual toast items (not the container)
  function findToastItems(wrapper: ReturnType<typeof mount>) {
    // Find divs that have role="alert" - these are the actual toast items
    return wrapper.findAll('[role="alert"]')
  }

  describe('visibility', () => {
    it('should not render when there are no toasts', () => {
      const wrapper = mount(ToastContainer)
      expect(wrapper.find('[data-testid="toast-container"]').exists()).toBe(true)
      expect(findToastItems(wrapper)).toHaveLength(0)
    })

    it('should render toasts when they exist', async () => {
      const wrapper = mount(ToastContainer)
      notifications.showToast('Test message', 'info')
      await nextTick()
      expect(findToastItems(wrapper)).toHaveLength(1)
    })
  })

  describe('toast display', () => {
    it('should display toast message', async () => {
      const wrapper = mount(ToastContainer)
      notifications.showToast('Hello World', 'success')
      await nextTick()
      expect(wrapper.text()).toContain('Hello World')
    })

    it('should display multiple toasts', async () => {
      const wrapper = mount(ToastContainer)
      notifications.showToast('First toast', 'info')
      notifications.showToast('Second toast', 'success')
      await nextTick()
      expect(findToastItems(wrapper)).toHaveLength(2)
      expect(wrapper.text()).toContain('First toast')
      expect(wrapper.text()).toContain('Second toast')
    })
  })

  describe('toast types', () => {
    it('should apply info styling for info toasts', async () => {
      const wrapper = mount(ToastContainer)
      notifications.showToast('Info message', 'info')
      await nextTick()
      const toast = findToastItems(wrapper)[0]!
      expect(toast.classes()).toContain('toast-info')
    })

    it('should apply success styling for success toasts', async () => {
      const wrapper = mount(ToastContainer)
      notifications.showToast('Success message', 'success')
      await nextTick()
      const toast = findToastItems(wrapper)[0]!
      expect(toast.classes()).toContain('toast-success')
    })

    it('should apply warning styling for warning toasts', async () => {
      const wrapper = mount(ToastContainer)
      notifications.showToast('Warning message', 'warning')
      await nextTick()
      const toast = findToastItems(wrapper)[0]!
      expect(toast.classes()).toContain('toast-warning')
    })

    it('should apply error styling for error toasts', async () => {
      const wrapper = mount(ToastContainer)
      notifications.showToast('Error message', 'error')
      await nextTick()
      const toast = findToastItems(wrapper)[0]!
      expect(toast.classes()).toContain('toast-error')
    })
  })

  describe('dismiss functionality', () => {
    it('should have a dismiss button on each toast', async () => {
      const wrapper = mount(ToastContainer)
      notifications.showToast('Dismissible', 'info')
      await nextTick()
      expect(wrapper.find('[data-testid="toast-dismiss"]').exists()).toBe(true)
    })

    it('should dismiss toast when dismiss button is clicked', async () => {
      const wrapper = mount(ToastContainer)
      notifications.showToast('Dismissible', 'info')
      await nextTick()
      expect(findToastItems(wrapper)).toHaveLength(1)

      await wrapper.find('[data-testid="toast-dismiss"]').trigger('click')
      await nextTick()
      expect(findToastItems(wrapper)).toHaveLength(0)
    })

    it('should auto-dismiss after duration', async () => {
      const wrapper = mount(ToastContainer)
      notifications.showToast('Auto dismiss', 'info')
      await nextTick()
      expect(findToastItems(wrapper)).toHaveLength(1)

      vi.advanceTimersByTime(3000)
      await nextTick()
      expect(findToastItems(wrapper)).toHaveLength(0)
    })
  })

  describe('positioning', () => {
    it('should be positioned at the top of the screen', () => {
      const wrapper = mount(ToastContainer)
      const container = wrapper.find('[data-testid="toast-container"]')
      expect(container.classes()).toContain('fixed')
      expect(container.classes()).toContain('top-4')
    })

    it('should be centered horizontally', () => {
      const wrapper = mount(ToastContainer)
      const container = wrapper.find('[data-testid="toast-container"]')
      expect(container.classes()).toContain('left-1/2')
    })
  })

  describe('mobile-friendly design', () => {
    it('should have touch-friendly dismiss button (min 44px)', async () => {
      const wrapper = mount(ToastContainer)
      notifications.showToast('Touch friendly', 'info')
      await nextTick()
      const dismissBtn = wrapper.find('[data-testid="toast-dismiss"]')
      expect(dismissBtn.classes()).toContain('min-h-11')
    })

    it('should have readable text size', async () => {
      const wrapper = mount(ToastContainer)
      notifications.showToast('Readable', 'info')
      await nextTick()
      const toast = findToastItems(wrapper)[0]!
      expect(toast.classes()).toContain('text-sm')
    })
  })

  describe('accessibility', () => {
    it('should have role="alert" for screen readers', async () => {
      const wrapper = mount(ToastContainer)
      notifications.showToast('Alert message', 'info')
      await nextTick()
      const toast = findToastItems(wrapper)[0]!
      expect(toast.attributes('role')).toBe('alert')
    })

    it('should have aria-live="polite" on container', () => {
      const wrapper = mount(ToastContainer)
      const container = wrapper.find('[data-testid="toast-container"]')
      expect(container.attributes('aria-live')).toBe('polite')
    })

    it('should have aria-label on dismiss button', async () => {
      const wrapper = mount(ToastContainer)
      notifications.showToast('Dismissible', 'info')
      await nextTick()
      const dismissBtn = wrapper.find('[data-testid="toast-dismiss"]')
      expect(dismissBtn.attributes('aria-label')).toBe('Dismiss notification')
    })
  })
})
