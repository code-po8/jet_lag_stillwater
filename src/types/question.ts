/**
 * Question data model types for Jet Lag: Hide and Seek
 *
 * Based on the official game rules with five question categories.
 * Each category has different draw/keep values representing
 * how many cards the hider draws when a question is answered.
 */

/**
 * Enum for question category identifiers
 */
export enum QuestionCategoryId {
  Relative = 'relative',
  Radar = 'radar',
  Photos = 'photos',
  Oddball = 'oddball',
  Precision = 'precision',
}

/**
 * Question category definition
 */
export interface QuestionCategory {
  /** Unique identifier for the category */
  id: QuestionCategoryId
  /** Display name */
  name: string
  /** Description of what types of questions are in this category */
  description: string
  /** How many cards the hider draws when this question is answered */
  cardsDraw: number
  /** How many cards the hider keeps from those drawn */
  cardsKeep: number
}

/**
 * Individual question definition
 */
export interface Question {
  /** Unique identifier for the question */
  id: string
  /** The question text */
  text: string
  /** Category this question belongs to */
  categoryId: QuestionCategoryId
}

/**
 * Record of a question that has been asked during gameplay
 */
export interface AskedQuestion {
  /** Reference to the question that was asked */
  questionId: string
  /** The category of the question (denormalized for easy access) */
  categoryId: QuestionCategoryId
  /** The answer provided by the hider */
  answer: string
  /** When the question was asked */
  askedAt: Date
  /** When the answer was provided (optional, for tracking response time) */
  answeredAt?: Date
  /** Whether the question was vetoed by the hider */
  vetoed?: boolean
}

/**
 * All question categories with their draw/keep values
 *
 * Note: Draw/keep values are placeholders pending final rulebook reference.
 * Higher value questions (more information for seekers) = more cards for hider.
 */
export const QUESTION_CATEGORIES: QuestionCategory[] = [
  {
    id: QuestionCategoryId.Relative,
    name: 'Relative',
    description: 'Compares some element of the seekers to the hider',
    cardsDraw: 2,
    cardsKeep: 1,
  },
  {
    id: QuestionCategoryId.Radar,
    name: 'Radar',
    description: 'Checks if the hider is within a radius of the seekers',
    cardsDraw: 3,
    cardsKeep: 1,
  },
  {
    id: QuestionCategoryId.Photos,
    name: 'Photos',
    description: 'Requires the hider to send a photo of their choosing',
    cardsDraw: 2,
    cardsKeep: 1,
  },
  {
    id: QuestionCategoryId.Oddball,
    name: 'Oddball',
    description: 'Requires hider to do something that may reveal incidental info',
    cardsDraw: 2,
    cardsKeep: 1,
  },
  {
    id: QuestionCategoryId.Precision,
    name: 'Precision',
    description: 'Lets seekers narrow down exactly where the hider is',
    cardsDraw: 4,
    cardsKeep: 2,
  },
]

/**
 * Helper function to create an AskedQuestion with current timestamp
 */
export function createAskedQuestion(
  questionId: string,
  categoryId: QuestionCategoryId
): AskedQuestion {
  return {
    questionId,
    categoryId,
    answer: '',
    askedAt: new Date(),
    vetoed: false,
  }
}

/**
 * Get a category by its ID
 */
export function getCategoryById(id: QuestionCategoryId): QuestionCategory | undefined {
  return QUESTION_CATEGORIES.find(c => c.id === id)
}
