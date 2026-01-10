import { describe, it, expect } from 'vitest'
import {
  CardType,
  PowerupType,
  TIME_BONUS_TIERS,
  POWERUP_CARDS,
  CURSE_CARDS,
  TIME_TRAP_CARD,
  TIME_BONUS_CARDS,
  TOTAL_DECK_SIZE,
  getAllCards,
  getAllCardsWithExpansion,
  getCardById,
  getCardsByType,
  getTimeBonusCards,
  getPowerupCards,
  getCurseCards,
  getTimeBonusValue,
  getTimeBonusTierQuantity,
  getPowerupQuantity,
  getTotalTimeBonusCount,
  getTotalPowerupCount,
  getTotalCurseCount,
} from '../card'
import type { TimeBonusCard, PowerupCard, CurseCard, TimeTrapCard } from '../card'
import { GameSize } from '../question'

describe('CardType enum', () => {
  it('should define all four card types', () => {
    expect(CardType.TimeBonus).toBe('time-bonus')
    expect(CardType.Powerup).toBe('powerup')
    expect(CardType.Curse).toBe('curse')
    expect(CardType.TimeTrap).toBe('time-trap')
  })
})

describe('PowerupType enum', () => {
  it('should define all seven powerup types', () => {
    expect(PowerupType.Veto).toBe('veto')
    expect(PowerupType.Randomize).toBe('randomize')
    expect(PowerupType.Discard1Draw2).toBe('discard-1-draw-2')
    expect(PowerupType.Discard2Draw3).toBe('discard-2-draw-3')
    expect(PowerupType.DrawExpand).toBe('draw-expand')
    expect(PowerupType.Duplicate).toBe('duplicate')
    expect(PowerupType.Move).toBe('move')
  })
})

describe('TIME_BONUS_TIERS', () => {
  it('should have 5 tiers', () => {
    expect(TIME_BONUS_TIERS).toHaveLength(5)
  })

  it('should have tiers numbered 1 through 5', () => {
    const tiers = TIME_BONUS_TIERS.map(t => t.tier)
    expect(tiers).toEqual([1, 2, 3, 4, 5])
  })

  it('should have correct quantities totaling 55 cards', () => {
    const total = TIME_BONUS_TIERS.reduce((sum, t) => sum + t.quantity, 0)
    expect(total).toBe(55)
  })

  it('should have correct quantities per tier', () => {
    expect(TIME_BONUS_TIERS[0].quantity).toBe(25) // Tier 1
    expect(TIME_BONUS_TIERS[1].quantity).toBe(15) // Tier 2
    expect(TIME_BONUS_TIERS[2].quantity).toBe(10) // Tier 3
    expect(TIME_BONUS_TIERS[3].quantity).toBe(3)  // Tier 4
    expect(TIME_BONUS_TIERS[4].quantity).toBe(2)  // Tier 5
  })

  it('should have game-size-specific minutes for each tier', () => {
    // Tier 1: S:2, M:3, L:5
    expect(TIME_BONUS_TIERS[0].minutes[GameSize.Small]).toBe(2)
    expect(TIME_BONUS_TIERS[0].minutes[GameSize.Medium]).toBe(3)
    expect(TIME_BONUS_TIERS[0].minutes[GameSize.Large]).toBe(5)

    // Tier 5: S:12, M:18, L:30
    expect(TIME_BONUS_TIERS[4].minutes[GameSize.Small]).toBe(12)
    expect(TIME_BONUS_TIERS[4].minutes[GameSize.Medium]).toBe(18)
    expect(TIME_BONUS_TIERS[4].minutes[GameSize.Large]).toBe(30)
  })
})

describe('TimeBonusCard interface', () => {
  it('should allow creating a valid time bonus card', () => {
    const card: TimeBonusCard = {
      id: 'time-bonus-tier-1',
      type: CardType.TimeBonus,
      name: 'Time Bonus (Tier 1)',
      description: 'Adds 2/3/5 minutes (S/M/L) to hiding duration',
      tier: 1,
      bonusMinutes: {
        [GameSize.Small]: 2,
        [GameSize.Medium]: 3,
        [GameSize.Large]: 5,
      },
    }

    expect(card.id).toBe('time-bonus-tier-1')
    expect(card.type).toBe(CardType.TimeBonus)
    expect(card.tier).toBe(1)
    expect(card.bonusMinutes[GameSize.Small]).toBe(2)
  })
})

describe('PowerupCard interface', () => {
  it('should allow creating a valid powerup card', () => {
    const card: PowerupCard = {
      id: 'powerup-veto',
      type: CardType.Powerup,
      name: 'Veto Question',
      description: 'Decline to answer a question',
      powerupType: PowerupType.Veto,
      effect: 'Play instead of answering a question. No answer is given.',
      quantity: 4,
      canPlayDuringEndgame: true,
    }

    expect(card.id).toBe('powerup-veto')
    expect(card.type).toBe(CardType.Powerup)
    expect(card.powerupType).toBe(PowerupType.Veto)
    expect(card.quantity).toBe(4)
    expect(card.canPlayDuringEndgame).toBe(true)
  })
})

describe('CurseCard interface', () => {
  it('should allow creating a curse card with penalty minutes', () => {
    const card: CurseCard = {
      id: 'curse-lemon-phylactery',
      type: CardType.Curse,
      name: 'Lemon Phylactery',
      description: 'Seekers must find and wear lemons',
      effect: 'Seekers must each find a lemon...',
      castingCost: 'Discard a powerup',
      blocksQuestions: true,
      blocksTransit: false,
      canPlayDuringEndgame: false,
      penaltyMinutes: {
        [GameSize.Small]: 30,
        [GameSize.Medium]: 45,
        [GameSize.Large]: 60,
      },
    }

    expect(card.id).toBe('curse-lemon-phylactery')
    expect(card.type).toBe(CardType.Curse)
    expect(card.blocksQuestions).toBe(true)
    expect(card.canPlayDuringEndgame).toBe(false)
    expect(card.penaltyMinutes?.[GameSize.Large]).toBe(60)
  })

  it('should allow creating a curse card with duration minutes', () => {
    const card: CurseCard = {
      id: 'curse-right-turn',
      type: CardType.Curse,
      name: 'Right Turn',
      description: 'Can only turn right',
      effect: 'For next (S:20min, M:40min, L:60min)...',
      castingCost: 'Discard a card',
      blocksQuestions: false,
      blocksTransit: false,
      canPlayDuringEndgame: true,
      durationMinutes: {
        [GameSize.Small]: 20,
        [GameSize.Medium]: 40,
        [GameSize.Large]: 60,
      },
    }

    expect(card.durationMinutes?.[GameSize.Medium]).toBe(40)
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
  it('should define all seven powerup card types', () => {
    expect(POWERUP_CARDS).toHaveLength(7)
  })

  it('should have total quantity of 21 cards', () => {
    const total = POWERUP_CARDS.reduce((sum, card) => sum + card.quantity, 0)
    expect(total).toBe(21)
  })

  it('should include Veto powerup with quantity 4', () => {
    const veto = POWERUP_CARDS.find(c => c.powerupType === PowerupType.Veto)
    expect(veto).toBeDefined()
    expect(veto?.name).toBe('Veto Question')
    expect(veto?.quantity).toBe(4)
  })

  it('should include Randomize powerup with quantity 4', () => {
    const randomize = POWERUP_CARDS.find(c => c.powerupType === PowerupType.Randomize)
    expect(randomize).toBeDefined()
    expect(randomize?.quantity).toBe(4)
  })

  it('should include Discard 1, Draw 2 powerup with quantity 4', () => {
    const discard1 = POWERUP_CARDS.find(c => c.powerupType === PowerupType.Discard1Draw2)
    expect(discard1).toBeDefined()
    expect(discard1?.name).toBe('Discard 1, Draw 2')
    expect(discard1?.quantity).toBe(4)
  })

  it('should include Discard 2, Draw 3 powerup with quantity 4', () => {
    const discard2 = POWERUP_CARDS.find(c => c.powerupType === PowerupType.Discard2Draw3)
    expect(discard2).toBeDefined()
    expect(discard2?.name).toBe('Discard 2, Draw 3')
    expect(discard2?.quantity).toBe(4)
  })

  it('should include Draw 1, Expand 1 powerup with quantity 2', () => {
    const drawExpand = POWERUP_CARDS.find(c => c.powerupType === PowerupType.DrawExpand)
    expect(drawExpand).toBeDefined()
    expect(drawExpand?.quantity).toBe(2)
  })

  it('should include Duplicate powerup with quantity 2', () => {
    const duplicate = POWERUP_CARDS.find(c => c.powerupType === PowerupType.Duplicate)
    expect(duplicate).toBeDefined()
    expect(duplicate?.quantity).toBe(2)
  })

  it('should include Move powerup with quantity 1', () => {
    const move = POWERUP_CARDS.find(c => c.powerupType === PowerupType.Move)
    expect(move).toBeDefined()
    expect(move?.quantity).toBe(1)
    expect(move?.canPlayDuringEndgame).toBe(false)
  })

  it('should have all powerup cards with correct type', () => {
    POWERUP_CARDS.forEach(card => {
      expect(card.type).toBe(CardType.Powerup)
    })
  })
})

describe('CURSE_CARDS', () => {
  it('should define 24 unique curse cards', () => {
    expect(CURSE_CARDS).toHaveLength(24)
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

  it('should have each curse card define castingCost', () => {
    CURSE_CARDS.forEach(card => {
      expect(card.castingCost).toBeTruthy()
    })
  })

  it('should have each curse card define canPlayDuringEndgame', () => {
    CURSE_CARDS.forEach(card => {
      expect(typeof card.canPlayDuringEndgame).toBe('boolean')
    })
  })

  it('should include Lemon Phylactery curse', () => {
    const lemon = CURSE_CARDS.find(c => c.id === 'curse-lemon-phylactery')
    expect(lemon).toBeDefined()
    expect(lemon?.blocksQuestions).toBe(true)
    expect(lemon?.canPlayDuringEndgame).toBe(false)
    expect(lemon?.penaltyMinutes?.[GameSize.Small]).toBe(30)
  })

  it('should include Unguided Tourist curse that blocks both questions and transit', () => {
    const tourist = CURSE_CARDS.find(c => c.id === 'curse-unguided-tourist')
    expect(tourist).toBeDefined()
    expect(tourist?.blocksQuestions).toBe(true)
    expect(tourist?.blocksTransit).toBe(true)
  })

  it('should have curses with duration minutes', () => {
    const rightTurn = CURSE_CARDS.find(c => c.id === 'curse-right-turn')
    expect(rightTurn?.durationMinutes).toBeDefined()
    expect(rightTurn?.durationMinutes?.[GameSize.Small]).toBe(20)
  })
})

describe('TIME_TRAP_CARD', () => {
  it('should be a valid time trap card', () => {
    expect(TIME_TRAP_CARD.type).toBe(CardType.TimeTrap)
    expect(TIME_TRAP_CARD.name).toBe('Time Trap')
    expect(TIME_TRAP_CARD.bonusMinutesWhenTriggered).toBeGreaterThan(0)
  })
})

describe('TIME_BONUS_CARDS', () => {
  it('should have 5 time bonus card definitions (one per tier)', () => {
    expect(TIME_BONUS_CARDS).toHaveLength(5)
  })

  it('should have correct tier assignments', () => {
    const tiers = TIME_BONUS_CARDS.map(c => c.tier)
    expect(tiers).toEqual([1, 2, 3, 4, 5])
  })
})

describe('TOTAL_DECK_SIZE', () => {
  it('should equal 100 cards', () => {
    expect(TOTAL_DECK_SIZE).toBe(100)
  })

  it('should match sum of all card quantities', () => {
    const timeBonusTotal = getTotalTimeBonusCount()
    const powerupTotal = getTotalPowerupCount()
    const curseTotal = getTotalCurseCount()
    expect(timeBonusTotal + powerupTotal + curseTotal).toBe(TOTAL_DECK_SIZE)
  })
})

describe('getAllCards', () => {
  it('should return all base cards (excluding expansion)', () => {
    const allCards = getAllCards()
    // 5 time bonus + 7 powerup + 24 curse = 36 unique card definitions
    expect(allCards.length).toBe(36)
  })

  it('should not include time trap card', () => {
    const allCards = getAllCards()
    const timeTrap = allCards.find(c => c.type === CardType.TimeTrap)
    expect(timeTrap).toBeUndefined()
  })
})

describe('getAllCardsWithExpansion', () => {
  it('should return all cards including expansion', () => {
    const allCards = getAllCardsWithExpansion()
    expect(allCards.length).toBe(37) // 36 base + 1 time trap
  })

  it('should include time trap card', () => {
    const allCards = getAllCardsWithExpansion()
    const timeTrap = allCards.find(c => c.type === CardType.TimeTrap)
    expect(timeTrap).toBeDefined()
  })
})

describe('getCardById', () => {
  it('should return the correct card', () => {
    const veto = getCardById('powerup-veto')
    expect(veto?.name).toBe('Veto Question')
  })

  it('should return undefined for invalid ID', () => {
    const invalid = getCardById('invalid-card-id')
    expect(invalid).toBeUndefined()
  })

  it('should find time trap card', () => {
    const trap = getCardById('time-trap')
    expect(trap).toBeDefined()
    expect(trap?.type).toBe(CardType.TimeTrap)
  })
})

describe('getCardsByType', () => {
  it('should return only time bonus cards', () => {
    const timeBonusCards = getCardsByType(CardType.TimeBonus)
    expect(timeBonusCards.length).toBe(5) // 5 tiers
    timeBonusCards.forEach(card => {
      expect(card.type).toBe(CardType.TimeBonus)
    })
  })

  it('should return only powerup cards', () => {
    const powerupCards = getCardsByType(CardType.Powerup)
    expect(powerupCards.length).toBe(7)
    powerupCards.forEach(card => {
      expect(card.type).toBe(CardType.Powerup)
    })
  })

  it('should return only curse cards', () => {
    const curseCards = getCardsByType(CardType.Curse)
    expect(curseCards.length).toBe(24)
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
    expect(cards).toHaveLength(5)
  })
})

describe('getPowerupCards', () => {
  it('should return all powerup cards', () => {
    const cards = getPowerupCards()
    expect(cards).toHaveLength(7)
    cards.forEach(card => {
      expect(card.powerupType).toBeDefined()
    })
  })
})

describe('getCurseCards', () => {
  it('should return all curse cards', () => {
    const cards = getCurseCards()
    expect(cards).toHaveLength(24)
    cards.forEach(card => {
      expect(card.castingCost).toBeDefined()
    })
  })
})

describe('getTimeBonusValue', () => {
  it('should return correct value for tier 1 small game', () => {
    expect(getTimeBonusValue(1, GameSize.Small)).toBe(2)
  })

  it('should return correct value for tier 5 large game', () => {
    expect(getTimeBonusValue(5, GameSize.Large)).toBe(30)
  })

  it('should return 0 for invalid tier', () => {
    expect(getTimeBonusValue(99, GameSize.Small)).toBe(0)
  })
})

describe('getTimeBonusTierQuantity', () => {
  it('should return 25 for tier 1', () => {
    expect(getTimeBonusTierQuantity(1)).toBe(25)
  })

  it('should return 2 for tier 5', () => {
    expect(getTimeBonusTierQuantity(5)).toBe(2)
  })

  it('should return 0 for invalid tier', () => {
    expect(getTimeBonusTierQuantity(99)).toBe(0)
  })
})

describe('getPowerupQuantity', () => {
  it('should return 4 for Veto', () => {
    expect(getPowerupQuantity(PowerupType.Veto)).toBe(4)
  })

  it('should return 1 for Move', () => {
    expect(getPowerupQuantity(PowerupType.Move)).toBe(1)
  })
})

describe('getTotalTimeBonusCount', () => {
  it('should return 55', () => {
    expect(getTotalTimeBonusCount()).toBe(55)
  })
})

describe('getTotalPowerupCount', () => {
  it('should return 21', () => {
    expect(getTotalPowerupCount()).toBe(21)
  })
})

describe('getTotalCurseCount', () => {
  it('should return 24', () => {
    expect(getTotalCurseCount()).toBe(24)
  })
})
