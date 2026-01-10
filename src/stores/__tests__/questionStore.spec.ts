import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useQuestionStore } from '../questionStore'
import { ALL_QUESTIONS } from '@/data/questions'
import { QuestionCategoryId, GameSize } from '@/types/question'

describe('questionStore core', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  describe('initialization', () => {
    it('should initialize with all questions available', () => {
      const store = useQuestionStore()

      // Store should have access to all questions
      const availableQuestions = store.getAvailableQuestions()

      expect(availableQuestions.length).toBeGreaterThan(0)
      expect(availableQuestions.length).toBe(ALL_QUESTIONS.length)
    })

    it('should initialize with no asked questions', () => {
      const store = useQuestionStore()

      expect(store.askedQuestions).toEqual([])
    })

    it('should initialize with no pending question', () => {
      const store = useQuestionStore()

      expect(store.pendingQuestion).toBeNull()
      expect(store.hasPendingQuestion).toBe(false)
    })
  })

  describe('getAvailableQuestions', () => {
    it('should return all questions when none asked', () => {
      const store = useQuestionStore()

      const available = store.getAvailableQuestions()

      expect(available.length).toBe(ALL_QUESTIONS.length)
    })

    it('should filter out asked questions from available', () => {
      const store = useQuestionStore()

      // Ask a question manually by adding to askedQuestions
      const firstQuestion = ALL_QUESTIONS[0]!
      store.askedQuestions.push({
        questionId: firstQuestion.id,
        categoryId: firstQuestion.categoryId,
        answer: 'Yes',
        askedAt: new Date(),
      })

      const available = store.getAvailableQuestions()

      expect(available.length).toBe(ALL_QUESTIONS.length - 1)
      expect(available.find((q) => q.id === firstQuestion.id)).toBeUndefined()
    })

    it('should filter by category when specified', () => {
      const store = useQuestionStore()

      const matchingQuestions = store.getAvailableQuestions(QuestionCategoryId.Matching)

      expect(matchingQuestions.length).toBeGreaterThan(0)
      expect(matchingQuestions.every((q) => q.categoryId === QuestionCategoryId.Matching)).toBe(
        true,
      )
    })

    it('should filter by both category and exclude asked', () => {
      const store = useQuestionStore()

      // Get first matching question and mark it as asked
      const matchingQuestion = ALL_QUESTIONS.find(
        (q) => q.categoryId === QuestionCategoryId.Matching,
      )!

      store.askedQuestions.push({
        questionId: matchingQuestion.id,
        categoryId: matchingQuestion.categoryId,
        answer: 'No',
        askedAt: new Date(),
      })

      const available = store.getAvailableQuestions(QuestionCategoryId.Matching)
      const allMatchingCount = ALL_QUESTIONS.filter(
        (q) => q.categoryId === QuestionCategoryId.Matching,
      ).length

      expect(available.length).toBe(allMatchingCount - 1)
      expect(available.find((q) => q.id === matchingQuestion.id)).toBeUndefined()
    })
  })

  describe('getAvailableQuestionsForGameSize', () => {
    it('should filter questions by game size', () => {
      const store = useQuestionStore()

      const smallGameQuestions = store.getAvailableQuestionsForGameSize(GameSize.Small)

      expect(smallGameQuestions.length).toBeGreaterThan(0)
      expect(smallGameQuestions.every((q) => q.availableIn.includes(GameSize.Small))).toBe(true)
    })

    it('should exclude large-only questions from small game size', () => {
      const store = useQuestionStore()

      const smallGameQuestions = store.getAvailableQuestionsForGameSize(GameSize.Small)

      // Tentacle questions are only available in Medium and Large
      const hasTentacle = smallGameQuestions.some(
        (q) => q.categoryId === QuestionCategoryId.Tentacle,
      )
      expect(hasTentacle).toBe(false)
    })

    it('should include tentacle questions for medium game size', () => {
      const store = useQuestionStore()

      const mediumGameQuestions = store.getAvailableQuestionsForGameSize(GameSize.Medium)

      const hasTentacle = mediumGameQuestions.some(
        (q) => q.categoryId === QuestionCategoryId.Tentacle,
      )
      expect(hasTentacle).toBe(true)
    })
  })

  describe('hasPendingQuestion', () => {
    it('should return false when no pending question', () => {
      const store = useQuestionStore()

      expect(store.hasPendingQuestion).toBe(false)
    })

    it('should return true when there is a pending question', () => {
      const store = useQuestionStore()

      const question = ALL_QUESTIONS[0]!
      store.pendingQuestion = {
        questionId: question.id,
        categoryId: question.categoryId,
        answer: '',
        askedAt: new Date(),
      }

      expect(store.hasPendingQuestion).toBe(true)
    })
  })

  describe('getQuestionById', () => {
    it('should return question by id', () => {
      const store = useQuestionStore()

      const expectedQuestion = ALL_QUESTIONS[0]!
      const result = store.getQuestionById(expectedQuestion.id)

      expect(result).toEqual(expectedQuestion)
    })

    it('should return undefined for non-existent id', () => {
      const store = useQuestionStore()

      const result = store.getQuestionById('non-existent-id')

      expect(result).toBeUndefined()
    })
  })

  describe('getCategoryStats', () => {
    it('should return stats for all categories', () => {
      const store = useQuestionStore()

      const stats = store.getCategoryStats()

      expect(stats.length).toBe(6) // 6 official categories
      expect(stats.every((s) => s.total > 0)).toBe(true)
      expect(stats.every((s) => s.available === s.total)).toBe(true)
      expect(stats.every((s) => s.asked === 0)).toBe(true)
    })

    it('should update stats when questions are asked', () => {
      const store = useQuestionStore()

      // Ask a matching question
      const matchingQuestion = ALL_QUESTIONS.find(
        (q) => q.categoryId === QuestionCategoryId.Matching,
      )!
      store.askedQuestions.push({
        questionId: matchingQuestion.id,
        categoryId: matchingQuestion.categoryId,
        answer: 'Yes',
        askedAt: new Date(),
      })

      const stats = store.getCategoryStats()
      const matchingStats = stats.find((s) => s.categoryId === QuestionCategoryId.Matching)!

      expect(matchingStats.asked).toBe(1)
      expect(matchingStats.available).toBe(matchingStats.total - 1)
    })
  })
})
