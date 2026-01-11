import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, fireEvent, cleanup } from '@testing-library/vue'
import { setActivePinia, createPinia } from 'pinia'
import GamePauseOverlay from '../GamePauseOverlay.vue'
import { useGameStore } from '@/stores/gameStore'

describe('GamePauseOverlay', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.useFakeTimers()
  })

  afterEach(() => {
    cleanup()
    vi.useRealTimers()
    // Clean up any teleported content
    document.body.innerHTML = ''
  })

  function setupGameInProgress() {
    const store = useGameStore()
    store.addPlayer('Alice')
    store.addPlayer('Bob')
    store.startRound(store.players[0]!.id)
    store.startSeeking()
    return store
  }

  describe('visibility', () => {
    it('should not render when game is not paused', () => {
      setupGameInProgress()

      render(GamePauseOverlay)

      expect(screen.queryByTestId('game-pause-overlay')).not.toBeInTheDocument()
    })

    it('should render when game is paused', () => {
      setupGameInProgress().pauseGame()

      render(GamePauseOverlay)

      expect(screen.getByTestId('game-pause-overlay')).toBeInTheDocument()
    })

    it('should not render during setup phase (no active game)', () => {
      const store = useGameStore()
      store.addPlayer('Alice')
      store.addPlayer('Bob')
      // Still in setup phase

      render(GamePauseOverlay)

      expect(screen.queryByTestId('game-pause-overlay')).not.toBeInTheDocument()
    })
  })

  describe('pause button', () => {
    it('should display pause button during active gameplay', () => {
      setupGameInProgress()

      render(GamePauseOverlay)

      expect(screen.getByRole('button', { name: /pause game/i })).toBeInTheDocument()
    })

    it('should not display pause button during setup phase', () => {
      const store = useGameStore()
      store.addPlayer('Alice')
      store.addPlayer('Bob')

      render(GamePauseOverlay)

      expect(screen.queryByRole('button', { name: /pause game/i })).not.toBeInTheDocument()
    })

    it('should pause game when pause button is clicked', async () => {
      const store = setupGameInProgress()

      render(GamePauseOverlay)
      await fireEvent.click(screen.getByRole('button', { name: /pause game/i }))

      expect(store.isGamePaused).toBe(true)
    })

    it('should show pause button in hiding-period phase', () => {
      const store = useGameStore()
      store.addPlayer('Alice')
      store.addPlayer('Bob')
      store.startRound(store.players[0]!.id)
      // Now in hiding-period phase

      render(GamePauseOverlay)

      expect(screen.getByRole('button', { name: /pause game/i })).toBeInTheDocument()
    })

    it('should show pause button in end-game phase', () => {
      const store = setupGameInProgress()
      store.enterHidingZone()

      render(GamePauseOverlay)

      expect(screen.getByRole('button', { name: /pause game/i })).toBeInTheDocument()
    })

    it('should not show pause button in round-complete phase', () => {
      const store = setupGameInProgress()
      store.enterHidingZone()
      store.hiderFound()

      render(GamePauseOverlay)

      expect(screen.queryByRole('button', { name: /pause game/i })).not.toBeInTheDocument()
    })
  })

  describe('overlay content', () => {
    it('should display "Game Paused" title when paused', () => {
      const store = setupGameInProgress()
      store.pauseGame()

      render(GamePauseOverlay)

      expect(screen.getByText('Game Paused')).toBeInTheDocument()
    })

    it('should display pause indicator message', () => {
      const store = setupGameInProgress()
      store.pauseGame()

      render(GamePauseOverlay)

      expect(screen.getByText(/all timers stopped/i)).toBeInTheDocument()
    })

    it('should display resume button when paused', () => {
      const store = setupGameInProgress()
      store.pauseGame()

      render(GamePauseOverlay)

      expect(screen.getByRole('button', { name: /resume game/i })).toBeInTheDocument()
    })
  })

  describe('resume functionality', () => {
    it('should resume game when resume button is clicked', async () => {
      const store = setupGameInProgress()
      store.pauseGame()

      render(GamePauseOverlay)
      await fireEvent.click(screen.getByRole('button', { name: /resume game/i }))

      expect(store.isGamePaused).toBe(false)
    })

    it('should hide overlay after resume', async () => {
      const store = setupGameInProgress()
      store.pauseGame()

      render(GamePauseOverlay)
      expect(screen.getByTestId('game-pause-overlay')).toBeInTheDocument()

      await fireEvent.click(screen.getByRole('button', { name: /resume game/i }))

      expect(screen.queryByTestId('game-pause-overlay')).not.toBeInTheDocument()
    })
  })

  describe('pause display on both views', () => {
    it('should display paused status on hider view', () => {
      const store = setupGameInProgress()
      store.pauseGame()

      render(GamePauseOverlay, { props: { role: 'hider' } })

      expect(screen.getByTestId('game-pause-overlay')).toBeInTheDocument()
    })

    it('should display paused status on seeker view', () => {
      const store = setupGameInProgress()
      store.pauseGame()

      render(GamePauseOverlay, { props: { role: 'seeker' } })

      expect(screen.getByTestId('game-pause-overlay')).toBeInTheDocument()
    })
  })

  describe('mobile-friendly design', () => {
    it('should have touch-friendly resume button (min 44px)', () => {
      const store = setupGameInProgress()
      store.pauseGame()

      render(GamePauseOverlay)
      const button = screen.getByRole('button', { name: /resume game/i })

      expect(button).toHaveClass('min-h-11')
    })

    it('should have touch-friendly pause button (min 44px)', () => {
      setupGameInProgress()

      render(GamePauseOverlay)
      const button = screen.getByRole('button', { name: /pause game/i })

      expect(button).toHaveClass('min-h-11')
    })
  })

  describe('accessibility', () => {
    it('should have proper ARIA label for overlay', () => {
      const store = setupGameInProgress()
      store.pauseGame()

      render(GamePauseOverlay)
      const overlay = screen.getByTestId('game-pause-overlay')

      expect(overlay).toHaveAttribute('aria-label', 'Game paused overlay')
    })

    it('should have proper heading structure', () => {
      const store = setupGameInProgress()
      store.pauseGame()

      render(GamePauseOverlay)

      expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('Game Paused')
    })

    it('should trap focus within overlay when paused', () => {
      const store = setupGameInProgress()
      store.pauseGame()

      render(GamePauseOverlay)
      const overlay = screen.getByTestId('game-pause-overlay')

      expect(overlay).toHaveAttribute('role', 'dialog')
    })
  })

  describe('visual styling', () => {
    it('should have semi-transparent overlay background', () => {
      const store = setupGameInProgress()
      store.pauseGame()

      render(GamePauseOverlay)
      const overlay = screen.getByTestId('game-pause-overlay')

      expect(overlay).toHaveClass('bg-black/80')
    })

    it('should center content in overlay', () => {
      const store = setupGameInProgress()
      store.pauseGame()

      render(GamePauseOverlay)
      const overlay = screen.getByTestId('game-pause-overlay')

      expect(overlay).toHaveClass('flex')
      expect(overlay).toHaveClass('items-center')
      expect(overlay).toHaveClass('justify-center')
    })
  })
})
