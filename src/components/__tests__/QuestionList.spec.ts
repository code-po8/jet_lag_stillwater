import { describe, it, expect, afterEach, beforeEach, vi } from 'vitest'
import { render, screen, cleanup, within, fireEvent } from '@testing-library/vue'
import { createPinia, setActivePinia } from 'pinia'
import { nextTick } from 'vue'
import QuestionList from '../QuestionList.vue'
import { QUESTION_CATEGORIES } from '@/types/question'
import { useQuestionStore } from '@/stores/questionStore'
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

      // The pending question should be highlighted
      const questionElement = screen.getByTestId(`question-${matchingQuestion.id}`)
      expect(questionElement).toHaveClass('bg-yellow-100')
    })

    it('should disable selection while question is pending', async () => {
      render(QuestionList)
      const store = useQuestionStore()

      // Get two matching questions
      const matchingQuestions = ALL_QUESTIONS.filter((q) => q.categoryId === 'matching')
      const firstQuestion = matchingQuestions[0]
      const secondQuestion = matchingQuestions[1]

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
})
