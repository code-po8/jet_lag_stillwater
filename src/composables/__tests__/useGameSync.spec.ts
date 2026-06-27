import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { nextTick } from 'vue'
import { useGameSync } from '../useGameSync'
import { useGameStore, GamePhase } from '@/stores/gameStore'
import { useRoomStore } from '@/stores/roomStore'
import { useSync, __resetSyncSession } from '@/composables/useSync'

describe('useGameSync (MULTI-003b-1)', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    localStorage.clear()
    __resetSyncSession()
  })
  afterEach(() => {
    __resetSyncSession()
  })

  function enterRoomAs(isHost: boolean) {
    const room = useRoomStore()
    room.code = 'ABCD'
    room.rejoinToken = 'tok'
    room.self = {
      id: isHost ? 'h1' : 's1',
      name: isHost ? 'Host' : 'Seeker',
      role: isHost ? 'hider' : 'seeker',
      isHost,
      connected: true,
    }
  }

  it('applies the server-synced phase to the local store while in a room', async () => {
    enterRoomAs(false)
    const game = useGameStore()
    const sync = useSync()
    useGameSync()

    sync.phase.value = 'seeking'
    await nextTick()
    expect(game.currentPhase).toBe(GamePhase.Seeking)
  })

  it('does NOT override local phase when not in a room', async () => {
    const game = useGameStore()
    game.currentPhase = GamePhase.HidingPeriod
    const sync = useSync()
    useGameSync()

    sync.phase.value = 'seeking' // no room joined
    await nextTick()
    expect(game.currentPhase).toBe(GamePhase.HidingPeriod)
  })

  it('host action optimistically updates phase and is allowed', () => {
    enterRoomAs(true)
    const game = useGameStore()
    const { hostAction } = useGameSync()
    hostAction('start-seeking', GamePhase.Seeking)
    expect(game.currentPhase).toBe(GamePhase.Seeking)
  })

  it('non-host hostAction is a no-op locally', () => {
    enterRoomAs(false)
    const game = useGameStore()
    game.currentPhase = GamePhase.Setup
    const { hostAction } = useGameSync()
    hostAction('start-seeking', GamePhase.Seeking)
    expect(game.currentPhase).toBe(GamePhase.Setup)
  })
})
