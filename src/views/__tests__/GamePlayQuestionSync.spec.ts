import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { ref, nextTick } from 'vue'
import { render, screen, cleanup } from '@testing-library/vue'
import { createPinia, setActivePinia } from 'pinia'
import GamePlayView from '../GamePlayView.vue'
import { useGameStore, GamePhase } from '@/stores/gameStore'
import { useRoomStore } from '@/stores/roomStore'
import { useQuestionStore } from '@/stores/questionStore'
import { createSyncSession, __resetSyncSession, __setSyncSession } from '@/composables/useSync'
import { __resetQuestionCurseSync } from '@/composables/useQuestionCurseSync'
import type { SyncService, SyncStatus } from '@/services/sync/syncService'
import type { ClientMessage, ServerMessage } from '@/services/sync/protocol'

vi.mock('vue-router', () => ({
  useRouter: () => ({ push: vi.fn() }),
  RouterLink: { template: '<a><slot /></a>' },
}))

const RADAR_Q = 'radar-0.5-miles'

/** A controllable fake SyncService whose `emit` delivers inbound server msgs. */
function fakeService() {
  const handlers = new Set<(m: ServerMessage) => void>()
  const status = ref<SyncStatus>('connected')
  const sent: ClientMessage[] = []
  const svc: SyncService = {
    status,
    connect: vi.fn(async () => {
      status.value = 'connected'
    }),
    disconnect: vi.fn(() => {
      status.value = 'disconnected'
    }),
    send: vi.fn((m: ClientMessage) => sent.push(m)),
    onMessage: vi.fn((h) => {
      handlers.add(h)
      return () => handlers.delete(h)
    }),
  }
  return { svc, sent, emit: (m: ServerMessage) => handlers.forEach((h) => h(m)) }
}

/**
 * QSYNC-004 regression: the question/curse sync bridge must be MOUNTED by the
 * live app. Historically it was built and unit-tested but wired into no view, so
 * asks never broadcast and the hider never received them. Mounting GamePlayView
 * must activate the bridge so a relayed `game.event` — delivered through the
 * REAL useSync inbound dispatch — applies to the local questionStore.
 */
describe('GamePlayView question sync integration (QSYNC-004)', () => {
  let f: ReturnType<typeof fakeService>

  beforeEach(() => {
    setActivePinia(createPinia())
    localStorage.clear()
    __resetSyncSession()
    __resetQuestionCurseSync()
    // Install a sync singleton wired to a controllable fake service, then open
    // the connection so its onMessage handler is registered.
    f = fakeService()
    const session = createSyncSession({ service: f.svc })
    __setSyncSession(session)
    void session.connect({ url: 'ws://x/ws', code: 'ABCD', rejoinToken: 'tok' })
  })
  afterEach(() => {
    cleanup()
    __resetSyncSession()
    __resetQuestionCurseSync()
  })

  function enterRoomSeeking(role: 'seeker' | 'hider') {
    const game = useGameStore()
    game.currentPhase = GamePhase.Seeking
    const room = useRoomStore()
    room.code = 'ABCD'
    room.rejoinToken = 'tok'
    room.self = { id: 'p1', name: 'Pat', role, isHost: false, connected: true }
  }

  /** A relayed game event as the server broadcasts it (tagged with `from`). */
  function relayGameEvent(kind: string, payload: Record<string, unknown>) {
    f.emit({ t: 'game.event', kind, from: 'other', payload } as ServerMessage)
  }

  it('mounts the bridge so an inbound relayed question.asked reaches the hider store', () => {
    enterRoomSeeking('hider')
    const questions = useQuestionStore()

    render(GamePlayView)
    expect(questions.pendingQuestion).toBeNull()

    // The server relays a seeker's ask to this hider device.
    relayGameEvent('question.asked', { questionId: RADAR_Q })

    expect(questions.pendingQuestion?.questionId).toBe(RADAR_Q)
  })

  it('without mounting the view, the same relay is a no-op (the mount is load-bearing)', () => {
    enterRoomSeeking('hider')
    const questions = useQuestionStore()

    // No render(GamePlayView): the bridge is never mounted/subscribed.
    relayGameEvent('question.asked', { questionId: RADAR_Q })

    expect(questions.pendingQuestion).toBeNull()
  })

  it('round-trips ask then answer over the inbound relay after mount', () => {
    enterRoomSeeking('hider')
    const questions = useQuestionStore()

    render(GamePlayView)
    relayGameEvent('question.asked', { questionId: RADAR_Q })
    relayGameEvent('question.answered', { questionId: RADAR_Q, answer: 'no' })

    expect(questions.pendingQuestion).toBeNull()
    expect(questions.askedQuestions.some((q) => q.questionId === RADAR_Q)).toBe(true)
  })

  // ── QSYNC-006: the hider is alerted on ANY tab, not just Cards ──

  it('shows the hider answer prompt on the default (Questions) tab when a question arrives', async () => {
    enterRoomSeeking('hider')
    render(GamePlayView)
    // Default tab is Questions — the prompt used to live in the Cards-only
    // HiderView, so it was invisible here. It must now be visible regardless.
    expect(screen.queryByTestId('hider-answer-prompt')).toBeNull()

    relayGameEvent('question.asked', { questionId: RADAR_Q })
    await nextTick()

    expect(screen.getByTestId('hider-answer-prompt')).toBeInTheDocument()
  })

  it('badges the Cards nav tab while a question is pending for the hider', async () => {
    enterRoomSeeking('hider')
    render(GamePlayView)
    expect(screen.queryByTestId('nav-badge-cards')).toBeNull()

    relayGameEvent('question.asked', { questionId: RADAR_Q })
    await nextTick()
    expect(screen.getByTestId('nav-badge-cards')).toBeInTheDocument()

    // Answered → prompt and badge clear.
    relayGameEvent('question.answered', { questionId: RADAR_Q, answer: 'no' })
    await nextTick()
    expect(screen.queryByTestId('hider-answer-prompt')).toBeNull()
    expect(screen.queryByTestId('nav-badge-cards')).toBeNull()
  })

  it('does NOT show the hider prompt or badge to a seeker', async () => {
    enterRoomSeeking('seeker')
    const questions = useQuestionStore()
    render(GamePlayView)

    // A seeker on this device asks locally (pending set), but the seeker must not
    // see the hider-answer surface.
    questions.askQuestion(RADAR_Q)
    await nextTick()

    expect(screen.queryByTestId('hider-answer-prompt')).toBeNull()
    expect(screen.queryByTestId('nav-badge-cards')).toBeNull()
  })
})
