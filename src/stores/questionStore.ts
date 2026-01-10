/**
 * Question Store
 *
 * Pinia store for tracking question state in the game.
 * Tracks all available questions, asked questions, and pending questions.
 */

import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { ALL_QUESTIONS, getQuestionById as getQuestionByIdFromData } from '@/data/questions'
import {
  QUESTION_CATEGORIES,
  type AskedQuestion,
  type Question,
  getCategoryById,
} from '@/types/question'
import { GameSize, QuestionCategoryId } from '@/types/question'

/**
 * Result type for question actions
 */
export interface ActionResult {
  success: boolean
  error?: string
  cardsDraw?: number
  cardsKeep?: number
}

/**
 * Stats for a question category
 */
export interface CategoryStats {
  categoryId: QuestionCategoryId
  name: string
  total: number
  available: number
  asked: number
  cardsDraw: number
  cardsKeep: number
}

export const useQuestionStore = defineStore('questions', () => {
  // State
  const askedQuestions = ref<AskedQuestion[]>([])
  const pendingQuestion = ref<AskedQuestion | null>(null)

  // Getters
  const hasPendingQuestion = computed(() => pendingQuestion.value !== null)

  /**
   * Get all available questions, optionally filtered by category.
   * Filters out questions that have already been asked.
   */
  function getAvailableQuestions(categoryId?: QuestionCategoryId): Question[] {
    const askedIds = new Set(askedQuestions.value.map((aq) => aq.questionId))

    let questions = ALL_QUESTIONS.filter((q) => !askedIds.has(q.id))

    if (categoryId) {
      questions = questions.filter((q) => q.categoryId === categoryId)
    }

    return questions
  }

  /**
   * Get available questions filtered by game size.
   * Also filters out already asked questions.
   */
  function getAvailableQuestionsForGameSize(
    gameSize: GameSize,
    categoryId?: QuestionCategoryId,
  ): Question[] {
    const askedIds = new Set(askedQuestions.value.map((aq) => aq.questionId))

    let questions = ALL_QUESTIONS.filter(
      (q) => !askedIds.has(q.id) && q.availableIn.includes(gameSize),
    )

    if (categoryId) {
      questions = questions.filter((q) => q.categoryId === categoryId)
    }

    return questions
  }

  /**
   * Get a question by its ID
   */
  function getQuestionById(id: string): Question | undefined {
    return getQuestionByIdFromData(id)
  }

  /**
   * Get stats for all categories
   */
  function getCategoryStats(): CategoryStats[] {
    const askedIds = new Set(askedQuestions.value.map((aq) => aq.questionId))

    return QUESTION_CATEGORIES.map((category) => {
      const categoryQuestions = ALL_QUESTIONS.filter((q) => q.categoryId === category.id)
      const askedCount = categoryQuestions.filter((q) => askedIds.has(q.id)).length

      return {
        categoryId: category.id,
        name: category.name,
        total: categoryQuestions.length,
        available: categoryQuestions.length - askedCount,
        asked: askedCount,
        cardsDraw: category.cardsDraw,
        cardsKeep: category.cardsKeep,
      }
    })
  }

  /**
   * Ask a question - marks it as pending and returns draw/keep values.
   * Prevents asking if another question is already pending or if question was already asked.
   */
  function askQuestion(questionId: string): ActionResult {
    // Check if a question is already pending
    if (pendingQuestion.value !== null) {
      return { success: false, error: 'A question is already pending' }
    }

    // Check if the question exists
    const question = getQuestionByIdFromData(questionId)
    if (!question) {
      return { success: false, error: 'Question not found' }
    }

    // Check if the question was already asked
    const alreadyAsked = askedQuestions.value.some((aq) => aq.questionId === questionId)
    if (alreadyAsked) {
      return { success: false, error: 'Question has already been asked' }
    }

    // Get the category for draw/keep values
    const category = getCategoryById(question.categoryId)
    if (!category) {
      return { success: false, error: 'Question category not found' }
    }

    // Mark the question as pending
    pendingQuestion.value = {
      questionId,
      categoryId: question.categoryId,
      answer: '',
      askedAt: new Date(),
      vetoed: false,
    }

    return {
      success: true,
      cardsDraw: category.cardsDraw,
      cardsKeep: category.cardsKeep,
    }
  }

  /**
   * Answer a pending question - records the answer and moves it to asked questions.
   */
  function answerQuestion(questionId: string, answer: string): ActionResult {
    // Check if a question is pending
    if (pendingQuestion.value === null) {
      return { success: false, error: 'No question is pending' }
    }

    // Check if the question ID matches
    if (pendingQuestion.value.questionId !== questionId) {
      return { success: false, error: 'Question ID does not match pending question' }
    }

    // Record the answer and move to asked questions
    const answeredQuestion: AskedQuestion = {
      ...pendingQuestion.value,
      answer,
      answeredAt: new Date(),
      vetoed: false,
    }

    askedQuestions.value.push(answeredQuestion)
    pendingQuestion.value = null

    return { success: true }
  }

  /**
   * Veto a pending question - returns it to available (but hider still gets cards).
   * The question is NOT added to asked questions, so it can be asked again.
   */
  function vetoQuestion(questionId: string): ActionResult {
    // Check if a question is pending
    if (pendingQuestion.value === null) {
      return { success: false, error: 'No question is pending' }
    }

    // Check if the question ID matches
    if (pendingQuestion.value.questionId !== questionId) {
      return { success: false, error: 'Question ID does not match pending question' }
    }

    // Get the category for draw/keep values (hider still gets cards on veto)
    const question = getQuestionByIdFromData(questionId)
    const category = question ? getCategoryById(question.categoryId) : undefined

    // Clear the pending question (returns it to available)
    pendingQuestion.value = null

    return {
      success: true,
      cardsDraw: category?.cardsDraw,
      cardsKeep: category?.cardsKeep,
    }
  }

  return {
    // State
    askedQuestions,
    pendingQuestion,
    // Getters
    hasPendingQuestion,
    // Actions/Methods
    getAvailableQuestions,
    getAvailableQuestionsForGameSize,
    getQuestionById,
    getCategoryStats,
    askQuestion,
    answerQuestion,
    vetoQuestion,
  }
})
