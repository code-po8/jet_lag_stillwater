import { describe, it, expect } from 'vitest'
import {
  DISTANCE_UNITS,
  DEFAULT_DISTANCE_UNIT,
  toMeters,
  metersPerUnit,
  type DistanceUnit,
} from '../distanceUnits'

describe('distanceUnits (issue #28)', () => {
  it('defaults to miles (the most common question distance)', () => {
    expect(DEFAULT_DISTANCE_UNIT).toBe('miles')
  })

  it('offers feet and miles as selectable units', () => {
    const ids = DISTANCE_UNITS.map((u) => u.id)
    expect(ids).toContain('feet')
    expect(ids).toContain('miles')
  })

  it('every unit has a human label and an abbreviation', () => {
    for (const u of DISTANCE_UNITS) {
      expect(u.label.length).toBeGreaterThan(0)
      expect(u.abbr.length).toBeGreaterThan(0)
    }
  })

  it('converts miles to meters', () => {
    expect(toMeters(1, 'miles')).toBeCloseTo(1609.34, 2)
    // Decimal miles like 0.25 must convert correctly (issue #28 requirement).
    expect(toMeters(0.25, 'miles')).toBeCloseTo(402.335, 2)
  })

  it('converts feet to meters', () => {
    expect(toMeters(1, 'feet')).toBeCloseTo(0.3048, 4)
    expect(toMeters(500, 'feet')).toBeCloseTo(152.4, 1)
  })

  it('exposes meters-per-unit for each unit', () => {
    expect(metersPerUnit('miles')).toBeCloseTo(1609.34, 2)
    expect(metersPerUnit('feet')).toBeCloseTo(0.3048, 4)
  })

  it('handles fractional and zero values without error', () => {
    expect(toMeters(0, 'miles')).toBe(0)
    expect(toMeters(0.1, 'miles')).toBeCloseTo(160.934, 2)
  })

  it('treats a non-finite value as 0 meters (guards bad input)', () => {
    expect(toMeters(NaN, 'miles')).toBe(0)
    expect(toMeters(Infinity, 'feet')).toBe(0)
  })

  it('each unit id is a valid DistanceUnit', () => {
    const ids: DistanceUnit[] = DISTANCE_UNITS.map((u) => u.id)
    expect(ids.length).toBeGreaterThanOrEqual(2)
  })
})
