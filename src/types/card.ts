/**
 * Card data model types for Jet Lag: Hide and Seek
 *
 * The hider's deck contains 4 types of cards:
 * - Time Bonus: Add minutes to hiding duration
 * - Powerup: Special abilities for the hider
 * - Curse: Restrictions imposed on seekers
 * - Time Trap: (Expansion) Designate stations as traps
 */

/**
 * Card type identifiers
 */
export enum CardType {
  TimeBonus = 'time-bonus',
  Powerup = 'powerup',
  Curse = 'curse',
  TimeTrap = 'time-trap',
}

/**
 * Powerup card type identifiers
 */
export enum PowerupType {
  Veto = 'veto',
  Randomize = 'randomize',
  DiscardDraw = 'discard-draw',
  DrawExpand = 'draw-expand',
  Duplicate = 'duplicate',
  Move = 'move',
}

/**
 * Curse card type identifiers
 */
export enum CurseType {
  ActionToClear = 'action-to-clear',
  DurationBased = 'duration-based',
  UntilFound = 'until-found',
  DiceBased = 'dice-based',
}

/**
 * Time bonus values in minutes (lower values more common in deck)
 */
export const TIME_BONUS_VALUES = [5, 10, 15] as const

/**
 * Base card interface - common fields for all card types
 */
export interface BaseCard {
  /** Unique identifier for the card definition */
  id: string
  /** Card type discriminator */
  type: CardType
  /** Display name */
  name: string
  /** Description of the card */
  description: string
}

/**
 * Time Bonus Card - adds minutes to hiding duration when hider is found
 *
 * - Only count if they are in hand at the end of the round
 * - Cannot be played, only discarded
 * - Values: 5, 10, or 15 minutes
 */
export interface TimeBonusCard extends BaseCard {
  type: CardType.TimeBonus
  /** Minutes added to hiding duration */
  bonusMinutes: (typeof TIME_BONUS_VALUES)[number]
}

/**
 * Powerup Card - special abilities for the hider
 */
export interface PowerupCard extends BaseCard {
  type: CardType.Powerup
  /** Specific powerup type */
  powerupType: PowerupType
  /** Description of the card's effect when played */
  effect: string
}

/**
 * Curse Card - restrictions imposed on seekers
 *
 * Rules:
 * - Never more than one curse blocking questions or transit at a time
 */
export interface CurseCard extends BaseCard {
  type: CardType.Curse
  /** Type of curse (determines how it clears) */
  curseType: CurseType
  /** For duration-based curses: how long the curse lasts */
  durationMinutes?: number
  /** For action-to-clear curses: what seekers must do to clear it */
  clearCondition?: string
  /** Whether this curse blocks asking questions */
  blocksQuestions: boolean
  /** Whether this curse blocks using transit */
  blocksTransit: boolean
}

/**
 * Time Trap Card (Expansion Pack) - designate a station as a trap
 *
 * - Hider publicly designates a transit station
 * - If seekers visit the station, hider gains bonus time
 * - Can be used as misdirection
 */
export interface TimeTrapCard extends BaseCard {
  type: CardType.TimeTrap
  /** Minutes added when seekers trigger the trap */
  bonusMinutesWhenTriggered: number
}

/**
 * Union type for all card types
 */
export type Card = TimeBonusCard | PowerupCard | CurseCard | TimeTrapCard

/**
 * All powerup cards defined in the rulebook
 */
export const POWERUP_CARDS: PowerupCard[] = [
  {
    id: 'powerup-veto',
    type: CardType.Powerup,
    name: 'Veto',
    description: 'Decline a question without answering',
    powerupType: PowerupType.Veto,
    effect: 'Decline to answer the current question. You still receive cards for the question. Seekers can re-ask the same question later.',
  },
  {
    id: 'powerup-randomize',
    type: CardType.Powerup,
    name: 'Randomize',
    description: 'Replace question with a random one',
    powerupType: PowerupType.Randomize,
    effect: 'Replace the current question with a random unasked question from the same category.',
  },
  {
    id: 'powerup-discard-draw',
    type: CardType.Powerup,
    name: 'Discard/Draw',
    description: 'Exchange cards for new ones',
    powerupType: PowerupType.DiscardDraw,
    effect: 'Discard any number of cards from your hand, then draw that many new cards.',
  },
  {
    id: 'powerup-draw-expand',
    type: CardType.Powerup,
    name: 'Draw 1, Expand',
    description: 'Draw a card and expand hand size',
    powerupType: PowerupType.DrawExpand,
    effect: 'Draw one card and permanently increase your hand size by 1.',
  },
  {
    id: 'powerup-duplicate',
    type: CardType.Powerup,
    name: 'Duplicate',
    description: 'Copy another card in hand',
    powerupType: PowerupType.Duplicate,
    effect: 'Create a copy of another card in your hand. If copying a time bonus card, the copy has doubled value.',
  },
  {
    id: 'powerup-move',
    type: CardType.Powerup,
    name: 'Move',
    description: 'Establish a new hiding zone',
    powerupType: PowerupType.Move,
    effect: 'Pause hiding timer and establish a new hiding zone. Seekers must stay put until you confirm your new location.',
  },
]

/**
 * Curse cards defined in the rulebook
 *
 * Note: The actual rulebook has many specific curses. This is a representative
 * sample covering the four curse types. More curses can be added as needed.
 */
export const CURSE_CARDS: CurseCard[] = [
  // Duration-based curses
  {
    id: 'curse-no-transit-10',
    type: CardType.Curse,
    name: 'Transit Lockdown',
    description: 'Seekers cannot use transit for 10 minutes',
    curseType: CurseType.DurationBased,
    durationMinutes: 10,
    blocksQuestions: false,
    blocksTransit: true,
  },
  {
    id: 'curse-no-questions-5',
    type: CardType.Curse,
    name: 'Radio Silence',
    description: 'Seekers cannot ask questions for 5 minutes',
    curseType: CurseType.DurationBased,
    durationMinutes: 5,
    blocksQuestions: true,
    blocksTransit: false,
  },
  {
    id: 'curse-slow-walk-10',
    type: CardType.Curse,
    name: 'Slow Zone',
    description: 'Seekers must walk slowly for 10 minutes',
    curseType: CurseType.DurationBased,
    durationMinutes: 10,
    blocksQuestions: false,
    blocksTransit: false,
  },
  // Action-to-clear curses
  {
    id: 'curse-photo-park',
    type: CardType.Curse,
    name: 'Park Photo',
    description: 'Take a photo at a park to clear',
    curseType: CurseType.ActionToClear,
    clearCondition: 'Take and submit a photo at a park',
    blocksQuestions: true,
    blocksTransit: false,
  },
  {
    id: 'curse-visit-station',
    type: CardType.Curse,
    name: 'Station Visit',
    description: 'Visit any transit station to clear',
    curseType: CurseType.ActionToClear,
    clearCondition: 'Visit any transit station and take a photo',
    blocksQuestions: true,
    blocksTransit: false,
  },
  // Until-found curses
  {
    id: 'curse-silent-treatment',
    type: CardType.Curse,
    name: 'Silent Treatment',
    description: 'No verbal communication until found',
    curseType: CurseType.UntilFound,
    blocksQuestions: false,
    blocksTransit: false,
  },
  {
    id: 'curse-single-file',
    type: CardType.Curse,
    name: 'Single File',
    description: 'Seekers must stay in single file until found',
    curseType: CurseType.UntilFound,
    blocksQuestions: false,
    blocksTransit: false,
  },
  // Dice-based curses
  {
    id: 'curse-dice-direction',
    type: CardType.Curse,
    name: 'Dice Direction',
    description: 'Roll dice to determine which direction to travel',
    curseType: CurseType.DiceBased,
    clearCondition: 'Roll dice at each intersection to choose direction',
    blocksQuestions: false,
    blocksTransit: false,
  },
]

/**
 * Time Trap card (Expansion Pack)
 */
export const TIME_TRAP_CARD: TimeTrapCard = {
  id: 'time-trap',
  type: CardType.TimeTrap,
  name: 'Time Trap',
  description: 'Designate a transit station as a trap. If seekers visit it, you gain bonus time.',
  bonusMinutesWhenTriggered: 15,
}

/**
 * Time Bonus cards (one for each value)
 */
export const TIME_BONUS_CARDS: TimeBonusCard[] = TIME_BONUS_VALUES.map(minutes => ({
  id: `time-bonus-${minutes}`,
  type: CardType.TimeBonus,
  name: `+${minutes} Minutes`,
  description: `Adds ${minutes} minutes to hiding duration when round ends`,
  bonusMinutes: minutes,
}))

/**
 * Get all card definitions
 */
export function getAllCards(): Card[] {
  return [...TIME_BONUS_CARDS, ...POWERUP_CARDS, ...CURSE_CARDS, TIME_TRAP_CARD]
}

/**
 * Get a card definition by its ID
 */
export function getCardById(id: string): Card | undefined {
  return getAllCards().find(c => c.id === id)
}

/**
 * Get all cards of a specific type
 */
export function getCardsByType(type: CardType): Card[] {
  return getAllCards().filter(c => c.type === type)
}

/**
 * Get all time bonus cards (typed helper)
 */
export function getTimeBonusCards(): TimeBonusCard[] {
  return TIME_BONUS_CARDS
}

/**
 * Get all powerup cards (typed helper)
 */
export function getPowerupCards(): PowerupCard[] {
  return POWERUP_CARDS
}

/**
 * Get all curse cards (typed helper)
 */
export function getCurseCards(): CurseCard[] {
  return CURSE_CARDS
}
