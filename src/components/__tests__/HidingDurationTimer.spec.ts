import { describe, it, expect, afterEach, beforeEach, vi } from 'vitest'
import { render, screen, cleanup, fireEvent } from '@testing-library/vue'
import { createPinia, setActivePinia } from 'pinia'
import { nextTick } from 'vue'
import HidingDurationTimer from '../HidingDurationTimer.vue'
import { useGameStore } from '@/stores/gameStore'

/**
 * Helper to set up a game in seeking phase
 */
function setupGameInSeekingPhase() {
  const gameStore = useGameStore()
  gameStore.addPlayer('Alice')
  gameStore.addPlayer('Bob')
  gameStore.startRound(gameStore.players[0]!.id)
  gameStore.startSeeking()
  return gameStore
}

/**
 * Helper to set up a game in hiding-period phase
 */
function setupGameInHidingPeriod() {
  const gameStore = useGameStore()
  gameStore.addPlayer('Alice')
  gameStore.addPlayer('Bob')
  gameStore.startRound(gameStore.players[0]!.id)
  return gameStore
}

describe('HidingDurationTimer', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    setActivePinia(createPinia())
    localStorage.clear()
  })

  afterEach(() => {
    cleanup()
    vi.useRealTimers()
    localStorage.clear()
  })

  describe('timer display', () => {
    it('should count up from 00:00:00', async () => {
      render(HidingDurationTimer)
      setupGameInSeekingPhase()

      await nextTick()

      // Initial display should show 00:00:00
      expect(screen.getByTestId('timer-display')).toHaveTextContent('00:00:00')
    })

    it('should display time in HH:MM:SS format', async () => {
      render(HidingDurationTimer)
      setupGameInSeekingPhase()

      await nextTick()

      const timerDisplay = screen.getByTestId('timer-display')
      // Should match HH:MM:SS format
      expect(timerDisplay.textContent).toMatch(/^\d{2}:\d{2}:\d{2}$/)
    })

    it('should track elapsed time as time passes', async () => {
      render(HidingDurationTimer)
      setupGameInSeekingPhase()

      await nextTick()

      // Advance 5 minutes
      vi.advanceTimersByTime(5 * 60 * 1000)
      await nextTick()

      expect(screen.getByTestId('timer-display')).toHaveTextContent('00:05:00')
    })

    it('should track time beyond one hour', async () => {
      render(HidingDurationTimer)
      setupGameInSeekingPhase()

      await nextTick()

      // Advance 1 hour 30 minutes
      vi.advanceTimersByTime(90 * 60 * 1000)
      await nextTick()

      expect(screen.getByTestId('timer-display')).toHaveTextContent('01:30:00')
    })
  })

  describe('timer lifecycle', () => {
    it('should start when seeking phase begins', async () => {
      render(HidingDurationTimer)
      const gameStore = setupGameInHidingPeriod()

      await nextTick()

      // Timer should not be visible or running in hiding-period phase
      expect(screen.queryByTestId('hiding-duration-timer')).not.toBeInTheDocument()

      // Transition to seeking phase
      gameStore.startSeeking()
      await nextTick()

      // Timer should now be visible
      expect(screen.getByTestId('hiding-duration-timer')).toBeInTheDocument()
      expect(screen.getByTestId('timer-display')).toHaveTextContent('00:00:00')
    })

    it('should continue running in end-game phase', async () => {
      render(HidingDurationTimer)
      const gameStore = setupGameInSeekingPhase()

      await nextTick()

      // Advance 10 minutes
      vi.advanceTimersByTime(10 * 60 * 1000)
      await nextTick()

      expect(screen.getByTestId('timer-display')).toHaveTextContent('00:10:00')

      // Enter hiding zone (end-game phase)
      gameStore.enterHidingZone()
      await nextTick()

      // Timer should still be visible and running
      expect(screen.getByTestId('hiding-duration-timer')).toBeInTheDocument()

      // Advance another 5 minutes
      vi.advanceTimersByTime(5 * 60 * 1000)
      await nextTick()

      expect(screen.getByTestId('timer-display')).toHaveTextContent('00:15:00')
    })

    it('should stop when hider is found', async () => {
      render(HidingDurationTimer)
      const gameStore = setupGameInSeekingPhase()

      await nextTick()

      // Advance 20 minutes during seeking
      vi.advanceTimersByTime(20 * 60 * 1000)
      await nextTick()

      expect(screen.getByTestId('timer-display')).toHaveTextContent('00:20:00')

      // Enter end-game phase
      gameStore.enterHidingZone()
      await nextTick()

      // Advance another 5 minutes
      vi.advanceTimersByTime(5 * 60 * 1000)
      await nextTick()

      expect(screen.getByTestId('timer-display')).toHaveTextContent('00:25:00')

      // Hider found - timer should stop
      gameStore.hiderFound()
      await nextTick()

      // Capture current time
      const timeWhenFound = screen.getByTestId('timer-display').textContent

      // Advance more time - timer should NOT change
      vi.advanceTimersByTime(5 * 60 * 1000)
      await nextTick()

      expect(screen.getByTestId('timer-display')).toHaveTextContent(timeWhenFound!)
    })
  })

  describe('pause functionality', () => {
    it('should display pause button', async () => {
      render(HidingDurationTimer)
      setupGameInSeekingPhase()

      await nextTick()

      expect(screen.getByRole('button', { name: /pause/i })).toBeInTheDocument()
    })

    it('should pause timer when pause button clicked', async () => {
      render(HidingDurationTimer)
      setupGameInSeekingPhase()

      await nextTick()

      // Advance 5 minutes
      vi.advanceTimersByTime(5 * 60 * 1000)
      await nextTick()

      expect(screen.getByTestId('timer-display')).toHaveTextContent('00:05:00')

      // Pause
      await fireEvent.click(screen.getByRole('button', { name: /pause/i }))
      await nextTick()

      // Advance another 5 minutes while paused
      vi.advanceTimersByTime(5 * 60 * 1000)
      await nextTick()

      // Time should not have changed
      expect(screen.getByTestId('timer-display')).toHaveTextContent('00:05:00')
    })

    it('should show resume button when paused', async () => {
      render(HidingDurationTimer)
      setupGameInSeekingPhase()

      await nextTick()

      await fireEvent.click(screen.getByRole('button', { name: /pause/i }))
      await nextTick()

      expect(screen.getByRole('button', { name: /resume/i })).toBeInTheDocument()
    })

    it('should resume timer when resume button clicked', async () => {
      render(HidingDurationTimer)
      setupGameInSeekingPhase()

      await nextTick()

      // Advance 5 minutes
      vi.advanceTimersByTime(5 * 60 * 1000)
      await nextTick()

      // Pause
      await fireEvent.click(screen.getByRole('button', { name: /pause/i }))
      await nextTick()

      // Resume
      await fireEvent.click(screen.getByRole('button', { name: /resume/i }))
      await nextTick()

      // Advance another 5 minutes
      vi.advanceTimersByTime(5 * 60 * 1000)
      await nextTick()

      // Time should have continued
      expect(screen.getByTestId('timer-display')).toHaveTextContent('00:10:00')
    })

    it('should show paused indicator when timer is paused', async () => {
      render(HidingDurationTimer)
      setupGameInSeekingPhase()

      await nextTick()

      await fireEvent.click(screen.getByRole('button', { name: /pause/i }))
      await nextTick()

      expect(screen.getByTestId('hiding-duration-timer')).toHaveClass('paused')
    })

    it('should hide pause button when timer is stopped (hider found)', async () => {
      render(HidingDurationTimer)
      const gameStore = setupGameInSeekingPhase()

      await nextTick()

      gameStore.enterHidingZone()
      gameStore.hiderFound()
      await nextTick()

      // Pause button should not be present when timer is stopped
      expect(screen.queryByRole('button', { name: /pause/i })).not.toBeInTheDocument()
    })
  })

  describe('final time for scoring', () => {
    it('should emit final-time event when hider is found', async () => {
      const onFinalTime = vi.fn()
      render(HidingDurationTimer, {
        props: {
          onFinalTime,
        },
      })
      const gameStore = setupGameInSeekingPhase()

      await nextTick()

      // Advance 25 minutes
      vi.advanceTimersByTime(25 * 60 * 1000)
      await nextTick()

      gameStore.enterHidingZone()
      await nextTick()

      // Advance 5 more minutes
      vi.advanceTimersByTime(5 * 60 * 1000)
      await nextTick()

      gameStore.hiderFound()
      await nextTick()

      // Should emit final time of 30 minutes
      expect(onFinalTime).toHaveBeenCalledWith(30 * 60 * 1000)
    })

    it('should expose elapsed time getter for scoring', async () => {
      render(HidingDurationTimer)
      setupGameInSeekingPhase()

      await nextTick()

      // Advance 15 minutes
      vi.advanceTimersByTime(15 * 60 * 1000)
      await nextTick()

      // The display should show the elapsed time
      expect(screen.getByTestId('timer-display')).toHaveTextContent('00:15:00')
    })
  })

  describe('persistence', () => {
    it('should persist timer state if app is closed', async () => {
      const { unmount } = render(HidingDurationTimer)
      setupGameInSeekingPhase()

      await nextTick()

      // Advance 10 minutes
      vi.advanceTimersByTime(10 * 60 * 1000)
      await nextTick()

      expect(screen.getByTestId('timer-display')).toHaveTextContent('00:10:00')

      // Simulate app close by unmounting
      unmount()

      // Re-render with same pinia instance (simulating app reopen)
      render(HidingDurationTimer)
      await nextTick()

      // Timer should continue from where it left off (approximately 10:00)
      const display = screen.getByTestId('timer-display').textContent
      expect(display).toMatch(/00:10:0[0-9]/)
    })

    it('should handle time passed while app was closed', async () => {
      const { unmount } = render(HidingDurationTimer)
      setupGameInSeekingPhase()

      await nextTick()

      // Advance 5 minutes
      vi.advanceTimersByTime(5 * 60 * 1000)
      await nextTick()

      // Simulate app close
      unmount()

      // Simulate 5 more minutes passing while app was closed
      vi.advanceTimersByTime(5 * 60 * 1000)

      // Re-render
      render(HidingDurationTimer)
      await nextTick()

      // Timer should account for time passed (approximately 10 minutes)
      const display = screen.getByTestId('timer-display').textContent
      expect(display).toMatch(/00:10:0[0-9]/)
    })
  })

  describe('phase awareness', () => {
    it('should not display when in setup phase', async () => {
      render(HidingDurationTimer)
      // Game is in setup phase by default

      await nextTick()

      expect(screen.queryByTestId('hiding-duration-timer')).not.toBeInTheDocument()
    })

    it('should not display when in hiding-period phase', async () => {
      render(HidingDurationTimer)
      setupGameInHidingPeriod()

      await nextTick()

      expect(screen.queryByTestId('hiding-duration-timer')).not.toBeInTheDocument()
    })

    it('should display when in seeking phase', async () => {
      render(HidingDurationTimer)
      setupGameInSeekingPhase()

      await nextTick()

      expect(screen.getByTestId('hiding-duration-timer')).toBeInTheDocument()
    })

    it('should display when in end-game phase', async () => {
      render(HidingDurationTimer)
      const gameStore = setupGameInSeekingPhase()
      gameStore.enterHidingZone()

      await nextTick()

      expect(screen.getByTestId('hiding-duration-timer')).toBeInTheDocument()
    })

    it('should display final time in round-complete phase', async () => {
      render(HidingDurationTimer)
      const gameStore = setupGameInSeekingPhase()

      await nextTick()

      // Advance 20 minutes
      vi.advanceTimersByTime(20 * 60 * 1000)
      await nextTick()

      gameStore.enterHidingZone()
      gameStore.hiderFound()
      await nextTick()

      // Should still show timer with final time
      expect(screen.getByTestId('hiding-duration-timer')).toBeInTheDocument()
      expect(screen.getByTestId('timer-display')).toHaveTextContent('00:20:00')
    })
  })

  describe('mobile-friendly design', () => {
    it('should have touch-friendly pause button (min 44px)', async () => {
      render(HidingDurationTimer)
      setupGameInSeekingPhase()

      await nextTick()

      const pauseButton = screen.getByRole('button', { name: /pause/i })
      expect(pauseButton).toHaveClass('min-h-11', 'min-w-11')
    })

    it('should have large readable timer text', async () => {
      render(HidingDurationTimer)
      setupGameInSeekingPhase()

      await nextTick()

      const timerDisplay = screen.getByTestId('timer-display')
      // Should have large text class
      expect(timerDisplay.className).toMatch(/text-(3xl|4xl|5xl)/)
    })
  })

  describe('accessibility', () => {
    it('should have proper ARIA label for timer', async () => {
      render(HidingDurationTimer)
      setupGameInSeekingPhase()

      await nextTick()

      const timer = screen.getByTestId('hiding-duration-timer')
      expect(timer).toHaveAttribute('aria-label')
    })

    it('should announce elapsed time for screen readers', async () => {
      render(HidingDurationTimer)
      setupGameInSeekingPhase()

      await nextTick()

      // Should have timer role
      const timerElement = screen.getByRole('timer')
      expect(timerElement).toBeInTheDocument()
    })
  })

  describe('status messages', () => {
    it('should show seeking status during seeking phase', async () => {
      render(HidingDurationTimer)
      setupGameInSeekingPhase()

      await nextTick()

      expect(screen.getByText(/seeking in progress/i)).toBeInTheDocument()
    })

    it('should show end-game status during end-game phase', async () => {
      render(HidingDurationTimer)
      const gameStore = setupGameInSeekingPhase()
      gameStore.enterHidingZone()

      await nextTick()

      expect(screen.getByText(/in hiding zone/i)).toBeInTheDocument()
    })

    it('should show found status in round-complete phase', async () => {
      render(HidingDurationTimer)
      const gameStore = setupGameInSeekingPhase()

      await nextTick()

      vi.advanceTimersByTime(10 * 60 * 1000)
      await nextTick()

      gameStore.enterHidingZone()
      gameStore.hiderFound()
      await nextTick()

      expect(screen.getByText(/hider found/i)).toBeInTheDocument()
    })
  })
})
