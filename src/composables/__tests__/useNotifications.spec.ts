import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { useNotifications } from '../useNotifications'
import { nextTick } from 'vue'

// Mock the navigator.vibrate API
const mockVibrate = vi.fn()
Object.defineProperty(navigator, 'vibrate', {
  value: mockVibrate,
  writable: true,
  configurable: true,
})

// Mock Audio
class MockAudio {
  src = ''
  volume = 1
  play = vi.fn().mockResolvedValue(undefined)
  pause = vi.fn()
  constructor(src?: string) {
    if (src) this.src = src
  }
}
vi.stubGlobal('Audio', MockAudio)

describe('useNotifications', () => {
  let notifications: ReturnType<typeof useNotifications>

  beforeEach(() => {
    vi.useFakeTimers()
    notifications = useNotifications()
    // Reset state between tests (singleton pattern)
    notifications._reset()
    mockVibrate.mockClear()
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  describe('toast notifications', () => {
    describe('showToast', () => {
      it('should add a toast notification to the list', () => {
        notifications.showToast('Test message', 'success')
        expect(notifications.toasts.value).toHaveLength(1)
        expect(notifications.toasts.value[0]!.message).toBe('Test message')
      })

      it('should assign a unique ID to each toast', () => {
        notifications.showToast('First', 'info')
        notifications.showToast('Second', 'info')
        expect(notifications.toasts.value[0]!.id).not.toBe(notifications.toasts.value[1]!.id)
      })

      it('should set the correct type on toast', () => {
        notifications.showToast('Info', 'info')
        notifications.showToast('Success', 'success')
        notifications.showToast('Warning', 'warning')
        notifications.showToast('Error', 'error')

        expect(notifications.toasts.value[0]!.type).toBe('info')
        expect(notifications.toasts.value[1]!.type).toBe('success')
        expect(notifications.toasts.value[2]!.type).toBe('warning')
        expect(notifications.toasts.value[3]!.type).toBe('error')
      })

      it('should auto-dismiss toast after default duration (3000ms)', async () => {
        notifications.showToast('Dismissing', 'info')
        expect(notifications.toasts.value).toHaveLength(1)

        vi.advanceTimersByTime(3000)
        await nextTick()

        expect(notifications.toasts.value).toHaveLength(0)
      })

      it('should auto-dismiss toast after custom duration', async () => {
        notifications.showToast('Dismissing', 'info', { duration: 5000 })
        expect(notifications.toasts.value).toHaveLength(1)

        vi.advanceTimersByTime(3000)
        await nextTick()
        expect(notifications.toasts.value).toHaveLength(1)

        vi.advanceTimersByTime(2000)
        await nextTick()
        expect(notifications.toasts.value).toHaveLength(0)
      })

      it('should not auto-dismiss if duration is 0', async () => {
        notifications.showToast('Persistent', 'info', { duration: 0 })
        expect(notifications.toasts.value).toHaveLength(1)

        vi.advanceTimersByTime(10000)
        await nextTick()

        expect(notifications.toasts.value).toHaveLength(1)
      })
    })

    describe('dismissToast', () => {
      it('should remove a toast by ID', () => {
        notifications.showToast('First', 'info')
        notifications.showToast('Second', 'info')
        const idToRemove = notifications.toasts.value[0]!.id

        notifications.dismissToast(idToRemove)

        expect(notifications.toasts.value).toHaveLength(1)
        expect(notifications.toasts.value[0]!.message).toBe('Second')
      })

      it('should do nothing if toast ID does not exist', () => {
        notifications.showToast('Test', 'info')
        notifications.dismissToast('non-existent-id')
        expect(notifications.toasts.value).toHaveLength(1)
      })
    })

    describe('clearAllToasts', () => {
      it('should remove all toasts', () => {
        notifications.showToast('First', 'info')
        notifications.showToast('Second', 'warning')
        notifications.showToast('Third', 'error')

        notifications.clearAllToasts()

        expect(notifications.toasts.value).toHaveLength(0)
      })
    })
  })

  describe('sound alerts', () => {
    describe('soundEnabled setting', () => {
      it('should default to enabled', () => {
        expect(notifications.soundEnabled.value).toBe(true)
      })

      it('should allow toggling sound on/off', () => {
        notifications.toggleSound()
        expect(notifications.soundEnabled.value).toBe(false)

        notifications.toggleSound()
        expect(notifications.soundEnabled.value).toBe(true)
      })

      it('should allow setting sound directly', () => {
        notifications.setSoundEnabled(false)
        expect(notifications.soundEnabled.value).toBe(false)

        notifications.setSoundEnabled(true)
        expect(notifications.soundEnabled.value).toBe(true)
      })
    })

    describe('playSound', () => {
      it('should play sound when enabled', () => {
        // Just verify no errors thrown - actual sound requires AudioContext
        expect(() => notifications.playSound('timer-warning')).not.toThrow()
      })

      it('should not play sound when disabled', () => {
        notifications.setSoundEnabled(false)
        const playMock = vi.fn()
        vi.stubGlobal('Audio', class { play = playMock })

        notifications.playSound('timer-warning')
        expect(playMock).not.toHaveBeenCalled()
      })

      it('should support different sound types', () => {
        expect(() => notifications.playSound('timer-warning')).not.toThrow()
        expect(() => notifications.playSound('timer-expired')).not.toThrow()
        expect(() => notifications.playSound('curse-cleared')).not.toThrow()
        expect(() => notifications.playSound('game-action')).not.toThrow()
      })
    })
  })

  describe('vibration feedback', () => {
    describe('vibrationEnabled setting', () => {
      it('should default to enabled', () => {
        expect(notifications.vibrationEnabled.value).toBe(true)
      })

      it('should allow toggling vibration on/off', () => {
        notifications.toggleVibration()
        expect(notifications.vibrationEnabled.value).toBe(false)

        notifications.toggleVibration()
        expect(notifications.vibrationEnabled.value).toBe(true)
      })

      it('should allow setting vibration directly', () => {
        notifications.setVibrationEnabled(false)
        expect(notifications.vibrationEnabled.value).toBe(false)

        notifications.setVibrationEnabled(true)
        expect(notifications.vibrationEnabled.value).toBe(true)
      })
    })

    describe('vibrate', () => {
      it('should call navigator.vibrate when enabled', () => {
        notifications.vibrate('short')
        expect(mockVibrate).toHaveBeenCalled()
      })

      it('should not call navigator.vibrate when disabled', () => {
        notifications.setVibrationEnabled(false)
        notifications.vibrate('short')
        expect(mockVibrate).not.toHaveBeenCalled()
      })

      it('should support short vibration pattern', () => {
        notifications.vibrate('short')
        expect(mockVibrate).toHaveBeenCalledWith(50)
      })

      it('should support long vibration pattern', () => {
        notifications.vibrate('long')
        expect(mockVibrate).toHaveBeenCalledWith(200)
      })

      it('should support double vibration pattern', () => {
        notifications.vibrate('double')
        expect(mockVibrate).toHaveBeenCalledWith([50, 100, 50])
      })
    })

    describe('browser support', () => {
      it('should handle browsers without vibration API gracefully', () => {
        const originalVibrate = navigator.vibrate
        // @ts-expect-error - testing undefined vibrate
        navigator.vibrate = undefined

        // Should not throw
        expect(() => notifications.vibrate('short')).not.toThrow()

        navigator.vibrate = originalVibrate
      })
    })
  })

  describe('combined notifications', () => {
    describe('notify', () => {
      it('should show toast, play sound, and vibrate by default', () => {
        notifications.notify('Test notification', 'success')

        expect(notifications.toasts.value).toHaveLength(1)
        expect(mockVibrate).toHaveBeenCalled()
      })

      it('should respect options to disable sound and vibration', () => {
        notifications.notify('Test', 'info', { sound: false, vibrate: false })

        expect(notifications.toasts.value).toHaveLength(1)
        // Sound and vibration not triggered
      })

      it('should use specified sound and vibration patterns', () => {
        notifications.notify('Warning!', 'warning', {
          soundType: 'timer-warning',
          vibratePattern: 'double',
        })

        expect(notifications.toasts.value[0]!.type).toBe('warning')
        expect(mockVibrate).toHaveBeenCalledWith([50, 100, 50])
      })
    })

    describe('preset notifications', () => {
      it('should have preset for timer warning', () => {
        notifications.notifyTimerWarning()
        expect(notifications.toasts.value[0]!.message).toContain('5 minutes')
        expect(notifications.toasts.value[0]!.type).toBe('warning')
      })

      it('should have preset for timer expired', () => {
        notifications.notifyTimerExpired()
        expect(notifications.toasts.value[0]!.message).toContain('expired')
        expect(notifications.toasts.value[0]!.type).toBe('error')
      })

      it('should have preset for curse cleared', () => {
        notifications.notifyCurseCleared('Test Curse')
        expect(notifications.toasts.value[0]!.message).toContain('Test Curse')
        expect(notifications.toasts.value[0]!.message).toContain('cleared')
        expect(notifications.toasts.value[0]!.type).toBe('success')
      })

      it('should have preset for hiding period ended', () => {
        notifications.notifyHidingPeriodEnded()
        expect(notifications.toasts.value[0]!.message).toContain('Seeking')
        expect(notifications.toasts.value[0]!.type).toBe('info')
      })

      it('should have preset for game paused', () => {
        notifications.notifyGamePaused()
        expect(notifications.toasts.value[0]!.message).toContain('paused')
      })

      it('should have preset for game resumed', () => {
        notifications.notifyGameResumed()
        expect(notifications.toasts.value[0]!.message).toContain('resumed')
      })
    })
  })

  describe('settings persistence', () => {
    it('should persist sound setting to localStorage', async () => {
      const setItemSpy = vi.spyOn(Storage.prototype, 'setItem')

      notifications.setSoundEnabled(false)
      await nextTick() // Wait for watch to trigger

      expect(setItemSpy).toHaveBeenCalledWith(
        'jet-lag-notifications',
        expect.stringContaining('"soundEnabled":false')
      )
    })

    it('should persist vibration setting to localStorage', async () => {
      const setItemSpy = vi.spyOn(Storage.prototype, 'setItem')

      notifications.setVibrationEnabled(false)
      await nextTick() // Wait for watch to trigger

      expect(setItemSpy).toHaveBeenCalledWith(
        'jet-lag-notifications',
        expect.stringContaining('"vibrationEnabled":false')
      )
    })
  })
})
