import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { nextTick } from 'vue'
import { useQuestionStore } from '../questionStore'
import { ALL_QUESTIONS } from '@/data/questions'
import { QuestionCategoryId, GameSize, QUESTION_CATEGORIES } from '@/types/question'

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

describe('questionStore actions', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  describe('askQuestion', () => {
    it('should mark a question as pending when asked', () => {
      const store = useQuestionStore()
      const question = ALL_QUESTIONS[0]!

      store.askQuestion(question.id)

      expect(store.pendingQuestion).not.toBeNull()
      expect(store.pendingQuestion?.questionId).toBe(question.id)
      expect(store.hasPendingQuestion).toBe(true)
    })

    it('should return draw/keep values when question asked', () => {
      const store = useQuestionStore()
      const question = ALL_QUESTIONS.find((q) => q.categoryId === QuestionCategoryId.Matching)!
      const category = QUESTION_CATEGORIES.find((c) => c.id === QuestionCategoryId.Matching)!

      const result = store.askQuestion(question.id)

      expect(result).toEqual({
        success: true,
        cardsDraw: category.cardsDraw,
        cardsKeep: category.cardsKeep,
      })
    })

    it('should prevent new questions while one is pending', () => {
      const store = useQuestionStore()
      const firstQuestion = ALL_QUESTIONS[0]!
      const secondQuestion = ALL_QUESTIONS[1]!

      store.askQuestion(firstQuestion.id)
      const result = store.askQuestion(secondQuestion.id)

      expect(result.success).toBe(false)
      expect(result.error).toBe('A question is already pending')
      expect(store.pendingQuestion?.questionId).toBe(firstQuestion.id)
    })

    it('should prevent asking a question that was already asked', () => {
      const store = useQuestionStore()
      const question = ALL_QUESTIONS[0]!

      // Ask the question and answer it
      store.askQuestion(question.id)
      store.answerQuestion(question.id, 'Yes')

      // Try to ask it again
      const result = store.askQuestion(question.id)

      expect(result.success).toBe(false)
      expect(result.error).toBe('Question has already been asked')
    })

    it('should return error for non-existent question', () => {
      const store = useQuestionStore()

      const result = store.askQuestion('non-existent-id')

      expect(result.success).toBe(false)
      expect(result.error).toBe('Question not found')
    })

    it('should set askedAt timestamp when question asked', () => {
      const store = useQuestionStore()
      const question = ALL_QUESTIONS[0]!
      const before = new Date()

      store.askQuestion(question.id)

      const after = new Date()
      expect(store.pendingQuestion?.askedAt.getTime()).toBeGreaterThanOrEqual(before.getTime())
      expect(store.pendingQuestion?.askedAt.getTime()).toBeLessThanOrEqual(after.getTime())
    })
  })

  describe('answerQuestion', () => {
    it('should record answer and move question to asked', () => {
      const store = useQuestionStore()
      const question = ALL_QUESTIONS[0]!

      store.askQuestion(question.id)
      const result = store.answerQuestion(question.id, 'Yes')

      expect(result.success).toBe(true)
      expect(store.pendingQuestion).toBeNull()
      expect(store.askedQuestions.length).toBe(1)
      expect(store.askedQuestions[0]?.answer).toBe('Yes')
    })

    it('should set answeredAt timestamp when answered', () => {
      const store = useQuestionStore()
      const question = ALL_QUESTIONS[0]!

      store.askQuestion(question.id)
      const before = new Date()
      store.answerQuestion(question.id, 'No')
      const after = new Date()

      const askedQuestion = store.askedQuestions[0]!
      expect(askedQuestion.answeredAt).toBeDefined()
      expect(askedQuestion.answeredAt!.getTime()).toBeGreaterThanOrEqual(before.getTime())
      expect(askedQuestion.answeredAt!.getTime()).toBeLessThanOrEqual(after.getTime())
    })

    it('should return error if question id does not match pending', () => {
      const store = useQuestionStore()
      const question = ALL_QUESTIONS[0]!
      const otherQuestion = ALL_QUESTIONS[1]!

      store.askQuestion(question.id)
      const result = store.answerQuestion(otherQuestion.id, 'Yes')

      expect(result.success).toBe(false)
      expect(result.error).toBe('Question ID does not match pending question')
      expect(store.pendingQuestion).not.toBeNull()
    })

    it('should return error if no question is pending', () => {
      const store = useQuestionStore()
      const question = ALL_QUESTIONS[0]!

      const result = store.answerQuestion(question.id, 'Yes')

      expect(result.success).toBe(false)
      expect(result.error).toBe('No question is pending')
    })

    it('should mark question as not vetoed when answered', () => {
      const store = useQuestionStore()
      const question = ALL_QUESTIONS[0]!

      store.askQuestion(question.id)
      store.answerQuestion(question.id, 'Yes')

      expect(store.askedQuestions[0]?.vetoed).toBe(false)
    })
  })

  describe('vetoQuestion', () => {
    it('should return vetoed question to available', () => {
      const store = useQuestionStore()
      const question = ALL_QUESTIONS[0]!

      store.askQuestion(question.id)
      const result = store.vetoQuestion(question.id)

      expect(result.success).toBe(true)
      expect(store.pendingQuestion).toBeNull()
      // Question should NOT be in asked questions (it's available again)
      expect(store.askedQuestions.find((q) => q.questionId === question.id)).toBeUndefined()
      // Question should be available
      const available = store.getAvailableQuestions()
      expect(available.find((q) => q.id === question.id)).toBeDefined()
    })

    it('should return draw/keep values when vetoed (hider still gets cards)', () => {
      const store = useQuestionStore()
      const question = ALL_QUESTIONS.find((q) => q.categoryId === QuestionCategoryId.Radar)!
      const category = QUESTION_CATEGORIES.find((c) => c.id === QuestionCategoryId.Radar)!

      store.askQuestion(question.id)
      const result = store.vetoQuestion(question.id)

      expect(result.success).toBe(true)
      expect(result.cardsDraw).toBe(category.cardsDraw)
      expect(result.cardsKeep).toBe(category.cardsKeep)
    })

    it('should return error if question id does not match pending', () => {
      const store = useQuestionStore()
      const question = ALL_QUESTIONS[0]!
      const otherQuestion = ALL_QUESTIONS[1]!

      store.askQuestion(question.id)
      const result = store.vetoQuestion(otherQuestion.id)

      expect(result.success).toBe(false)
      expect(result.error).toBe('Question ID does not match pending question')
    })

    it('should return error if no question is pending', () => {
      const store = useQuestionStore()
      const question = ALL_QUESTIONS[0]!

      const result = store.vetoQuestion(question.id)

      expect(result.success).toBe(false)
      expect(result.error).toBe('No question is pending')
    })
  })

  describe('randomizeQuestion', () => {
    it('should replace pending question with a different question from same category', () => {
      const store = useQuestionStore()
      const question = ALL_QUESTIONS.find((q) => q.categoryId === QuestionCategoryId.Matching)!

      store.askQuestion(question.id)
      const result = store.randomizeQuestion(question.id)

      expect(result.success).toBe(true)
      expect(store.hasPendingQuestion).toBe(true)
      expect(store.pendingQuestion?.questionId).not.toBe(question.id)
      expect(store.pendingQuestion?.categoryId).toBe(QuestionCategoryId.Matching)
    })

    it('should return the new question ID when randomized', () => {
      const store = useQuestionStore()
      const question = ALL_QUESTIONS.find((q) => q.categoryId === QuestionCategoryId.Matching)!

      store.askQuestion(question.id)
      const result = store.randomizeQuestion(question.id)

      expect(result.success).toBe(true)
      expect(result.newQuestionId).toBeDefined()
      expect(result.newQuestionId).not.toBe(question.id)
    })

    it('should return error if question id does not match pending', () => {
      const store = useQuestionStore()
      const question = ALL_QUESTIONS[0]!
      const otherQuestion = ALL_QUESTIONS[1]!

      store.askQuestion(question.id)
      const result = store.randomizeQuestion(otherQuestion.id)

      expect(result.success).toBe(false)
      expect(result.error).toBe('Question ID does not match pending question')
    })

    it('should return error if no question is pending', () => {
      const store = useQuestionStore()
      const question = ALL_QUESTIONS[0]!

      const result = store.randomizeQuestion(question.id)

      expect(result.success).toBe(false)
      expect(result.error).toBe('No question is pending')
    })

    it('should return error if no other questions available in same category', () => {
      const store = useQuestionStore()
      // Get all matching questions and mark all but one as asked
      const matchingQuestions = ALL_QUESTIONS.filter(
        (q) => q.categoryId === QuestionCategoryId.Matching,
      )

      // Mark all but one as asked
      for (let i = 1; i < matchingQuestions.length; i++) {
        store.askedQuestions.push({
          questionId: matchingQuestions[i]!.id,
          categoryId: matchingQuestions[i]!.categoryId,
          answer: 'Yes',
          askedAt: new Date(),
        })
      }

      // Ask the only remaining question
      store.askQuestion(matchingQuestions[0]!.id)
      const result = store.randomizeQuestion(matchingQuestions[0]!.id)

      expect(result.success).toBe(false)
      expect(result.error).toBe('No other questions available in this category')
    })

    it('should preserve the original askedAt timestamp', () => {
      const store = useQuestionStore()
      const question = ALL_QUESTIONS.find((q) => q.categoryId === QuestionCategoryId.Matching)!

      store.askQuestion(question.id)
      const originalAskedAt = store.pendingQuestion!.askedAt

      store.randomizeQuestion(question.id)

      expect(store.pendingQuestion?.askedAt).toEqual(originalAskedAt)
    })
  })
})

describe('questionStore persistence', () => {
  let mockStorage: Record<string, string>

  beforeEach(() => {
    mockStorage = {}

    vi.stubGlobal('localStorage', {
      getItem: vi.fn((key: string) => mockStorage[key] ?? null),
      setItem: vi.fn((key: string, value: string) => {
        mockStorage[key] = value
      }),
      removeItem: vi.fn((key: string) => {
        delete mockStorage[key]
      }),
      clear: vi.fn(() => {
        mockStorage = {}
      }),
    })

    setActivePinia(createPinia())
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('should persist state to localStorage', async () => {
    const store = useQuestionStore()
    const question = ALL_QUESTIONS[0]!

    // Ask and answer a question to create state
    store.askQuestion(question.id)
    store.answerQuestion(question.id, 'Yes')

    // Wait for Vue's watcher to trigger (watchers are async)
    await nextTick()

    // State should be persisted to localStorage
    expect(localStorage.setItem).toHaveBeenCalled()

    // Verify persisted data contains the asked question
    const persistedKey = Object.keys(mockStorage).find((key) =>
      key.includes('questions'),
    )
    expect(persistedKey).toBeDefined()

    const persistedData = JSON.parse(mockStorage[persistedKey!]!)
    expect(persistedData.askedQuestions).toBeDefined()
    expect(persistedData.askedQuestions.length).toBe(1)
    expect(persistedData.askedQuestions[0].questionId).toBe(question.id)
  })

  it('should rehydrate state on load', () => {
    const question = ALL_QUESTIONS[0]!
    const askedQuestion = {
      questionId: question.id,
      categoryId: question.categoryId,
      answer: 'Yes',
      askedAt: new Date().toISOString(),
      answeredAt: new Date().toISOString(),
      vetoed: false,
    }

    // Pre-populate localStorage with persisted state
    mockStorage['jet-lag-stillwater:questions'] = JSON.stringify({
      askedQuestions: [askedQuestion],
      pendingQuestion: null,
    })

    // Create a new store - it should rehydrate from localStorage
    const store = useQuestionStore()
    store.rehydrate()

    expect(store.askedQuestions.length).toBe(1)
    expect(store.askedQuestions[0]!.questionId).toBe(question.id)
    expect(store.askedQuestions[0]!.answer).toBe('Yes')
  })

  it('should preserve pending question across restart', () => {
    const question = ALL_QUESTIONS[0]!
    const pendingQuestion = {
      questionId: question.id,
      categoryId: question.categoryId,
      answer: '',
      askedAt: new Date().toISOString(),
      vetoed: false,
    }

    // Pre-populate localStorage with a pending question
    mockStorage['jet-lag-stillwater:questions'] = JSON.stringify({
      askedQuestions: [],
      pendingQuestion: pendingQuestion,
    })

    // Create a new store - it should rehydrate with the pending question
    const store = useQuestionStore()
    store.rehydrate()

    expect(store.hasPendingQuestion).toBe(true)
    expect(store.pendingQuestion?.questionId).toBe(question.id)
  })

  it('should convert date strings back to Date objects on rehydrate', () => {
    const question = ALL_QUESTIONS[0]!
    const now = new Date()
    const askedQuestion = {
      questionId: question.id,
      categoryId: question.categoryId,
      answer: 'Yes',
      askedAt: now.toISOString(),
      answeredAt: now.toISOString(),
      vetoed: false,
    }

    mockStorage['jet-lag-stillwater:questions'] = JSON.stringify({
      askedQuestions: [askedQuestion],
      pendingQuestion: null,
    })

    const store = useQuestionStore()
    store.rehydrate()

    // askedAt should be a Date object, not a string
    expect(store.askedQuestions[0]!.askedAt).toBeInstanceOf(Date)
    expect(store.askedQuestions[0]!.answeredAt).toBeInstanceOf(Date)
  })

  it('should handle empty localStorage gracefully', () => {
    // localStorage is empty
    const store = useQuestionStore()
    store.rehydrate()

    // Store should have default state
    expect(store.askedQuestions).toEqual([])
    expect(store.pendingQuestion).toBeNull()
  })

  it('should handle corrupted localStorage data gracefully', () => {
    // Corrupted data in localStorage
    mockStorage['jet-lag-stillwater:questions'] = 'not valid json {'

    const store = useQuestionStore()

    // Should not throw and should have default state
    expect(() => store.rehydrate()).not.toThrow()
    expect(store.askedQuestions).toEqual([])
    expect(store.pendingQuestion).toBeNull()
  })
})
