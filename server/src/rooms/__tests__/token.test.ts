import { describe, it, expect } from 'vitest'
import { generateRejoinToken, hashToken, verifyToken } from '../token.js'

describe('generateRejoinToken', () => {
  it('returns a raw token and its hash', () => {
    const { raw, hash } = generateRejoinToken()
    expect(typeof raw).toBe('string')
    expect(typeof hash).toBe('string')
    expect(raw.length).toBeGreaterThan(0)
  })

  it('encodes 32 bytes of randomness (64 hex chars)', () => {
    const { raw } = generateRejoinToken()
    expect(raw).toMatch(/^[0-9a-f]{64}$/)
  })

  it('produces a unique token each call', () => {
    const tokens = new Set(Array.from({ length: 100 }, () => generateRejoinToken().raw))
    expect(tokens.size).toBe(100)
  })

  it('stores only the hash, never the raw token (hash differs from raw)', () => {
    const { raw, hash } = generateRejoinToken()
    expect(hash).not.toBe(raw)
    expect(hash).toBe(hashToken(raw))
  })
})

describe('hashToken', () => {
  it('is a SHA-256 hex digest (64 chars)', () => {
    expect(hashToken('anything')).toMatch(/^[0-9a-f]{64}$/)
  })

  it('is deterministic', () => {
    expect(hashToken('abc')).toBe(hashToken('abc'))
  })

  it('differs for different inputs', () => {
    expect(hashToken('abc')).not.toBe(hashToken('abd'))
  })
})

describe('verifyToken', () => {
  it('accepts a raw token matching the stored hash', () => {
    const { raw, hash } = generateRejoinToken()
    expect(verifyToken(raw, hash)).toBe(true)
  })

  it('rejects a wrong token', () => {
    const { hash } = generateRejoinToken()
    expect(verifyToken('deadbeef', hash)).toBe(false)
  })

  it('rejects when the stored hash is empty', () => {
    expect(verifyToken('whatever', '')).toBe(false)
  })
})
