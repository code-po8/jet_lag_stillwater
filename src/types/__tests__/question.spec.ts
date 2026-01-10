import { describe, it, expect } from 'vitest'
import type { QuestionCategory, Question, AskedQuestion } from '../question'
import {
  QUESTION_CATEGORIES,
  QuestionCategoryId,
  GameSize,
  createAskedQuestion,
  getCategoryById,
  getResponseTime,
  isCategoryAvailable,
  getCategoriesForGameSize,
} from '../question'

describe('QuestionCategory', () => {
  it('should have all six question categories defined', () => {
    expect(QUESTION_CATEGORIES).toHaveLength(6)
  })

  it('should include Matching category', () => {
    const matching = QUESTION_CATEGORIES.find(c => c.id === QuestionCategoryId.Matching)
    expect(matching).toBeDefined()
    expect(matching?.name).toBe('Matching')
    expect(matching?.format).toBe('Is your nearest _ the same as my nearest _?')
  })

  it('should include Measuring category', () => {
    const measuring = QUESTION_CATEGORIES.find(c => c.id === QuestionCategoryId.Measuring)
    expect(measuring).toBeDefined()
    expect(measuring?.name).toBe('Measuring')
    expect(measuring?.format).toBe('Compared to me, are you closer to or further from _?')
  })

  it('should include Radar category', () => {
    const radar = QUESTION_CATEGORIES.find(c => c.id === QuestionCategoryId.Radar)
    expect(radar).toBeDefined()
    expect(radar?.name).toBe('Radar')
    expect(radar?.format).toBe('Are you within _ of me?')
  })

  it('should include Thermometer category', () => {
    const thermometer = QUESTION_CATEGORIES.find(c => c.id === QuestionCategoryId.Thermometer)
    expect(thermometer).toBeDefined()
    expect(thermometer?.name).toBe('Thermometer')
    expect(thermometer?.format).toBe('After traveling _, am I hotter or colder?')
  })

  it('should include Photo category', () => {
    const photo = QUESTION_CATEGORIES.find(c => c.id === QuestionCategoryId.Photo)
    expect(photo).toBeDefined()
    expect(photo?.name).toBe('Photo')
    expect(photo?.format).toBe('Send us a photo of _')
  })

  it('should include Tentacle category', () => {
    const tentacle = QUESTION_CATEGORIES.find(c => c.id === QuestionCategoryId.Tentacle)
    expect(tentacle).toBeDefined()
    expect(tentacle?.name).toBe('Tentacle')
    expect(tentacle?.format).toBe('Of all the [location type] within [distance] of me, which are you closest to?')
  })

  it('should have correct draw and keep values for each category', () => {
    const expectedValues: Record<QuestionCategoryId, { draw: number; keep: number }> = {
      [QuestionCategoryId.Matching]: { draw: 3, keep: 1 },
      [QuestionCategoryId.Measuring]: { draw: 3, keep: 1 },
      [QuestionCategoryId.Radar]: { draw: 2, keep: 1 },
      [QuestionCategoryId.Thermometer]: { draw: 2, keep: 1 },
      [QuestionCategoryId.Photo]: { draw: 1, keep: 1 },
      [QuestionCategoryId.Tentacle]: { draw: 4, keep: 2 },
    }

    QUESTION_CATEGORIES.forEach((category: QuestionCategory) => {
      const expected = expectedValues[category.id]
      expect(category.cardsDraw).toBe(expected.draw)
      expect(category.cardsKeep).toBe(expected.keep)
      expect(category.cardsKeep).toBeLessThanOrEqual(category.cardsDraw)
    })
  })

  it('should have a description for each category', () => {
    QUESTION_CATEGORIES.forEach((category: QuestionCategory) => {
      expect(category.description).toBeTruthy()
      expect(typeof category.description).toBe('string')
    })
  })

  it('should have response time defined for each category', () => {
    QUESTION_CATEGORIES.forEach((category: QuestionCategory) => {
      expect(category.responseTimeMinutes).toBeDefined()
    })
  })

  it('should have availableIn defined for each category', () => {
    QUESTION_CATEGORIES.forEach((category: QuestionCategory) => {
      expect(category.availableIn).toBeDefined()
      expect(Array.isArray(category.availableIn)).toBe(true)
      expect(category.availableIn.length).toBeGreaterThan(0)
    })
  })
})

describe('Question interface', () => {
  it('should allow creating a valid question object', () => {
    const question: Question = {
      id: 'matching-001',
      text: 'Is your nearest airport the same as my nearest airport?',
      categoryId: QuestionCategoryId.Matching,
      availableIn: [GameSize.Small, GameSize.Medium, GameSize.Large],
    }

    expect(question.id).toBe('matching-001')
    expect(question.text).toBe('Is your nearest airport the same as my nearest airport?')
    expect(question.categoryId).toBe(QuestionCategoryId.Matching)
    expect(question.availableIn).toContain(GameSize.Small)
  })

  it('should allow optional subcategory and instructions', () => {
    const question: Question = {
      id: 'matching-custom-001',
      text: 'Is your nearest quadrant the same as my nearest quadrant?',
      categoryId: QuestionCategoryId.Matching,
      availableIn: [GameSize.Small],
      subcategory: 'administrative',
      isStillwaterCustom: true,
      instructions: 'Quadrant defined by Husband St (E/W) and McElroy Rd (N/S)',
    }

    expect(question.subcategory).toBe('administrative')
    expect(question.isStillwaterCustom).toBe(true)
    expect(question.instructions).toBeTruthy()
  })
})

describe('AskedQuestion', () => {
  it('should allow creating an asked question with required fields', () => {
    const askedAt = new Date()
    const asked: AskedQuestion = {
      questionId: 'matching-001',
      answer: 'Yes',
      askedAt,
      categoryId: QuestionCategoryId.Matching,
    }

    expect(asked.questionId).toBe('matching-001')
    expect(asked.answer).toBe('Yes')
    expect(asked.askedAt).toBe(askedAt)
    expect(asked.categoryId).toBe(QuestionCategoryId.Matching)
  })

  it('should allow an optional answeredAt timestamp', () => {
    const askedAt = new Date()
    const answeredAt = new Date(askedAt.getTime() + 60000) // 1 minute later

    const asked: AskedQuestion = {
      questionId: 'radar-001',
      answer: 'Yes, within 1 mile',
      askedAt,
      answeredAt,
      categoryId: QuestionCategoryId.Radar,
    }

    expect(asked.answeredAt).toBe(answeredAt)
  })

  it('should allow tracking vetoed status', () => {
    const asked: AskedQuestion = {
      questionId: 'tentacle-001',
      answer: '',
      askedAt: new Date(),
      categoryId: QuestionCategoryId.Tentacle,
      vetoed: true,
    }

    expect(asked.vetoed).toBe(true)
  })
})

describe('createAskedQuestion helper', () => {
  it('should create an AskedQuestion with current timestamp', () => {
    const before = new Date()
    const asked = createAskedQuestion('matching-001', QuestionCategoryId.Matching)
    const after = new Date()

    expect(asked.questionId).toBe('matching-001')
    expect(asked.categoryId).toBe(QuestionCategoryId.Matching)
    expect(asked.answer).toBe('')
    expect(asked.askedAt.getTime()).toBeGreaterThanOrEqual(before.getTime())
    expect(asked.askedAt.getTime()).toBeLessThanOrEqual(after.getTime())
    expect(asked.vetoed).toBe(false)
  })
})

describe('getCategoryById', () => {
  it('should return the correct category', () => {
    const matching = getCategoryById(QuestionCategoryId.Matching)
    expect(matching?.name).toBe('Matching')

    const photo = getCategoryById(QuestionCategoryId.Photo)
    expect(photo?.name).toBe('Photo')
  })

  it('should return undefined for invalid ID', () => {
    const invalid = getCategoryById('invalid' as QuestionCategoryId)
    expect(invalid).toBeUndefined()
  })
})

describe('getResponseTime', () => {
  it('should return fixed response time for most categories', () => {
    const matching = getCategoryById(QuestionCategoryId.Matching)!
    expect(getResponseTime(matching, GameSize.Small)).toBe(5)
    expect(getResponseTime(matching, GameSize.Large)).toBe(5)
  })

  it('should return variable response time for Photo category by game size', () => {
    const photo = getCategoryById(QuestionCategoryId.Photo)!
    expect(getResponseTime(photo, GameSize.Small)).toBe(10)
    expect(getResponseTime(photo, GameSize.Medium)).toBe(10)
    expect(getResponseTime(photo, GameSize.Large)).toBe(20)
  })
})

describe('isCategoryAvailable', () => {
  it('should return true for categories available in all sizes', () => {
    const matching = getCategoryById(QuestionCategoryId.Matching)!
    expect(isCategoryAvailable(matching, GameSize.Small)).toBe(true)
    expect(isCategoryAvailable(matching, GameSize.Medium)).toBe(true)
    expect(isCategoryAvailable(matching, GameSize.Large)).toBe(true)
  })

  it('should return false for Tentacle in Small game size', () => {
    const tentacle = getCategoryById(QuestionCategoryId.Tentacle)!
    expect(isCategoryAvailable(tentacle, GameSize.Small)).toBe(false)
    expect(isCategoryAvailable(tentacle, GameSize.Medium)).toBe(true)
    expect(isCategoryAvailable(tentacle, GameSize.Large)).toBe(true)
  })
})

describe('getCategoriesForGameSize', () => {
  it('should return 5 categories for Small game size (no Tentacle)', () => {
    const categories = getCategoriesForGameSize(GameSize.Small)
    expect(categories).toHaveLength(5)
    expect(categories.map(c => c.id)).not.toContain(QuestionCategoryId.Tentacle)
  })

  it('should return all 6 categories for Medium and Large game sizes', () => {
    const mediumCategories = getCategoriesForGameSize(GameSize.Medium)
    expect(mediumCategories).toHaveLength(6)

    const largeCategories = getCategoriesForGameSize(GameSize.Large)
    expect(largeCategories).toHaveLength(6)
  })
})
