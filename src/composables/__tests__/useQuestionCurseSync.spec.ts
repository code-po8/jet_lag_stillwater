import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useQuestionCurseSync, __resetQuestionCurseSync } from '../useQuestionCurseSync'
import { useRoomStore } from '@/stores/roomStore'
import { useQuestionStore } from '@/stores/questionStore'
import { useSync, __resetSyncSession } from '@/composables/useSync'
import { useGeolocation, __resetGeolocation } from '@/composables/useGeolocation'

// A real radar question id from the data set.
const RADAR_Q = 'radar-0.5-miles'

describe('useQuestionCurseSync (MULTI-003b-2)', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    localStorage.clear()
    __resetSyncSession()
    __resetQuestionCurseSync()
    __resetGeolocation()
  })
  afterEach(() => {
    __resetSyncSession()
    __resetQuestionCurseSync()
    __resetGeolocation()
  })

  function enterRoom() {
    const room = useRoomStore()
    room.code = 'ABCD'
    room.rejoinToken = 'tok'
    room.self = { id: 's1', name: 'Sue', role: 'seeker', isHost: false, connected: true }
  }

  /** Seed the singleton tracker's live position (as if a GPS fix arrived). */
  function setOwnPosition(lat: number, lng: number) {
    useGeolocation().ownPosition.value = { lat, lng, accuracy: 5, ts: 1000 }
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

  it('warns when a remote event fails to apply locally (silent divergence)', () => {
    enterRoom()
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const bridge = useQuestionCurseSync()

    // First ask succeeds and leaves a pending question; a second remote ask
    // (different id) fails its precondition ("a question is already pending").
    // The relay replays an action, so the failure would otherwise be silent —
    // assert it is surfaced so divergence is diagnosable.
    bridge.applyRemoteEvent('question.asked', { questionId: RADAR_Q })
    bridge.applyRemoteEvent('question.asked', { questionId: 'radar-1-mile' })

    expect(warn).toHaveBeenCalled()
    expect(warn.mock.calls.some((c) => String(c[0]).includes('question.asked'))).toBe(true)
    warn.mockRestore()
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

  // ── QSYNC-005: both devices may answer; the second answer is a safe no-op ──

  it('a stale second answer (both devices answered) is a safe no-op', () => {
    // The hider answers in-app AND the seeker manually enters an answer: whoever
    // is first clears the pending question; the second answer must not throw,
    // double-record, or re-broadcast (nothing pending → answerQuestion no-ops).
    enterRoom()
    const questions = useQuestionStore()
    const sync = useSync()
    const sent: unknown[] = []
    const bridge = useQuestionCurseSync()

    bridge.askQuestion(RADAR_Q)
    bridge.answerQuestion(RADAR_Q, 'Yes') // first answer wins
    // Start counting emits AFTER the first (legitimate) answer.
    sync.sendGameEvent = (kind, payload) => sent.push({ kind, payload })

    const res = bridge.answerQuestion(RADAR_Q, 'No') // stale second answer
    expect(res.success).toBe(false)
    expect(sent).toHaveLength(0)
    // The recorded answer is the FIRST one; not overwritten or duplicated.
    const recorded = questions.askedQuestions.filter((q) => q.questionId === RADAR_Q)
    expect(recorded).toHaveLength(1)
    expect(recorded[0]!.answer).toBe('Yes')
  })

  it('an inbound remote answer with nothing pending is a safe no-op', () => {
    enterRoom()
    const questions = useQuestionStore()
    const bridge = useQuestionCurseSync()
    // No pending question locally (e.g. already answered) — applying a relayed
    // answer must not throw or create a phantom asked-question.
    expect(() =>
      bridge.applyRemoteEvent('question.answered', { questionId: RADAR_Q, answer: 'Yes' }),
    ).not.toThrow()
    expect(questions.askedQuestions).toHaveLength(0)
  })

  // ── QSYNC-004: singleton + reask/randomize wrappers ──

  it('useQuestionCurseSync returns the SAME instance (app-singleton)', () => {
    const a = useQuestionCurseSync()
    const b = useQuestionCurseSync()
    expect(a).toBe(b)
  })

  it('__resetQuestionCurseSync clears the singleton', () => {
    const a = useQuestionCurseSync()
    __resetQuestionCurseSync()
    const b = useQuestionCurseSync()
    expect(a).not.toBe(b)
  })

  it('emits question.asked when a re-ask succeeds in a room', () => {
    enterRoom()
    const sync = useSync()
    const sent: Array<{ kind: string; payload: unknown }> = []
    sync.sendGameEvent = (kind, payload) => sent.push({ kind, payload })

    const bridge = useQuestionCurseSync()
    // Re-ask requires the question to have been asked AND answered before, so
    // establish that precondition first, then clear the sent log.
    bridge.askQuestion(RADAR_Q)
    bridge.answerQuestion(RADAR_Q, 'yes')
    sent.length = 0

    // A re-ask replays the ask (2x cost handled in the store); on the wire it is
    // the same question.asked event so the hider sees the pending question.
    const res = bridge.reaskQuestion(RADAR_Q)
    expect(res.success).toBe(true)
    expect(sent).toEqual([{ kind: 'question.asked', payload: { questionId: RADAR_Q } }])
  })

  it('emits question.asked with the NEW id when a randomize succeeds in a room', () => {
    enterRoom()
    const questions = useQuestionStore()
    const sync = useSync()
    const sent: Array<{ kind: string; payload: Record<string, unknown> }> = []
    sync.sendGameEvent = (kind, payload) => sent.push({ kind, payload })

    const bridge = useQuestionCurseSync()
    // Randomize needs a pending question first.
    bridge.askQuestion(RADAR_Q)
    sent.length = 0

    const res = bridge.randomizeQuestion(RADAR_Q)
    expect(res.success).toBe(true)
    // The pending question is now a different radar question, broadcast so the
    // hider's pending question tracks the swap.
    expect(sent).toHaveLength(1)
    expect(sent[0]!.kind).toBe('question.asked')
    const newId = questions.pendingQuestion!.questionId
    expect(sent[0]!.payload).toEqual({ questionId: newId })
    expect(newId).not.toBe(RADAR_Q)
  })

  // ── MAP-009: ask-time position (askedFrom) ──

  it('includes askedFrom in the emit payload and on the pending question', () => {
    enterRoom()
    setOwnPosition(36.12, -97.07)
    const sync = useSync()
    const questions = useQuestionStore()
    const sent: Array<{ kind: string; payload: Record<string, unknown> }> = []
    sync.sendGameEvent = (kind, payload) => sent.push({ kind, payload })

    const bridge = useQuestionCurseSync()
    bridge.askQuestion(RADAR_Q)

    expect(sent).toEqual([
      {
        kind: 'question.asked',
        payload: { questionId: RADAR_Q, askedFrom: { lat: 36.12, lng: -97.07 } },
      },
    ])
    expect(questions.pendingQuestion?.askedFrom).toEqual({ lat: 36.12, lng: -97.07 })
  })

  it('omits askedFrom when there is no GPS fix', () => {
    enterRoom()
    // No setOwnPosition — ownPosition is null.
    const sync = useSync()
    const sent: Array<{ kind: string; payload: Record<string, unknown> }> = []
    sync.sendGameEvent = (kind, payload) => sent.push({ kind, payload })

    const bridge = useQuestionCurseSync()
    bridge.askQuestion(RADAR_Q)

    expect(sent).toEqual([{ kind: 'question.asked', payload: { questionId: RADAR_Q } }])
  })

  it('applies an inbound askedFrom to the local (hider) store', () => {
    enterRoom()
    const questions = useQuestionStore()
    const bridge = useQuestionCurseSync()

    bridge.applyRemoteEvent('question.asked', {
      questionId: RADAR_Q,
      askedFrom: { lat: 36.5, lng: -97.5 },
    })

    expect(questions.pendingQuestion?.askedFrom).toEqual({ lat: 36.5, lng: -97.5 })
  })

  it('a hider applying a remote ask does NOT stamp its OWN position over the wire value', () => {
    enterRoom()
    // This device (the hider) has its own GPS fix, which must be ignored when
    // applying a remote ask — the ask-time position is the SEEKER's, from the wire.
    setOwnPosition(1, 1)
    const questions = useQuestionStore()
    const bridge = useQuestionCurseSync()

    bridge.applyRemoteEvent('question.asked', {
      questionId: RADAR_Q,
      askedFrom: { lat: 36.5, lng: -97.5 },
    })

    expect(questions.pendingQuestion?.askedFrom).toEqual({ lat: 36.5, lng: -97.5 })
  })

  it('ignores a malformed inbound askedFrom (ask still applies)', () => {
    enterRoom()
    const questions = useQuestionStore()
    const bridge = useQuestionCurseSync()

    bridge.applyRemoteEvent('question.asked', {
      questionId: RADAR_Q,
      askedFrom: { lat: 'nope' },
    })

    expect(questions.pendingQuestion?.questionId).toBe(RADAR_Q)
    expect(questions.pendingQuestion?.askedFrom).toBeUndefined()
  })
})
