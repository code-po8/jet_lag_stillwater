import { describe, it, expect } from 'vitest'
import { formatTime, formatTimeShort } from '../formatTime'

describe('formatTime', () => {
  it('should format zero milliseconds as 00:00:00', () => {
    expect(formatTime(0)).toBe('00:00:00')
  })

  it('should format seconds correctly', () => {
    expect(formatTime(5000)).toBe('00:00:05')
    expect(formatTime(59000)).toBe('00:00:59')
  })

  it('should format minutes correctly', () => {
    expect(formatTime(60000)).toBe('00:01:00')
    expect(formatTime(125000)).toBe('00:02:05')
  })

  it('should format hours correctly', () => {
    expect(formatTime(3600000)).toBe('01:00:00')
    expect(formatTime(3661000)).toBe('01:01:01')
  })

  it('should handle multi-hour durations', () => {
    expect(formatTime(7384000)).toBe('02:03:04')
  })
})

describe('formatTimeShort', () => {
  it('should format as MM:SS when under an hour', () => {
    expect(formatTimeShort(0)).toBe('00:00')
    expect(formatTimeShort(125000)).toBe('02:05')
    expect(formatTimeShort(1800000)).toBe('30:00')
  })

  it('should format as HH:MM:SS when an hour or more', () => {
    expect(formatTimeShort(3600000)).toBe('01:00:00')
    expect(formatTimeShort(7384000)).toBe('02:03:04')
  })
})
