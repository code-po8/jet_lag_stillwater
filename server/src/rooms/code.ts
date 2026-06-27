import { randomInt } from 'node:crypto'

/**
 * Crockford-style room-code alphabet: uppercase, with the visually ambiguous
 * characters 0/O, 1/I/L removed so codes are easy to read aloud and type.
 */
export const CODE_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'

export const DEFAULT_CODE_LENGTH = 4

/**
 * Generate a random room code of the given length using a cryptographically
 * strong RNG (no modulo bias, via crypto.randomInt).
 */
export function generateCode(length: number = DEFAULT_CODE_LENGTH): string {
  let out = ''
  for (let i = 0; i < length; i++) {
    out += CODE_ALPHABET[randomInt(CODE_ALPHABET.length)]
  }
  return out
}

export interface ValidateOptions {
  /** Uppercase the input before validating (for user-typed codes). */
  caseInsensitive?: boolean
}

/** True if every character is in the alphabet and the string is non-empty. */
export function isValidCode(code: string, options: ValidateOptions = {}): boolean {
  if (!code) return false
  const candidate = options.caseInsensitive ? code.toUpperCase() : code
  for (const ch of candidate) {
    if (!CODE_ALPHABET.includes(ch)) return false
  }
  return true
}
