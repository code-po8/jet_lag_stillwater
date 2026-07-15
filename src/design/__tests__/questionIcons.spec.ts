import { describe, it, expect } from 'vitest'
import { getQuestionRangeBadge } from '../questionIcons'

describe('getQuestionRangeBadge (issue #26)', () => {
  it('returns the distance for radar questions', () => {
    expect(getQuestionRangeBadge('radar-0.5-miles')).toBe('0.5')
    expect(getQuestionRangeBadge('radar-25-miles')).toBe('25')
    expect(getQuestionRangeBadge('radar-0.2-miles')).toBe('0.2')
    expect(getQuestionRangeBadge('radar-100-miles')).toBe('100')
  })

  it('returns the distance for thermometer questions', () => {
    expect(getQuestionRangeBadge('thermometer-0.2-miles')).toBe('0.2')
    expect(getQuestionRangeBadge('thermometer-3-miles')).toBe('3')
    expect(getQuestionRangeBadge('thermometer-50-miles')).toBe('50')
  })

  it('returns the distance for tentacle questions (e.g. 1mi / 15mi)', () => {
    expect(getQuestionRangeBadge('tentacle-1mi-museums')).toBe('1')
    expect(getQuestionRangeBadge('tentacle-15mi-zoos')).toBe('15')
  })

  it('returns null for questions with no meaningful range (they are already distinct)', () => {
    expect(getQuestionRangeBadge('matching-transit-airport')).toBeNull()
    expect(getQuestionRangeBadge('photo-tree')).toBeNull()
    expect(getQuestionRangeBadge('radar-custom')).toBeNull()
  })

  it('returns null for an unknown id', () => {
    expect(getQuestionRangeBadge('does-not-exist')).toBeNull()
  })
})
