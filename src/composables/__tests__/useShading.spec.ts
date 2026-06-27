import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useShading } from '../useShading'
import { useSync, __resetSyncSession } from '@/composables/useSync'

const SEEKER = { lat: 36.12, lng: -97.07 }

describe('useShading (MAP-005)', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    __resetSyncSession()
  })
  afterEach(() => __resetSyncSession())

  it('exposes the synced ruled-out cells', () => {
    const sync = useSync()
    sync.ruledOutCells.value = ['abc', 'def']
    const { cells } = useShading()
    expect(cells.value).toEqual(['abc', 'def'])
  })

  it('shadeCells sends ruledout.add', () => {
    const sync = useSync()
    const sent: string[][] = []
    sync.addRuledOutCells = (c) => sent.push(c)
    const { shadeCells } = useShading()
    shadeCells(['x', 'y'])
    expect(sent).toEqual([['x', 'y']])
  })

  it('shadeFreehand converts points to cells and sends them', () => {
    const sync = useSync()
    const sent: string[][] = []
    sync.addRuledOutCells = (c) => sent.push(c)
    const { shadeFreehand } = useShading()
    shadeFreehand([
      { lat: 36.12, lng: -97.07 },
      { lat: 36.121, lng: -97.071 },
    ])
    expect(sent).toHaveLength(1)
    expect(sent[0]!.length).toBeGreaterThan(0)
    expect(sent[0]!.every((c) => typeof c === 'string')).toBe(true)
  })

  it('unshadeLocal removes cells from the local ruled-out view', () => {
    const sync = useSync()
    sync.ruledOutCells.value = ['a', 'b', 'c']
    const { unshadeLocal, cells } = useShading()
    unshadeLocal(['b'])
    expect(cells.value).toEqual(['a', 'c'])
  })

  describe('autoShadeRadar', () => {
    it('within X = NO rules out the disc inside the radius (cells near the seeker)', () => {
      const sync = useSync()
      const sent: string[][] = []
      sync.addRuledOutCells = (c) => sent.push(c)
      const { autoShadeRadar } = useShading()
      // 0.5 mi radius, answer no -> hider is NOT within -> shade inside.
      autoShadeRadar(SEEKER, 0.5, false)
      expect(sent).toHaveLength(1)
      expect(sent[0]!.length).toBeGreaterThan(0)
    })

    it('within X = YES rules out the ring outside the radius', () => {
      const sync = useSync()
      const sent: string[][] = []
      sync.addRuledOutCells = (c) => sent.push(c)
      const { autoShadeRadar } = useShading()
      autoShadeRadar(SEEKER, 0.5, true)
      expect(sent).toHaveLength(1)
      expect(sent[0]!.length).toBeGreaterThan(0)
    })
  })
})
