/**
 * Question data model types for Jet Lag: Hide and Seek
 *
 * Based on the official game rules with six question categories.
 * Each category has different draw/keep values representing
 * how many cards the hider draws when a question is answered.
 */

/**
 * Game size affects which questions are available and response times
 */
export enum GameSize {
  Small = 'small',
  Medium = 'medium',
  Large = 'large',
}

/**
 * Enum for question category identifiers (official rulebook names)
 */
export enum QuestionCategoryId {
  Matching = 'matching',
  Measuring = 'measuring',
  Radar = 'radar',
  Thermometer = 'thermometer',
  Photo = 'photo',
  Tentacle = 'tentacle',
}

/**
 * Question category definition
 */
export interface QuestionCategory {
  /** Unique identifier for the category */
  id: QuestionCategoryId
  /** Display name */
  name: string
  /** Question format template */
  format: string
  /** Description of what types of questions are in this category */
  description: string
  /** How many cards the hider draws when this question is answered */
  cardsDraw: number
  /** How many cards the hider keeps from those drawn */
  cardsKeep: number
  /** Response time in minutes (may vary by game size for Photo) */
  responseTimeMinutes: number | { small: number; medium: number; large: number }
  /** Which game sizes this category is available for */
  availableIn: GameSize[]
}

/**
 * Subcategory for organizing questions within a category
 */
export type QuestionSubcategory =
  | 'transit'
  | 'administrative'
  | 'natural'
  | 'places-of-interest'
  | 'public-utilities'
  | 'borders'
  | 'distance'
  | 'general'

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
  /** Subcategory for organization */
  subcategory?: QuestionSubcategory
  /** Which game sizes this question is available for */
  availableIn: GameSize[]
  /** Whether this is a custom question for Stillwater */
  isStillwaterCustom?: boolean
  /** Additional instructions or rules for this question */
  instructions?: string
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
 * Values from official Jet Lag: Hide and Seek rulebook.
 */
export const QUESTION_CATEGORIES: QuestionCategory[] = [
  {
    id: QuestionCategoryId.Matching,
    name: 'Matching',
    format: 'Is your nearest _ the same as my nearest _?',
    description: 'Compares whether the hider and seekers share the same nearest location of a type',
    cardsDraw: 3,
    cardsKeep: 1,
    responseTimeMinutes: 5,
    availableIn: [GameSize.Small, GameSize.Medium, GameSize.Large],
  },
  {
    id: QuestionCategoryId.Measuring,
    name: 'Measuring',
    format: 'Compared to me, are you closer to or further from _?',
    description: 'Determines relative distance between hider and seekers to a landmark',
    cardsDraw: 3,
    cardsKeep: 1,
    responseTimeMinutes: 5,
    availableIn: [GameSize.Small, GameSize.Medium, GameSize.Large],
  },
  {
    id: QuestionCategoryId.Radar,
    name: 'Radar',
    format: 'Are you within _ of me?',
    description: 'Checks if the hider is within a specific distance of the seekers',
    cardsDraw: 2,
    cardsKeep: 1,
    responseTimeMinutes: 5,
    availableIn: [GameSize.Small, GameSize.Medium, GameSize.Large],
  },
  {
    id: QuestionCategoryId.Thermometer,
    name: 'Thermometer',
    format: 'After traveling _, am I hotter or colder?',
    description: 'Seekers travel a distance and learn if they got closer or further from hider',
    cardsDraw: 2,
    cardsKeep: 1,
    responseTimeMinutes: 5,
    availableIn: [GameSize.Small, GameSize.Medium, GameSize.Large],
  },
  {
    id: QuestionCategoryId.Photo,
    name: 'Photo',
    format: 'Send us a photo of _',
    description: 'Requires the hider to send a photo that may reveal location information',
    cardsDraw: 1,
    cardsKeep: 1,
    responseTimeMinutes: { small: 10, medium: 10, large: 20 },
    availableIn: [GameSize.Small, GameSize.Medium, GameSize.Large],
  },
  {
    id: QuestionCategoryId.Tentacle,
    name: 'Tentacle',
    format: 'Of all the [location type] within [distance] of me, which are you closest to?',
    description: 'Identifies which specific location the hider is nearest to. Hider must be within [distance] of seekers to answer.',
    cardsDraw: 4,
    cardsKeep: 2,
    responseTimeMinutes: 5,
    availableIn: [GameSize.Medium, GameSize.Large],
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

/**
 * Get the response time for a category based on game size
 */
export function getResponseTime(category: QuestionCategory, gameSize: GameSize): number {
  if (typeof category.responseTimeMinutes === 'number') {
    return category.responseTimeMinutes
  }
  return category.responseTimeMinutes[gameSize]
}

/**
 * Check if a category is available for a given game size
 */
export function isCategoryAvailable(category: QuestionCategory, gameSize: GameSize): boolean {
  return category.availableIn.includes(gameSize)
}

/**
 * Get all categories available for a given game size
 */
export function getCategoriesForGameSize(gameSize: GameSize): QuestionCategory[] {
  return QUESTION_CATEGORIES.filter(c => c.availableIn.includes(gameSize))
}
