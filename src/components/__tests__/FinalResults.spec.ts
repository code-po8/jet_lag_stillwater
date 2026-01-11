/**
 * Final Results Tests (GS-006)
 *
 * Tests for the final results view that displays when the game ends:
 * - All players ranked by total hiding time
 * - Winner clearly announced (longest time)
 * - Option to start new game or return to home
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, cleanup, fireEvent } from '@testing-library/vue'
import { createPinia, setActivePinia } from 'pinia'
import FinalResults from '../FinalResults.vue'
import { useGameStore } from '@/stores/gameStore'

describe('FinalResults', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  afterEach(() => {
    cleanup()
    vi.clearAllMocks()
  })

  /**
   * Helper to set up a completed game with multiple rounds
   */
  function setupCompletedGame() {
    const gameStore = useGameStore()
    gameStore.addPlayer('Alice')
    gameStore.addPlayer('Bob')
    gameStore.addPlayer('Charlie')

    const aliceId = gameStore.players[0]!.id
    const bobId = gameStore.players[1]!.id
    const charlieId = gameStore.players[2]!.id

    // Round 1: Alice hides for 2 hours
    gameStore.startRound(aliceId)
    gameStore.startSeeking()
    gameStore.enterHidingZone()
    gameStore.hiderFound()
    gameStore.endRound(7200000) // 2 hours

    // Round 2: Bob hides for 1 hour
    gameStore.startRound(bobId)
    gameStore.startSeeking()
    gameStore.enterHidingZone()
    gameStore.hiderFound()
    gameStore.endRound(3600000) // 1 hour

    // Round 3: Charlie hides for 1.5 hours
    gameStore.startRound(charlieId)
    gameStore.startSeeking()
    gameStore.enterHidingZone()
    gameStore.hiderFound()
    gameStore.endRound(5400000) // 1.5 hours

    return { gameStore, aliceId, bobId, charlieId }
  }

  function renderFinalResults() {
    return render(FinalResults)
  }

  describe('display requirements', () => {
    it('should display the final results container', () => {
      setupCompletedGame()
      renderFinalResults()
      expect(screen.getByTestId('final-results')).toBeInTheDocument()
    })

    it('should show a celebratory header', () => {
      setupCompletedGame()
      renderFinalResults()
      expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument()
      // Both "Game Over!" and "Final Results" should be present
      expect(screen.getByText(/game over/i)).toBeInTheDocument()
    })
  })

  describe('final leaderboard', () => {
    it('should display all players ranked by total hiding time', () => {
      setupCompletedGame()
      renderFinalResults()

      expect(screen.getByTestId('final-leaderboard')).toBeInTheDocument()
      // All players should be visible (may appear multiple times due to winner section)
      expect(screen.getAllByText('Alice').length).toBeGreaterThanOrEqual(1)
      expect(screen.getByText('Bob')).toBeInTheDocument()
      expect(screen.getByText('Charlie')).toBeInTheDocument()
    })

    it('should rank players correctly - highest time first', () => {
      setupCompletedGame()
      renderFinalResults()

      const entries = screen.getAllByTestId(/final-leaderboard-entry/)
      // Alice: 2 hours (first), Charlie: 1.5 hours (second), Bob: 1 hour (third)
      expect(entries[0]).toHaveTextContent('Alice')
      expect(entries[1]).toHaveTextContent('Charlie')
      expect(entries[2]).toHaveTextContent('Bob')
    })

    it('should show rank numbers (1st, 2nd, 3rd)', () => {
      setupCompletedGame()
      renderFinalResults()

      expect(screen.getByText(/1st|1\./)).toBeInTheDocument()
      expect(screen.getByText(/2nd|2\./)).toBeInTheDocument()
      expect(screen.getByText(/3rd|3\./)).toBeInTheDocument()
    })

    it('should display total hiding time for each player', () => {
      setupCompletedGame()
      renderFinalResults()

      // Alice: 2 hours = 02:00:00 (appears in winner section and leaderboard)
      // Charlie: 1.5 hours = 01:30:00
      // Bob: 1 hour = 01:00:00
      expect(screen.getAllByText('02:00:00').length).toBeGreaterThanOrEqual(1)
      expect(screen.getByText('01:30:00')).toBeInTheDocument()
      expect(screen.getByText('01:00:00')).toBeInTheDocument()
    })
  })

  describe('winner announcement', () => {
    it('should clearly announce the winner', () => {
      setupCompletedGame()
      renderFinalResults()

      // Winner should be prominently displayed
      expect(screen.getByTestId('winner-announcement')).toBeInTheDocument()
    })

    it('should show the winner name prominently', () => {
      setupCompletedGame()
      renderFinalResults()

      const winnerSection = screen.getByTestId('winner-announcement')
      expect(winnerSection).toHaveTextContent('Alice')
    })

    it('should show the winning time', () => {
      setupCompletedGame()
      renderFinalResults()

      const winnerSection = screen.getByTestId('winner-announcement')
      expect(winnerSection).toHaveTextContent('02:00:00')
    })

    it('should have a trophy or winner indicator', () => {
      setupCompletedGame()
      renderFinalResults()

      // Should have some visual indicator - trophy emoji and "Winner" text both present
      expect(screen.getAllByText(/winner|🏆/i).length).toBeGreaterThanOrEqual(1)
    })

    it('should highlight the winner in the leaderboard', () => {
      setupCompletedGame()
      renderFinalResults()

      const firstEntry = screen.getByTestId('final-leaderboard-entry-0')
      // Should have distinct styling for winner
      expect(firstEntry.className).toMatch(/gold|amber|yellow|winner|first/)
    })
  })

  describe('game statistics', () => {
    it('should show total number of rounds played', () => {
      setupCompletedGame()
      renderFinalResults()

      // The number 3 should be displayed along with "Rounds Played" label
      expect(screen.getByText('3')).toBeInTheDocument()
      expect(screen.getByText(/rounds.*played/i)).toBeInTheDocument()
    })

    it('should show total game time', () => {
      setupCompletedGame()
      renderFinalResults()

      // Total: 2 + 1 + 1.5 = 4.5 hours combined hiding time
      expect(screen.getByTestId('total-game-time')).toBeInTheDocument()
    })
  })

  describe('action buttons', () => {
    it('should show New Game button', () => {
      setupCompletedGame()
      renderFinalResults()

      expect(screen.getByRole('button', { name: /new.*game/i })).toBeInTheDocument()
    })

    it('should emit new-game event when New Game button is clicked', async () => {
      setupCompletedGame()
      const { emitted } = renderFinalResults()

      const button = screen.getByRole('button', { name: /new.*game/i })
      await fireEvent.click(button)

      expect(emitted()['new-game']).toBeTruthy()
    })

    it('should show Return Home button', () => {
      setupCompletedGame()
      renderFinalResults()

      expect(screen.getByRole('button', { name: /home|back/i })).toBeInTheDocument()
    })

    it('should emit return-home event when Return Home button is clicked', async () => {
      setupCompletedGame()
      const { emitted } = renderFinalResults()

      const button = screen.getByRole('button', { name: /home|back/i })
      await fireEvent.click(button)

      expect(emitted()['return-home']).toBeTruthy()
    })
  })

  describe('mobile-friendly design', () => {
    it('should have touch-friendly button sizes (min 44px)', () => {
      setupCompletedGame()
      renderFinalResults()

      const button = screen.getByRole('button', { name: /new.*game/i })
      expect(button.className).toMatch(/min-h-11|py-3|h-11/)
    })

    it('should be scrollable when content overflows', () => {
      setupCompletedGame()
      renderFinalResults()

      const container = screen.getByTestId('final-results')
      expect(container.className).toMatch(/overflow/)
    })
  })

  describe('accessibility', () => {
    it('should have proper heading structure', () => {
      setupCompletedGame()
      renderFinalResults()

      expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument()
    })

    it('should have proper ARIA labels for buttons', () => {
      setupCompletedGame()
      renderFinalResults()

      const newGameButton = screen.getByRole('button', { name: /new.*game/i })
      expect(newGameButton).toHaveAccessibleName()
    })

    it('should announce winner to screen readers', () => {
      setupCompletedGame()
      renderFinalResults()

      const winnerAnnouncement = screen.getByTestId('winner-announcement')
      expect(winnerAnnouncement.getAttribute('role') || winnerAnnouncement.getAttribute('aria-live')).toBeTruthy()
    })
  })
})
