import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, cleanup, fireEvent } from '@testing-library/vue'
import { createPinia, setActivePinia } from 'pinia'
import { nextTick } from 'vue'
import AdminPanel from '../AdminPanel.vue'
import { useSync, __resetSyncSession } from '@/composables/useSync'
import { useRoomStore } from '@/stores/roomStore'
import { useGameStore, GamePhase } from '@/stores/gameStore'

// AdminPanel starts its own geolocation watch; stub it so tests don't touch the
// browser API. `position` drives the host's OWN GPS status row.
const geoState = { position: null as null | { lat: number; lng: number; ts: number } }
vi.mock('@/composables/useGeolocation', () => ({
  useGeolocation: () => ({
    ownPosition: {
      get value() {
        return geoState.position
      },
    },
    error: { value: null },
    start: vi.fn(),
    stop: vi.fn(),
  }),
}))

describe('AdminPanel (ADMIN-001)', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    __resetSyncSession()
    geoState.position = null
  })
  afterEach(() => {
    cleanup()
    __resetSyncSession()
  })

  function seedRoster() {
    const sync = useSync()
    // hostAction() is guarded by roomStore.isHost — mark this device the host.
    const room = useRoomStore()
    room.self = { id: 'h1', name: 'Host', role: 'seeker', isHost: true, connected: true }
    sync.self.value = { id: 'h1', name: 'Host', role: 'seeker', isHost: true, connected: true }
    sync.players.value = [
      { id: 'h1', name: 'Host', role: 'seeker', isHost: true, connected: true },
      { id: 'x1', name: 'Hidey', role: 'hider', isHost: false, connected: true },
      { id: 's2', name: 'Sam', role: 'seeker', isHost: false, connected: false },
    ]
    return sync
  }

  it('renders a roster row per player', async () => {
    seedRoster()
    render(AdminPanel)
    await nextTick()
    expect(screen.getByTestId('admin-player-h1')).toBeInTheDocument()
    expect(screen.getByTestId('admin-player-x1')).toBeInTheDocument()
    expect(screen.getByTestId('admin-player-s2')).toBeInTheDocument()
  })

  it('reflects WS connection status per player', async () => {
    seedRoster()
    render(AdminPanel)
    await nextTick()
    expect(screen.getByTestId('admin-conn-h1')).toHaveTextContent(/online/i)
    expect(screen.getByTestId('admin-conn-s2')).toHaveTextContent(/offline/i)
  })

  it('shows GPS on for players in the leak-free presence set, off otherwise', async () => {
    const sync = seedRoster()
    // Server says the hider (x1) has a fresh GPS fix — but NOT its coordinates.
    sync.gpsOnline.value = new Set(['x1'])
    render(AdminPanel)
    await nextTick()
    expect(screen.getByTestId('admin-gps-x1')).toHaveAttribute('data-gps', 'on')
    expect(screen.getByTestId('admin-gps-s2')).toHaveAttribute('data-gps', 'off')
  })

  it('uses the local fix (not the server set) for the host’s OWN GPS row', async () => {
    const sync = seedRoster()
    // Server presence does NOT include the host; the local fix must still show on.
    sync.gpsOnline.value = new Set()
    geoState.position = { lat: 36.12, lng: -97.07, ts: 1 }
    render(AdminPanel)
    await nextTick()
    expect(screen.getByTestId('admin-gps-h1')).toHaveAttribute('data-gps', 'on')
  })

  it('broadcasts end-round when End Game is clicked', async () => {
    const sync = seedRoster()
    const game = useGameStore()
    game.currentPhase = GamePhase.Seeking
    const sendHostAction = vi.fn()
    sync.sendHostAction = sendHostAction

    render(AdminPanel)
    await fireEvent.click(screen.getByTestId('admin-end-game-btn'))
    expect(sendHostAction).toHaveBeenCalledWith('end-round')
  })

  it('offers End Hiding Period Early only during the hiding period', async () => {
    seedRoster()
    const game = useGameStore()

    game.currentPhase = GamePhase.Seeking
    const { unmount } = render(AdminPanel)
    expect(screen.queryByTestId('admin-end-hiding-btn')).toBeNull()
    unmount()

    game.currentPhase = GamePhase.HidingPeriod
    render(AdminPanel)
    await nextTick()
    expect(screen.getByTestId('admin-end-hiding-btn')).toBeInTheDocument()
  })

  it('requires a confirm, then broadcasts start-seeking, to end hiding early', async () => {
    const sync = seedRoster()
    const game = useGameStore()
    game.currentPhase = GamePhase.HidingPeriod
    const sendHostAction = vi.fn()
    sync.sendHostAction = sendHostAction

    render(AdminPanel)
    await fireEvent.click(screen.getByTestId('admin-end-hiding-btn'))
    // Two-step confirm: not sent yet.
    expect(sendHostAction).not.toHaveBeenCalled()
    await fireEvent.click(screen.getByTestId('admin-end-hiding-confirm-btn'))
    expect(sendHostAction).toHaveBeenCalledWith('start-seeking')
  })

  it('cancels the end-hiding confirm without sending', async () => {
    const sync = seedRoster()
    const game = useGameStore()
    game.currentPhase = GamePhase.HidingPeriod
    const sendHostAction = vi.fn()
    sync.sendHostAction = sendHostAction

    render(AdminPanel)
    await fireEvent.click(screen.getByTestId('admin-end-hiding-btn'))
    await fireEvent.click(screen.getByTestId('admin-end-hiding-cancel-btn'))
    expect(screen.queryByTestId('admin-end-hiding-confirm')).toBeNull()
    expect(sendHostAction).not.toHaveBeenCalled()
  })
})
