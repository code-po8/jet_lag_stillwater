import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { nextTick, ref } from 'vue'
import { useMultiplayerBridge } from '../useMultiplayerBridge'
import { useGameStore, GamePhase } from '@/stores/gameStore'
import { useRoomStore } from '@/stores/roomStore'
import { useSync, __resetSyncSession } from '@/composables/useSync'

// Controllable router mock: `routeName` drives useRoute().name; push is a spy.
const routeName = ref<string>('lobby')
const push = vi.fn()
vi.mock('vue-router', () => ({
  useRoute: () => ({
    get name() {
      return routeName.value
    },
  }),
  useRouter: () => ({ push }),
}))

describe('useMultiplayerBridge', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    localStorage.clear()
    __resetSyncSession()
    routeName.value = 'lobby'
    push.mockClear()
    // Default: neutralize the reconnect effect so it never opens a real socket.
    // Tests that assert on reconnect override this.
    useSync().connect = vi.fn(async () => {})
  })
  afterEach(() => {
    __resetSyncSession()
  })

  function enterRoom() {
    const room = useRoomStore()
    room.code = 'ABCD'
    room.rejoinToken = 'tok'
    room.self = { id: 'h1', name: 'Host', role: 'seeker', isHost: true, connected: true }
  }

  /** Stub the transport connect so the reconnect effect doesn't open a real WS. */
  function stubConnect() {
    const sync = useSync()
    const connect = vi.fn(async () => {
      sync.status.value = 'connected'
    })
    sync.connect = connect
    return connect
  }

  it('bridges the synced roster into gameStore players + hider', async () => {
    enterRoom()
    const game = useGameStore()
    const sync = useSync()
    useMultiplayerBridge()

    sync.players.value = [
      { id: 'h1', name: 'Host', role: 'seeker', isHost: true, connected: true },
      { id: 's1', name: 'Sam', role: 'hider', isHost: false, connected: true },
    ]
    await nextTick()
    expect(game.players.map((p) => p.id)).toEqual(['h1', 's1'])
    expect(game.currentHiderId).toBe('s1')
  })

  it('mirrors the synced self into roomStore (restores host after refresh)', async () => {
    const room = useRoomStore()
    // Post-refresh: code/token hydrated, but self is null (no welcome yet).
    room.code = 'ABCD'
    room.rejoinToken = 'tok'
    room.self = null
    const sync = useSync()
    useMultiplayerBridge()
    expect(room.isHost).toBe(false)

    // The reconnect welcome re-establishes self as the host.
    sync.self.value = { id: 'h1', name: 'Host', role: 'hider', isHost: true, connected: true }
    await nextTick()
    expect(room.isHost).toBe(true)
    expect(room.role).toBe('hider')
  })

  it('does nothing to gameStore when not in a room', async () => {
    const game = useGameStore()
    const sync = useSync()
    useMultiplayerBridge()

    sync.players.value = [{ id: 's1', name: 'Sam', role: 'hider', isHost: false, connected: true }]
    await nextTick()
    expect(game.players).toHaveLength(0)
  })

  it('navigates all clients to /game on the start (hiding-period) edge from the lobby', async () => {
    enterRoom()
    const sync = useSync()
    useMultiplayerBridge()

    sync.phase.value = 'hiding-period'
    await nextTick()
    expect(push).toHaveBeenCalledWith('/game')
  })

  it('navigates to /results on the end (round-complete) edge from the game', async () => {
    enterRoom()
    routeName.value = 'game'
    const sync = useSync()
    useMultiplayerBridge()

    sync.phase.value = 'round-complete'
    await nextTick()
    expect(push).toHaveBeenCalledWith('/results')
  })

  it('does NOT navigate to /game when not on the lobby route', async () => {
    enterRoom()
    routeName.value = 'game' // already in the game
    const sync = useSync()
    useMultiplayerBridge()

    sync.phase.value = 'hiding-period'
    await nextTick()
    expect(push).not.toHaveBeenCalledWith('/game')
  })

  it('does NOT navigate when offline (no room)', async () => {
    const sync = useSync()
    useMultiplayerBridge()

    sync.phase.value = 'hiding-period'
    await nextTick()
    expect(push).not.toHaveBeenCalled()
  })

  it('mirrors the synced phase into the local store while in a room', async () => {
    enterRoom()
    const game = useGameStore()
    const sync = useSync()
    useMultiplayerBridge()

    sync.phase.value = 'seeking'
    await nextTick()
    expect(game.currentPhase).toBe(GamePhase.Seeking)
  })

  it('applies a synced pause/resume to the local game state', async () => {
    enterRoom()
    const game = useGameStore()
    const sync = useSync()
    useMultiplayerBridge()
    // Get into a pausable phase so pauseGame succeeds.
    game.currentPhase = GamePhase.Seeking

    sync.paused.value = true
    await nextTick()
    expect(game.isGamePaused).toBe(true)

    sync.paused.value = false
    await nextTick()
    expect(game.isGamePaused).toBe(false)
  })

  it('does not apply pause when offline (no room)', async () => {
    const game = useGameStore()
    const sync = useSync()
    useMultiplayerBridge()
    game.currentPhase = GamePhase.Seeking

    sync.paused.value = true
    await nextTick()
    expect(game.isGamePaused).toBe(false)
  })

  it('does NOT wipe gameStore players on an empty (not-yet-synced) roster', async () => {
    enterRoom()
    const game = useGameStore()
    // Seed real players (as if the game was in progress before a refresh).
    game.syncFromRoster([
      { id: 'h1', name: 'Host', role: 'seeker' },
      { id: 's1', name: 'Sam', role: 'hider' },
    ])
    useMultiplayerBridge() // immediate roster watch fires with sync.players = []
    await nextTick()

    // Empty roster (pre-welcome) must not clear the names.
    expect(game.players.map((p) => p.name)).toEqual(['Host', 'Sam'])
    expect(game.currentHiderId).toBe('s1')
  })

  it('reconnects the transport when in a room but disconnected (mid-game refresh)', async () => {
    enterRoom() // code + rejoinToken restored (as roomStore.hydrate would)
    const sync = useSync()
    const connect = stubConnect()
    sync.status.value = 'disconnected'

    useMultiplayerBridge() // immediate reconnect effect
    await nextTick()

    expect(connect).toHaveBeenCalledWith(
      expect.objectContaining({ code: 'ABCD', rejoinToken: 'tok' }),
    )
  })

  it('does not reconnect when already connected', async () => {
    enterRoom()
    const sync = useSync()
    const connect = stubConnect()
    sync.status.value = 'connected'

    useMultiplayerBridge()
    await nextTick()
    expect(connect).not.toHaveBeenCalled()
  })
})
