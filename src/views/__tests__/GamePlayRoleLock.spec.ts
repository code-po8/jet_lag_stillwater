import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, cleanup, fireEvent } from '@testing-library/vue'
import { createPinia, setActivePinia } from 'pinia'
import GamePlayView from '../GamePlayView.vue'
import { useGameStore, GamePhase } from '@/stores/gameStore'
import { useRoomStore } from '@/stores/roomStore'
import { useSync, __resetSyncSession } from '@/composables/useSync'

vi.mock('vue-router', () => ({
  useRouter: () => ({ push: vi.fn() }),
  RouterLink: { template: '<a><slot /></a>' },
}))

/**
 * SYNC-003: in a multiplayer room, the device's role is server-locked. The free
 * role toggle is hidden and tab changes cannot flip the role.
 */
describe('GamePlayView role lock (SYNC-003)', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    localStorage.clear()
    __resetSyncSession()
  })
  afterEach(() => {
    cleanup()
    __resetSyncSession()
  })

  function enterSeekingOffline() {
    const game = useGameStore()
    game.currentPhase = GamePhase.Seeking
  }

  it('shows the role toggle when NOT in a room (offline play)', () => {
    enterSeekingOffline()
    render(GamePlayView)
    expect(screen.getByTestId('role-toggle')).toBeInTheDocument()
    expect(screen.queryByTestId('role-locked-indicator')).not.toBeInTheDocument()
  })

  it('HIDES the role toggle when in a room', () => {
    enterSeekingOffline()
    const room = useRoomStore()
    // Simulate being in a room as a seeker.
    room.code = 'ABCD'
    room.rejoinToken = 'tok'
    room.self = { id: 's1', name: 'Sue', role: 'seeker', isHost: false, connected: true }

    render(GamePlayView)
    expect(screen.queryByTestId('role-toggle')).not.toBeInTheDocument()
    expect(screen.getByTestId('role-locked-indicator')).toBeInTheDocument()
  })

  it('forces the viewed role to the SERVER role for a seeker', async () => {
    enterSeekingOffline()
    const room = useRoomStore()
    room.code = 'ABCD'
    room.rejoinToken = 'tok'
    room.self = { id: 's1', name: 'Sue', role: 'seeker', isHost: false, connected: true }

    // Server says this device is a seeker.
    const sync = useSync()
    sync.self.value = { id: 's1', name: 'Sue', role: 'seeker', isHost: false, connected: true }

    render(GamePlayView)
    const display = screen.getByTestId('current-role-display')
    expect(display).toHaveTextContent(/seeker/i)
  })

  it('uses the persisted role when welcome has not arrived yet (refresh)', async () => {
    enterSeekingOffline()
    // Simulate a refresh mid-game: a persisted session restores code/token (so
    // inRoom is true) and the server-assigned role, but `self` is null until the
    // WS `welcome` lands.
    localStorage.setItem(
      'jet-lag-stillwater:room-session',
      JSON.stringify({ code: 'ABCD', rejoinToken: 'tok', selfId: 'h1', selfRole: 'hider' }),
    )
    const room = useRoomStore() // hydrate() runs on construction
    expect(room.inRoom).toBe(true)
    expect(room.self).toBeNull()
    expect(room.role).toBe('hider')

    // welcome has NOT arrived, so the live sync role is still null.
    const sync = useSync()
    expect(sync.role.value).toBeNull()

    render(GamePlayView)
    // The hider must NOT be stranded on the default seeker view.
    expect(screen.getByTestId('current-role-display')).toHaveTextContent(/hider/i)
  })

  it('a seeker cannot switch to the hider view via the cards tab', async () => {
    enterSeekingOffline()
    const room = useRoomStore()
    room.code = 'ABCD'
    room.rejoinToken = 'tok'
    room.self = { id: 's1', name: 'Sue', role: 'seeker', isHost: false, connected: true }
    const sync = useSync()
    sync.self.value = { id: 's1', name: 'Sue', role: 'seeker', isHost: false, connected: true }

    render(GamePlayView)
    // Try to reach the hider view by clicking the cards tab.
    const cardsTab = screen.queryByTestId('nav-tab-cards')
    if (cardsTab) await fireEvent.click(cardsTab)

    // Role display must still say Seeker — the role did not flip.
    expect(screen.getByTestId('current-role-display')).toHaveTextContent(/seeker/i)
  })
})

describe('GamePlayView host End Game (multiplayer)', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    localStorage.clear()
    __resetSyncSession()
  })
  afterEach(() => {
    cleanup()
    __resetSyncSession()
  })

  function enterRoomAs(isHost: boolean) {
    const game = useGameStore()
    game.currentPhase = GamePhase.Seeking
    const room = useRoomStore()
    room.code = 'ABCD'
    room.rejoinToken = 'tok'
    room.self = {
      id: isHost ? 'h1' : 's1',
      name: isHost ? 'Host' : 'Sue',
      role: isHost ? 'seeker' : 'seeker',
      isHost,
      connected: true,
    }
  }

  // End Game now lives in the host-only Admin tab (ADMIN-001).
  it('shows the Admin tab (with End Game) to the host during play', async () => {
    enterRoomAs(true)
    render(GamePlayView)
    // The host gets the Admin nav tab; opening it reveals the End Game control.
    const adminTab = screen.getByTestId('nav-tab-admin')
    expect(adminTab).toBeInTheDocument()
    await fireEvent.click(adminTab)
    expect(screen.getByTestId('admin-end-game-btn')).toBeInTheDocument()
  })

  it('hides the Admin tab (and End Game) from a non-host', () => {
    enterRoomAs(false)
    render(GamePlayView)
    expect(screen.queryByTestId('nav-tab-admin')).not.toBeInTheDocument()
    expect(screen.queryByTestId('admin-end-game-btn')).not.toBeInTheDocument()
  })

  it('does not show the Admin tab in offline (no room) play', () => {
    const game = useGameStore()
    game.currentPhase = GamePhase.Seeking
    render(GamePlayView)
    expect(screen.queryByTestId('nav-tab-admin')).not.toBeInTheDocument()
  })

  it('clicking End Game in the Admin tab broadcasts end-round', async () => {
    enterRoomAs(true)
    const sync = useSync()
    const sendHostAction = vi.fn()
    sync.sendHostAction = sendHostAction

    render(GamePlayView)
    await fireEvent.click(screen.getByTestId('nav-tab-admin'))
    await fireEvent.click(screen.getByTestId('admin-end-game-btn'))
    expect(sendHostAction).toHaveBeenCalledWith('end-round')
  })
})
