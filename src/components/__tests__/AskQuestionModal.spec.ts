import { describe, it, expect, afterEach, beforeEach, vi } from 'vitest'
import { render, screen, cleanup, fireEvent } from '@testing-library/vue'
import { createPinia, setActivePinia } from 'pinia'
import AskQuestionModal from '../AskQuestionModal.vue'
import { useQuestionStore } from '@/stores/questionStore'
import { ALL_QUESTIONS } from '@/data/questions'
import { QUESTION_CATEGORIES, type Question } from '@/types/question'

describe('AskQuestionModal', () => {
  let testQuestion: Question

  beforeEach(() => {
    // Create a fresh Pinia instance before each test
    setActivePinia(createPinia())

    // Get a known question for testing
    testQuestion = ALL_QUESTIONS.find((q) => q.categoryId === 'matching')!
  })

  afterEach(() => {
    cleanup()
  })

  describe('modal display', () => {
    it('should not render when no question is provided', () => {
      render(AskQuestionModal, {
        props: {
          question: null,
        },
      })

      expect(screen.queryByTestId('ask-question-modal')).not.toBeInTheDocument()
    })

    it('should render modal when question is provided', () => {
      render(AskQuestionModal, {
        props: {
          question: testQuestion,
        },
      })

      expect(screen.getByTestId('ask-question-modal')).toBeInTheDocument()
    })

    it('should display question text', () => {
      render(AskQuestionModal, {
        props: {
          question: testQuestion,
        },
      })

      expect(screen.getByText(testQuestion.text)).toBeInTheDocument()
    })

    it('should display category name', () => {
      render(AskQuestionModal, {
        props: {
          question: testQuestion,
        },
      })

      const category = QUESTION_CATEGORIES.find((c) => c.id === testQuestion.categoryId)!
      expect(screen.getByText(category.name)).toBeInTheDocument()
    })

    it('should display draw/keep values', () => {
      render(AskQuestionModal, {
        props: {
          question: testQuestion,
        },
      })

      // Matching category has Draw 3, Keep 1
      expect(screen.getByText(/draw.*3/i)).toBeInTheDocument()
      expect(screen.getByText(/keep.*1/i)).toBeInTheDocument()
    })
  })

  describe('confirmation flow', () => {
    it('should show Ask and Cancel buttons', () => {
      render(AskQuestionModal, {
        props: {
          question: testQuestion,
        },
      })

      expect(screen.getByRole('button', { name: /ask/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument()
    })

    it('should emit cancel event when Cancel button is clicked', async () => {
      const onCancel = vi.fn()
      render(AskQuestionModal, {
        props: {
          question: testQuestion,
          onCancel,
        },
      })

      await fireEvent.click(screen.getByRole('button', { name: /cancel/i }))

      expect(onCancel).toHaveBeenCalled()
    })

    it('should mark question as pending when Ask button is clicked', async () => {
      const store = useQuestionStore()
      render(AskQuestionModal, {
        props: {
          question: testQuestion,
        },
      })

      await fireEvent.click(screen.getByRole('button', { name: /ask/i }))

      expect(store.hasPendingQuestion).toBe(true)
      expect(store.pendingQuestion?.questionId).toBe(testQuestion.id)
    })

    it('should emit asked event with draw/keep values when Ask button is clicked', async () => {
      const onAsked = vi.fn()
      render(AskQuestionModal, {
        props: {
          question: testQuestion,
          onAsked,
        },
      })

      await fireEvent.click(screen.getByRole('button', { name: /ask/i }))

      expect(onAsked).toHaveBeenCalledWith({
        questionId: testQuestion.id,
        cardsDraw: 3,
        cardsKeep: 1,
      })
    })
  })

  describe('answer recording', () => {
    it('should show answer input after question is asked', async () => {
      render(AskQuestionModal, {
        props: {
          question: testQuestion,
        },
      })

      // Ask the question first
      await fireEvent.click(screen.getByRole('button', { name: /ask/i }))

      // Should now show answer section
      expect(screen.getByTestId('answer-section')).toBeInTheDocument()
    })

    it('should show Submit Answer button after question is asked', async () => {
      render(AskQuestionModal, {
        props: {
          question: testQuestion,
        },
      })

      await fireEvent.click(screen.getByRole('button', { name: /ask/i }))

      expect(screen.getByRole('button', { name: /submit answer/i })).toBeInTheDocument()
    })

    it('should record answer when Submit Answer is clicked', async () => {
      const store = useQuestionStore()
      render(AskQuestionModal, {
        props: {
          question: testQuestion,
        },
      })

      // Ask the question
      await fireEvent.click(screen.getByRole('button', { name: /ask/i }))

      // Enter answer
      const answerInput = screen.getByPlaceholderText(/enter the hider's answer/i)
      await fireEvent.update(answerInput, 'Yes, same airport')

      // Submit answer
      await fireEvent.click(screen.getByRole('button', { name: /submit answer/i }))

      // Should have recorded the answer
      expect(store.hasPendingQuestion).toBe(false)
      expect(store.askedQuestions).toHaveLength(1)
      expect(store.askedQuestions[0]!.answer).toBe('Yes, same airport')
    })

    it('should emit answered event when answer is submitted', async () => {
      const onAnswered = vi.fn()
      render(AskQuestionModal, {
        props: {
          question: testQuestion,
          onAnswered,
        },
      })

      // Ask the question
      await fireEvent.click(screen.getByRole('button', { name: /ask/i }))

      // Enter and submit answer
      const answerInput = screen.getByPlaceholderText(/enter the hider's answer/i)
      await fireEvent.update(answerInput, 'Yes')
      await fireEvent.click(screen.getByRole('button', { name: /submit answer/i }))

      expect(onAnswered).toHaveBeenCalledWith({
        questionId: testQuestion.id,
        answer: 'Yes',
      })
    })
  })

  describe('toast/notification', () => {
    it('should show confirmation message after question is asked', async () => {
      render(AskQuestionModal, {
        props: {
          question: testQuestion,
        },
      })

      await fireEvent.click(screen.getByRole('button', { name: /ask/i }))

      // Should show confirmation that question was asked
      expect(screen.getByText(/question asked/i)).toBeInTheDocument()
    })
  })

  describe('pending question state', () => {
    it('should show answer mode when question is already pending', async () => {
      const store = useQuestionStore()
      // Pre-mark question as pending
      store.askQuestion(testQuestion.id)

      render(AskQuestionModal, {
        props: {
          question: testQuestion,
        },
      })

      // Should show answer section directly
      expect(screen.getByTestId('answer-section')).toBeInTheDocument()
      expect(screen.queryByRole('button', { name: /^ask$/i })).not.toBeInTheDocument()
    })
  })
})
