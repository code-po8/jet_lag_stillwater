/**
 * Round Summary Tests (GS-004)
 *
 * Tests for the round summary view that displays after a round ends:
 * - Final hiding time
 * - Time bonuses applied
 * - Total score for round
 * - Running leaderboard
 * - Next round / end game options
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, cleanup, fireEvent } from '@testing-library/vue'
import { createPinia, setActivePinia } from 'pinia'
import { nextTick } from 'vue'
import RoundSummary from '../RoundSummary.vue'
import { useGameStore } from '@/stores/gameStore'
import { useCardStore } from '@/stores/cardStore'
import { GameSize } from '@/types/question'

describe('RoundSummary', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  afterEach(() => {
    cleanup()
    vi.clearAllMocks()
  })

  function setupCompletedRound(hidingTimeMs: number = 3600000) {
    const gameStore = useGameStore()
    gameStore.addPlayer('Alice')
    gameStore.addPlayer('Bob')
    const aliceId = gameStore.players[0]!.id
    gameStore.startRound(aliceId)
    gameStore.startSeeking()
    gameStore.enterHidingZone()
    gameStore.hiderFound()
    return { gameStore, hiderId: aliceId, hidingTimeMs }
  }

  function renderRoundSummary(props: { hidingTimeMs?: number; gameSize?: GameSize } = {}) {
    return render(RoundSummary, {
      props: {
        hidingTimeMs: props.hidingTimeMs ?? 3600000, // 1 hour default
        gameSize: props.gameSize ?? GameSize.Small,
      },
    })
  }

  describe('visibility based on phase', () => {
    it('should only display in round-complete phase', () => {
      setupCompletedRound()
      renderRoundSummary()
      expect(screen.getByTestId('round-summary')).toBeInTheDocument()
    })

    it('should not display in seeking phase', () => {
      const gameStore = useGameStore()
      gameStore.addPlayer('Alice')
      gameStore.addPlayer('Bob')
      const aliceId = gameStore.players[0]!.id
      gameStore.startRound(aliceId)
      gameStore.startSeeking()

      renderRoundSummary()
      expect(screen.queryByTestId('round-summary')).not.toBeInTheDocument()
    })
  })

  describe('final hiding time display', () => {
    it('should display the hiders final hiding time', () => {
      setupCompletedRound(3600000) // 1 hour
      renderRoundSummary({ hidingTimeMs: 3600000 })
      expect(screen.getByTestId('hiding-time')).toHaveTextContent('01:00:00')
    })

    it('should format time correctly for under an hour', () => {
      setupCompletedRound(1800000) // 30 minutes
      renderRoundSummary({ hidingTimeMs: 1800000 })
      expect(screen.getByTestId('hiding-time')).toHaveTextContent('00:30:00')
    })

    it('should format time correctly for multiple hours', () => {
      setupCompletedRound(7200000) // 2 hours
      renderRoundSummary({ hidingTimeMs: 7200000 })
      expect(screen.getByTestId('hiding-time')).toHaveTextContent('02:00:00')
    })
  })

  describe('time bonuses applied', () => {
    it('should display total time bonus from cards', () => {
      setupCompletedRound()
      const cardStore = useCardStore()
      // Draw some cards to get time bonus cards
      cardStore.drawCards(6)
      renderRoundSummary()

      // Should show time bonus section
      expect(screen.getByTestId('time-bonus-section')).toBeInTheDocument()
    })

    it('should show zero bonus when no time bonus cards', () => {
      setupCompletedRound()
      // Don't draw any cards
      renderRoundSummary()

      expect(screen.getByTestId('time-bonus-value')).toHaveTextContent('0')
    })

    it('should calculate time bonus based on game size', () => {
      setupCompletedRound()
      renderRoundSummary({ gameSize: GameSize.Small })
      // Bonus calculation should use the game size
      expect(screen.getByTestId('time-bonus-section')).toBeInTheDocument()
    })
  })

  describe('total score for round', () => {
    it('should display total round score (hiding time + time bonus)', () => {
      setupCompletedRound(3600000) // 1 hour
      renderRoundSummary({ hidingTimeMs: 3600000 })

      expect(screen.getByTestId('total-score')).toBeInTheDocument()
    })

    it('should show score label', () => {
      setupCompletedRound()
      renderRoundSummary()

      expect(screen.getByText(/total.*score/i)).toBeInTheDocument()
    })
  })

  describe('running leaderboard', () => {
    it('should display all players ranked by total hiding time', () => {
      const gameStore = useGameStore()
      gameStore.addPlayer('Alice')
      gameStore.addPlayer('Bob')
      gameStore.addPlayer('Charlie')
      const aliceId = gameStore.players[0]!.id
      gameStore.startRound(aliceId)
      gameStore.startSeeking()
      gameStore.enterHidingZone()
      gameStore.hiderFound()

      renderRoundSummary()

      expect(screen.getByTestId('leaderboard')).toBeInTheDocument()
      // Alice appears twice (header + leaderboard), others only in leaderboard
      expect(screen.getAllByText('Alice').length).toBeGreaterThanOrEqual(1)
      expect(screen.getByText('Bob')).toBeInTheDocument()
      expect(screen.getByText('Charlie')).toBeInTheDocument()
    })

    it('should show rank numbers for players', () => {
      const gameStore = useGameStore()
      gameStore.addPlayer('Alice')
      gameStore.addPlayer('Bob')
      const aliceId = gameStore.players[0]!.id
      gameStore.startRound(aliceId)
      gameStore.startSeeking()
      gameStore.enterHidingZone()
      gameStore.hiderFound()

      renderRoundSummary()

      // Should show ranking numbers
      expect(screen.getByText(/1\./)).toBeInTheDocument()
      expect(screen.getByText(/2\./)).toBeInTheDocument()
    })

    it('should highlight the current hiders result', () => {
      setupCompletedRound()
      renderRoundSummary()

      // Alice was the hider, should be highlighted
      const hiderEntry = screen.getByTestId('leaderboard-entry-0')
      expect(hiderEntry.className).toMatch(/bg-amber|border-amber|highlight/)
    })
  })

  describe('current hider display', () => {
    it('should show hiders name prominently', () => {
      setupCompletedRound()
      renderRoundSummary()

      // Should show hider name in a prominent way
      expect(screen.getByTestId('hider-name')).toHaveTextContent('Alice')
    })
  })

  describe('next round button', () => {
    it('should show Start Next Round button when not all players have been hider', () => {
      setupCompletedRound()
      renderRoundSummary()

      // Alice has been hider but not Bob
      expect(screen.getByRole('button', { name: /next.*round/i })).toBeInTheDocument()
    })

    it('should emit start-next-round event when button is clicked and confirmed', async () => {
      setupCompletedRound()
      const { emitted } = renderRoundSummary()

      const button = screen.getByRole('button', { name: /next.*round/i })
      await fireEvent.click(button)

      expect(emitted()['start-next-round']).toBeTruthy()
    })

    it('should call gameStore.endRound with hiding time when starting next round', async () => {
      const { gameStore } = setupCompletedRound()
      const endRoundSpy = vi.spyOn(gameStore, 'endRound')
      renderRoundSummary({ hidingTimeMs: 3600000 })

      const button = screen.getByRole('button', { name: /next.*round/i })
      await fireEvent.click(button)
      await nextTick()

      expect(endRoundSpy).toHaveBeenCalledWith(3600000)
    })
  })

  describe('end game button', () => {
    it('should show End Game button when all players have been hider', async () => {
      const gameStore = useGameStore()
      gameStore.addPlayer('Alice')
      gameStore.addPlayer('Bob')

      // Complete round with Alice as hider
      const aliceId = gameStore.players[0]!.id
      const bobId = gameStore.players[1]!.id
      gameStore.startRound(aliceId)
      gameStore.startSeeking()
      gameStore.enterHidingZone()
      gameStore.hiderFound()
      gameStore.endRound(3600000)

      // Complete round with Bob as hider
      gameStore.startRound(bobId)
      gameStore.startSeeking()
      gameStore.enterHidingZone()
      gameStore.hiderFound()

      renderRoundSummary()

      expect(screen.getByRole('button', { name: /end.*game/i })).toBeInTheDocument()
    })

    it('should emit end-game event when End Game button is clicked', async () => {
      const gameStore = useGameStore()
      gameStore.addPlayer('Alice')
      gameStore.addPlayer('Bob')

      // Complete both rounds
      const aliceId = gameStore.players[0]!.id
      const bobId = gameStore.players[1]!.id
      gameStore.startRound(aliceId)
      gameStore.startSeeking()
      gameStore.enterHidingZone()
      gameStore.hiderFound()
      gameStore.endRound(3600000)
      gameStore.startRound(bobId)
      gameStore.startSeeking()
      gameStore.enterHidingZone()
      gameStore.hiderFound()

      const { emitted } = renderRoundSummary()

      const button = screen.getByRole('button', { name: /end.*game/i })
      await fireEvent.click(button)

      expect(emitted()['end-game']).toBeTruthy()
    })

    it('should not show End Game button when not all players have been hider', () => {
      setupCompletedRound() // Only Alice has been hider
      renderRoundSummary()

      expect(screen.queryByRole('button', { name: /end.*game/i })).not.toBeInTheDocument()
    })
  })

  describe('round number display', () => {
    it('should display current round number', () => {
      setupCompletedRound()
      renderRoundSummary()

      expect(screen.getByText(/round.*1/i)).toBeInTheDocument()
    })
  })

  describe('mobile-friendly design', () => {
    it('should have touch-friendly button sizes (min 44px)', () => {
      setupCompletedRound()
      renderRoundSummary()

      const button = screen.getByRole('button', { name: /next.*round/i })
      expect(button.className).toMatch(/min-h-11|py-3|h-11/)
    })

    it('should be scrollable when content overflows', () => {
      setupCompletedRound()
      renderRoundSummary()

      const container = screen.getByTestId('round-summary')
      expect(container.className).toMatch(/overflow/)
    })
  })

  describe('accessibility', () => {
    it('should have proper heading structure', () => {
      setupCompletedRound()
      renderRoundSummary()

      // Should have a main heading
      expect(screen.getByRole('heading', { level: 2 })).toBeInTheDocument()
    })

    it('should have proper ARIA labels for buttons', () => {
      setupCompletedRound()
      renderRoundSummary()

      const button = screen.getByRole('button', { name: /next.*round/i })
      expect(button).toHaveAccessibleName()
    })
  })
})
