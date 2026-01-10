import { describe, it, expect } from 'vitest'
import {
  ALL_QUESTIONS,
  MATCHING_QUESTIONS,
  MEASURING_QUESTIONS,
  RADAR_QUESTIONS,
  THERMOMETER_QUESTIONS,
  PHOTO_QUESTIONS,
  TENTACLE_QUESTIONS,
  getQuestionsForGameSize,
  getQuestionsByCategory,
  getQuestionsByCategoryAndGameSize,
  getStillwaterCustomQuestions,
  getQuestionById,
} from '../questions'
import { QuestionCategoryId, GameSize } from '../../types/question'

describe('Question Seed Data', () => {
  describe('ALL_QUESTIONS', () => {
    it('should have unique IDs for all questions', () => {
      const ids = ALL_QUESTIONS.map(q => q.id)
      const uniqueIds = new Set(ids)
      expect(uniqueIds.size).toBe(ids.length)
    })

    it('should have non-empty text for all questions', () => {
      ALL_QUESTIONS.forEach(q => {
        expect(q.text).toBeTruthy()
        expect(q.text.length).toBeGreaterThan(0)
      })
    })

    it('should have valid categoryId for all questions', () => {
      const validCategories = Object.values(QuestionCategoryId)
      ALL_QUESTIONS.forEach(q => {
        expect(validCategories).toContain(q.categoryId)
      })
    })

    it('should have non-empty availableIn for all questions', () => {
      ALL_QUESTIONS.forEach(q => {
        expect(q.availableIn).toBeDefined()
        expect(Array.isArray(q.availableIn)).toBe(true)
        expect(q.availableIn.length).toBeGreaterThan(0)
      })
    })

    it('should have valid game sizes in availableIn', () => {
      const validSizes = Object.values(GameSize)
      ALL_QUESTIONS.forEach(q => {
        q.availableIn.forEach(size => {
          expect(validSizes).toContain(size)
        })
      })
    })
  })

  describe('MATCHING_QUESTIONS', () => {
    it('should have 22 matching questions', () => {
      expect(MATCHING_QUESTIONS.length).toBe(22)
    })

    it('should all have Matching categoryId', () => {
      MATCHING_QUESTIONS.forEach(q => {
        expect(q.categoryId).toBe(QuestionCategoryId.Matching)
      })
    })

    it('should include Stillwater custom questions', () => {
      const customQuestions = MATCHING_QUESTIONS.filter(q => q.isStillwaterCustom)
      expect(customQuestions.length).toBe(3) // quadrant, restaurant, school
    })

    it('should have subcategories defined', () => {
      const subcategories = new Set(MATCHING_QUESTIONS.map(q => q.subcategory))
      expect(subcategories).toContain('transit')
      expect(subcategories).toContain('administrative')
      expect(subcategories).toContain('natural')
      expect(subcategories).toContain('places-of-interest')
      expect(subcategories).toContain('public-utilities')
    })
  })

  describe('MEASURING_QUESTIONS', () => {
    it('should have 20 measuring questions', () => {
      expect(MEASURING_QUESTIONS.length).toBe(20)
    })

    it('should all have Measuring categoryId', () => {
      MEASURING_QUESTIONS.forEach(q => {
        expect(q.categoryId).toBe(QuestionCategoryId.Measuring)
      })
    })

    it('should have subcategories defined', () => {
      const subcategories = new Set(MEASURING_QUESTIONS.map(q => q.subcategory))
      expect(subcategories).toContain('transit')
      expect(subcategories).toContain('borders')
      expect(subcategories).toContain('natural')
      expect(subcategories).toContain('places-of-interest')
      expect(subcategories).toContain('public-utilities')
    })
  })

  describe('RADAR_QUESTIONS', () => {
    it('should have 10 radar questions', () => {
      expect(RADAR_QUESTIONS.length).toBe(10)
    })

    it('should all have Radar categoryId', () => {
      RADAR_QUESTIONS.forEach(q => {
        expect(q.categoryId).toBe(QuestionCategoryId.Radar)
      })
    })

    it('should include various distance options', () => {
      const texts = RADAR_QUESTIONS.map(q => q.text)
      expect(texts.some(t => t.includes('0.2 miles'))).toBe(true)
      expect(texts.some(t => t.includes('1 mile'))).toBe(true)
      expect(texts.some(t => t.includes('100 miles'))).toBe(true)
      expect(texts.some(t => t.includes('custom'))).toBe(true)
    })
  })

  describe('THERMOMETER_QUESTIONS', () => {
    it('should have 5 thermometer questions', () => {
      expect(THERMOMETER_QUESTIONS.length).toBe(5)
    })

    it('should all have Thermometer categoryId', () => {
      THERMOMETER_QUESTIONS.forEach(q => {
        expect(q.categoryId).toBe(QuestionCategoryId.Thermometer)
      })
    })

    it('should have one Stillwater custom question (0.2 miles)', () => {
      const customQuestions = THERMOMETER_QUESTIONS.filter(q => q.isStillwaterCustom)
      expect(customQuestions.length).toBe(1)
      expect(customQuestions[0]!.text).toContain('0.2 miles')
    })

    it('should have game size restrictions', () => {
      const smallOnly = THERMOMETER_QUESTIONS.filter(q =>
        q.availableIn.includes(GameSize.Small)
      )
      expect(smallOnly.length).toBe(3) // 0.2, 0.5, 3 miles

      const largeOnly = THERMOMETER_QUESTIONS.filter(q =>
        q.availableIn.length === 1 && q.availableIn[0] === GameSize.Large
      )
      expect(largeOnly.length).toBe(1) // 50 miles
    })
  })

  describe('PHOTO_QUESTIONS', () => {
    it('should have 18 photo questions', () => {
      expect(PHOTO_QUESTIONS.length).toBe(18)
    })

    it('should all have Photo categoryId', () => {
      PHOTO_QUESTIONS.forEach(q => {
        expect(q.categoryId).toBe(QuestionCategoryId.Photo)
      })
    })

    it('should have instructions for all photo questions', () => {
      PHOTO_QUESTIONS.forEach(q => {
        expect(q.instructions).toBeTruthy()
      })
    })

    it('should have 6 questions available for Small game size', () => {
      const smallQuestions = PHOTO_QUESTIONS.filter(q =>
        q.availableIn.includes(GameSize.Small)
      )
      expect(smallQuestions.length).toBe(6)
    })

    it('should have 4 questions only available for Large game size', () => {
      const largeOnly = PHOTO_QUESTIONS.filter(q =>
        q.availableIn.length === 1 && q.availableIn[0] === GameSize.Large
      )
      expect(largeOnly.length).toBe(4)
    })
  })

  describe('TENTACLE_QUESTIONS', () => {
    it('should have 8 tentacle questions', () => {
      expect(TENTACLE_QUESTIONS.length).toBe(8)
    })

    it('should all have Tentacle categoryId', () => {
      TENTACLE_QUESTIONS.forEach(q => {
        expect(q.categoryId).toBe(QuestionCategoryId.Tentacle)
      })
    })

    it('should have NO questions available for Small game size', () => {
      const smallQuestions = TENTACLE_QUESTIONS.filter(q =>
        q.availableIn.includes(GameSize.Small)
      )
      expect(smallQuestions.length).toBe(0)
    })

    it('should have 4 questions for Medium game size', () => {
      const mediumQuestions = TENTACLE_QUESTIONS.filter(q =>
        q.availableIn.includes(GameSize.Medium)
      )
      expect(mediumQuestions.length).toBe(4)
    })

    it('should have instructions for all tentacle questions', () => {
      TENTACLE_QUESTIONS.forEach(q => {
        expect(q.instructions).toBeTruthy()
      })
    })
  })
})

describe('Question Helper Functions', () => {
  describe('getQuestionsForGameSize', () => {
    it('should return correct number of questions for Small game', () => {
      const questions = getQuestionsForGameSize(GameSize.Small)
      // Matching: 22, Measuring: 20, Radar: 10, Thermometer: 3, Photo: 6, Tentacle: 0
      expect(questions.length).toBe(61)
    })

    it('should return more questions for Large game', () => {
      const smallQuestions = getQuestionsForGameSize(GameSize.Small)
      const largeQuestions = getQuestionsForGameSize(GameSize.Large)
      expect(largeQuestions.length).toBeGreaterThan(smallQuestions.length)
    })

    it('should not include Tentacle questions for Small game', () => {
      const questions = getQuestionsForGameSize(GameSize.Small)
      const tentacleQuestions = questions.filter(q => q.categoryId === QuestionCategoryId.Tentacle)
      expect(tentacleQuestions.length).toBe(0)
    })
  })

  describe('getQuestionsByCategory', () => {
    it('should return only questions from specified category', () => {
      const matching = getQuestionsByCategory(QuestionCategoryId.Matching)
      expect(matching.length).toBe(22)
      matching.forEach(q => {
        expect(q.categoryId).toBe(QuestionCategoryId.Matching)
      })
    })

    it('should return all photo questions', () => {
      const photos = getQuestionsByCategory(QuestionCategoryId.Photo)
      expect(photos.length).toBe(18)
    })
  })

  describe('getQuestionsByCategoryAndGameSize', () => {
    it('should filter by both category and game size', () => {
      const smallPhotos = getQuestionsByCategoryAndGameSize(
        QuestionCategoryId.Photo,
        GameSize.Small
      )
      expect(smallPhotos.length).toBe(6)
      smallPhotos.forEach(q => {
        expect(q.categoryId).toBe(QuestionCategoryId.Photo)
        expect(q.availableIn).toContain(GameSize.Small)
      })
    })

    it('should return 0 for Tentacle in Small game', () => {
      const smallTentacles = getQuestionsByCategoryAndGameSize(
        QuestionCategoryId.Tentacle,
        GameSize.Small
      )
      expect(smallTentacles.length).toBe(0)
    })
  })

  describe('getStillwaterCustomQuestions', () => {
    it('should return only Stillwater custom questions', () => {
      const custom = getStillwaterCustomQuestions()
      expect(custom.length).toBe(4) // quadrant, restaurant, school, thermometer 0.2mi
      custom.forEach(q => {
        expect(q.isStillwaterCustom).toBe(true)
      })
    })
  })

  describe('getQuestionById', () => {
    it('should return correct question by ID', () => {
      const question = getQuestionById('matching-transit-airport')
      expect(question).toBeDefined()
      expect(question!.text).toContain('commercial airport')
    })

    it('should return undefined for invalid ID', () => {
      const question = getQuestionById('invalid-id')
      expect(question).toBeUndefined()
    })
  })
})
