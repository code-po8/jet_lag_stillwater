import { describe, it, expect, afterEach, beforeEach, vi } from 'vitest'
import { render, screen, cleanup, within, fireEvent } from '@testing-library/vue'
import { createPinia, setActivePinia } from 'pinia'
import { nextTick } from 'vue'
import QuestionList from '../QuestionList.vue'
import { QUESTION_CATEGORIES, QuestionCategoryId } from '@/types/question'
import { useQuestionStore } from '@/stores/questionStore'
import { useGameStore } from '@/stores/gameStore'
import { ALL_QUESTIONS } from '@/data/questions'

describe('QuestionList', () => {
  beforeEach(() => {
    // Create a fresh Pinia instance before each test
    setActivePinia(createPinia())
  })

  afterEach(() => {
    cleanup()
  })

  describe('category display', () => {
    it('should display all categories', () => {
      render(QuestionList)

      // Verify all 6 categories are displayed
      QUESTION_CATEGORIES.forEach((category) => {
        expect(screen.getByText(category.name)).toBeInTheDocument()
      })
    })

    it('should display draw/keep values for each category', () => {
      render(QuestionList)

      // Each category should show its draw/keep values
      // Matching: Draw 3, Keep 1
      const matchingSection = screen.getByTestId('category-matching')
      expect(within(matchingSection).getByText(/draw.*3/i)).toBeInTheDocument()
      expect(within(matchingSection).getByText(/keep.*1/i)).toBeInTheDocument()

      // Tentacle: Draw 4, Keep 2
      const tentacleSection = screen.getByTestId('category-tentacle')
      expect(within(tentacleSection).getByText(/draw.*4/i)).toBeInTheDocument()
      expect(within(tentacleSection).getByText(/keep.*2/i)).toBeInTheDocument()
    })
  })

  describe('question display', () => {
    it('should show questions within each category', () => {
      render(QuestionList)

      // Check that questions are rendered within their category
      // We should find at least some question text in the Matching category
      const matchingSection = screen.getByTestId('category-matching')

      // Matching questions use "Is your nearest _ the same as my nearest _?" format
      // Should find at least one question with "nearest" in the text
      const matchingQuestions = within(matchingSection).getAllByTestId(/^question-/)
      expect(matchingQuestions.length).toBeGreaterThan(0)
    })

    it('should display question text', () => {
      render(QuestionList)

      // Verify that actual question text is shown
      // "Is your nearest commercial airport the same as my nearest commercial airport?" is a known matching question
      expect(
        screen.getByText(/is your nearest commercial airport the same as my nearest commercial airport/i),
      ).toBeInTheDocument()
    })
  })

  describe('category collapsing', () => {
    it('should show category headers that can be expanded/collapsed', () => {
      render(QuestionList)

      // Categories should have buttons/headers that can toggle visibility
      QUESTION_CATEGORIES.forEach((category) => {
        const header = screen.getByTestId(`category-header-${category.id}`)
        expect(header).toBeInTheDocument()
      })
    })
  })

  describe('mobile-friendly design', () => {
    it('should have touch-friendly category headers', () => {
      render(QuestionList)

      // Category headers should be buttons for accessibility
      const matchingHeader = screen.getByTestId('category-header-matching')
      // Headers should be buttons or clickable elements
      expect(
        matchingHeader.tagName === 'BUTTON' || matchingHeader.getAttribute('role') === 'button',
      ).toBe(true)
    })

    it('should have a scrollable container', () => {
      const { container } = render(QuestionList)

      // The main container should have overflow handling
      const listContainer = container.querySelector('[data-testid="question-list-container"]')
      expect(listContainer).toBeInTheDocument()
    })
  })

  describe('category stats', () => {
    it('should show question count for each category', () => {
      render(QuestionList)

      // Each category should show how many questions are available
      const matchingSection = screen.getByTestId('category-matching')
      // Should show something like "22 questions" or "22 available"
      expect(within(matchingSection).getByText(/\d+\s*(questions|available)/i)).toBeInTheDocument()
    })
  })

  describe('question status indicators', () => {
    it('should gray out asked questions', async () => {
      render(QuestionList)
      const store = useQuestionStore()

      // Get a matching question and ask/answer it
      const matchingQuestion = ALL_QUESTIONS.find((q) => q.categoryId === 'matching')!
      store.askQuestion(matchingQuestion.id)
      store.answerQuestion(matchingQuestion.id, 'Yes')

      // Wait for Vue to update the DOM
      await nextTick()

      // The asked question should have a visual indicator (grayed out styling)
      const questionElement = screen.getByTestId(`question-${matchingQuestion.id}`)
      expect(questionElement).toHaveClass('opacity-50')
    })

    it('should highlight pending question', async () => {
      render(QuestionList)
      const store = useQuestionStore()

      // Get a matching question and mark it as pending
      const matchingQuestion = ALL_QUESTIONS.find((q) => q.categoryId === 'matching')!
      store.askQuestion(matchingQuestion.id)

      // Wait for Vue to update the DOM
      await nextTick()

      // The pending question should be highlighted with brand gold color
      const questionElement = screen.getByTestId(`question-${matchingQuestion.id}`)
      expect(questionElement).toHaveClass('bg-brand-gold/20')
    })

    it('should disable selection while question is pending', async () => {
      render(QuestionList)
      const store = useQuestionStore()

      // Get two matching questions
      const matchingQuestions = ALL_QUESTIONS.filter((q) => q.categoryId === 'matching')
      const firstQuestion = matchingQuestions[0]!
      const secondQuestion = matchingQuestions[1]!

      // Mark first question as pending
      store.askQuestion(firstQuestion.id)

      // Wait for Vue to update the DOM
      await nextTick()

      // Try to click the second question - it should be disabled
      const secondQuestionElement = screen.getByTestId(`question-${secondQuestion.id}`)
      expect(secondQuestionElement).toHaveAttribute('aria-disabled', 'true')
    })

    it('should emit event when question selected', async () => {
      const onQuestionSelect = vi.fn()
      render(QuestionList, {
        props: {
          onQuestionSelect,
        },
      })

      // Get a matching question
      const matchingQuestion = ALL_QUESTIONS.find((q) => q.categoryId === 'matching')!

      // Click the question
      const questionElement = screen.getByTestId(`question-${matchingQuestion.id}`)
      await fireEvent.click(questionElement)

      // Should emit the event with the question
      expect(onQuestionSelect).toHaveBeenCalledWith(matchingQuestion)
    })

    it('should show asked status indicator text', async () => {
      render(QuestionList)
      const store = useQuestionStore()

      // Ask and answer a question
      const matchingQuestion = ALL_QUESTIONS.find((q) => q.categoryId === 'matching')!
      store.askQuestion(matchingQuestion.id)
      store.answerQuestion(matchingQuestion.id, 'Yes')

      // Wait for Vue to update the DOM
      await nextTick()

      // Should show "Asked" status indicator
      const questionElement = screen.getByTestId(`question-${matchingQuestion.id}`)
      expect(within(questionElement).getByText(/asked/i)).toBeInTheDocument()
    })

    it('should show pending status indicator text', async () => {
      render(QuestionList)
      const store = useQuestionStore()

      // Mark a question as pending
      const matchingQuestion = ALL_QUESTIONS.find((q) => q.categoryId === 'matching')!
      store.askQuestion(matchingQuestion.id)

      // Wait for Vue to update the DOM
      await nextTick()

      // Should show "Pending" status indicator
      const questionElement = screen.getByTestId(`question-${matchingQuestion.id}`)
      expect(within(questionElement).getByText(/pending/i)).toBeInTheDocument()
    })

    it('should not emit event when clicking asked question', async () => {
      const onQuestionSelect = vi.fn()
      render(QuestionList, {
        props: {
          onQuestionSelect,
        },
      })
      const store = useQuestionStore()

      // Ask and answer a question
      const matchingQuestion = ALL_QUESTIONS.find((q) => q.categoryId === 'matching')!
      store.askQuestion(matchingQuestion.id)
      store.answerQuestion(matchingQuestion.id, 'Yes')

      // Wait for Vue to update the DOM
      await nextTick()

      // Click the asked question
      const questionElement = screen.getByTestId(`question-${matchingQuestion.id}`)
      await fireEvent.click(questionElement)

      // Should NOT emit the event
      expect(onQuestionSelect).not.toHaveBeenCalled()
    })
  })

  describe('re-ask question (Q-006)', () => {
    it('should show re-ask option for previously asked questions', async () => {
      render(QuestionList)
      const store = useQuestionStore()

      // Ask and answer a question
      const matchingQuestion = ALL_QUESTIONS.find((q) => q.categoryId === 'matching')!
      store.askQuestion(matchingQuestion.id)
      store.answerQuestion(matchingQuestion.id, 'Yes')

      await nextTick()

      // The asked question should show a "Re-ask (2x cost)" option
      const questionElement = screen.getByTestId(`question-${matchingQuestion.id}`)
      expect(within(questionElement).getByText(/re-?ask.*2x|re-?ask.*double/i)).toBeInTheDocument()
    })

    it('should emit reaskSelect event when re-ask is clicked', async () => {
      const onReaskSelect = vi.fn()
      render(QuestionList, {
        props: {
          onReaskSelect,
        },
      })
      const store = useQuestionStore()

      // Ask and answer a question
      const matchingQuestion = ALL_QUESTIONS.find((q) => q.categoryId === 'matching')!
      store.askQuestion(matchingQuestion.id)
      store.answerQuestion(matchingQuestion.id, 'Yes')

      await nextTick()

      // Click the re-ask button
      const questionElement = screen.getByTestId(`question-${matchingQuestion.id}`)
      const reaskButton = within(questionElement).getByRole('button', { name: /re-?ask/i })
      await fireEvent.click(reaskButton)

      // Should emit the event with the question and isReask flag
      expect(onReaskSelect).toHaveBeenCalledWith(expect.objectContaining({
        question: matchingQuestion,
        isReask: true,
      }))
    })

    it('should not show re-ask option for pending questions', async () => {
      render(QuestionList)
      const store = useQuestionStore()

      // Mark a question as pending (not answered yet)
      const matchingQuestion = ALL_QUESTIONS.find((q) => q.categoryId === 'matching')!
      store.askQuestion(matchingQuestion.id)

      await nextTick()

      // The pending question should NOT show re-ask option
      const questionElement = screen.getByTestId(`question-${matchingQuestion.id}`)
      expect(within(questionElement).queryByText(/re-?ask/i)).not.toBeInTheDocument()
    })

    it('should not show re-ask option for available questions', async () => {
      render(QuestionList)

      // Get an available question (never asked)
      const matchingQuestion = ALL_QUESTIONS.find((q) => q.categoryId === 'matching')!

      // The available question should NOT show re-ask option
      const questionElement = screen.getByTestId(`question-${matchingQuestion.id}`)
      expect(within(questionElement).queryByText(/re-?ask/i)).not.toBeInTheDocument()
    })

    it('should disable re-ask button while another question is pending', async () => {
      render(QuestionList)
      const store = useQuestionStore()

      // Ask and answer first question
      const matchingQuestions = ALL_QUESTIONS.filter((q) => q.categoryId === 'matching')
      const firstQuestion = matchingQuestions[0]!
      const secondQuestion = matchingQuestions[1]!

      store.askQuestion(firstQuestion.id)
      store.answerQuestion(firstQuestion.id, 'Yes')

      // Ask second question (pending)
      store.askQuestion(secondQuestion.id)

      await nextTick()

      // The re-ask button on first question should be disabled
      const questionElement = screen.getByTestId(`question-${firstQuestion.id}`)
      const reaskButton = within(questionElement).getByRole('button', { name: /re-?ask/i })
      expect(reaskButton).toBeDisabled()
    })
  })

  describe('end-game phase restrictions (GS-005)', () => {
    function setupEndGamePhase() {
      const gameStore = useGameStore()
      gameStore.addPlayer('Alice')
      gameStore.addPlayer('Bob')
      const aliceId = gameStore.players[0]!.id
      gameStore.startRound(aliceId)
      gameStore.startSeeking()
      gameStore.enterHidingZone()
      return gameStore
    }

    it('should disable Photo questions during end-game phase', async () => {
      setupEndGamePhase()
      render(QuestionList)
      await nextTick()

      // Get a Photo question
      const photoQuestion = ALL_QUESTIONS.find((q) => q.categoryId === QuestionCategoryId.Photo)!

      // The Photo question should be disabled
      const questionElement = screen.getByTestId(`question-${photoQuestion.id}`)
      expect(questionElement).toHaveAttribute('aria-disabled', 'true')
    })

    it('should disable Tentacle questions during end-game phase', async () => {
      setupEndGamePhase()
      render(QuestionList)
      await nextTick()

      // Get a Tentacle question
      const tentacleQuestion = ALL_QUESTIONS.find((q) => q.categoryId === QuestionCategoryId.Tentacle)!

      // The Tentacle question should be disabled
      const questionElement = screen.getByTestId(`question-${tentacleQuestion.id}`)
      expect(questionElement).toHaveAttribute('aria-disabled', 'true')
    })

    it('should show disabled indicator for Photo category in end-game phase', async () => {
      setupEndGamePhase()
      render(QuestionList)
      await nextTick()

      // The Photo category should show it's disabled in end-game
      const photoCategory = screen.getByTestId('category-photo')
      expect(within(photoCategory).getByText(/disabled.*end.?game|not.*available/i)).toBeInTheDocument()
    })

    it('should show disabled indicator for Tentacle category in end-game phase', async () => {
      setupEndGamePhase()
      render(QuestionList)
      await nextTick()

      // The Tentacle category should show it's disabled in end-game
      const tentacleCategory = screen.getByTestId('category-tentacle')
      expect(within(tentacleCategory).getByText(/disabled.*end.?game|not.*available/i)).toBeInTheDocument()
    })

    it('should not emit event when clicking Photo question during end-game', async () => {
      setupEndGamePhase()
      const onQuestionSelect = vi.fn()
      render(QuestionList, {
        props: {
          onQuestionSelect,
        },
      })
      await nextTick()

      // Get a Photo question
      const photoQuestion = ALL_QUESTIONS.find((q) => q.categoryId === QuestionCategoryId.Photo)!

      // Click the Photo question
      const questionElement = screen.getByTestId(`question-${photoQuestion.id}`)
      await fireEvent.click(questionElement)

      // Should NOT emit the event
      expect(onQuestionSelect).not.toHaveBeenCalled()
    })

    it('should allow other question types during end-game phase', async () => {
      setupEndGamePhase()
      const onQuestionSelect = vi.fn()
      render(QuestionList, {
        props: {
          onQuestionSelect,
        },
      })
      await nextTick()

      // Get a Matching question (should still be allowed)
      const matchingQuestion = ALL_QUESTIONS.find((q) => q.categoryId === QuestionCategoryId.Matching)!

      // Click the Matching question
      const questionElement = screen.getByTestId(`question-${matchingQuestion.id}`)
      await fireEvent.click(questionElement)

      // Should emit the event
      expect(onQuestionSelect).toHaveBeenCalledWith(matchingQuestion)
    })

    it('should enable Photo/Tentacle questions in seeking phase', async () => {
      // Setup game but stay in seeking phase
      const gameStore = useGameStore()
      gameStore.addPlayer('Alice')
      gameStore.addPlayer('Bob')
      const aliceId = gameStore.players[0]!.id
      gameStore.startRound(aliceId)
      gameStore.startSeeking()
      // Don't enter hiding zone - stay in seeking phase

      const onQuestionSelect = vi.fn()
      render(QuestionList, {
        props: {
          onQuestionSelect,
        },
      })
      await nextTick()

      // Get a Photo question
      const photoQuestion = ALL_QUESTIONS.find((q) => q.categoryId === QuestionCategoryId.Photo)!

      // Click the Photo question - should work in seeking phase
      const questionElement = screen.getByTestId(`question-${photoQuestion.id}`)
      await fireEvent.click(questionElement)

      // Should emit the event
      expect(onQuestionSelect).toHaveBeenCalledWith(photoQuestion)
    })
  })
})
