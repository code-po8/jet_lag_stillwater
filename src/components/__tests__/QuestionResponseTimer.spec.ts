import { describe, it, expect, afterEach, beforeEach, vi } from 'vitest'
import { render, screen, cleanup } from '@testing-library/vue'
import { createPinia, setActivePinia } from 'pinia'
import { nextTick } from 'vue'
import QuestionResponseTimer from '../QuestionResponseTimer.vue'
import { useQuestionStore } from '@/stores/questionStore'
import { useGameStore } from '@/stores/gameStore'
import { QuestionCategoryId, GameSize } from '@/types/question'

/**
 * Helper to set up a game in seeking phase with a pending question
 */
function setupGameWithPendingQuestion(categoryId: QuestionCategoryId = QuestionCategoryId.Matching) {
  const gameStore = useGameStore()
  const questionStore = useQuestionStore()

  // Set up game in seeking phase
  gameStore.addPlayer('Alice')
  gameStore.addPlayer('Bob')
  gameStore.startRound(gameStore.players[0]!.id)
  gameStore.startSeeking()

  // Ask a question to make it pending
  // Find a question from the specified category
  const questions = questionStore.getAvailableQuestions(categoryId)
  if (questions.length > 0) {
    questionStore.askQuestion(questions[0]!.id)
  }

  return { gameStore, questionStore }
}

describe('QuestionResponseTimer', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    setActivePinia(createPinia())
  })

  afterEach(() => {
    cleanup()
    vi.useRealTimers()
    localStorage.clear()
  })

  describe('visibility', () => {
    it('should not render when no question is pending', async () => {
      const gameStore = useGameStore()
      gameStore.addPlayer('Alice')
      gameStore.addPlayer('Bob')
      gameStore.startRound(gameStore.players[0]!.id)
      gameStore.startSeeking()

      render(QuestionResponseTimer)
      await nextTick()

      expect(screen.queryByTestId('question-response-timer')).not.toBeInTheDocument()
    })

    it('should render when a question is pending', async () => {
      setupGameWithPendingQuestion()

      render(QuestionResponseTimer)
      await nextTick()

      expect(screen.getByTestId('question-response-timer')).toBeInTheDocument()
    })
  })

  describe('timer countdown', () => {
    it('should countdown from 5:00 for standard questions', async () => {
      setupGameWithPendingQuestion(QuestionCategoryId.Matching)

      render(QuestionResponseTimer, { props: { gameSize: GameSize.Small } })
      await nextTick()

      // Standard questions have 5 minute response time
      expect(screen.getByTestId('timer-display')).toHaveTextContent('05:00')
    })

    it('should countdown from 10:00 for photo questions in small/medium games', async () => {
      setupGameWithPendingQuestion(QuestionCategoryId.Photo)

      render(QuestionResponseTimer, { props: { gameSize: GameSize.Small } })
      await nextTick()

      // Photo questions have 10 minute response time in small/medium games
      expect(screen.getByTestId('timer-display')).toHaveTextContent('10:00')
    })

    it('should countdown from 20:00 for photo questions in large games', async () => {
      setupGameWithPendingQuestion(QuestionCategoryId.Photo)

      render(QuestionResponseTimer, { props: { gameSize: GameSize.Large } })
      await nextTick()

      // Photo questions have 20 minute response time in large games
      expect(screen.getByTestId('timer-display')).toHaveTextContent('20:00')
    })

    it('should display time in MM:SS format', async () => {
      setupGameWithPendingQuestion()

      render(QuestionResponseTimer, { props: { gameSize: GameSize.Small } })
      await nextTick()

      const timerDisplay = screen.getByTestId('timer-display')
      expect(timerDisplay.textContent).toMatch(/^\d{2}:\d{2}$/)
    })

    it('should update countdown as time passes', async () => {
      setupGameWithPendingQuestion()

      render(QuestionResponseTimer, { props: { gameSize: GameSize.Small } })
      await nextTick()

      // Advance 1 minute
      vi.advanceTimersByTime(60000)
      await nextTick()

      expect(screen.getByTestId('timer-display')).toHaveTextContent('04:00')
    })
  })

  describe('visibility on both views', () => {
    it('should be visible on hider view', async () => {
      setupGameWithPendingQuestion()

      render(QuestionResponseTimer, { props: { role: 'hider', gameSize: GameSize.Small } })
      await nextTick()

      expect(screen.getByTestId('question-response-timer')).toBeInTheDocument()
    })

    it('should be visible on seeker view', async () => {
      setupGameWithPendingQuestion()

      render(QuestionResponseTimer, { props: { role: 'seeker', gameSize: GameSize.Small } })
      await nextTick()

      expect(screen.getByTestId('question-response-timer')).toBeInTheDocument()
    })
  })

  describe('low time alert', () => {
    it('should show visual alert when less than 1 minute remaining', async () => {
      setupGameWithPendingQuestion()

      render(QuestionResponseTimer, { props: { gameSize: GameSize.Small } })
      await nextTick()

      // Advance to less than 1 minute remaining (4 minutes 1 second)
      vi.advanceTimersByTime(4 * 60 * 1000 + 1000)
      await nextTick()

      expect(screen.getByTestId('question-response-timer')).toHaveClass('low-time')
    })

    it('should not show low time alert before threshold', async () => {
      setupGameWithPendingQuestion()

      render(QuestionResponseTimer, { props: { gameSize: GameSize.Small } })
      await nextTick()

      // Advance to just over 1 minute remaining
      vi.advanceTimersByTime(3 * 60 * 1000 + 59000)
      await nextTick()

      expect(screen.getByTestId('question-response-timer')).not.toHaveClass('low-time')
    })

    it('should emit lowTime event when threshold is crossed', async () => {
      setupGameWithPendingQuestion()

      const onLowTime = vi.fn()
      render(QuestionResponseTimer, {
        props: { gameSize: GameSize.Small, onLowTime },
      })
      await nextTick()

      // Advance to less than 1 minute remaining
      vi.advanceTimersByTime(4 * 60 * 1000 + 1000)
      await nextTick()

      expect(onLowTime).toHaveBeenCalled()
    })
  })

  describe('timer expiration', () => {
    it('should show visual alert when timer expires', async () => {
      setupGameWithPendingQuestion()

      render(QuestionResponseTimer, { props: { gameSize: GameSize.Small } })
      await nextTick()

      // Advance full 5 minutes
      vi.advanceTimersByTime(5 * 60 * 1000)
      await nextTick()

      expect(screen.getByTestId('question-response-timer')).toHaveClass('expired')
    })

    it('should emit expired event when timer expires', async () => {
      setupGameWithPendingQuestion()

      const onExpired = vi.fn()
      render(QuestionResponseTimer, {
        props: { gameSize: GameSize.Small, onExpired },
      })
      await nextTick()

      // Advance full 5 minutes
      vi.advanceTimersByTime(5 * 60 * 1000)
      await nextTick()

      expect(onExpired).toHaveBeenCalled()
    })

    it('should display 00:00 when timer expires', async () => {
      setupGameWithPendingQuestion()

      render(QuestionResponseTimer, { props: { gameSize: GameSize.Small } })
      await nextTick()

      // Advance full 5 minutes
      vi.advanceTimersByTime(5 * 60 * 1000)
      await nextTick()

      expect(screen.getByTestId('timer-display')).toHaveTextContent('00:00')
    })

    it('should show "Time expired!" message when timer expires', async () => {
      setupGameWithPendingQuestion()

      render(QuestionResponseTimer, { props: { gameSize: GameSize.Small } })
      await nextTick()

      // Advance full 5 minutes
      vi.advanceTimersByTime(5 * 60 * 1000)
      await nextTick()

      expect(screen.getByText(/time expired/i)).toBeInTheDocument()
    })
  })

  describe('clearing timer on answer', () => {
    it('should hide timer when answer is recorded', async () => {
      const { questionStore } = setupGameWithPendingQuestion()

      render(QuestionResponseTimer, { props: { gameSize: GameSize.Small } })
      await nextTick()

      expect(screen.getByTestId('question-response-timer')).toBeInTheDocument()

      // Answer the question
      const pendingId = questionStore.pendingQuestion!.questionId
      questionStore.answerQuestion(pendingId, 'Yes')
      await nextTick()

      expect(screen.queryByTestId('question-response-timer')).not.toBeInTheDocument()
    })

    it('should hide timer when question is vetoed', async () => {
      const { questionStore } = setupGameWithPendingQuestion()

      render(QuestionResponseTimer, { props: { gameSize: GameSize.Small } })
      await nextTick()

      expect(screen.getByTestId('question-response-timer')).toBeInTheDocument()

      // Veto the question
      const pendingId = questionStore.pendingQuestion!.questionId
      questionStore.vetoQuestion(pendingId)
      await nextTick()

      expect(screen.queryByTestId('question-response-timer')).not.toBeInTheDocument()
    })
  })

  describe('question category display', () => {
    it('should display the pending question category', async () => {
      setupGameWithPendingQuestion(QuestionCategoryId.Matching)

      render(QuestionResponseTimer, { props: { gameSize: GameSize.Small } })
      await nextTick()

      expect(screen.getByText(/matching/i)).toBeInTheDocument()
    })

    it('should update category when different question is pending', async () => {
      const { questionStore } = setupGameWithPendingQuestion(QuestionCategoryId.Matching)

      render(QuestionResponseTimer, { props: { gameSize: GameSize.Small } })
      await nextTick()

      expect(screen.getByText(/matching/i)).toBeInTheDocument()

      // Answer first question
      const pendingId = questionStore.pendingQuestion!.questionId
      questionStore.answerQuestion(pendingId, 'Yes')
      await nextTick()

      // Ask a photo question - Photo questions are always available
      const photoQuestions = questionStore.getAvailableQuestions(QuestionCategoryId.Photo)
      // Photo category always has questions in test data
      questionStore.askQuestion(photoQuestions[0]!.id)
      await nextTick()

      expect(screen.getByText(/photo/i)).toBeInTheDocument()
    })
  })

  describe('role-specific messaging', () => {
    it('should show answer prompt for hider', async () => {
      setupGameWithPendingQuestion()

      render(QuestionResponseTimer, { props: { role: 'hider', gameSize: GameSize.Small } })
      await nextTick()

      expect(screen.getByText(/respond/i)).toBeInTheDocument()
    })

    it('should show waiting message for seeker', async () => {
      setupGameWithPendingQuestion()

      render(QuestionResponseTimer, { props: { role: 'seeker', gameSize: GameSize.Small } })
      await nextTick()

      expect(screen.getByText(/waiting/i)).toBeInTheDocument()
    })
  })

  describe('mobile-friendly design', () => {
    it('should have large readable timer text', async () => {
      setupGameWithPendingQuestion()

      render(QuestionResponseTimer, { props: { gameSize: GameSize.Small } })
      await nextTick()

      const timerDisplay = screen.getByTestId('timer-display')
      expect(timerDisplay.className).toMatch(/text-(2xl|3xl|4xl)/)
    })

    it('should have touch-friendly container', async () => {
      setupGameWithPendingQuestion()

      render(QuestionResponseTimer, { props: { gameSize: GameSize.Small } })
      await nextTick()

      const timer = screen.getByTestId('question-response-timer')
      expect(timer).toHaveClass('p-4')
    })
  })

  describe('accessibility', () => {
    it('should have proper ARIA label for timer', async () => {
      setupGameWithPendingQuestion()

      render(QuestionResponseTimer, { props: { gameSize: GameSize.Small } })
      await nextTick()

      const timer = screen.getByTestId('question-response-timer')
      expect(timer).toHaveAttribute('aria-label')
    })

    it('should have timer role', async () => {
      setupGameWithPendingQuestion()

      render(QuestionResponseTimer, { props: { gameSize: GameSize.Small } })
      await nextTick()

      const liveRegion = screen.getByRole('timer')
      expect(liveRegion).toBeInTheDocument()
    })
  })
})
