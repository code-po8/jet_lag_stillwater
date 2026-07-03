import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useGameSync } from '../useGameSync'
import { useGameStore, GamePhase } from '@/stores/gameStore'
import { useRoomStore } from '@/stores/roomStore'
import { __resetSyncSession } from '@/composables/useSync'

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
