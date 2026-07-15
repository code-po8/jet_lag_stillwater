/**
 * Distance units for the map drawing tools (issue #28).
 *
 * The radius/drawing tools let a seeker enter a distance in a chosen unit rather
 * than always in feet — asking a "25 mile radar" question shouldn't require
 * converting to 132,000 ft by hand. Miles is the default (the most common
 * question distance); feet is offered for small local shapes. Meters and
 * kilometers can be added later by extending `METERS_PER_UNIT` and the exported
 * `DISTANCE_UNITS` list — the conversion helpers already work for any entry.
 *
 * Values accept decimals (e.g. 0.25 miles) — conversion is plain multiplication.
 */

/** Identifiers for the units the drawing tools can accept. */
export type DistanceUnit = 'feet' | 'miles'

/** Meters per one of each unit. Central source of truth for conversions. */
const METERS_PER_UNIT: Record<DistanceUnit, number> = {
  feet: 0.3048,
  miles: 1609.34,
}

/** A selectable unit for the drawing-tool UI. */
export interface DistanceUnitOption {
  id: DistanceUnit
  /** Full name for the dropdown, e.g. "Miles". */
  label: string
  /** Short suffix for hints/labels, e.g. "mi". */
  abbr: string
}

/**
 * Units offered in the drawing tools, in display order. Miles first so it reads
 * as the primary/default choice.
 */
export const DISTANCE_UNITS: DistanceUnitOption[] = [
  { id: 'miles', label: 'Miles', abbr: 'mi' },
  { id: 'feet', label: 'Feet', abbr: 'ft' },
]

/** The default unit — miles, the most common question distance (issue #28). */
export const DEFAULT_DISTANCE_UNIT: DistanceUnit = 'miles'

/** Meters in one of the given unit. */
export function metersPerUnit(unit: DistanceUnit): number {
  return METERS_PER_UNIT[unit]
}

/**
 * Convert a distance `value` in `unit` to meters. Non-finite input (NaN from an
 * empty/garbled field, Infinity) converts to 0 so a bad entry never produces a
 * NaN radius on the map.
 */
export function toMeters(value: number, unit: DistanceUnit): number {
  if (!Number.isFinite(value)) return 0
  return value * METERS_PER_UNIT[unit]
}
