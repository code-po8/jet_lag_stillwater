import { describe, it, expect, afterEach, beforeEach, vi } from 'vitest'
import { render, screen, cleanup, fireEvent } from '@testing-library/vue'
import { createPinia, setActivePinia } from 'pinia'
import { nextTick } from 'vue'
import HidingPeriodTimer from '../HidingPeriodTimer.vue'
import { useGameStore } from '@/stores/gameStore'

/**
 * Helper to set up a game in hiding-period phase
 */
function setupGameInHidingPeriod() {
  const gameStore = useGameStore()
  gameStore.addPlayer('Alice')
  gameStore.addPlayer('Bob')
  // We know players[0] exists because we just added it
  gameStore.startRound(gameStore.players[0]!.id)
  return gameStore
}

describe('HidingPeriodTimer', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    setActivePinia(createPinia())
  })

  afterEach(() => {
    cleanup()
    vi.useRealTimers()
  })

  describe('timer display', () => {
    it('should countdown from 30:00', async () => {
      render(HidingPeriodTimer)
      setupGameInHidingPeriod()

      await nextTick()

      // Initial display should show 30:00
      expect(screen.getByTestId('timer-display')).toHaveTextContent('30:00')
    })

    it('should display time in MM:SS format', async () => {
      render(HidingPeriodTimer)
      setupGameInHidingPeriod()

      await nextTick()

      const timerDisplay = screen.getByTestId('timer-display')
      // Should match MM:SS format
      expect(timerDisplay.textContent).toMatch(/^\d{2}:\d{2}$/)
    })

    it('should update countdown as time passes', async () => {
      render(HidingPeriodTimer)
      setupGameInHidingPeriod()

      await nextTick()

      // Advance 1 minute
      vi.advanceTimersByTime(60000)
      await nextTick()

      expect(screen.getByTestId('timer-display')).toHaveTextContent('29:00')
    })

    it('should be visible on both hider and seeker views', async () => {
      render(HidingPeriodTimer)
      setupGameInHidingPeriod()

      await nextTick()

      // Timer should always be visible when game is in hiding-period
      expect(screen.getByTestId('hiding-period-timer')).toBeInTheDocument()
    })
  })

  describe('seeking freeze indicator', () => {
    it('should show freeze message for seekers during hiding period', async () => {
      render(HidingPeriodTimer, {
        props: {
          role: 'seeker',
        },
      })
      setupGameInHidingPeriod()

      await nextTick()

      expect(screen.getByText(/seekers are frozen/i)).toBeInTheDocument()
    })

    it('should not show freeze message for hiders', async () => {
      render(HidingPeriodTimer, {
        props: {
          role: 'hider',
        },
      })
      setupGameInHidingPeriod()

      await nextTick()

      expect(screen.queryByText(/seekers are frozen/i)).not.toBeInTheDocument()
    })
  })

  describe('5-minute warning alert', () => {
    it('should show visual alert at 5 minutes remaining', async () => {
      render(HidingPeriodTimer)
      setupGameInHidingPeriod()

      await nextTick()

      // Advance to 5 minutes remaining (25 minutes elapsed)
      vi.advanceTimersByTime(25 * 60 * 1000)
      await nextTick()

      expect(screen.getByTestId('hiding-period-timer')).toHaveClass('warning')
    })

    it('should emit warning event at 5 minutes remaining', async () => {
      const onWarning = vi.fn()
      render(HidingPeriodTimer, {
        props: {
          onWarning,
        },
      })
      setupGameInHidingPeriod()

      await nextTick()

      // Advance to 5 minutes remaining
      vi.advanceTimersByTime(25 * 60 * 1000)
      await nextTick()

      expect(onWarning).toHaveBeenCalled()
    })
  })

  describe('timer expiration', () => {
    it('should show visual alert when timer expires', async () => {
      render(HidingPeriodTimer)
      setupGameInHidingPeriod()

      await nextTick()

      // Advance full 30 minutes
      vi.advanceTimersByTime(30 * 60 * 1000)
      await nextTick()

      expect(screen.getByTestId('hiding-period-timer')).toHaveClass('expired')
    })

    it('should emit complete event when timer expires', async () => {
      const onComplete = vi.fn()
      render(HidingPeriodTimer, {
        props: {
          onComplete,
        },
      })
      setupGameInHidingPeriod()

      await nextTick()

      // Advance full 30 minutes
      vi.advanceTimersByTime(30 * 60 * 1000)
      await nextTick()

      expect(onComplete).toHaveBeenCalled()
    })

    it('should display 00:00 when timer expires', async () => {
      render(HidingPeriodTimer)
      setupGameInHidingPeriod()

      await nextTick()

      // Advance full 30 minutes
      vi.advanceTimersByTime(30 * 60 * 1000)
      await nextTick()

      expect(screen.getByTestId('timer-display')).toHaveTextContent('00:00')
    })

    it('should show "Seeking begins!" message when timer expires', async () => {
      render(HidingPeriodTimer)
      setupGameInHidingPeriod()

      await nextTick()

      // Advance full 30 minutes
      vi.advanceTimersByTime(30 * 60 * 1000)
      await nextTick()

      expect(screen.getByText(/seeking begins/i)).toBeInTheDocument()
    })
  })

  describe('pause functionality', () => {
    it('should display pause button', async () => {
      render(HidingPeriodTimer)
      setupGameInHidingPeriod()

      await nextTick()

      expect(screen.getByRole('button', { name: /pause/i })).toBeInTheDocument()
    })

    it('should pause timer when pause button clicked', async () => {
      render(HidingPeriodTimer)
      setupGameInHidingPeriod()

      await nextTick()

      // Advance 1 minute
      vi.advanceTimersByTime(60000)
      await nextTick()

      expect(screen.getByTestId('timer-display')).toHaveTextContent('29:00')

      // Pause
      await fireEvent.click(screen.getByRole('button', { name: /pause/i }))
      await nextTick()

      // Advance another minute while paused
      vi.advanceTimersByTime(60000)
      await nextTick()

      // Time should not have changed
      expect(screen.getByTestId('timer-display')).toHaveTextContent('29:00')
    })

    it('should show resume button when paused', async () => {
      render(HidingPeriodTimer)
      setupGameInHidingPeriod()

      await nextTick()

      await fireEvent.click(screen.getByRole('button', { name: /pause/i }))
      await nextTick()

      expect(screen.getByRole('button', { name: /resume/i })).toBeInTheDocument()
    })

    it('should resume timer when resume button clicked', async () => {
      render(HidingPeriodTimer)
      setupGameInHidingPeriod()

      await nextTick()

      // Advance 1 minute
      vi.advanceTimersByTime(60000)
      await nextTick()

      // Pause
      await fireEvent.click(screen.getByRole('button', { name: /pause/i }))
      await nextTick()

      // Resume
      await fireEvent.click(screen.getByRole('button', { name: /resume/i }))
      await nextTick()

      // Advance another minute
      vi.advanceTimersByTime(60000)
      await nextTick()

      // Time should have continued
      expect(screen.getByTestId('timer-display')).toHaveTextContent('28:00')
    })

    it('should show paused indicator when timer is paused', async () => {
      render(HidingPeriodTimer)
      setupGameInHidingPeriod()

      await nextTick()

      await fireEvent.click(screen.getByRole('button', { name: /pause/i }))
      await nextTick()

      expect(screen.getByTestId('hiding-period-timer')).toHaveClass('paused')
    })
  })

  describe('persistence', () => {
    it('should persist timer state if app is closed', async () => {
      const { unmount } = render(HidingPeriodTimer)
      setupGameInHidingPeriod()

      await nextTick()

      // Advance 5 minutes
      vi.advanceTimersByTime(5 * 60 * 1000)
      await nextTick()

      // Simulate app close by unmounting
      unmount()

      // Re-render with same pinia instance (simulating app reopen)
      render(HidingPeriodTimer)
      await nextTick()

      // Timer should continue from where it left off (approximately 25:00)
      const display = screen.getByTestId('timer-display').textContent
      expect(display).toMatch(/25:0[0-9]/)
    })
  })

  describe('phase awareness', () => {
    it('should not display when not in hiding-period phase', async () => {
      render(HidingPeriodTimer)
      // Note: useGameStore is available but we use defaults (setup phase)

      // Game is in setup phase by default
      await nextTick()

      // Timer should be hidden or show a different state
      expect(screen.queryByTestId('timer-display')).not.toBeInTheDocument()
    })

    it('should display when in hiding-period phase', async () => {
      render(HidingPeriodTimer)
      setupGameInHidingPeriod()

      await nextTick()

      expect(screen.getByTestId('timer-display')).toBeInTheDocument()
    })

    it('should hide when phase transitions to seeking', async () => {
      render(HidingPeriodTimer)
      const gameStore = setupGameInHidingPeriod()

      await nextTick()

      expect(screen.getByTestId('timer-display')).toBeInTheDocument()

      // Transition to seeking
      gameStore.startSeeking()
      await nextTick()

      // Timer should no longer show the countdown
      expect(screen.queryByTestId('timer-display')).not.toBeInTheDocument()
    })
  })

  describe('mobile-friendly design', () => {
    it('should have touch-friendly pause button (min 44px)', async () => {
      render(HidingPeriodTimer)
      setupGameInHidingPeriod()

      await nextTick()

      const pauseButton = screen.getByRole('button', { name: /pause/i })
      expect(pauseButton).toHaveClass('min-h-11', 'min-w-11')
    })

    it('should have large readable timer text', async () => {
      render(HidingPeriodTimer)
      setupGameInHidingPeriod()

      await nextTick()

      const timerDisplay = screen.getByTestId('timer-display')
      // Should have large text class
      expect(timerDisplay.className).toMatch(/text-(3xl|4xl|5xl)/)
    })
  })

  describe('accessibility', () => {
    it('should have proper ARIA label for timer', async () => {
      render(HidingPeriodTimer)
      setupGameInHidingPeriod()

      await nextTick()

      const timer = screen.getByTestId('hiding-period-timer')
      expect(timer).toHaveAttribute('aria-label')
    })

    it('should announce time remaining for screen readers', async () => {
      render(HidingPeriodTimer)
      setupGameInHidingPeriod()

      await nextTick()

      // Should have aria-live region or similar
      const liveRegion = screen.getByRole('timer')
      expect(liveRegion).toBeInTheDocument()
    })
  })
})
