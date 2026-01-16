/**
 * Dev Skip Hiding Period Button Tests (DEV-001)
 *
 * Tests for the developer tool that allows skipping the 30-minute hiding period
 * to quickly test seeking and end-game phases.
 *
 * Note: The component should only be visible in dev mode (import.meta.env.DEV).
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, cleanup, fireEvent } from '@testing-library/vue'
import { createPinia, setActivePinia } from 'pinia'
import { nextTick } from 'vue'
import DevSkipHidingPeriod from '../DevSkipHidingPeriod.vue'
import { useGameStore, GamePhase } from '@/stores/gameStore'

describe('DevSkipHidingPeriod', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  afterEach(() => {
    cleanup()
    vi.clearAllMocks()
    vi.unstubAllEnvs()
  })

  function setupGame(phase: GamePhase = GamePhase.HidingPeriod) {
    const gameStore = useGameStore()
    gameStore.addPlayer('Alice')
    gameStore.addPlayer('Bob')
    const aliceId = gameStore.players[0]!.id
    gameStore.startRound(aliceId)
    if (phase !== GamePhase.HidingPeriod) {
      gameStore.currentPhase = phase
    }
    return gameStore
  }

  function renderComponent() {
    return render(DevSkipHidingPeriod)
  }

  describe('visibility', () => {
    it('should not render in production mode', () => {
      vi.stubEnv('DEV', false)
      setupGame(GamePhase.HidingPeriod)
      renderComponent()

      expect(screen.queryByRole('button', { name: /skip/i })).not.toBeInTheDocument()
    })

    it('should render in dev mode during hiding period', () => {
      vi.stubEnv('DEV', true)
      setupGame(GamePhase.HidingPeriod)
      renderComponent()

      expect(screen.getByRole('button', { name: /skip/i })).toBeInTheDocument()
    })

    it('should not render during setup phase', () => {
      vi.stubEnv('DEV', true)
      setupGame(GamePhase.Setup)
      renderComponent()

      expect(screen.queryByRole('button', { name: /skip/i })).not.toBeInTheDocument()
    })

    it('should not render during seeking phase', () => {
      vi.stubEnv('DEV', true)
      setupGame(GamePhase.Seeking)
      renderComponent()

      expect(screen.queryByRole('button', { name: /skip/i })).not.toBeInTheDocument()
    })

    it('should not render during end-game phase', () => {
      vi.stubEnv('DEV', true)
      setupGame(GamePhase.EndGame)
      renderComponent()

      expect(screen.queryByRole('button', { name: /skip/i })).not.toBeInTheDocument()
    })

    it('should not render during round-complete phase', () => {
      vi.stubEnv('DEV', true)
      setupGame(GamePhase.RoundComplete)
      renderComponent()

      expect(screen.queryByRole('button', { name: /skip/i })).not.toBeInTheDocument()
    })
  })

  describe('functionality', () => {
    it('should call startSeeking when clicked', async () => {
      vi.stubEnv('DEV', true)
      const gameStore = setupGame(GamePhase.HidingPeriod)
      const startSeekingSpy = vi.spyOn(gameStore, 'startSeeking')
      renderComponent()

      const button = screen.getByRole('button', { name: /skip/i })
      await fireEvent.click(button)
      await nextTick()

      expect(startSeekingSpy).toHaveBeenCalled()
    })

    it('should transition game to seeking phase', async () => {
      vi.stubEnv('DEV', true)
      const gameStore = setupGame(GamePhase.HidingPeriod)
      renderComponent()

      const button = screen.getByRole('button', { name: /skip/i })
      await fireEvent.click(button)
      await nextTick()

      expect(gameStore.currentPhase).toBe(GamePhase.Seeking)
    })
  })

  describe('visual styling', () => {
    it('should display DEV badge', () => {
      vi.stubEnv('DEV', true)
      setupGame(GamePhase.HidingPeriod)
      renderComponent()

      expect(screen.getByText(/dev/i)).toBeInTheDocument()
    })

    it('should have visually distinct styling (warning/yellow appearance)', () => {
      vi.stubEnv('DEV', true)
      setupGame(GamePhase.HidingPeriod)
      renderComponent()

      const button = screen.getByRole('button', { name: /skip/i })
      // Check for dev-skip-button class which contains yellow/warning styling
      expect(button.className).toMatch(/dev-skip-button/)
    })
  })

  describe('accessibility', () => {
    it('should have accessible label', () => {
      vi.stubEnv('DEV', true)
      setupGame(GamePhase.HidingPeriod)
      renderComponent()

      const button = screen.getByRole('button', { name: /skip/i })
      expect(button).toHaveAccessibleName()
    })

    it('should be keyboard accessible', async () => {
      vi.stubEnv('DEV', true)
      setupGame(GamePhase.HidingPeriod)
      renderComponent()

      const button = screen.getByRole('button', { name: /skip/i })
      // Button should be focusable
      button.focus()
      expect(document.activeElement).toBe(button)
      // Button should have proper button type (native buttons handle Enter/Space automatically)
      expect(button).toHaveAttribute('type', 'button')
    })
  })
})
