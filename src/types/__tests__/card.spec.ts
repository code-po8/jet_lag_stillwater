import { describe, it, expect } from 'vitest'
import {
  CardType,
  PowerupType,
  CurseType,
  TIME_BONUS_VALUES,
  POWERUP_CARDS,
  CURSE_CARDS,
  TIME_TRAP_CARD,
  getAllCards,
  getCardById,
  getCardsByType,
  getTimeBonusCards,
  getPowerupCards,
  getCurseCards,
} from '../card'
import type { Card, TimeBonusCard, PowerupCard, CurseCard, TimeTrapCard } from '../card'

describe('CardType enum', () => {
  it('should define all four card types', () => {
    expect(CardType.TimeBonus).toBe('time-bonus')
    expect(CardType.Powerup).toBe('powerup')
    expect(CardType.Curse).toBe('curse')
    expect(CardType.TimeTrap).toBe('time-trap')
  })
})

describe('PowerupType enum', () => {
  it('should define all six powerup types', () => {
    expect(PowerupType.Veto).toBe('veto')
    expect(PowerupType.Randomize).toBe('randomize')
    expect(PowerupType.DiscardDraw).toBe('discard-draw')
    expect(PowerupType.DrawExpand).toBe('draw-expand')
    expect(PowerupType.Duplicate).toBe('duplicate')
    expect(PowerupType.Move).toBe('move')
  })
})

describe('CurseType enum', () => {
  it('should define all four curse types', () => {
    expect(CurseType.ActionToClear).toBe('action-to-clear')
    expect(CurseType.DurationBased).toBe('duration-based')
    expect(CurseType.UntilFound).toBe('until-found')
    expect(CurseType.DiceBased).toBe('dice-based')
  })
})

describe('TIME_BONUS_VALUES', () => {
  it('should contain 5, 10, and 15 minute values', () => {
    expect(TIME_BONUS_VALUES).toContain(5)
    expect(TIME_BONUS_VALUES).toContain(10)
    expect(TIME_BONUS_VALUES).toContain(15)
    expect(TIME_BONUS_VALUES).toHaveLength(3)
  })
})

describe('TimeBonusCard interface', () => {
  it('should allow creating a valid time bonus card', () => {
    const card: TimeBonusCard = {
      id: 'time-bonus-5',
      type: CardType.TimeBonus,
      name: '+5 Minutes',
      description: 'Adds 5 minutes to hiding duration',
      bonusMinutes: 5,
    }

    expect(card.id).toBe('time-bonus-5')
    expect(card.type).toBe(CardType.TimeBonus)
    expect(card.bonusMinutes).toBe(5)
  })
})

describe('PowerupCard interface', () => {
  it('should allow creating a valid powerup card', () => {
    const card: PowerupCard = {
      id: 'powerup-veto',
      type: CardType.Powerup,
      name: 'Veto',
      description: 'Decline a question; still receive cards; seekers can re-ask',
      powerupType: PowerupType.Veto,
      effect: 'Decline to answer the current question',
    }

    expect(card.id).toBe('powerup-veto')
    expect(card.type).toBe(CardType.Powerup)
    expect(card.powerupType).toBe(PowerupType.Veto)
    expect(card.effect).toBeTruthy()
  })
})

describe('CurseCard interface', () => {
  it('should allow creating a duration-based curse card', () => {
    const card: CurseCard = {
      id: 'curse-duration-1',
      type: CardType.Curse,
      name: 'Slow Zone',
      description: 'Seekers must walk for 10 minutes',
      curseType: CurseType.DurationBased,
      durationMinutes: 10,
      blocksQuestions: false,
      blocksTransit: false,
    }

    expect(card.id).toBe('curse-duration-1')
    expect(card.type).toBe(CardType.Curse)
    expect(card.curseType).toBe(CurseType.DurationBased)
    expect(card.durationMinutes).toBe(10)
  })

  it('should allow creating an action-to-clear curse card', () => {
    const card: CurseCard = {
      id: 'curse-action-1',
      type: CardType.Curse,
      name: 'Photo Challenge',
      description: 'Take a photo of a park',
      curseType: CurseType.ActionToClear,
      clearCondition: 'Take and submit a photo of a park',
      blocksQuestions: true,
      blocksTransit: false,
    }

    expect(card.curseType).toBe(CurseType.ActionToClear)
    expect(card.clearCondition).toBeTruthy()
    expect(card.blocksQuestions).toBe(true)
  })

  it('should allow creating an until-found curse card', () => {
    const card: CurseCard = {
      id: 'curse-until-found-1',
      type: CardType.Curse,
      name: 'Silent Treatment',
      description: 'No verbal communication until found',
      curseType: CurseType.UntilFound,
      blocksQuestions: false,
      blocksTransit: false,
    }

    expect(card.curseType).toBe(CurseType.UntilFound)
    expect(card.durationMinutes).toBeUndefined()
  })
})

describe('TimeTrapCard interface', () => {
  it('should allow creating a time trap card', () => {
    const card: TimeTrapCard = {
      id: 'time-trap',
      type: CardType.TimeTrap,
      name: 'Time Trap',
      description: 'Designate a station as a trap',
      bonusMinutesWhenTriggered: 15,
    }

    expect(card.id).toBe('time-trap')
    expect(card.type).toBe(CardType.TimeTrap)
    expect(card.bonusMinutesWhenTriggered).toBe(15)
  })
})

describe('POWERUP_CARDS', () => {
  it('should define all six powerup cards', () => {
    expect(POWERUP_CARDS).toHaveLength(6)
  })

  it('should include Veto powerup', () => {
    const veto = POWERUP_CARDS.find(c => c.powerupType === PowerupType.Veto)
    expect(veto).toBeDefined()
    expect(veto?.name).toBe('Veto')
    expect(veto?.effect).toContain('Decline')
  })

  it('should include Randomize powerup', () => {
    const randomize = POWERUP_CARDS.find(c => c.powerupType === PowerupType.Randomize)
    expect(randomize).toBeDefined()
    expect(randomize?.name).toBe('Randomize')
    expect(randomize?.effect).toContain('random')
  })

  it('should include Discard/Draw powerup', () => {
    const discardDraw = POWERUP_CARDS.find(c => c.powerupType === PowerupType.DiscardDraw)
    expect(discardDraw).toBeDefined()
    expect(discardDraw?.name).toBe('Discard/Draw')
  })

  it('should include Draw 1, Expand powerup', () => {
    const drawExpand = POWERUP_CARDS.find(c => c.powerupType === PowerupType.DrawExpand)
    expect(drawExpand).toBeDefined()
    expect(drawExpand?.name).toBe('Draw 1, Expand')
    expect(drawExpand?.effect).toContain('hand size')
  })

  it('should include Duplicate powerup', () => {
    const duplicate = POWERUP_CARDS.find(c => c.powerupType === PowerupType.Duplicate)
    expect(duplicate).toBeDefined()
    expect(duplicate?.name).toBe('Duplicate')
    expect(duplicate?.effect).toContain('copy')
  })

  it('should include Move powerup', () => {
    const move = POWERUP_CARDS.find(c => c.powerupType === PowerupType.Move)
    expect(move).toBeDefined()
    expect(move?.name).toBe('Move')
    expect(move?.effect).toContain('hiding zone')
  })

  it('should have all powerup cards with correct type', () => {
    POWERUP_CARDS.forEach(card => {
      expect(card.type).toBe(CardType.Powerup)
    })
  })
})

describe('CURSE_CARDS', () => {
  it('should define curse cards', () => {
    expect(CURSE_CARDS.length).toBeGreaterThan(0)
  })

  it('should have all curse cards with correct type', () => {
    CURSE_CARDS.forEach(card => {
      expect(card.type).toBe(CardType.Curse)
    })
  })

  it('should have each curse card define blocksQuestions', () => {
    CURSE_CARDS.forEach(card => {
      expect(typeof card.blocksQuestions).toBe('boolean')
    })
  })

  it('should have each curse card define blocksTransit', () => {
    CURSE_CARDS.forEach(card => {
      expect(typeof card.blocksTransit).toBe('boolean')
    })
  })

  it('should have duration-based curses with durationMinutes', () => {
    const durationBased = CURSE_CARDS.filter(c => c.curseType === CurseType.DurationBased)
    durationBased.forEach(card => {
      expect(card.durationMinutes).toBeDefined()
      expect(card.durationMinutes).toBeGreaterThan(0)
    })
  })

  it('should have action-to-clear curses with clearCondition', () => {
    const actionToClear = CURSE_CARDS.filter(c => c.curseType === CurseType.ActionToClear)
    actionToClear.forEach(card => {
      expect(card.clearCondition).toBeDefined()
      expect(card.clearCondition).toBeTruthy()
    })
  })
})

describe('TIME_TRAP_CARD', () => {
  it('should be a valid time trap card', () => {
    expect(TIME_TRAP_CARD.type).toBe(CardType.TimeTrap)
    expect(TIME_TRAP_CARD.name).toBe('Time Trap')
    expect(TIME_TRAP_CARD.bonusMinutesWhenTriggered).toBeGreaterThan(0)
  })
})

describe('getAllCards', () => {
  it('should return all cards from all types', () => {
    const allCards = getAllCards()

    // Should include time bonus cards (3), powerup cards (6), curse cards, and time trap (1)
    expect(allCards.length).toBeGreaterThanOrEqual(10)
  })

  it('should include cards of all types', () => {
    const allCards = getAllCards()
    const types = new Set(allCards.map(c => c.type))

    expect(types.has(CardType.TimeBonus)).toBe(true)
    expect(types.has(CardType.Powerup)).toBe(true)
    expect(types.has(CardType.Curse)).toBe(true)
    expect(types.has(CardType.TimeTrap)).toBe(true)
  })
})

describe('getCardById', () => {
  it('should return the correct card', () => {
    const veto = getCardById('powerup-veto')
    expect(veto?.name).toBe('Veto')
  })

  it('should return undefined for invalid ID', () => {
    const invalid = getCardById('invalid-card-id')
    expect(invalid).toBeUndefined()
  })
})

describe('getCardsByType', () => {
  it('should return only time bonus cards', () => {
    const timeBonusCards = getCardsByType(CardType.TimeBonus)
    expect(timeBonusCards.length).toBe(3) // 5, 10, 15 minute cards
    timeBonusCards.forEach(card => {
      expect(card.type).toBe(CardType.TimeBonus)
    })
  })

  it('should return only powerup cards', () => {
    const powerupCards = getCardsByType(CardType.Powerup)
    expect(powerupCards.length).toBe(6)
    powerupCards.forEach(card => {
      expect(card.type).toBe(CardType.Powerup)
    })
  })

  it('should return only curse cards', () => {
    const curseCards = getCardsByType(CardType.Curse)
    expect(curseCards.length).toBeGreaterThan(0)
    curseCards.forEach(card => {
      expect(card.type).toBe(CardType.Curse)
    })
  })

  it('should return only time trap cards', () => {
    const timeTrapCards = getCardsByType(CardType.TimeTrap)
    expect(timeTrapCards.length).toBe(1)
    timeTrapCards.forEach(card => {
      expect(card.type).toBe(CardType.TimeTrap)
    })
  })
})

describe('getTimeBonusCards', () => {
  it('should return all time bonus cards', () => {
    const cards = getTimeBonusCards()
    expect(cards).toHaveLength(3)
    expect(cards.map(c => c.bonusMinutes).sort((a, b) => a - b)).toEqual([5, 10, 15])
  })
})

describe('getPowerupCards', () => {
  it('should return all powerup cards', () => {
    const cards = getPowerupCards()
    expect(cards).toHaveLength(6)
    cards.forEach(card => {
      expect(card.powerupType).toBeDefined()
    })
  })
})

describe('getCurseCards', () => {
  it('should return all curse cards', () => {
    const cards = getCurseCards()
    expect(cards.length).toBeGreaterThan(0)
    cards.forEach(card => {
      expect(card.curseType).toBeDefined()
    })
  })
})
