/**
 * Design System: Color Tokens
 *
 * This module defines all colors used in the Jet Lag Stillwater app.
 * Colors are sourced from:
 * - Official Jet Lag branding (logo palette)
 * - Jet Lag: Hide and Seek Nebula show (question category colors)
 *
 * See RESEARCH_NOTES.md for design research and color sources.
 */

import { QuestionCategoryId } from '@/types/question'
import { CardType } from '@/types/card'

/**
 * Official Jet Lag brand colors from the logo.
 * Pentagon/shield shape with airplane silhouette, radiating gradient stripes.
 */
export const BRAND_COLORS = {
  /** Dark navy - Background, airplane silhouette */
  navy: '#1a1a2e',
  /** Deep red - Inner gradient stripe */
  red: '#c73e3e',
  /** Vibrant orange - Middle gradient stripe */
  orange: '#f07d2e',
  /** Golden yellow - Outer gradient stripe */
  gold: '#f5b830',
  /** Cyan glow - Radiating light effect, accents */
  cyan: '#00aaff',
} as const

/**
 * Question category colors from the Nebula show UI.
 * Each category has a distinct color for quick visual identification.
 *
 * Note: Some colors are adjusted from the original show values to meet
 * WCAG 2.1 AA contrast requirements (3:1 minimum for large text).
 */
export const CATEGORY_COLORS = {
  /** Matching - Dark Navy Blue */
  matching: '#1e3a5f',
  /** Measuring - Green */
  measuring: '#2d8a4e',
  /** Radar - Orange */
  radar: '#e07830',
  /** Thermometer - Yellow/Gold (darkened from #d4a012 for contrast) */
  thermometer: '#b38b0f',
  /** Tentacles - Purple */
  tentacle: '#7b4d9e',
  /** Photo - Light Blue/Cyan (darkened from #5ba4c9 for contrast) */
  photo: '#3d8ab3',
} as const

/**
 * Card type colors for visual distinction in the hider's hand.
 * Each card type has background, border, and text color variants.
 */
export const CARD_TYPE_COLORS = {
  /** Time Bonus - Green (nature, growth, bonus time) */
  timeBonus: {
    bg: '#dcfce7', // green-100 equivalent
    border: '#86efac', // green-300 equivalent
    text: '#166534', // green-800 equivalent
    accent: '#22c55e', // green-500 equivalent
  },
  /** Powerup - Cyan (energy, power, action) */
  powerup: {
    bg: '#cffafe', // cyan-100 equivalent
    border: '#67e8f9', // cyan-300 equivalent
    text: '#155e75', // cyan-800 equivalent
    accent: '#06b6d4', // cyan-500 equivalent
  },
  /** Curse - Purple (mystery, magic, restriction) */
  curse: {
    bg: '#f3e8ff', // purple-100 equivalent
    border: '#d8b4fe', // purple-300 equivalent
    text: '#6b21a8', // purple-800 equivalent
    accent: '#a855f7', // purple-500 equivalent
  },
  /** Time Trap - Orange (warning, trap, danger) */
  timeTrap: {
    bg: '#ffedd5', // orange-100 equivalent
    border: '#fdba74', // orange-300 equivalent
    text: '#9a3412', // orange-800 equivalent
    accent: '#f97316', // orange-500 equivalent
  },
} as const

/**
 * Get the category color for a given question category ID.
 * @param categoryId - The question category ID
 * @returns The hex color for the category
 */
export function getCategoryColor(categoryId: QuestionCategoryId): string {
  return CATEGORY_COLORS[categoryId]
}

/**
 * Get the card type color object for a given card type.
 * @param cardType - The card type
 * @returns The color object with bg, border, text, and accent colors
 */
export function getCardTypeColor(cardType: CardType): (typeof CARD_TYPE_COLORS)[keyof typeof CARD_TYPE_COLORS] {
  switch (cardType) {
    case CardType.TimeBonus:
      return CARD_TYPE_COLORS.timeBonus
    case CardType.Powerup:
      return CARD_TYPE_COLORS.powerup
    case CardType.Curse:
      return CARD_TYPE_COLORS.curse
    case CardType.TimeTrap:
      return CARD_TYPE_COLORS.timeTrap
    default:
      return CARD_TYPE_COLORS.powerup // fallback
  }
}

/**
 * CSS custom property names for category colors.
 * These are used in Tailwind CSS to create utility classes.
 */
export const CATEGORY_CSS_VARS = {
  matching: '--color-category-matching',
  measuring: '--color-category-measuring',
  radar: '--color-category-radar',
  thermometer: '--color-category-thermometer',
  tentacle: '--color-category-tentacle',
  photo: '--color-category-photo',
} as const

/**
 * Type for category color keys
 */
export type CategoryColorKey = keyof typeof CATEGORY_COLORS

/**
 * Type for card type color keys
 */
export type CardTypeColorKey = keyof typeof CARD_TYPE_COLORS
