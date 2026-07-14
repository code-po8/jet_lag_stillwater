import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { useVectorShades, __resetVectorShades } from '../useVectorShades'
import type { RadiusShade, LineShade } from '../useVectorShades'

describe('useVectorShades (MAP-010)', () => {
  beforeEach(() => __resetVectorShades())
  afterEach(() => __resetVectorShades())

  it('is an app-singleton so UI and renderer share one list', () => {
    expect(useVectorShades()).toBe(useVectorShades())
  })

  it('adds a radius shade and returns its id', () => {
    const v = useVectorShades()
    const id = v.addRadiusShade({ lat: 36.12, lng: -97.07 }, 800, 'inside')

    expect(v.shades.value).toHaveLength(1)
    const s = v.shades.value[0] as RadiusShade
    expect(s).toMatchObject({
      kind: 'radius',
      id,
      center: { lat: 36.12, lng: -97.07 },
      radiusM: 800,
      mode: 'inside',
    })
  })

  it('supports the outside mode (Radar hit — shade beyond the disc)', () => {
    const v = useVectorShades()
    v.addRadiusShade({ lat: 1, lng: 1 }, 500, 'outside')
    expect((v.shades.value[0] as RadiusShade).mode).toBe('outside')
  })

  it('gives each shade a distinct id', () => {
    const v = useVectorShades()
    const a = v.addRadiusShade({ lat: 1, lng: 1 }, 100, 'inside')
    const b = v.addRadiusShade({ lat: 2, lng: 2 }, 200, 'inside')
    expect(a).not.toBe(b)
    expect(v.shades.value).toHaveLength(2)
  })

  it('removes a single shade by id (undo)', () => {
    const v = useVectorShades()
    const a = v.addRadiusShade({ lat: 1, lng: 1 }, 100, 'inside')
    const b = v.addRadiusShade({ lat: 2, lng: 2 }, 200, 'inside')

    v.removeShade(a)

    expect(v.shades.value).toHaveLength(1)
    expect(v.shades.value[0]!.id).toBe(b)
  })

  it('clears all shades', () => {
    const v = useVectorShades()
    v.addRadiusShade({ lat: 1, lng: 1 }, 100, 'inside')
    v.addRadiusShade({ lat: 2, lng: 2 }, 200, 'inside')

    v.clearShades()

    expect(v.shades.value).toEqual([])
  })

  it('stores line shades too (MAP-011)', () => {
    const v = useVectorShades()
    const id = v.addLineShade({ lat: 1, lng: 1 }, { lat: 2, lng: 2 }, 'toward')
    const s = v.shades.value[0] as LineShade
    expect(s).toMatchObject({ kind: 'line', id, side: 'toward' })
  })

  it('__resetVectorShades clears the singleton', () => {
    const a = useVectorShades()
    a.addRadiusShade({ lat: 1, lng: 1 }, 100, 'inside')
    __resetVectorShades()
    const b = useVectorShades()
    expect(a).not.toBe(b)
    expect(b.shades.value).toEqual([])
  })
})
