import { describe, it, expect, afterEach, beforeEach, vi } from 'vitest'
import { render, screen, cleanup, within } from '@testing-library/vue'
import { createPinia, setActivePinia } from 'pinia'
import { nextTick } from 'vue'
import CurseDisplay from '../CurseDisplay.vue'
import { useCardStore } from '@/stores/cardStore'
import { CardType, type CurseCard } from '@/types/card'
import { GameSize } from '@/types/question'
import type { ActiveCurse, CurseCardInstance } from '@/stores/cardStore'

/**
 * Helper to create an active curse for testing
 */
function createActiveCurse(overrides: Partial<ActiveCurse> = {}): ActiveCurse {
  return {
    instanceId: `active-curse-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
    curseId: 'curse-lemon-phylactery',
    name: 'Lemon Phylactery',
    description: 'Seekers must find and wear lemons',
    effect: 'Seekers must each find a lemon and affix it to their clothes/skin before asking another question. If a lemon stops touching a seeker, hider gets bonus time.',
    castingCost: 'Discard a powerup',
    blocksQuestions: true,
    blocksTransit: false,
    activatedAt: new Date(),
    penaltyMinutes: { [GameSize.Small]: 30, [GameSize.Medium]: 45, [GameSize.Large]: 60 },
    ...overrides,
  }
}

/**
 * Helper to create a curse card instance for hider's hand
 */
function createCurseCardInHand(overrides: Partial<CurseCard & { instanceId: string }> = {}): CurseCardInstance {
  return {
    id: 'curse-lemon-phylactery',
    instanceId: `curse-instance-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
    type: CardType.Curse,
    name: 'Lemon Phylactery',
    description: 'Seekers must find and wear lemons',
    effect: 'Seekers must each find a lemon and affix it to their clothes/skin before asking another question.',
    castingCost: 'Discard a powerup',
    blocksQuestions: true,
    blocksTransit: false,
    canPlayDuringEndgame: false,
    ...overrides,
  } as CurseCardInstance
}

describe('CurseDisplay', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  afterEach(() => {
    cleanup()
  })

  describe('empty state', () => {
    it('should show empty state when no active curses', () => {
      render(CurseDisplay)

      expect(screen.getByText(/no active curses/i)).toBeInTheDocument()
    })

    it('should show the curses section header', () => {
      render(CurseDisplay)

      expect(screen.getByRole('heading', { name: /active curses/i })).toBeInTheDocument()
    })
  })

  describe('curse list display', () => {
    it('should display active curses', async () => {
      render(CurseDisplay)
      const store = useCardStore()

      const curse = createActiveCurse()
      store.activeCurses.push(curse)

      await nextTick()

      expect(screen.getByTestId(`curse-${curse.instanceId}`)).toBeInTheDocument()
    })

    it('should display multiple active curses', async () => {
      render(CurseDisplay)
      const store = useCardStore()

      const curse1 = createActiveCurse({ curseId: 'curse-lemon-phylactery', name: 'Lemon Phylactery' })
      const curse2 = createActiveCurse({ curseId: 'curse-water-weight', name: 'Water Weight' })
      store.activeCurses.push(curse1, curse2)

      await nextTick()

      expect(screen.getByTestId(`curse-${curse1.instanceId}`)).toBeInTheDocument()
      expect(screen.getByTestId(`curse-${curse2.instanceId}`)).toBeInTheDocument()
    })

    it('should show curse name', async () => {
      render(CurseDisplay)
      const store = useCardStore()

      const curse = createActiveCurse({ name: 'Lemon Phylactery' })
      store.activeCurses.push(curse)

      await nextTick()

      const curseElement = screen.getByTestId(`curse-${curse.instanceId}`)
      expect(within(curseElement).getByText(/lemon phylactery/i)).toBeInTheDocument()
    })

    it('should show curse description', async () => {
      render(CurseDisplay)
      const store = useCardStore()

      const curse = createActiveCurse({ description: 'Seekers must find and wear lemons' })
      store.activeCurses.push(curse)

      await nextTick()

      const curseElement = screen.getByTestId(`curse-${curse.instanceId}`)
      expect(within(curseElement).getByText(/seekers must find and wear lemons/i)).toBeInTheDocument()
    })

    it('should show curse effect', async () => {
      render(CurseDisplay)
      const store = useCardStore()

      const curse = createActiveCurse({ effect: 'If a lemon stops touching a seeker, hider gets bonus time.' })
      store.activeCurses.push(curse)

      await nextTick()

      const curseElement = screen.getByTestId(`curse-${curse.instanceId}`)
      expect(within(curseElement).getByText(/if a lemon stops touching/i)).toBeInTheDocument()
    })
  })

  describe('clear condition display', () => {
    it('should show clear condition for action-based curses', async () => {
      render(CurseDisplay)
      const store = useCardStore()

      const curse = createActiveCurse({
        name: 'Cairn',
        effect: 'Build a rock tower. Seekers must build one of same height before asking another question.',
        blocksQuestions: true,
      })
      store.activeCurses.push(curse)

      await nextTick()

      const curseElement = screen.getByTestId(`curse-${curse.instanceId}`)
      // Should indicate how to clear it
      expect(within(curseElement).getByText(/blocks questions/i)).toBeInTheDocument()
    })

    it('should show blocks transit indicator for transit-blocking curses', async () => {
      render(CurseDisplay)
      const store = useCardStore()

      const curse = createActiveCurse({
        name: 'Unguided Tourist',
        blocksQuestions: true,
        blocksTransit: true,
      })
      store.activeCurses.push(curse)

      await nextTick()

      const curseElement = screen.getByTestId(`curse-${curse.instanceId}`)
      expect(within(curseElement).getByText(/blocks transit/i)).toBeInTheDocument()
    })

    it('should show duration for time-based curses', async () => {
      render(CurseDisplay, {
        props: { gameSize: GameSize.Small },
      })
      const store = useCardStore()

      const curse = createActiveCurse({
        name: 'Right Turn',
        durationMinutes: { [GameSize.Small]: 20, [GameSize.Medium]: 40, [GameSize.Large]: 60 },
      })
      store.activeCurses.push(curse)

      await nextTick()

      const curseElement = screen.getByTestId(`curse-${curse.instanceId}`)
      // Should show the duration
      expect(within(curseElement).getByText(/20\s*min/i)).toBeInTheDocument()
    })

    it('should show penalty for penalty curses', async () => {
      render(CurseDisplay, {
        props: { gameSize: GameSize.Small },
      })
      const store = useCardStore()

      const curse = createActiveCurse({
        name: 'Lemon Phylactery',
        penaltyMinutes: { [GameSize.Small]: 30, [GameSize.Medium]: 45, [GameSize.Large]: 60 },
      })
      store.activeCurses.push(curse)

      await nextTick()

      const curseElement = screen.getByTestId(`curse-${curse.instanceId}`)
      // Should show the penalty
      expect(within(curseElement).getByText(/\+30\s*min.*penalty/i)).toBeInTheDocument()
    })
  })

  describe('until-found curses', () => {
    it('should show persistent indicator for until-found curses', async () => {
      render(CurseDisplay)
      const store = useCardStore()

      const curse = createActiveCurse({
        name: 'Urban Explorer',
        effect: 'For rest of run, seekers cannot ask questions when on transit or in transit stations.',
        untilFound: true,
      })
      store.activeCurses.push(curse)

      await nextTick()

      const curseElement = screen.getByTestId(`curse-${curse.instanceId}`)
      // Specifically look for the "Until Found" badge
      expect(within(curseElement).getByText('Until Found')).toBeInTheDocument()
    })

    it('should not show clear button for until-found curses', async () => {
      render(CurseDisplay)
      const store = useCardStore()

      const curse = createActiveCurse({
        untilFound: true,
      })
      store.activeCurses.push(curse)

      await nextTick()

      const curseElement = screen.getByTestId(`curse-${curse.instanceId}`)
      // Should not have a clear/complete button
      expect(within(curseElement).queryByRole('button', { name: /clear|complete|mark done/i })).not.toBeInTheDocument()
    })
  })

  describe('playing curses from hider', () => {
    it('should add curse to active curses when hider plays curse card', async () => {
      const store = useCardStore()

      // First, get a curse card in the hider's hand
      const curseInHand = createCurseCardInHand({
        instanceId: 'test-curse-instance',
        penaltyMinutes: { [GameSize.Small]: 30, [GameSize.Medium]: 45, [GameSize.Large]: 60 },
      })
      store.hand.push(curseInHand)

      // Play the curse card
      const result = store.playCurseCard('test-curse-instance')

      expect(result.success).toBe(true)
      expect(store.activeCurses.length).toBe(1)
      expect(store.activeCurses[0]!.curseId).toBe('curse-lemon-phylactery')
    })

    it('should remove curse card from hand when played', async () => {
      const store = useCardStore()

      const curseInHand = createCurseCardInHand({ instanceId: 'test-curse-instance' })
      store.hand.push(curseInHand)

      expect(store.hand.length).toBe(1)
      store.playCurseCard('test-curse-instance')
      expect(store.hand.length).toBe(0)
    })

    it('should set activated timestamp when curse is played', async () => {
      const store = useCardStore()

      const curseInHand = createCurseCardInHand({ instanceId: 'test-curse-instance' })
      store.hand.push(curseInHand)

      const beforePlay = new Date()
      store.playCurseCard('test-curse-instance')
      const afterPlay = new Date()

      expect(store.activeCurses[0]!.activatedAt.getTime()).toBeGreaterThanOrEqual(beforePlay.getTime())
      expect(store.activeCurses[0]!.activatedAt.getTime()).toBeLessThanOrEqual(afterPlay.getTime())
    })
  })

  describe('curse count indicator', () => {
    it('should show count of active curses', async () => {
      render(CurseDisplay)
      const store = useCardStore()

      store.activeCurses.push(createActiveCurse())
      store.activeCurses.push(createActiveCurse({ curseId: 'curse-water-weight' }))

      await nextTick()

      expect(screen.getByTestId('curse-count')).toHaveTextContent('2')
    })
  })

  describe('visual styling', () => {
    it('should have distinct visual style for curses (purple/red theme)', async () => {
      render(CurseDisplay)
      const store = useCardStore()

      const curse = createActiveCurse()
      store.activeCurses.push(curse)

      await nextTick()

      const curseElement = screen.getByTestId(`curse-${curse.instanceId}`)
      // Should have a distinct curse styling (purple or red)
      expect(curseElement.className).toMatch(/purple|red|curse/)
    })
  })

  describe('mobile-friendly design', () => {
    it('should have touch-friendly elements', async () => {
      render(CurseDisplay)
      const store = useCardStore()

      const curse = createActiveCurse()
      store.activeCurses.push(curse)

      await nextTick()

      const curseElement = screen.getByTestId(`curse-${curse.instanceId}`)
      // Should have appropriate padding/sizing for touch
      expect(curseElement.className).toMatch(/p-|py-|px-/)
    })

    it('should be scrollable when many curses are active', async () => {
      render(CurseDisplay)

      const container = screen.getByTestId('curse-display-container')
      expect(container.className).toMatch(/overflow/)
    })
  })

  describe('accessibility', () => {
    it('should have proper heading structure', () => {
      render(CurseDisplay)

      expect(screen.getByRole('heading', { name: /active curses/i })).toBeInTheDocument()
    })

    it('should have proper ARIA labels for curse items', async () => {
      render(CurseDisplay)
      const store = useCardStore()

      const curse = createActiveCurse({ name: 'Lemon Phylactery' })
      store.activeCurses.push(curse)

      await nextTick()

      const curseElement = screen.getByTestId(`curse-${curse.instanceId}`)
      expect(curseElement).toHaveAttribute('aria-label')
    })

    it('should announce curse count to screen readers', async () => {
      render(CurseDisplay)
      const store = useCardStore()

      store.activeCurses.push(createActiveCurse())
      store.activeCurses.push(createActiveCurse({ curseId: 'curse-water-weight' }))

      await nextTick()

      const countElement = screen.getByTestId('curse-count')
      expect(countElement).toHaveAttribute('aria-live', 'polite')
    })
  })

  describe('persistence', () => {
    let mockStorage: Record<string, string>

    beforeEach(() => {
      mockStorage = {}

      vi.stubGlobal('localStorage', {
        getItem: vi.fn((key: string) => mockStorage[key] ?? null),
        setItem: vi.fn((key: string, value: string) => {
          mockStorage[key] = value
        }),
        removeItem: vi.fn((key: string) => {
          delete mockStorage[key]
        }),
        clear: vi.fn(() => {
          mockStorage = {}
        }),
      })

      // Recreate pinia after mocking localStorage
      setActivePinia(createPinia())
    })

    afterEach(() => {
      vi.unstubAllGlobals()
    })

    it('should persist active curses to localStorage', async () => {
      const store = useCardStore()

      const curseInHand = createCurseCardInHand({ instanceId: 'test-curse-instance' })
      store.hand.push(curseInHand)

      // Wait for the hand change to persist first
      await nextTick()

      store.playCurseCard('test-curse-instance')

      // Wait for persistence - watchers are async
      await nextTick()

      // Verify localStorage was updated
      expect(localStorage.setItem).toHaveBeenCalled()

      const persistedKey = Object.keys(mockStorage).find(key => key.includes('cards'))
      expect(persistedKey).toBeDefined()

      const persistedData = JSON.parse(mockStorage[persistedKey!]!)
      expect(persistedData.activeCurses).toBeDefined()
      expect(persistedData.activeCurses.length).toBe(1)
    })
  })

  // CARD-006b: Curse Clearing Tests
  describe('curse clearing (CARD-006b)', () => {
    describe('time-based curse countdown', () => {
      it('should show countdown timer for time-based curses', async () => {
        render(CurseDisplay, {
          props: { gameSize: GameSize.Small },
        })
        const store = useCardStore()

        const curse = createActiveCurse({
          name: 'Right Turn',
          durationMinutes: { [GameSize.Small]: 20, [GameSize.Medium]: 40, [GameSize.Large]: 60 },
          activatedAt: new Date(), // Just activated
        })
        store.activeCurses.push(curse)

        await nextTick()

        const curseElement = screen.getByTestId(`curse-${curse.instanceId}`)
        // Should show a countdown timer with remaining time
        expect(within(curseElement).getByTestId('curse-countdown')).toBeInTheDocument()
      })

      it('should display remaining time in countdown format', async () => {
        render(CurseDisplay, {
          props: { gameSize: GameSize.Small },
        })
        const store = useCardStore()

        // Curse activated 5 minutes ago with 20 minute duration = 15 minutes remaining
        const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000)
        const curse = createActiveCurse({
          name: 'Right Turn',
          durationMinutes: { [GameSize.Small]: 20, [GameSize.Medium]: 40, [GameSize.Large]: 60 },
          activatedAt: fiveMinutesAgo,
        })
        store.activeCurses.push(curse)

        await nextTick()

        const curseElement = screen.getByTestId(`curse-${curse.instanceId}`)
        const countdown = within(curseElement).getByTestId('curse-countdown')
        // Should show approximately 15 minutes remaining (could be 14:59 due to timing)
        expect(countdown.textContent).toMatch(/1[45]:\d{2}/)
      })

      it('should auto-clear time-based curse when countdown expires', async () => {
        vi.useFakeTimers()

        render(CurseDisplay, {
          props: { gameSize: GameSize.Small },
        })
        const store = useCardStore()

        // Curse with 1 second remaining
        const almostExpired = new Date(Date.now() - (20 * 60 * 1000 - 1000))
        const curse = createActiveCurse({
          name: 'Right Turn',
          durationMinutes: { [GameSize.Small]: 20, [GameSize.Medium]: 40, [GameSize.Large]: 60 },
          activatedAt: almostExpired,
        })
        store.activeCurses.push(curse)

        await nextTick()

        expect(store.activeCurses.length).toBe(1)

        // Advance time past expiration
        vi.advanceTimersByTime(2000)
        await nextTick()

        expect(store.activeCurses.length).toBe(0)

        vi.useRealTimers()
      })

      it('should not show countdown for non-time-based curses', async () => {
        render(CurseDisplay, {
          props: { gameSize: GameSize.Small },
        })
        const store = useCardStore()

        const curse = createActiveCurse({
          name: 'Lemon Phylactery',
          durationMinutes: undefined, // No duration - action-based curse
          blocksQuestions: true,
        })
        store.activeCurses.push(curse)

        await nextTick()

        const curseElement = screen.getByTestId(`curse-${curse.instanceId}`)
        expect(within(curseElement).queryByTestId('curse-countdown')).not.toBeInTheDocument()
      })
    })

    describe('action-based curse manual clearing', () => {
      it('should show Mark Complete button for action-based curses', async () => {
        render(CurseDisplay)
        const store = useCardStore()

        const curse = createActiveCurse({
          name: 'Cairn',
          effect: 'Build a rock tower. Seekers must build one of same height.',
          blocksQuestions: true,
          durationMinutes: undefined, // Action-based, not time-based
          untilFound: false,
        })
        store.activeCurses.push(curse)

        await nextTick()

        const curseElement = screen.getByTestId(`curse-${curse.instanceId}`)
        expect(within(curseElement).getByRole('button', { name: /mark complete|clear/i })).toBeInTheDocument()
      })

      it('should clear curse when Mark Complete button is clicked', async () => {
        render(CurseDisplay)
        const store = useCardStore()

        const curse = createActiveCurse({
          name: 'Cairn',
          blocksQuestions: true,
          untilFound: false,
        })
        store.activeCurses.push(curse)

        await nextTick()

        expect(store.activeCurses.length).toBe(1)

        const curseElement = screen.getByTestId(`curse-${curse.instanceId}`)
        const clearButton = within(curseElement).getByRole('button', { name: /mark complete|clear/i })

        const { fireEvent } = await import('@testing-library/vue')
        await fireEvent.click(clearButton)

        expect(store.activeCurses.length).toBe(0)
      })

      it('should not show Mark Complete button for time-based curses', async () => {
        render(CurseDisplay, {
          props: { gameSize: GameSize.Small },
        })
        const store = useCardStore()

        const curse = createActiveCurse({
          name: 'Right Turn',
          durationMinutes: { [GameSize.Small]: 20, [GameSize.Medium]: 40, [GameSize.Large]: 60 },
        })
        store.activeCurses.push(curse)

        await nextTick()

        const curseElement = screen.getByTestId(`curse-${curse.instanceId}`)
        expect(within(curseElement).queryByRole('button', { name: /mark complete|clear/i })).not.toBeInTheDocument()
      })

      it('should not show Mark Complete button for until-found curses', async () => {
        render(CurseDisplay)
        const store = useCardStore()

        const curse = createActiveCurse({
          name: 'Urban Explorer',
          untilFound: true,
        })
        store.activeCurses.push(curse)

        await nextTick()

        const curseElement = screen.getByTestId(`curse-${curse.instanceId}`)
        expect(within(curseElement).queryByRole('button', { name: /mark complete|clear/i })).not.toBeInTheDocument()
      })
    })

    describe('curse cleared notification', () => {
      it('should emit curse-cleared event when curse is cleared manually', async () => {
        const onCurseCleared = vi.fn()
        render(CurseDisplay, {
          props: {
            gameSize: GameSize.Small,
            onCurseCleared,
          },
        })
        const store = useCardStore()

        const curse = createActiveCurse({
          name: 'Cairn',
          blocksQuestions: true,
          untilFound: false,
        })
        store.activeCurses.push(curse)

        await nextTick()

        const curseElement = screen.getByTestId(`curse-${curse.instanceId}`)
        const clearButton = within(curseElement).getByRole('button', { name: /mark complete|clear/i })

        // Use fireEvent directly since userEvent isn't configured in render return
        const { fireEvent } = await import('@testing-library/vue')
        await fireEvent.click(clearButton)

        expect(onCurseCleared).toHaveBeenCalledWith(expect.objectContaining({
          curseName: 'Cairn',
          reason: 'manual',
        }))
      })

      it('should emit curse-cleared event when time-based curse expires', async () => {
        vi.useFakeTimers()

        const onCurseCleared = vi.fn()
        render(CurseDisplay, {
          props: {
            gameSize: GameSize.Small,
            onCurseCleared,
          },
        })
        const store = useCardStore()

        // Curse with 1 second remaining
        const almostExpired = new Date(Date.now() - (20 * 60 * 1000 - 1000))
        const curse = createActiveCurse({
          name: 'Right Turn',
          durationMinutes: { [GameSize.Small]: 20, [GameSize.Medium]: 40, [GameSize.Large]: 60 },
          activatedAt: almostExpired,
        })
        store.activeCurses.push(curse)

        await nextTick()

        // Advance time past expiration
        vi.advanceTimersByTime(2000)
        await nextTick()

        expect(onCurseCleared).toHaveBeenCalledWith(expect.objectContaining({
          curseName: 'Right Turn',
          reason: 'expired',
        }))

        vi.useRealTimers()
      })

      it('should show visual feedback when curse is cleared', async () => {
        render(CurseDisplay)
        const store = useCardStore()

        const curse = createActiveCurse({
          name: 'Cairn',
          blocksQuestions: true,
          untilFound: false,
        })
        store.activeCurses.push(curse)

        await nextTick()

        const curseElement = screen.getByTestId(`curse-${curse.instanceId}`)
        const clearButton = within(curseElement).getByRole('button', { name: /mark complete|clear/i })

        const { fireEvent } = await import('@testing-library/vue')
        await fireEvent.click(clearButton)
        await nextTick()

        // After clearing, the curse should be removed from the list
        expect(screen.queryByTestId(`curse-${curse.instanceId}`)).not.toBeInTheDocument()
        // And we should be back to empty state
        expect(screen.getByText(/no active curses/i)).toBeInTheDocument()
      })
    })
  })
})
