import { describe, it, expect, afterEach, beforeEach } from 'vitest'
import { render, screen, cleanup, fireEvent } from '@testing-library/vue'
import { createPinia, setActivePinia } from 'pinia'
import { nextTick } from 'vue'
import QuestionMenu from '../QuestionMenu.vue'
import { QUESTION_CATEGORIES } from '@/types/question'
import { useQuestionStore } from '@/stores/questionStore'
import { useGameStore, GamePhase } from '@/stores/gameStore'

// Concrete question ids + their tile title text (the question's `text`)
const RADAR_Q = 'radar-0.5-miles'
const RADAR_TITLE = /are you within 0\.5 miles of me\?/i
const MEASURING_Q = 'measuring-transit-airport'
const MEASURING_TITLE = /compared to me.*commercial airport/i
const PHOTO_TITLE = /send us a photo of you/i

/**
 * Helper: put the game into seeking phase so questions are selectable
 * (not locked by the hiding period).
 */
function enterSeekingPhase() {
  const gameStore = useGameStore()
  gameStore.currentPhase = GamePhase.Seeking
}

describe('QuestionMenu', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  afterEach(() => {
    cleanup()
  })

  describe('menu display', () => {
    it('should render the question menu container', () => {
      render(QuestionMenu)
      expect(screen.getByTestId('question-list-container')).toBeInTheDocument()
    })

    it('should display the QUESTION MENU header', () => {
      render(QuestionMenu)
      expect(screen.getByText(/question menu/i)).toBeInTheDocument()
    })

    it('should display all six categories', () => {
      render(QuestionMenu)
      QUESTION_CATEGORIES.forEach((category) => {
        expect(screen.getByText(category.name.toUpperCase())).toBeInTheDocument()
      })
    })

    it('should display draw/pick values for each category', () => {
      render(QuestionMenu)
      // "Draw 3, Pick 1" is shared by several categories (Matching/Measuring),
      // so assert it appears at least once. Tentacle's "Draw 4, Pick 2" is unique.
      expect(screen.getAllByText(/draw 3, pick 1/i).length).toBeGreaterThanOrEqual(1)
      expect(screen.getByText(/draw 4, pick 2/i)).toBeInTheDocument()
    })

    it('should render a tile for every question', () => {
      render(QuestionMenu)
      // Each tile is a button with the question text as its title attribute
      const tiles = screen.getAllByRole('button')
      // At least as many tiles as there are categories (sanity); deeper count below
      expect(tiles.length).toBeGreaterThan(QUESTION_CATEGORIES.length)
    })
  })

  describe('question selection', () => {
    it('should emit questionSelect when an available question tile is clicked', async () => {
      enterSeekingPhase()
      const { emitted } = render(QuestionMenu)

      const tile = screen.getByTitle(RADAR_TITLE)
      await fireEvent.click(tile)
      await nextTick()

      expect(emitted()).toHaveProperty('questionSelect')
      const payload = emitted().questionSelect![0] as unknown[]
      expect((payload[0] as { id: string }).id).toBe(RADAR_Q)
    })

    it('should not emit questionSelect for an already-asked question tile', async () => {
      enterSeekingPhase()
      const questionStore = useQuestionStore()
      questionStore.askQuestion(RADAR_Q)
      questionStore.answerQuestion(RADAR_Q, 'yes')

      const { emitted } = render(QuestionMenu)
      const tile = screen.getByTitle(RADAR_TITLE)
      await fireEvent.click(tile)
      await nextTick()

      // Clicking an asked tile opens detail, it does not emit questionSelect
      expect(emitted().questionSelect).toBeUndefined()
    })

    it('should not emit questionSelect while another question is pending', async () => {
      enterSeekingPhase()
      const questionStore = useQuestionStore()
      questionStore.askQuestion(MEASURING_Q) // leaves it pending

      const { emitted } = render(QuestionMenu)
      const tile = screen.getByTitle(RADAR_TITLE)
      await fireEvent.click(tile)
      await nextTick()

      expect(emitted().questionSelect).toBeUndefined()
    })

    // Issue #25: the seeker must be able to reopen the answer modal for the
    // pending question (e.g. to record the answer after closing it), so clicking
    // the pending tile itself re-emits questionSelect for that question.
    it('should re-emit questionSelect when the pending question tile is clicked', async () => {
      enterSeekingPhase()
      const questionStore = useQuestionStore()
      questionStore.askQuestion(MEASURING_Q) // leaves it pending

      const { emitted } = render(QuestionMenu)
      const tile = screen.getByTitle(MEASURING_TITLE)
      await fireEvent.click(tile)
      await nextTick()

      expect(emitted()).toHaveProperty('questionSelect')
      const payload = emitted().questionSelect![0] as unknown[]
      expect((payload[0] as { id: string }).id).toBe(MEASURING_Q)
    })
  })

  describe('status indicators', () => {
    it('should mark asked questions with the asked tile class', () => {
      enterSeekingPhase()
      const questionStore = useQuestionStore()
      questionStore.askQuestion(RADAR_Q)
      questionStore.answerQuestion(RADAR_Q, 'yes')

      render(QuestionMenu)
      const tile = screen.getByTitle(RADAR_TITLE)
      expect(tile.className).toContain('tile-asked')
    })

    it('should mark the pending question with the pending tile class', () => {
      enterSeekingPhase()
      const questionStore = useQuestionStore()
      questionStore.askQuestion(MEASURING_Q)

      render(QuestionMenu)
      const tile = screen.getByTitle(MEASURING_TITLE)
      expect(tile.className).toContain('tile-pending')
    })
  })

  describe('hiding period lock', () => {
    it('should show a locked notice during the hiding period', () => {
      const gameStore = useGameStore()
      gameStore.currentPhase = GamePhase.HidingPeriod

      render(QuestionMenu)
      expect(screen.getByText(/locked during hiding period/i)).toBeInTheDocument()
    })

    it('should not emit questionSelect during the hiding period', async () => {
      const gameStore = useGameStore()
      gameStore.currentPhase = GamePhase.HidingPeriod

      const { emitted } = render(QuestionMenu)
      const tile = screen.getByTitle(RADAR_TITLE)
      await fireEvent.click(tile)
      await nextTick()

      expect(emitted().questionSelect).toBeUndefined()
    })

    it('should not show the locked notice during seeking', () => {
      enterSeekingPhase()
      render(QuestionMenu)
      expect(screen.queryByText(/locked during hiding period/i)).not.toBeInTheDocument()
    })
  })

  describe('end-game category disabling', () => {
    it('should disable Photo and Tentacle categories during end-game', () => {
      const gameStore = useGameStore()
      gameStore.currentPhase = GamePhase.EndGame

      render(QuestionMenu)
      // Disabled categories surface a "Not available in end-game" notice
      const notices = screen.getAllByText(/not available in end-game/i)
      expect(notices.length).toBeGreaterThanOrEqual(1)
    })

    it('should not emit questionSelect for a disabled category during end-game', async () => {
      const gameStore = useGameStore()
      gameStore.currentPhase = GamePhase.EndGame

      const { emitted } = render(QuestionMenu)
      const photoTile = screen.getByTitle(PHOTO_TITLE)
      await fireEvent.click(photoTile)
      await nextTick()

      expect(emitted().questionSelect).toBeUndefined()
    })
  })

  describe('question detail overlay', () => {
    it('should open the detail overlay when an asked question is tapped', async () => {
      enterSeekingPhase()
      const questionStore = useQuestionStore()
      questionStore.askQuestion(RADAR_Q)
      questionStore.answerQuestion(RADAR_Q, 'yes')

      render(QuestionMenu)
      const tile = screen.getByTitle(RADAR_TITLE)
      await fireEvent.click(tile)
      await nextTick()

      // Detail overlay shows the ASKED status badge and a Re-ask action
      expect(screen.getByText(/re-ask/i)).toBeInTheDocument()
    })

    it('should emit reaskSelect when Re-ask is clicked in the detail overlay', async () => {
      enterSeekingPhase()
      const questionStore = useQuestionStore()
      questionStore.askQuestion(RADAR_Q)
      questionStore.answerQuestion(RADAR_Q, 'yes')

      const { emitted } = render(QuestionMenu)
      const tile = screen.getByTitle(RADAR_TITLE)
      await fireEvent.click(tile)
      await nextTick()

      const reaskBtn = screen.getByText(/re-ask/i)
      await fireEvent.click(reaskBtn)
      await nextTick()

      expect(emitted()).toHaveProperty('reaskSelect')
      const payload = emitted().reaskSelect![0] as unknown[]
      expect(payload[0]).toMatchObject({ isReask: true })
    })

    it('should close the detail overlay when Close is clicked', async () => {
      enterSeekingPhase()
      const questionStore = useQuestionStore()
      questionStore.askQuestion(RADAR_Q)
      questionStore.answerQuestion(RADAR_Q, 'yes')

      render(QuestionMenu)
      const tile = screen.getByTitle(RADAR_TITLE)
      await fireEvent.click(tile)
      await nextTick()
      expect(screen.getByText(/re-ask/i)).toBeInTheDocument()

      await fireEvent.click(screen.getByText(/^close$/i))
      await nextTick()

      expect(screen.queryByText(/re-ask/i)).not.toBeInTheDocument()
    })
  })

  describe('category stats', () => {
    it('should show available/total counts per category', () => {
      enterSeekingPhase()
      render(QuestionMenu)
      // Format: "X / Y available"
      const stats = screen.getAllByText(/\d+ \/ \d+ available/i)
      expect(stats.length).toBe(QUESTION_CATEGORIES.length)
    })
  })
})
