/**
 * Seed data for all questions in Jet Lag: Hide and Seek
 *
 * Questions are organized by category and include game size availability.
 * Custom Stillwater questions are marked with isStillwaterCustom: true.
 */

import type { Question } from '../types/question'
import { QuestionCategoryId, GameSize } from '../types/question'

/**
 * All game sizes constant for convenience
 */
const ALL_SIZES: GameSize[] = [GameSize.Small, GameSize.Medium, GameSize.Large]
const MEDIUM_AND_LARGE: GameSize[] = [GameSize.Medium, GameSize.Large]
const LARGE_ONLY: GameSize[] = [GameSize.Large]

/**
 * Matching Questions
 * Format: "Is your nearest _ the same as my nearest _?"
 */
export const MATCHING_QUESTIONS: Question[] = [
  // Transit
  {
    id: 'matching-transit-airport',
    text: 'Is your nearest commercial airport the same as my nearest commercial airport?',
    categoryId: QuestionCategoryId.Matching,
    subcategory: 'transit',
    availableIn: ALL_SIZES,
  },
  {
    id: 'matching-transit-line',
    text: 'Is your nearest transit line the same as my nearest transit line?',
    categoryId: QuestionCategoryId.Matching,
    subcategory: 'transit',
    availableIn: ALL_SIZES,
  },
  {
    id: 'matching-transit-station-name-length',
    text: "Is your nearest station's name length the same as my nearest station's name length?",
    categoryId: QuestionCategoryId.Matching,
    subcategory: 'transit',
    availableIn: ALL_SIZES,
  },
  {
    id: 'matching-transit-street',
    text: 'Is your nearest street or path the same as my nearest street or path?',
    categoryId: QuestionCategoryId.Matching,
    subcategory: 'transit',
    availableIn: ALL_SIZES,
  },

  // Administrative Divisions
  {
    id: 'matching-admin-1st',
    text: 'Is your nearest 1st admin division (state) the same as my nearest 1st admin division?',
    categoryId: QuestionCategoryId.Matching,
    subcategory: 'administrative',
    availableIn: ALL_SIZES,
  },
  {
    id: 'matching-admin-2nd',
    text: 'Is your nearest 2nd admin division (county) the same as my nearest 2nd admin division?',
    categoryId: QuestionCategoryId.Matching,
    subcategory: 'administrative',
    availableIn: ALL_SIZES,
  },
  {
    id: 'matching-admin-3rd',
    text: 'Is your nearest 3rd admin division (city/municipality) the same as my nearest 3rd admin division?',
    categoryId: QuestionCategoryId.Matching,
    subcategory: 'administrative',
    availableIn: ALL_SIZES,
  },
  {
    id: 'matching-admin-4th',
    text: 'Is your nearest 4th admin division (quadrant) the same as my nearest 4th admin division?',
    categoryId: QuestionCategoryId.Matching,
    subcategory: 'administrative',
    availableIn: ALL_SIZES,
    isStillwaterCustom: true,
    instructions: 'Quadrant defined by Husband St (E/W) and McElroy Rd (N/S)',
  },

  // Natural
  {
    id: 'matching-natural-mountain',
    text: 'Is your nearest mountain the same as my nearest mountain?',
    categoryId: QuestionCategoryId.Matching,
    subcategory: 'natural',
    availableIn: ALL_SIZES,
  },
  {
    id: 'matching-natural-landmass',
    text: 'Is your nearest landmass the same as my nearest landmass?',
    categoryId: QuestionCategoryId.Matching,
    subcategory: 'natural',
    availableIn: ALL_SIZES,
  },
  {
    id: 'matching-natural-park',
    text: 'Is your nearest park the same as my nearest park?',
    categoryId: QuestionCategoryId.Matching,
    subcategory: 'natural',
    availableIn: ALL_SIZES,
  },

  // Places of Interest
  {
    id: 'matching-poi-amusement-park',
    text: 'Is your nearest amusement park the same as my nearest amusement park?',
    categoryId: QuestionCategoryId.Matching,
    subcategory: 'places-of-interest',
    availableIn: ALL_SIZES,
  },
  {
    id: 'matching-poi-zoo',
    text: 'Is your nearest zoo the same as my nearest zoo?',
    categoryId: QuestionCategoryId.Matching,
    subcategory: 'places-of-interest',
    availableIn: ALL_SIZES,
  },
  {
    id: 'matching-poi-aquarium',
    text: 'Is your nearest aquarium the same as my nearest aquarium?',
    categoryId: QuestionCategoryId.Matching,
    subcategory: 'places-of-interest',
    availableIn: ALL_SIZES,
  },
  {
    id: 'matching-poi-golf-course',
    text: 'Is your nearest golf course the same as my nearest golf course?',
    categoryId: QuestionCategoryId.Matching,
    subcategory: 'places-of-interest',
    availableIn: ALL_SIZES,
  },
  {
    id: 'matching-poi-museum',
    text: 'Is your nearest museum the same as my nearest museum?',
    categoryId: QuestionCategoryId.Matching,
    subcategory: 'places-of-interest',
    availableIn: ALL_SIZES,
  },
  {
    id: 'matching-poi-movie-theater',
    text: 'Is your nearest movie theater the same as my nearest movie theater?',
    categoryId: QuestionCategoryId.Matching,
    subcategory: 'places-of-interest',
    availableIn: ALL_SIZES,
  },
  {
    id: 'matching-poi-restaurant',
    text: 'Is your nearest restaurant the same as my nearest restaurant?',
    categoryId: QuestionCategoryId.Matching,
    subcategory: 'places-of-interest',
    availableIn: ALL_SIZES,
    isStillwaterCustom: true,
  },

  // Public Utilities
  {
    id: 'matching-utility-hospital',
    text: 'Is your nearest hospital the same as my nearest hospital?',
    categoryId: QuestionCategoryId.Matching,
    subcategory: 'public-utilities',
    availableIn: ALL_SIZES,
  },
  {
    id: 'matching-utility-library',
    text: 'Is your nearest library the same as my nearest library?',
    categoryId: QuestionCategoryId.Matching,
    subcategory: 'public-utilities',
    availableIn: ALL_SIZES,
  },
  {
    id: 'matching-utility-consulate',
    text: 'Is your nearest foreign consulate the same as my nearest foreign consulate?',
    categoryId: QuestionCategoryId.Matching,
    subcategory: 'public-utilities',
    availableIn: ALL_SIZES,
  },
  {
    id: 'matching-utility-school',
    text: 'Is your nearest school the same as my nearest school?',
    categoryId: QuestionCategoryId.Matching,
    subcategory: 'public-utilities',
    availableIn: ALL_SIZES,
    isStillwaterCustom: true,
  },
]

/**
 * Measuring Questions
 * Format: "Compared to me, are you closer to or further from _?"
 */
export const MEASURING_QUESTIONS: Question[] = [
  // Transit
  {
    id: 'measuring-transit-airport',
    text: 'Compared to me, are you closer to or further from a commercial airport?',
    categoryId: QuestionCategoryId.Measuring,
    subcategory: 'transit',
    availableIn: ALL_SIZES,
  },
  {
    id: 'measuring-transit-high-speed-train',
    text: 'Compared to me, are you closer to or further from a high speed train line?',
    categoryId: QuestionCategoryId.Measuring,
    subcategory: 'transit',
    availableIn: ALL_SIZES,
  },
  {
    id: 'measuring-transit-rail-station',
    text: 'Compared to me, are you closer to or further from a rail station?',
    categoryId: QuestionCategoryId.Measuring,
    subcategory: 'transit',
    availableIn: ALL_SIZES,
  },

  // Borders
  {
    id: 'measuring-border-international',
    text: 'Compared to me, are you closer to or further from an international border?',
    categoryId: QuestionCategoryId.Measuring,
    subcategory: 'borders',
    availableIn: ALL_SIZES,
  },
  {
    id: 'measuring-border-1st-admin',
    text: 'Compared to me, are you closer to or further from a 1st admin division border (state)?',
    categoryId: QuestionCategoryId.Measuring,
    subcategory: 'borders',
    availableIn: ALL_SIZES,
  },
  {
    id: 'measuring-border-2nd-admin',
    text: 'Compared to me, are you closer to or further from a 2nd admin division border (county)?',
    categoryId: QuestionCategoryId.Measuring,
    subcategory: 'borders',
    availableIn: ALL_SIZES,
  },

  // Natural
  {
    id: 'measuring-natural-sea-level',
    text: 'Compared to me, are you closer to or further from sea level?',
    categoryId: QuestionCategoryId.Measuring,
    subcategory: 'natural',
    availableIn: ALL_SIZES,
  },
  {
    id: 'measuring-natural-body-of-water',
    text: 'Compared to me, are you closer to or further from a body of water?',
    categoryId: QuestionCategoryId.Measuring,
    subcategory: 'natural',
    availableIn: ALL_SIZES,
  },
  {
    id: 'measuring-natural-coastline',
    text: 'Compared to me, are you closer to or further from a coastline?',
    categoryId: QuestionCategoryId.Measuring,
    subcategory: 'natural',
    availableIn: ALL_SIZES,
  },
  {
    id: 'measuring-natural-mountain',
    text: 'Compared to me, are you closer to or further from a mountain?',
    categoryId: QuestionCategoryId.Measuring,
    subcategory: 'natural',
    availableIn: ALL_SIZES,
  },
  {
    id: 'measuring-natural-park',
    text: 'Compared to me, are you closer to or further from a park?',
    categoryId: QuestionCategoryId.Measuring,
    subcategory: 'natural',
    availableIn: ALL_SIZES,
  },

  // Places of Interest
  {
    id: 'measuring-poi-amusement-park',
    text: 'Compared to me, are you closer to or further from an amusement park?',
    categoryId: QuestionCategoryId.Measuring,
    subcategory: 'places-of-interest',
    availableIn: ALL_SIZES,
  },
  {
    id: 'measuring-poi-zoo',
    text: 'Compared to me, are you closer to or further from a zoo?',
    categoryId: QuestionCategoryId.Measuring,
    subcategory: 'places-of-interest',
    availableIn: ALL_SIZES,
  },
  {
    id: 'measuring-poi-aquarium',
    text: 'Compared to me, are you closer to or further from an aquarium?',
    categoryId: QuestionCategoryId.Measuring,
    subcategory: 'places-of-interest',
    availableIn: ALL_SIZES,
  },
  {
    id: 'measuring-poi-golf-course',
    text: 'Compared to me, are you closer to or further from a golf course?',
    categoryId: QuestionCategoryId.Measuring,
    subcategory: 'places-of-interest',
    availableIn: ALL_SIZES,
  },
  {
    id: 'measuring-poi-museum',
    text: 'Compared to me, are you closer to or further from a museum?',
    categoryId: QuestionCategoryId.Measuring,
    subcategory: 'places-of-interest',
    availableIn: ALL_SIZES,
  },
  {
    id: 'measuring-poi-movie-theater',
    text: 'Compared to me, are you closer to or further from a movie theater?',
    categoryId: QuestionCategoryId.Measuring,
    subcategory: 'places-of-interest',
    availableIn: ALL_SIZES,
  },

  // Public Utilities
  {
    id: 'measuring-utility-hospital',
    text: 'Compared to me, are you closer to or further from a hospital?',
    categoryId: QuestionCategoryId.Measuring,
    subcategory: 'public-utilities',
    availableIn: ALL_SIZES,
  },
  {
    id: 'measuring-utility-library',
    text: 'Compared to me, are you closer to or further from a library?',
    categoryId: QuestionCategoryId.Measuring,
    subcategory: 'public-utilities',
    availableIn: ALL_SIZES,
  },
  {
    id: 'measuring-utility-consulate',
    text: 'Compared to me, are you closer to or further from a foreign consulate?',
    categoryId: QuestionCategoryId.Measuring,
    subcategory: 'public-utilities',
    availableIn: ALL_SIZES,
  },
]

/**
 * Radar Questions
 * Format: "Are you within _ of me?"
 */
export const RADAR_QUESTIONS: Question[] = [
  {
    id: 'radar-0.2-miles',
    text: 'Are you within 0.2 miles of me?',
    categoryId: QuestionCategoryId.Radar,
    subcategory: 'distance',
    availableIn: ALL_SIZES,
    instructions: 'Tweaked from original (Google Maps doesn\'t do 100ths)',
  },
  {
    id: 'radar-0.5-miles',
    text: 'Are you within 0.5 miles of me?',
    categoryId: QuestionCategoryId.Radar,
    subcategory: 'distance',
    availableIn: ALL_SIZES,
  },
  {
    id: 'radar-1-mile',
    text: 'Are you within 1 mile of me?',
    categoryId: QuestionCategoryId.Radar,
    subcategory: 'distance',
    availableIn: ALL_SIZES,
  },
  {
    id: 'radar-3-miles',
    text: 'Are you within 3 miles of me?',
    categoryId: QuestionCategoryId.Radar,
    subcategory: 'distance',
    availableIn: ALL_SIZES,
  },
  {
    id: 'radar-5-miles',
    text: 'Are you within 5 miles of me?',
    categoryId: QuestionCategoryId.Radar,
    subcategory: 'distance',
    availableIn: ALL_SIZES,
  },
  {
    id: 'radar-10-miles',
    text: 'Are you within 10 miles of me?',
    categoryId: QuestionCategoryId.Radar,
    subcategory: 'distance',
    availableIn: ALL_SIZES,
  },
  {
    id: 'radar-25-miles',
    text: 'Are you within 25 miles of me?',
    categoryId: QuestionCategoryId.Radar,
    subcategory: 'distance',
    availableIn: ALL_SIZES,
  },
  {
    id: 'radar-50-miles',
    text: 'Are you within 50 miles of me?',
    categoryId: QuestionCategoryId.Radar,
    subcategory: 'distance',
    availableIn: ALL_SIZES,
  },
  {
    id: 'radar-100-miles',
    text: 'Are you within 100 miles of me?',
    categoryId: QuestionCategoryId.Radar,
    subcategory: 'distance',
    availableIn: ALL_SIZES,
  },
  {
    id: 'radar-custom',
    text: 'Are you within [custom distance] of me?',
    categoryId: QuestionCategoryId.Radar,
    subcategory: 'distance',
    availableIn: ALL_SIZES,
    instructions: 'Seekers choose the distance',
  },
]

/**
 * Thermometer Questions
 * Format: "After traveling _, am I hotter or colder?"
 */
export const THERMOMETER_QUESTIONS: Question[] = [
  {
    id: 'thermometer-0.2-miles',
    text: 'After traveling 0.2 miles, am I hotter or colder?',
    categoryId: QuestionCategoryId.Thermometer,
    subcategory: 'distance',
    availableIn: ALL_SIZES,
    isStillwaterCustom: true,
  },
  {
    id: 'thermometer-0.5-miles',
    text: 'After traveling 0.5 miles, am I hotter or colder?',
    categoryId: QuestionCategoryId.Thermometer,
    subcategory: 'distance',
    availableIn: ALL_SIZES,
  },
  {
    id: 'thermometer-3-miles',
    text: 'After traveling 3 miles, am I hotter or colder?',
    categoryId: QuestionCategoryId.Thermometer,
    subcategory: 'distance',
    availableIn: ALL_SIZES,
  },
  {
    id: 'thermometer-10-miles',
    text: 'After traveling 10 miles, am I hotter or colder?',
    categoryId: QuestionCategoryId.Thermometer,
    subcategory: 'distance',
    availableIn: MEDIUM_AND_LARGE,
  },
  {
    id: 'thermometer-50-miles',
    text: 'After traveling 50 miles, am I hotter or colder?',
    categoryId: QuestionCategoryId.Thermometer,
    subcategory: 'distance',
    availableIn: LARGE_ONLY,
  },
]

/**
 * Photo Questions
 * Format: "Send us a photo of _"
 */
export const PHOTO_QUESTIONS: Question[] = [
  // All game sizes
  {
    id: 'photo-tree',
    text: 'Send us a photo of a tree',
    categoryId: QuestionCategoryId.Photo,
    subcategory: 'general',
    availableIn: ALL_SIZES,
    instructions: 'Must include entire tree',
  },
  {
    id: 'photo-sky',
    text: 'Send us a photo of the sky',
    categoryId: QuestionCategoryId.Photo,
    subcategory: 'general',
    availableIn: ALL_SIZES,
    instructions: 'Place phone on ground and shoot directly up',
  },
  {
    id: 'photo-selfie',
    text: 'Send us a photo of you',
    categoryId: QuestionCategoryId.Photo,
    subcategory: 'general',
    availableIn: ALL_SIZES,
    instructions: 'Selfie mode, arm parallel to the ground, fully extended',
  },
  {
    id: 'photo-widest-street',
    text: 'Send us a photo of the widest street',
    categoryId: QuestionCategoryId.Photo,
    subcategory: 'general',
    availableIn: ALL_SIZES,
    instructions: 'Must include both sides of the street',
  },
  {
    id: 'photo-tallest-structure',
    text: 'Send us a photo of the tallest structure in your sightline',
    categoryId: QuestionCategoryId.Photo,
    subcategory: 'general',
    availableIn: ALL_SIZES,
    instructions: 'Tallest from your current perspective/sightline. Must include top and both sides. The top must be in the top 1/2 of the frame',
  },
  {
    id: 'photo-any-building-from-station',
    text: 'Send us a photo of any building visible from station',
    categoryId: QuestionCategoryId.Photo,
    subcategory: 'general',
    availableIn: ALL_SIZES,
    instructions: 'Must stand directly outside transit station entrance. If multiple entrances, you may choose. Must include roof, both sides, with the top of building in top 1/2 of frame',
  },

  // Medium and Large game sizes
  {
    id: 'photo-tallest-building-from-station',
    text: 'Send us a photo of the tallest building visible from station',
    categoryId: QuestionCategoryId.Photo,
    subcategory: 'general',
    availableIn: MEDIUM_AND_LARGE,
    instructions: 'Tallest from your perspective/sightline. Must stand directly outside transit station entrance. If multiple entrances, you may choose. Must include roof, both sides, with the top of building in top 1/2 of frame',
  },
  {
    id: 'photo-trace-street',
    text: 'Send us a photo of trace nearest street/path',
    categoryId: QuestionCategoryId.Photo,
    subcategory: 'general',
    availableIn: MEDIUM_AND_LARGE,
    instructions: 'Street/path must be visible on mapping app. Trace intersection to intersection',
  },
  {
    id: 'photo-two-buildings',
    text: 'Send us a photo of two buildings',
    categoryId: QuestionCategoryId.Photo,
    subcategory: 'general',
    availableIn: MEDIUM_AND_LARGE,
    instructions: 'Must include bottom and up to four stories',
  },
  {
    id: 'photo-restaurant-interior',
    text: 'Send us a photo of a restaurant interior',
    categoryId: QuestionCategoryId.Photo,
    subcategory: 'general',
    availableIn: MEDIUM_AND_LARGE,
    instructions: 'No zoom. Must take the picture through the window from outside the restaurant',
  },
  {
    id: 'photo-train-platform',
    text: 'Send us a photo of a train platform',
    categoryId: QuestionCategoryId.Photo,
    subcategory: 'general',
    availableIn: MEDIUM_AND_LARGE,
    instructions: 'Must include a 5\' x 5\' section with three distinct elements',
  },
  {
    id: 'photo-park',
    text: 'Send us a photo of a park',
    categoryId: QuestionCategoryId.Photo,
    subcategory: 'general',
    availableIn: MEDIUM_AND_LARGE,
    instructions: 'No zoom, phone perpendicular to ground. Must stand 5\' from any obstruction',
  },
  {
    id: 'photo-grocery-aisle',
    text: 'Send us a photo of a grocery store aisle',
    categoryId: QuestionCategoryId.Photo,
    subcategory: 'general',
    availableIn: MEDIUM_AND_LARGE,
    instructions: 'No zoom. Stand at the end of the aisle. Shoot directly down aisle',
  },
  {
    id: 'photo-place-of-worship',
    text: 'Send us a photo of a place of worship',
    categoryId: QuestionCategoryId.Photo,
    subcategory: 'general',
    availableIn: MEDIUM_AND_LARGE,
    instructions: 'Must include a 5\' x 5\' section with three distinct elements',
  },

  // Large game size only
  {
    id: 'photo-half-mile-streets',
    text: 'Send us a photo of 1/2 mile of streets traced',
    categoryId: QuestionCategoryId.Photo,
    subcategory: 'general',
    availableIn: LARGE_ONLY,
    instructions: 'Must be continuous, including 5 turns, no doubling back. Send N-S oriented. Streets must appear on mapping app',
  },
  {
    id: 'photo-tallest-mountain-from-station',
    text: 'Send us a photo of the tallest mountain visible from station',
    categoryId: QuestionCategoryId.Photo,
    subcategory: 'general',
    availableIn: LARGE_ONLY,
    instructions: 'Tallest from your perspective/sightline. Max 3x zoom. Top of mountain must be in top 1/2 of frame',
  },
  {
    id: 'photo-biggest-body-of-water',
    text: 'Send us a photo of the biggest body of water in your hiding zone',
    categoryId: QuestionCategoryId.Photo,
    subcategory: 'general',
    availableIn: LARGE_ONLY,
    instructions: 'Max 3x zoom. Must include either both sides of body of water or the horizon',
  },
  {
    id: 'photo-five-buildings',
    text: 'Send us a photo of five buildings',
    categoryId: QuestionCategoryId.Photo,
    subcategory: 'general',
    availableIn: LARGE_ONLY,
    instructions: 'Must include bottom & up to four stories',
  },
]

/**
 * Tentacle Questions
 * Format: "Within _ of me, which _ are you nearest to? (You must also be within _)"
 */
export const TENTACLE_QUESTIONS: Question[] = [
  // Medium and Large (1 mile distance)
  {
    id: 'tentacle-1mi-museums',
    text: 'Within 1 mile of me, which museum are you nearest to? (You must also be within 1 mile)',
    categoryId: QuestionCategoryId.Tentacle,
    subcategory: 'places-of-interest',
    availableIn: MEDIUM_AND_LARGE,
    instructions: 'If hider is not within 1 mile of any museum, they answer that they are not within the distance',
  },
  {
    id: 'tentacle-1mi-libraries',
    text: 'Within 1 mile of me, which library are you nearest to? (You must also be within 1 mile)',
    categoryId: QuestionCategoryId.Tentacle,
    subcategory: 'public-utilities',
    availableIn: MEDIUM_AND_LARGE,
    instructions: 'If hider is not within 1 mile of any library, they answer that they are not within the distance',
  },
  {
    id: 'tentacle-1mi-movie-theaters',
    text: 'Within 1 mile of me, which movie theater are you nearest to? (You must also be within 1 mile)',
    categoryId: QuestionCategoryId.Tentacle,
    subcategory: 'places-of-interest',
    availableIn: MEDIUM_AND_LARGE,
    instructions: 'If hider is not within 1 mile of any movie theater, they answer that they are not within the distance',
  },
  {
    id: 'tentacle-1mi-hospitals',
    text: 'Within 1 mile of me, which hospital are you nearest to? (You must also be within 1 mile)',
    categoryId: QuestionCategoryId.Tentacle,
    subcategory: 'public-utilities',
    availableIn: MEDIUM_AND_LARGE,
    instructions: 'If hider is not within 1 mile of any hospital, they answer that they are not within the distance',
  },

  // Large only (15 miles distance)
  {
    id: 'tentacle-15mi-metro-lines',
    text: 'Within 15 miles of me, which metro line are you nearest to? (You must also be within 15 miles)',
    categoryId: QuestionCategoryId.Tentacle,
    subcategory: 'transit',
    availableIn: LARGE_ONLY,
    instructions: 'If hider is not within 15 miles of any metro line, they answer that they are not within the distance',
  },
  {
    id: 'tentacle-15mi-zoos',
    text: 'Within 15 miles of me, which zoo are you nearest to? (You must also be within 15 miles)',
    categoryId: QuestionCategoryId.Tentacle,
    subcategory: 'places-of-interest',
    availableIn: LARGE_ONLY,
    instructions: 'If hider is not within 15 miles of any zoo, they answer that they are not within the distance',
  },
  {
    id: 'tentacle-15mi-aquariums',
    text: 'Within 15 miles of me, which aquarium are you nearest to? (You must also be within 15 miles)',
    categoryId: QuestionCategoryId.Tentacle,
    subcategory: 'places-of-interest',
    availableIn: LARGE_ONLY,
    instructions: 'If hider is not within 15 miles of any aquarium, they answer that they are not within the distance',
  },
  {
    id: 'tentacle-15mi-amusement-parks',
    text: 'Within 15 miles of me, which amusement park are you nearest to? (You must also be within 15 miles)',
    categoryId: QuestionCategoryId.Tentacle,
    subcategory: 'places-of-interest',
    availableIn: LARGE_ONLY,
    instructions: 'If hider is not within 15 miles of any amusement park, they answer that they are not within the distance',
  },
]

/**
 * All questions combined
 */
export const ALL_QUESTIONS: Question[] = [
  ...MATCHING_QUESTIONS,
  ...MEASURING_QUESTIONS,
  ...RADAR_QUESTIONS,
  ...THERMOMETER_QUESTIONS,
  ...PHOTO_QUESTIONS,
  ...TENTACLE_QUESTIONS,
]

/**
 * Get all questions for a specific game size
 */
export function getQuestionsForGameSize(gameSize: GameSize): Question[] {
  return ALL_QUESTIONS.filter(q => q.availableIn.includes(gameSize))
}

/**
 * Get questions by category
 */
export function getQuestionsByCategory(categoryId: QuestionCategoryId): Question[] {
  return ALL_QUESTIONS.filter(q => q.categoryId === categoryId)
}

/**
 * Get questions by category and game size
 */
export function getQuestionsByCategoryAndGameSize(
  categoryId: QuestionCategoryId,
  gameSize: GameSize
): Question[] {
  return ALL_QUESTIONS.filter(
    q => q.categoryId === categoryId && q.availableIn.includes(gameSize)
  )
}

/**
 * Get Stillwater custom questions only
 */
export function getStillwaterCustomQuestions(): Question[] {
  return ALL_QUESTIONS.filter(q => q.isStillwaterCustom)
}

/**
 * Get question by ID
 */
export function getQuestionById(id: string): Question | undefined {
  return ALL_QUESTIONS.find(q => q.id === id)
}
