import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useRoomStore } from '../roomStore'

const HOST_RESP = {
  code: 'ABCD',
  sessionId: 's1',
  player: { id: 'p1', name: 'Host', role: 'hider' as const, isHost: true },
  rejoinToken: 'host-tok',
}

function stubApi(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    createRoom: vi.fn().mockResolvedValue(HOST_RESP),
    getRoom: vi.fn().mockResolvedValue({
      code: 'ABCD',
      phase: 'setup',
      status: 'active',
      players: [HOST_RESP.player],
    }),
    joinRoom: vi.fn().mockResolvedValue({
      player: { id: 'p2', name: 'Bob', role: 'seeker', isHost: false },
      rejoinToken: 'bob-tok',
    }),
    rejoinRoom: vi.fn().mockResolvedValue({ player: HOST_RESP.player }),
    ...overrides,
  }
}

describe('roomStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    localStorage.clear()
  })
  afterEach(() => {
    localStorage.clear()
  })

  it('starts with no active room', () => {
    const store = useRoomStore()
    expect(store.inRoom).toBe(false)
    expect(store.code).toBeNull()
  })

  describe('createRoom', () => {
    it('sets the room code, self player, and rejoin token', async () => {
      const store = useRoomStore()
      store.api = stubApi() as never
      await store.createRoom('Host')

      expect(store.code).toBe('ABCD')
      expect(store.inRoom).toBe(true)
      expect(store.self?.isHost).toBe(true)
      expect(store.rejoinToken).toBe('host-tok')
    })

    it('persists session for rejoin across reloads', async () => {
      const store = useRoomStore()
      store.api = stubApi() as never
      await store.createRoom('Host')

      // A fresh store instance should rehydrate the persisted session.
      setActivePinia(createPinia())
      const store2 = useRoomStore()
      expect(store2.code).toBe('ABCD')
      expect(store2.rejoinToken).toBe('host-tok')
    })
  })

  describe('joinRoom', () => {
    it('joins with a code + name and stores the seeker token', async () => {
      const store = useRoomStore()
      store.api = stubApi() as never
      await store.joinRoom('ABCD', 'Bob')
      expect(store.self?.name).toBe('Bob')
      expect(store.self?.isHost).toBe(false)
      expect(store.rejoinToken).toBe('bob-tok')
    })

    it('surfaces a not-found error for a bad code', async () => {
      const store = useRoomStore()
      store.api = stubApi({
        joinRoom: vi
          .fn()
          .mockRejectedValue(Object.assign(new Error('room not found'), { status: 404 })),
      }) as never
      await expect(store.joinRoom('ZZZZ', 'Bob')).rejects.toBeTruthy()
      expect(store.inRoom).toBe(false)
    })
  })

  describe('refreshRoster', () => {
    it('updates the player list from the server', async () => {
      const store = useRoomStore()
      store.api = stubApi() as never
      await store.createRoom('Host')
      await store.refreshRoster()
      expect(store.players.map((p) => p.id)).toContain('p1')
    })
  })

  describe('leaveRoom', () => {
    it('clears all room state and persistence', async () => {
      const store = useRoomStore()
      store.api = stubApi() as never
      await store.createRoom('Host')
      store.leaveRoom()
      expect(store.inRoom).toBe(false)
      expect(store.code).toBeNull()
      expect(store.rejoinToken).toBeNull()
    })
  })
})
