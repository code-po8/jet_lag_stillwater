/**
 * Card data model types for Jet Lag: Hide and Seek
 *
 * The hider's deck contains 99 cards total:
 * - 55 Time Bonus cards (5 tiers)
 * - 21 Powerup cards (7 types)
 * - 23 Curse cards (unique effects)
 *
 * Time Trap cards are from an expansion pack and not in the base deck.
 */

import { GameSize } from './question'

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
 * Powerup card type identifiers (7 types in the deck)
 */
export enum PowerupType {
  Veto = 'veto',
  Randomize = 'randomize',
  Discard1Draw2 = 'discard-1-draw-2',
  Discard2Draw3 = 'discard-2-draw-3',
  DrawExpand = 'draw-expand',
  Duplicate = 'duplicate',
  Move = 'move',
}

/**
 * Time bonus tier definition with game-size-specific values
 */
export interface TimeBonusTier {
  /** Tier identifier (1-5, lower = more common) */
  tier: number
  /** Number of cards of this tier in the deck */
  quantity: number
  /** Minutes by game size */
  minutes: {
    [GameSize.Small]: number
    [GameSize.Medium]: number
    [GameSize.Large]: number
  }
}

/**
 * Time bonus tiers - 55 cards total
 * Lower tiers are more common, higher tiers are rarer
 */
export const TIME_BONUS_TIERS: TimeBonusTier[] = [
  { tier: 1, quantity: 25, minutes: { [GameSize.Small]: 2, [GameSize.Medium]: 3, [GameSize.Large]: 5 } },
  { tier: 2, quantity: 15, minutes: { [GameSize.Small]: 4, [GameSize.Medium]: 6, [GameSize.Large]: 10 } },
  { tier: 3, quantity: 10, minutes: { [GameSize.Small]: 6, [GameSize.Medium]: 9, [GameSize.Large]: 15 } },
  { tier: 4, quantity: 3, minutes: { [GameSize.Small]: 8, [GameSize.Medium]: 12, [GameSize.Large]: 20 } },
  { tier: 5, quantity: 2, minutes: { [GameSize.Small]: 12, [GameSize.Medium]: 18, [GameSize.Large]: 30 } },
]

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
 * - Values scale by game size
 */
export interface TimeBonusCard extends BaseCard {
  type: CardType.TimeBonus
  /** Tier (1-5, determines value) */
  tier: number
  /** Minutes added by game size */
  bonusMinutes: {
    [GameSize.Small]: number
    [GameSize.Medium]: number
    [GameSize.Large]: number
  }
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
  /** Number of this card in the deck */
  quantity: number
  /** Whether this card can be played during endgame */
  canPlayDuringEndgame: boolean
}

/**
 * Curse Card - restrictions imposed on seekers
 *
 * Rules:
 * - Never more than one curse blocking questions or transit at a time
 */
export interface CurseCard extends BaseCard {
  type: CardType.Curse
  /** Full effect description */
  effect: string
  /** What the hider must do/have to cast this curse */
  castingCost: string
  /** Whether this curse blocks asking questions */
  blocksQuestions: boolean
  /** Whether this curse blocks using transit */
  blocksTransit: boolean
  /** Whether this card can be played during endgame */
  canPlayDuringEndgame: boolean
  /** Game-size-specific bonus minutes if penalty triggered (optional) */
  penaltyMinutes?: {
    [GameSize.Small]: number
    [GameSize.Medium]: number
    [GameSize.Large]: number
  }
  /** Game-size-specific duration in minutes (optional) */
  durationMinutes?: {
    [GameSize.Small]: number
    [GameSize.Medium]: number
    [GameSize.Large]: number
  }
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
 * All powerup cards defined in the rulebook (21 cards total)
 */
export const POWERUP_CARDS: PowerupCard[] = [
  {
    id: 'powerup-veto',
    type: CardType.Powerup,
    name: 'Veto Question',
    description: 'Decline to answer a question',
    powerupType: PowerupType.Veto,
    effect: 'Play instead of answering a question. No answer is given, and no reward is earned.',
    quantity: 4,
    canPlayDuringEndgame: true,
  },
  {
    id: 'powerup-randomize',
    type: CardType.Powerup,
    name: 'Randomize Question',
    description: 'Replace question with a random one',
    powerupType: PowerupType.Randomize,
    effect: 'Play instead of answering a question. A new unasked question from the same category is chosen at random, which you answer instead.',
    quantity: 4,
    canPlayDuringEndgame: true,
  },
  {
    id: 'powerup-discard-1-draw-2',
    type: CardType.Powerup,
    name: 'Discard 1, Draw 2',
    description: 'Trade one card for two',
    powerupType: PowerupType.Discard1Draw2,
    effect: 'Discard one other card from your hand. Then, draw and keep two cards from the hider deck.',
    quantity: 4,
    canPlayDuringEndgame: true,
  },
  {
    id: 'powerup-discard-2-draw-3',
    type: CardType.Powerup,
    name: 'Discard 2, Draw 3',
    description: 'Trade two cards for three',
    powerupType: PowerupType.Discard2Draw3,
    effect: 'Discard two other cards from your hand. Then, draw and keep three cards from the hider deck.',
    quantity: 4,
    canPlayDuringEndgame: true,
  },
  {
    id: 'powerup-draw-expand',
    type: CardType.Powerup,
    name: 'Draw 1, Expand 1',
    description: 'Draw a card and expand hand size',
    powerupType: PowerupType.DrawExpand,
    effect: 'Draw one card from the hider deck. For the rest of the round, you can hold one additional card in your hand.',
    quantity: 2,
    canPlayDuringEndgame: true,
  },
  {
    id: 'powerup-duplicate',
    type: CardType.Powerup,
    name: 'Duplicate Another Card',
    description: 'Copy another card in hand',
    powerupType: PowerupType.Duplicate,
    effect: 'Play this card as a copy of any other card in your hand. This may be used to duplicate a time bonus at the end of your round.',
    quantity: 2,
    canPlayDuringEndgame: true,
  },
  {
    id: 'powerup-move',
    type: CardType.Powerup,
    name: 'Move',
    description: 'Establish a new hiding zone',
    powerupType: PowerupType.Move,
    effect: 'Discard your hand and send the seekers the location of your transit station. Grants a new hiding period (S:10min, M:20min, L:60min) to establish a new hiding zone. Seekers are frozen and hiding timer is paused until the new hiding period concludes. Cannot be played during endgame.',
    quantity: 1,
    canPlayDuringEndgame: false,
  },
]

/**
 * All curse cards defined in the rulebook (23 cards total)
 */
export const CURSE_CARDS: CurseCard[] = [
  {
    id: 'curse-lemon-phylactery',
    type: CardType.Curse,
    name: 'Lemon Phylactery',
    description: 'Seekers must find and wear lemons',
    effect: 'Seekers must each find a lemon and affix it to their clothes/skin before asking another question. If a lemon stops touching a seeker, hider gets bonus time.',
    castingCost: 'Discard a powerup',
    blocksQuestions: true,
    blocksTransit: false,
    canPlayDuringEndgame: false,
    penaltyMinutes: { [GameSize.Small]: 30, [GameSize.Medium]: 45, [GameSize.Large]: 60 },
  },
  {
    id: 'curse-luxury-car',
    type: CardType.Curse,
    name: 'Luxury Car',
    description: 'Photo challenge with cars',
    effect: 'Take a photo of a car. Seekers must take a photo of a more expensive car before asking another question.',
    castingCost: 'Photo of a car',
    blocksQuestions: true,
    blocksTransit: false,
    canPlayDuringEndgame: true,
  },
  {
    id: 'curse-water-weight',
    type: CardType.Curse,
    name: 'Water Weight',
    description: 'Seekers must carry water',
    effect: 'Seekers must carry 2L of liquid per seeker for rest of run. Cannot ask questions until acquired. If lost/abandoned, hider gets bonus time.',
    castingCost: 'Seekers within 1000ft of body of water',
    blocksQuestions: true,
    blocksTransit: false,
    canPlayDuringEndgame: true,
    penaltyMinutes: { [GameSize.Small]: 30, [GameSize.Medium]: 30, [GameSize.Large]: 60 },
  },
  {
    id: 'curse-spotty-memory',
    type: CardType.Curse,
    name: 'Spotty Memory',
    description: 'Random category disabled',
    effect: 'For rest of run, one random category disabled at all times. After each question, roll die to choose new disabled category.',
    castingCost: 'Discard a time bonus',
    blocksQuestions: false,
    blocksTransit: false,
    canPlayDuringEndgame: true,
  },
  {
    id: 'curse-zoologist',
    type: CardType.Curse,
    name: 'Zoologist',
    description: 'Animal photo challenge',
    effect: 'Take photo of wild animal. Seekers must photo a wild animal in same category (fish/bird/mammal/reptile/amphibian/bug) before asking another question.',
    castingCost: 'Photo of an animal',
    blocksQuestions: true,
    blocksTransit: false,
    canPlayDuringEndgame: true,
  },
  {
    id: 'curse-mediocre-travel-agent',
    type: CardType.Curse,
    name: 'Mediocre Travel Agent',
    description: 'Send seekers on a detour',
    effect: 'Choose a place within (S:0.25mi, M:0.25mi, L:0.5mi) of seekers. They must go there, spend (S:5min, M:5min, L:10min), send 3 photos, and bring a souvenir. If souvenir lost, hider gets bonus time.',
    castingCost: 'Destination must be further from hider than seekers\' current location',
    blocksQuestions: true,
    blocksTransit: false,
    canPlayDuringEndgame: true,
    penaltyMinutes: { [GameSize.Small]: 30, [GameSize.Medium]: 45, [GameSize.Large]: 60 },
  },
  {
    id: 'curse-gamblers-feet',
    type: CardType.Curse,
    name: 'Gambler\'s Feet',
    description: 'Dice-controlled movement',
    effect: 'For next (S:20min, M:40min, L:60min), seekers must roll die before taking steps. They may take that many steps before rolling again.',
    castingCost: 'Roll die; if even, curse has no effect',
    blocksQuestions: false,
    blocksTransit: false,
    canPlayDuringEndgame: true,
    durationMinutes: { [GameSize.Small]: 20, [GameSize.Medium]: 40, [GameSize.Large]: 60 },
  },
  {
    id: 'curse-egg-partner',
    type: CardType.Curse,
    name: 'Egg Partner',
    description: 'Seekers must protect an egg',
    effect: 'Seekers must acquire an egg before asking another question. Egg is an official team member. If egg is cracked/abandoned before end of run, hider gets bonus time.',
    castingCost: 'Discard two cards',
    blocksQuestions: true,
    blocksTransit: false,
    canPlayDuringEndgame: false,
    penaltyMinutes: { [GameSize.Small]: 30, [GameSize.Medium]: 45, [GameSize.Large]: 60 },
  },
  {
    id: 'curse-drained-brain',
    type: CardType.Curse,
    name: 'Drained Brain',
    description: 'Ban three questions',
    effect: 'Choose three questions in different categories. Seekers cannot ask those questions for rest of run.',
    castingCost: 'Discard your hand',
    blocksQuestions: false,
    blocksTransit: false,
    canPlayDuringEndgame: true,
  },
  {
    id: 'curse-cairn',
    type: CardType.Curse,
    name: 'Cairn',
    description: 'Rock tower challenge',
    effect: 'Build a rock tower. Seekers must build one of same height before asking another question. Rocks must be found in nature and dispersed after.',
    castingCost: 'Build a rock tower',
    blocksQuestions: true,
    blocksTransit: false,
    canPlayDuringEndgame: true,
  },
  {
    id: 'curse-endless-tumble',
    type: CardType.Curse,
    name: 'Endless Tumble',
    description: 'Roll die 100ft challenge',
    effect: 'Seekers must roll a die at least 100ft and land on 5 or 6 before asking another question. If they hit someone with the die, hider gets bonus time.',
    castingCost: 'Roll die; if 5 or 6, curse has no effect',
    blocksQuestions: true,
    blocksTransit: false,
    canPlayDuringEndgame: true,
    penaltyMinutes: { [GameSize.Small]: 10, [GameSize.Medium]: 20, [GameSize.Large]: 30 },
  },
  {
    id: 'curse-hidden-hangman',
    type: CardType.Curse,
    name: 'Hidden Hangman',
    description: 'Win at hangman to clear',
    effect: 'Seekers must beat hider in hangman (5-letter word, 7 wrong guesses allowed). After (S:1, M:2, L:3) losses, wait 10min and curse clears.',
    castingCost: 'Discard 2 cards',
    blocksQuestions: true,
    blocksTransit: false,
    canPlayDuringEndgame: true,
  },
  {
    id: 'curse-unguided-tourist',
    type: CardType.Curse,
    name: 'Unguided Tourist',
    description: 'Find a Street View location',
    effect: 'Send seekers a Google Street View image from within 500ft. Without using internet, they must find it in real life before using transit or asking questions.',
    castingCost: 'Seekers must be outside',
    blocksQuestions: true,
    blocksTransit: true,
    canPlayDuringEndgame: true,
  },
  {
    id: 'curse-right-turn',
    type: CardType.Curse,
    name: 'Right Turn',
    description: 'Can only turn right',
    effect: 'For next (S:20min, M:40min, L:60min), seekers can only turn right at intersections. 180° allowed only at dead ends.',
    castingCost: 'Discard a card',
    blocksQuestions: false,
    blocksTransit: false,
    canPlayDuringEndgame: true,
    durationMinutes: { [GameSize.Small]: 20, [GameSize.Medium]: 40, [GameSize.Large]: 60 },
  },
  {
    id: 'curse-bird-guide',
    type: CardType.Curse,
    name: 'Bird Guide',
    description: 'Film a bird challenge',
    effect: 'Film a bird for up to (S:5min, M:10min, L:15min). Seekers must film a bird for same time or longer before asking another question.',
    castingCost: 'Film a bird',
    blocksQuestions: true,
    blocksTransit: false,
    canPlayDuringEndgame: true,
  },
  {
    id: 'curse-u-turn',
    type: CardType.Curse,
    name: 'U-Turn',
    description: 'Force seekers off transit',
    effect: 'Seekers must disembark at next station (if serviced by other transit within S:0.5hr, M:0.5hr, L:1hr).',
    castingCost: 'Seekers must be heading wrong way (next station further from hider)',
    blocksQuestions: false,
    blocksTransit: false,
    canPlayDuringEndgame: true,
  },
  {
    id: 'curse-jammed-door',
    type: CardType.Curse,
    name: 'Jammed Door',
    description: 'Dice roll to enter doorways',
    effect: 'For next (S:0.5hr, M:1hr, L:3hr), seekers must roll 2 dice (7+ to enter) before passing through any doorway. Failed doorways can be re-attempted after (S:5min, M:10min, L:15min).',
    castingCost: 'Discard two cards',
    blocksQuestions: false,
    blocksTransit: false,
    canPlayDuringEndgame: true,
    durationMinutes: { [GameSize.Small]: 30, [GameSize.Medium]: 60, [GameSize.Large]: 180 },
  },
  {
    id: 'curse-overflowing-chalice',
    type: CardType.Curse,
    name: 'Overflowing Chalice',
    description: 'Extra card draws',
    effect: 'For next three questions, hider may draw (not keep) an additional card.',
    castingCost: 'Discard a card',
    blocksQuestions: false,
    blocksTransit: false,
    canPlayDuringEndgame: true,
  },
  {
    id: 'curse-ransom-note',
    type: CardType.Curse,
    name: 'Ransom Note',
    description: 'Cut-out letter question',
    effect: 'Next question must be composed of cut-out words/letters from printed material, at least 5 words.',
    castingCost: 'Spell out "ransom note" as a ransom note',
    blocksQuestions: false,
    blocksTransit: false,
    canPlayDuringEndgame: true,
  },
  {
    id: 'curse-impressionable-consumer',
    type: CardType.Curse,
    name: 'Impressionable Consumer',
    description: 'Follow an advertisement',
    effect: 'Seekers must enter a location or buy a product they saw advertised (ad must be 100ft+ from product/location, not on device).',
    castingCost: 'Seekers\' next question is free',
    blocksQuestions: false,
    blocksTransit: false,
    canPlayDuringEndgame: true,
  },
  {
    id: 'curse-labyrinth',
    type: CardType.Curse,
    name: 'Labyrinth',
    description: 'Solve a maze',
    effect: 'Draw a solvable maze (up to S:10min, M:20min, L:30min). Seekers must solve it before asking another question.',
    castingCost: 'Draw a maze',
    blocksQuestions: true,
    blocksTransit: false,
    canPlayDuringEndgame: true,
  },
  {
    id: 'curse-urban-explorer',
    type: CardType.Curse,
    name: 'Urban Explorer',
    description: 'No questions on transit',
    effect: 'For rest of run, seekers cannot ask questions when on transit or in transit stations.',
    castingCost: 'Discard 2 cards',
    blocksQuestions: false,
    blocksTransit: false,
    canPlayDuringEndgame: true,
  },
  {
    id: 'curse-distant-cuisine',
    type: CardType.Curse,
    name: 'Distant Cuisine',
    description: 'Foreign restaurant challenge',
    effect: 'Find restaurant in your zone serving food from specific foreign country. Seekers must visit restaurant serving food from equal/greater distance country before asking another question.',
    castingCost: 'You must be at the restaurant',
    blocksQuestions: true,
    blocksTransit: false,
    canPlayDuringEndgame: true,
  },
  {
    id: 'curse-bridge-troll',
    type: CardType.Curse,
    name: 'Bridge Troll',
    description: 'Ask from under a bridge',
    effect: 'Seekers must ask their next question from under a bridge.',
    castingCost: 'Seekers must be at least (S:1mi, M:5mi, L:30mi) from you',
    blocksQuestions: false,
    blocksTransit: false,
    canPlayDuringEndgame: true,
  },
]

/**
 * Time Trap card (Expansion Pack) - not in base 99-card deck
 */
export const TIME_TRAP_CARD: TimeTrapCard = {
  id: 'time-trap',
  type: CardType.TimeTrap,
  name: 'Time Trap',
  description: 'Designate a transit station as a trap. If seekers visit it, you gain bonus time.',
  bonusMinutesWhenTriggered: 15,
}

/**
 * Time Bonus card definitions (5 tiers, 55 cards total)
 */
export const TIME_BONUS_CARDS: TimeBonusCard[] = TIME_BONUS_TIERS.map(tier => ({
  id: `time-bonus-tier-${tier.tier}`,
  type: CardType.TimeBonus,
  name: `Time Bonus (Tier ${tier.tier})`,
  description: `Adds ${tier.minutes[GameSize.Small]}/${tier.minutes[GameSize.Medium]}/${tier.minutes[GameSize.Large]} minutes (S/M/L) to hiding duration`,
  tier: tier.tier,
  bonusMinutes: tier.minutes,
}))

/**
 * Get total number of cards in deck (excluding expansion)
 * 55 time bonus + 21 powerup + 24 curse = 100 cards
 */
export const TOTAL_DECK_SIZE = 100

/**
 * Get all card definitions (unique cards, not accounting for quantities)
 */
export function getAllCards(): Card[] {
  return [...TIME_BONUS_CARDS, ...POWERUP_CARDS, ...CURSE_CARDS]
}

/**
 * Get all card definitions including expansion cards
 */
export function getAllCardsWithExpansion(): Card[] {
  return [...getAllCards(), TIME_TRAP_CARD]
}

/**
 * Get a card definition by its ID
 */
export function getCardById(id: string): Card | undefined {
  return getAllCardsWithExpansion().find(c => c.id === id)
}

/**
 * Get all cards of a specific type
 */
export function getCardsByType(type: CardType): Card[] {
  return getAllCardsWithExpansion().filter(c => c.type === type)
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

/**
 * Get the time bonus value for a specific tier and game size
 */
export function getTimeBonusValue(tier: number, gameSize: GameSize): number {
  const tierData = TIME_BONUS_TIERS.find(t => t.tier === tier)
  return tierData ? tierData.minutes[gameSize] : 0
}

/**
 * Get the quantity of a specific time bonus tier in the deck
 */
export function getTimeBonusTierQuantity(tier: number): number {
  const tierData = TIME_BONUS_TIERS.find(t => t.tier === tier)
  return tierData ? tierData.quantity : 0
}

/**
 * Get the quantity of a specific powerup type in the deck
 */
export function getPowerupQuantity(powerupType: PowerupType): number {
  const card = POWERUP_CARDS.find(c => c.powerupType === powerupType)
  return card ? card.quantity : 0
}

/**
 * Calculate total time bonus cards in deck
 */
export function getTotalTimeBonusCount(): number {
  return TIME_BONUS_TIERS.reduce((sum, tier) => sum + tier.quantity, 0)
}

/**
 * Calculate total powerup cards in deck
 */
export function getTotalPowerupCount(): number {
  return POWERUP_CARDS.reduce((sum, card) => sum + card.quantity, 0)
}

/**
 * Calculate total curse cards in deck
 */
export function getTotalCurseCount(): number {
  return CURSE_CARDS.length // Each curse is unique (1 copy)
}
