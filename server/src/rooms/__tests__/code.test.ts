import { describe, it, expect } from 'vitest'
import { CODE_ALPHABET, generateCode, isValidCode } from '../code.js'

describe('room code alphabet', () => {
  it('excludes ambiguous characters 0 O 1 I L', () => {
    for (const ch of ['0', 'O', '1', 'I', 'L']) {
      expect(CODE_ALPHABET).not.toContain(ch)
    }
  })

  it('is uppercase Crockford-style (no lowercase)', () => {
    expect(CODE_ALPHABET).toBe(CODE_ALPHABET.toUpperCase())
  })
})

describe('generateCode', () => {
  it('defaults to length 4', () => {
    expect(generateCode()).toHaveLength(4)
  })

  it('honors a requested length', () => {
    expect(generateCode(6)).toHaveLength(6)
  })

  it('only uses characters from the alphabet', () => {
    for (let i = 0; i < 200; i++) {
      for (const ch of generateCode()) {
        expect(CODE_ALPHABET).toContain(ch)
      }
    }
  })

  it('produces varied codes (not constant)', () => {
    const codes = new Set(Array.from({ length: 50 }, () => generateCode()))
    expect(codes.size).toBeGreaterThan(1)
  })
})

describe('isValidCode', () => {
  it('accepts a well-formed code', () => {
    expect(isValidCode('ABCD')).toBe(true)
  })

  it('rejects codes containing excluded characters', () => {
    expect(isValidCode('A0CD')).toBe(false)
    expect(isValidCode('AILO')).toBe(false)
  })

  it('rejects empty or wrong-shaped input', () => {
    expect(isValidCode('')).toBe(false)
    expect(isValidCode('ab')).toBe(false) // lowercase
  })

  it('is case-insensitive on input but validates against the alphabet', () => {
    expect(isValidCode('abcd', { caseInsensitive: true })).toBe(true)
  })
})
