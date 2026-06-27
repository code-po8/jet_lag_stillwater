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
