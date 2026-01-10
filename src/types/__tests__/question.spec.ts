import { describe, it, expect } from 'vitest'
import type { QuestionCategory, Question, AskedQuestion } from '../question'
import {
  QUESTION_CATEGORIES,
  QuestionCategoryId,
  createAskedQuestion,
} from '../question'

describe('QuestionCategory', () => {
  it('should have all five question categories defined', () => {
    expect(QUESTION_CATEGORIES).toHaveLength(5)
  })

  it('should include Relative category', () => {
    const relative = QUESTION_CATEGORIES.find(c => c.id === QuestionCategoryId.Relative)
    expect(relative).toBeDefined()
    expect(relative?.name).toBe('Relative')
  })

  it('should include Radar category', () => {
    const radar = QUESTION_CATEGORIES.find(c => c.id === QuestionCategoryId.Radar)
    expect(radar).toBeDefined()
    expect(radar?.name).toBe('Radar')
  })

  it('should include Photos category', () => {
    const photos = QUESTION_CATEGORIES.find(c => c.id === QuestionCategoryId.Photos)
    expect(photos).toBeDefined()
    expect(photos?.name).toBe('Photos')
  })

  it('should include Oddball category', () => {
    const oddball = QUESTION_CATEGORIES.find(c => c.id === QuestionCategoryId.Oddball)
    expect(oddball).toBeDefined()
    expect(oddball?.name).toBe('Oddball')
  })

  it('should include Precision category', () => {
    const precision = QUESTION_CATEGORIES.find(c => c.id === QuestionCategoryId.Precision)
    expect(precision).toBeDefined()
    expect(precision?.name).toBe('Precision')
  })

  it('should have draw and keep values for each category', () => {
    QUESTION_CATEGORIES.forEach((category: QuestionCategory) => {
      expect(category.cardsDraw).toBeGreaterThanOrEqual(0)
      expect(category.cardsKeep).toBeGreaterThanOrEqual(0)
      expect(category.cardsKeep).toBeLessThanOrEqual(category.cardsDraw)
    })
  })

  it('should have a description for each category', () => {
    QUESTION_CATEGORIES.forEach((category: QuestionCategory) => {
      expect(category.description).toBeTruthy()
      expect(typeof category.description).toBe('string')
    })
  })
})

describe('Question interface', () => {
  it('should allow creating a valid question object', () => {
    const question: Question = {
      id: 'relative-001',
      text: 'Is the hider north or south of you?',
      categoryId: QuestionCategoryId.Relative,
    }

    expect(question.id).toBe('relative-001')
    expect(question.text).toBe('Is the hider north or south of you?')
    expect(question.categoryId).toBe(QuestionCategoryId.Relative)
  })
})

describe('AskedQuestion', () => {
  it('should allow creating an asked question with required fields', () => {
    const askedAt = new Date()
    const asked: AskedQuestion = {
      questionId: 'relative-001',
      answer: 'North',
      askedAt,
      categoryId: QuestionCategoryId.Relative,
    }

    expect(asked.questionId).toBe('relative-001')
    expect(asked.answer).toBe('North')
    expect(asked.askedAt).toBe(askedAt)
    expect(asked.categoryId).toBe(QuestionCategoryId.Relative)
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
      questionId: 'precision-001',
      answer: '',
      askedAt: new Date(),
      categoryId: QuestionCategoryId.Precision,
      vetoed: true,
    }

    expect(asked.vetoed).toBe(true)
  })
})

describe('createAskedQuestion helper', () => {
  it('should create an AskedQuestion with current timestamp', () => {
    const before = new Date()
    const asked = createAskedQuestion('relative-001', QuestionCategoryId.Relative)
    const after = new Date()

    expect(asked.questionId).toBe('relative-001')
    expect(asked.categoryId).toBe(QuestionCategoryId.Relative)
    expect(asked.answer).toBe('')
    expect(asked.askedAt.getTime()).toBeGreaterThanOrEqual(before.getTime())
    expect(asked.askedAt.getTime()).toBeLessThanOrEqual(after.getTime())
    expect(asked.vetoed).toBe(false)
  })
})
