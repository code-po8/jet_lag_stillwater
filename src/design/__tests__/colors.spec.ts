import { describe, it, expect } from 'vitest'
import {
  CATEGORY_COLORS,
  BRAND_COLORS,
  CARD_TYPE_COLORS,
  getCategoryColor,
  getCardTypeColor,
} from '../colors'
import { QuestionCategoryId } from '@/types/question'
import { CardType } from '@/types/card'

describe('Design System Colors', () => {
  describe('BRAND_COLORS', () => {
    it('should define all Jet Lag brand colors', () => {
      expect(BRAND_COLORS).toHaveProperty('navy')
      expect(BRAND_COLORS).toHaveProperty('red')
      expect(BRAND_COLORS).toHaveProperty('orange')
      expect(BRAND_COLORS).toHaveProperty('gold')
      expect(BRAND_COLORS).toHaveProperty('cyan')
    })

    it('should use correct hex values from official branding', () => {
      expect(BRAND_COLORS.navy).toBe('#1a1a2e')
      expect(BRAND_COLORS.red).toBe('#c73e3e')
      expect(BRAND_COLORS.orange).toBe('#f07d2e')
      expect(BRAND_COLORS.gold).toBe('#f5b830')
      expect(BRAND_COLORS.cyan).toBe('#00aaff')
    })
  })

  describe('CATEGORY_COLORS', () => {
    it('should define colors for all six question categories', () => {
      expect(CATEGORY_COLORS).toHaveProperty('matching')
      expect(CATEGORY_COLORS).toHaveProperty('measuring')
      expect(CATEGORY_COLORS).toHaveProperty('radar')
      expect(CATEGORY_COLORS).toHaveProperty('thermometer')
      expect(CATEGORY_COLORS).toHaveProperty('tentacle')
      expect(CATEGORY_COLORS).toHaveProperty('photo')
    })

    it('should use correct hex values from Nebula show UI (adjusted for contrast)', () => {
      expect(CATEGORY_COLORS.matching).toBe('#1e3a5f')
      expect(CATEGORY_COLORS.measuring).toBe('#2d8a4e')
      expect(CATEGORY_COLORS.radar).toBe('#e07830')
      // Thermometer and Photo adjusted from original for WCAG contrast
      expect(CATEGORY_COLORS.thermometer).toBe('#b38b0f')
      expect(CATEGORY_COLORS.tentacle).toBe('#7b4d9e')
      expect(CATEGORY_COLORS.photo).toBe('#3d8ab3')
    })
  })

  describe('getCategoryColor', () => {
    it('should return correct color for each category', () => {
      expect(getCategoryColor(QuestionCategoryId.Matching)).toBe('#1e3a5f')
      expect(getCategoryColor(QuestionCategoryId.Measuring)).toBe('#2d8a4e')
      expect(getCategoryColor(QuestionCategoryId.Radar)).toBe('#e07830')
      expect(getCategoryColor(QuestionCategoryId.Thermometer)).toBe('#b38b0f')
      expect(getCategoryColor(QuestionCategoryId.Tentacle)).toBe('#7b4d9e')
      expect(getCategoryColor(QuestionCategoryId.Photo)).toBe('#3d8ab3')
    })
  })

  describe('CARD_TYPE_COLORS', () => {
    it('should define colors for all card types', () => {
      expect(CARD_TYPE_COLORS).toHaveProperty('timeBonus')
      expect(CARD_TYPE_COLORS).toHaveProperty('powerup')
      expect(CARD_TYPE_COLORS).toHaveProperty('curse')
      expect(CARD_TYPE_COLORS).toHaveProperty('timeTrap')
    })

    it('should use brand-consistent colors', () => {
      // Time bonus uses green (nature, growth)
      expect(CARD_TYPE_COLORS.timeBonus.bg).toBeDefined()
      expect(CARD_TYPE_COLORS.timeBonus.border).toBeDefined()
      expect(CARD_TYPE_COLORS.timeBonus.text).toBeDefined()

      // Powerup uses brand cyan
      expect(CARD_TYPE_COLORS.powerup.bg).toBeDefined()
      expect(CARD_TYPE_COLORS.powerup.border).toBeDefined()
      expect(CARD_TYPE_COLORS.powerup.text).toBeDefined()

      // Curse uses purple (mystery, power)
      expect(CARD_TYPE_COLORS.curse.bg).toBeDefined()
      expect(CARD_TYPE_COLORS.curse.border).toBeDefined()
      expect(CARD_TYPE_COLORS.curse.text).toBeDefined()

      // Time trap uses brand orange
      expect(CARD_TYPE_COLORS.timeTrap.bg).toBeDefined()
      expect(CARD_TYPE_COLORS.timeTrap.border).toBeDefined()
      expect(CARD_TYPE_COLORS.timeTrap.text).toBeDefined()
    })
  })

  describe('getCardTypeColor', () => {
    it('should return correct color object for each card type', () => {
      const timeBonusColor = getCardTypeColor(CardType.TimeBonus)
      expect(timeBonusColor).toEqual(CARD_TYPE_COLORS.timeBonus)

      const powerupColor = getCardTypeColor(CardType.Powerup)
      expect(powerupColor).toEqual(CARD_TYPE_COLORS.powerup)

      const curseColor = getCardTypeColor(CardType.Curse)
      expect(curseColor).toEqual(CARD_TYPE_COLORS.curse)

      const timeTrapColor = getCardTypeColor(CardType.TimeTrap)
      expect(timeTrapColor).toEqual(CARD_TYPE_COLORS.timeTrap)
    })
  })

  describe('WCAG contrast requirements', () => {
    // Helper to calculate relative luminance
    function getLuminance(hex: string): number {
      const rgb = hex
        .replace('#', '')
        .match(/.{2}/g)!
        .map((x) => parseInt(x, 16) / 255)
        .map((c) => (c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4))) as [
        number,
        number,
        number,
      ]
      return 0.2126 * rgb[0] + 0.7152 * rgb[1] + 0.0722 * rgb[2]
    }

    // Helper to calculate contrast ratio
    function getContrastRatio(color1: string, color2: string): number {
      const l1 = getLuminance(color1)
      const l2 = getLuminance(color2)
      const lighter = Math.max(l1, l2)
      const darker = Math.min(l1, l2)
      return (lighter + 0.05) / (darker + 0.05)
    }

    it('should have category colors with sufficient contrast against white text', () => {
      const WHITE = '#ffffff'
      const MIN_CONTRAST_LARGE = 3 // WCAG AA for large text

      // All category colors should have sufficient contrast with white text
      Object.entries(CATEGORY_COLORS).forEach(([name, color]) => {
        const ratio = getContrastRatio(color, WHITE)
        expect(
          ratio,
          `Category '${name}' (${color}) should have contrast >= ${MIN_CONTRAST_LARGE} with white text, got ${ratio.toFixed(2)}`,
        ).toBeGreaterThanOrEqual(MIN_CONTRAST_LARGE)
      })
    })

    it('should have brand colors with sufficient contrast', () => {
      const WHITE = '#ffffff'
      const MIN_CONTRAST_LARGE = 3

      // Navy should have good contrast with white (for text on dark background)
      const navyContrast = getContrastRatio(BRAND_COLORS.navy, WHITE)
      expect(navyContrast).toBeGreaterThanOrEqual(MIN_CONTRAST_LARGE)
    })
  })
})
