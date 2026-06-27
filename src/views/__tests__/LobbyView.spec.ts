import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { render, screen, cleanup, fireEvent, waitFor } from '@testing-library/vue'
import { createPinia, setActivePinia } from 'pinia'
import LobbyView from '../LobbyView.vue'
import { useRoomStore } from '@/stores/roomStore'

const routerPush = vi.fn()
vi.mock('vue-router', () => ({
  useRouter: () => ({ push: routerPush }),
  RouterLink: { template: '<a><slot /></a>' },
}))

function stubApi() {
  return {
    createRoom: vi.fn().mockResolvedValue({
      code: 'ABCD',
      sessionId: 's1',
      player: { id: 'p1', name: 'Host', role: 'hider', isHost: true },
      rejoinToken: 'tok',
    }),
    getRoom: vi.fn().mockResolvedValue({
      code: 'ABCD',
      phase: 'setup',
      status: 'active',
      players: [{ id: 'p1', name: 'Host', role: 'hider', isHost: true }],
    }),
    joinRoom: vi.fn().mockResolvedValue({
      player: { id: 'p2', name: 'Bob', role: 'seeker', isHost: false },
      rejoinToken: 'tok2',
    }),
    rejoinRoom: vi.fn(),
  }
}

describe('LobbyView', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    localStorage.clear()
    routerPush.mockClear()
  })
  afterEach(() => cleanup())

  it('shows create and join options when not in a room', () => {
    render(LobbyView)
    expect(screen.getByTestId('create-room-btn')).toBeInTheDocument()
    expect(screen.getByTestId('join-room-form')).toBeInTheDocument()
  })

  it('creates a room and shows the code prominently', async () => {
    render(LobbyView)
    const store = useRoomStore()
    store.api = stubApi() as never

    await fireEvent.update(screen.getByTestId('host-name-input'), 'Host')
    await fireEvent.click(screen.getByTestId('create-room-btn'))

    await waitFor(() => {
      expect(screen.getByTestId('room-code-display')).toHaveTextContent('ABCD')
    })
  })

  it('shows the roster in the lobby after creating', async () => {
    render(LobbyView)
    const store = useRoomStore()
    store.api = stubApi() as never
    await fireEvent.update(screen.getByTestId('host-name-input'), 'Host')
    await fireEvent.click(screen.getByTestId('create-room-btn'))

    await waitFor(() => {
      expect(screen.getByTestId('lobby-roster')).toHaveTextContent('Host')
    })
  })

  it('host sees a start-game button', async () => {
    render(LobbyView)
    const store = useRoomStore()
    store.api = stubApi() as never
    await fireEvent.update(screen.getByTestId('host-name-input'), 'Host')
    await fireEvent.click(screen.getByTestId('create-room-btn'))

    await waitFor(() => {
      expect(screen.getByTestId('start-game-btn')).toBeInTheDocument()
    })
  })

  it('joins a room with a code + name', async () => {
    render(LobbyView)
    const store = useRoomStore()
    store.api = stubApi() as never

    await fireEvent.update(screen.getByTestId('join-code-input'), 'ABCD')
    await fireEvent.update(screen.getByTestId('join-name-input'), 'Bob')
    await fireEvent.click(screen.getByTestId('join-submit-btn'))

    await waitFor(() => {
      expect(screen.getByTestId('room-code-display')).toHaveTextContent('ABCD')
    })
  })

  it('shows an error message when joining an invalid code', async () => {
    render(LobbyView)
    const store = useRoomStore()
    const api = stubApi()
    api.joinRoom = vi
      .fn()
      .mockRejectedValue(Object.assign(new Error('room not found'), { status: 404 }))
    store.api = api as never

    await fireEvent.update(screen.getByTestId('join-code-input'), 'ZZZZ')
    await fireEvent.update(screen.getByTestId('join-name-input'), 'Bob')
    await fireEvent.click(screen.getByTestId('join-submit-btn'))

    await waitFor(() => {
      expect(screen.getByTestId('lobby-error')).toBeInTheDocument()
    })
  })

  it('non-host does not see the start button', async () => {
    render(LobbyView)
    const store = useRoomStore()
    store.api = stubApi() as never
    await fireEvent.update(screen.getByTestId('join-code-input'), 'ABCD')
    await fireEvent.update(screen.getByTestId('join-name-input'), 'Bob')
    await fireEvent.click(screen.getByTestId('join-submit-btn'))

    await waitFor(() => {
      expect(screen.getByTestId('room-code-display')).toBeInTheDocument()
    })
    expect(screen.queryByTestId('start-game-btn')).not.toBeInTheDocument()
  })
})
