import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useQuestionCurseSync } from '../useQuestionCurseSync'
import { useRoomStore } from '@/stores/roomStore'
import { useQuestionStore } from '@/stores/questionStore'
import { useSync, __resetSyncSession } from '@/composables/useSync'

// A real radar question id from the data set.
const RADAR_Q = 'radar-0.5-miles'

describe('useQuestionCurseSync (MULTI-003b-2)', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    localStorage.clear()
    __resetSyncSession()
  })
  afterEach(() => {
    __resetSyncSession()
  })

  function enterRoom() {
    const room = useRoomStore()
    room.code = 'ABCD'
    room.rejoinToken = 'tok'
    room.self = { id: 's1', name: 'Sue', role: 'seeker', isHost: false, connected: true }
  }

  it('emits question.asked when a local ask succeeds in a room', () => {
    enterRoom()
    const sync = useSync()
    const sent: Array<{ kind: string; payload: unknown }> = []
    sync.sendGameEvent = (kind, payload) => sent.push({ kind, payload })

    const bridge = useQuestionCurseSync()
    bridge.askQuestion(RADAR_Q)

    expect(sent).toEqual([{ kind: 'question.asked', payload: { questionId: RADAR_Q } }])
  })

  it('does NOT emit when offline (no room)', () => {
    const sync = useSync()
    const sent: unknown[] = []
    sync.sendGameEvent = (kind, payload) => sent.push({ kind, payload })

    const bridge = useQuestionCurseSync()
    bridge.askQuestion(RADAR_Q)
    expect(sent).toHaveLength(0)
  })

  it('applies an inbound question.asked to the local store', () => {
    enterRoom()
    const questions = useQuestionStore()
    const bridge = useQuestionCurseSync()

    bridge.applyRemoteEvent('question.asked', { questionId: RADAR_Q })
    expect(questions.pendingQuestion?.questionId).toBe(RADAR_Q)
  })

  it('applying a remote event does NOT re-emit (echo guard)', () => {
    enterRoom()
    const sync = useSync()
    const sent: unknown[] = []
    sync.sendGameEvent = (kind, payload) => sent.push({ kind, payload })

    const bridge = useQuestionCurseSync()
    bridge.applyRemoteEvent('question.asked', { questionId: RADAR_Q })
    expect(sent).toHaveLength(0)
  })

  it('applying a remote time-trap event does not re-emit (echo guard)', () => {
    enterRoom()
    const sync = useSync()
    const sent: unknown[] = []
    sync.sendGameEvent = (kind, payload) => sent.push({ kind, payload })

    const bridge = useQuestionCurseSync()
    // Unknown trap id is a no-op in the store, but the echo guard must still
    // prevent any outbound emit while applying a remote event.
    bridge.applyRemoteEvent('timetrap.triggered', { trapInstanceId: 'nope' })
    expect(sent).toHaveLength(0)
  })

  it('does not apply card.drawn for seekers (cards withheld)', () => {
    enterRoom()
    const bridge = useQuestionCurseSync()
    // Should be a no-op and not throw.
    expect(() => bridge.applyRemoteEvent('card.drawn', { cardId: 'x' })).not.toThrow()
  })

  it('round-trips ask then answer through the bridge', () => {
    enterRoom()
    const questions = useQuestionStore()
    const bridge = useQuestionCurseSync()

    bridge.applyRemoteEvent('question.asked', { questionId: RADAR_Q })
    bridge.applyRemoteEvent('question.answered', { questionId: RADAR_Q, answer: 'yes' })
    expect(questions.pendingQuestion).toBeNull()
    expect(questions.askedQuestions.some((q) => q.questionId === RADAR_Q)).toBe(true)
  })
})
