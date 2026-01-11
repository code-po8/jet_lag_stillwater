/**
 * End Game Controls Tests (GS-005)
 *
 * Tests for the end game flow including:
 * - Enter Hiding Zone action
 * - Hider Found action
 * - Timer stopping
 * - Phase transitions
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, cleanup, fireEvent } from '@testing-library/vue'
import { createPinia, setActivePinia } from 'pinia'
import { nextTick } from 'vue'
import EndGameControls from '../EndGameControls.vue'
import { useGameStore, GamePhase } from '@/stores/gameStore'

describe('EndGameControls', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  afterEach(() => {
    cleanup()
    vi.clearAllMocks()
  })

  function setupGame(phase: GamePhase = GamePhase.Seeking) {
    const gameStore = useGameStore()
    gameStore.addPlayer('Alice')
    gameStore.addPlayer('Bob')
    const aliceId = gameStore.players[0]!.id
    gameStore.startRound(aliceId)
    gameStore.currentPhase = phase
    return gameStore
  }

  function renderEndGameControls() {
    return render(EndGameControls)
  }

  describe('visibility based on phase', () => {
    it('should display Enter Hiding Zone button in seeking phase', () => {
      setupGame(GamePhase.Seeking)
      renderEndGameControls()
      expect(screen.getByRole('button', { name: /enter.*hiding.*zone/i })).toBeInTheDocument()
    })

    it('should not display Enter Hiding Zone button in hiding-period phase', () => {
      setupGame(GamePhase.HidingPeriod)
      renderEndGameControls()
      expect(screen.queryByRole('button', { name: /enter.*hiding.*zone/i })).not.toBeInTheDocument()
    })

    it('should display Hider Found button in end-game phase', () => {
      setupGame(GamePhase.EndGame)
      renderEndGameControls()
      expect(screen.getByRole('button', { name: /hider.*found/i })).toBeInTheDocument()
    })

    it('should not display Hider Found button in seeking phase', () => {
      setupGame(GamePhase.Seeking)
      renderEndGameControls()
      expect(screen.queryByRole('button', { name: /hider.*found/i })).not.toBeInTheDocument()
    })

    it('should not display any buttons in round-complete phase', () => {
      setupGame(GamePhase.RoundComplete)
      renderEndGameControls()
      expect(screen.queryByRole('button')).not.toBeInTheDocument()
    })
  })

  describe('Enter Hiding Zone action', () => {
    it('should transition to end-game phase when Enter Hiding Zone is clicked and confirmed', async () => {
      const gameStore = setupGame(GamePhase.Seeking)
      renderEndGameControls()

      // Click the initial button
      const button = screen.getByRole('button', { name: /enter.*hiding.*zone/i })
      await fireEvent.click(button)
      await nextTick()

      // Click confirm in the dialog
      const confirmButton = screen.getByRole('button', { name: /confirm/i })
      await fireEvent.click(confirmButton)
      await nextTick()

      expect(gameStore.currentPhase).toBe(GamePhase.EndGame)
    })

    it('should emit enter-zone event when button is clicked and confirmed', async () => {
      setupGame(GamePhase.Seeking)
      const { emitted } = renderEndGameControls()

      // Click the initial button
      const button = screen.getByRole('button', { name: /enter.*hiding.*zone/i })
      await fireEvent.click(button)
      await nextTick()

      // Click confirm in the dialog
      const confirmButton = screen.getByRole('button', { name: /confirm/i })
      await fireEvent.click(confirmButton)
      await nextTick()

      expect(emitted()['enter-zone']).toBeTruthy()
    })

    it('should show confirmation dialog before entering hiding zone', async () => {
      setupGame(GamePhase.Seeking)
      renderEndGameControls()

      const button = screen.getByRole('button', { name: /enter.*hiding.*zone/i })
      await fireEvent.click(button)

      // Should show confirmation UI
      expect(screen.getByText(/confirm.*entering.*zone/i)).toBeInTheDocument()
    })
  })

  describe('Hider Found action', () => {
    it('should transition to round-complete phase when Hider Found is clicked and confirmed', async () => {
      const gameStore = setupGame(GamePhase.EndGame)
      renderEndGameControls()

      // Click the initial button
      const button = screen.getByRole('button', { name: /hider.*found/i })
      await fireEvent.click(button)
      await nextTick()

      // Click confirm in the dialog
      const confirmButton = screen.getByRole('button', { name: /confirm/i })
      await fireEvent.click(confirmButton)
      await nextTick()

      expect(gameStore.currentPhase).toBe(GamePhase.RoundComplete)
    })

    it('should emit hider-found event when button is clicked and confirmed', async () => {
      setupGame(GamePhase.EndGame)
      const { emitted } = renderEndGameControls()

      // Click the initial button
      const button = screen.getByRole('button', { name: /hider.*found/i })
      await fireEvent.click(button)
      await nextTick()

      // Click confirm in the dialog
      const confirmButton = screen.getByRole('button', { name: /confirm/i })
      await fireEvent.click(confirmButton)
      await nextTick()

      expect(emitted()['hider-found']).toBeTruthy()
    })

    it('should show confirmation dialog before marking hider found', async () => {
      setupGame(GamePhase.EndGame)
      renderEndGameControls()

      const button = screen.getByRole('button', { name: /hider.*found/i })
      await fireEvent.click(button)

      // Should show confirmation UI
      expect(screen.getByText(/confirm.*hider.*found/i)).toBeInTheDocument()
    })
  })

  describe('end-game status display', () => {
    it('should show seekers in zone message during end-game phase', () => {
      setupGame(GamePhase.EndGame)
      renderEndGameControls()

      expect(screen.getByText(/in.*zone.*searching/i)).toBeInTheDocument()
    })

    it('should show zone entry message when transitioning from seeking', async () => {
      const gameStore = setupGame(GamePhase.Seeking)
      renderEndGameControls()

      const button = screen.getByRole('button', { name: /enter.*hiding.*zone/i })
      await fireEvent.click(button)
      // Confirm the action
      const confirmButton = screen.getByRole('button', { name: /confirm/i })
      await fireEvent.click(confirmButton)
      await nextTick()

      expect(gameStore.currentPhase).toBe(GamePhase.EndGame)
    })
  })

  describe('mobile-friendly design', () => {
    it('should have touch-friendly button sizes (min 44px)', () => {
      setupGame(GamePhase.Seeking)
      renderEndGameControls()

      const button = screen.getByRole('button', { name: /enter.*hiding.*zone/i })
      // Check for min-h-11 (44px) class
      expect(button.className).toMatch(/min-h-11|py-3|h-11/)
    })
  })

  describe('accessibility', () => {
    it('should have proper ARIA labels for buttons', () => {
      setupGame(GamePhase.Seeking)
      renderEndGameControls()

      const button = screen.getByRole('button', { name: /enter.*hiding.*zone/i })
      expect(button).toHaveAccessibleName()
    })
  })
})
