/**
 * Question & curse sync bridge (MULTI-003b-2, wired into the app in QSYNC-004).
 *
 * Relays local question (ask/re-ask/randomize/answer/veto) and curse-activation
 * actions to the room, and applies inbound ones to the local stores. Reuses the
 * existing questionStore / cardStore (no parallel state).
 *
 * App-singleton (QSYNC-004): mounted once in `GamePlayView` so the `onGameEvent`
 * subscription persists across the SeekerView/HiderView/MapPanel tab switches
 * (they `v-if`-unmount), and so the modal and the view share ONE instance — the
 * modal calls the wrappers, the view owns the inbound subscription. Mirrors
 * `useSync`'s singleton + `__reset*` pattern.
 *
 * Echo safety: applying a remote event sets `applyingRemote`, so the same store
 * action does not re-broadcast. The server also tags events with `from` and
 * never echoes them to the originator.
 *
 * Divergence: a remote event replays a precondition-guarded store action, which
 * can fail if local state differs (e.g. a question is already pending). The
 * action then no-ops; we surface that via `console.warn` so the divergence is
 * diagnosable rather than silent.
 */
import { useRoomStore } from '@/stores/roomStore'
import { useQuestionStore } from '@/stores/questionStore'
import { useCardStore } from '@/stores/cardStore'
import { useSync } from './useSync'
import type { GameEventKind } from '@/services/sync/protocol'

/** Common shape of the precondition-guarded store actions we replay. */
type ApplyResult = { success: boolean; error?: string }

export type QuestionCurseSync = ReturnType<typeof createQuestionCurseSync>

function createQuestionCurseSync() {
  const room = useRoomStore()
  const questions = useQuestionStore()
  const cards = useCardStore()
  const sync = useSync()

  let applyingRemote = false

  function emit(kind: GameEventKind, payload: Record<string, unknown>) {
    if (applyingRemote || !room.inRoom) return
    sync.sendGameEvent(kind, payload)
  }

  // ── Local action wrappers (call these instead of the raw store actions) ──
  function askQuestion(questionId: string) {
    const res = questions.askQuestion(questionId)
    if (res.success) emit('question.asked', { questionId })
    return res
  }
  /**
   * Re-ask (2x card cost, handled in the store). On the wire it is the SAME
   * `question.asked` event — the remote side just needs the pending question to
   * appear; the doubled cost is a hider-local card concern.
   */
  function reaskQuestion(questionId: string) {
    const res = questions.reaskQuestion(questionId)
    if (res.success) emit('question.asked', { questionId })
    return res
  }
  /**
   * Randomize a pending question in-place. The store swaps the pending question
   * to a new id in the same category, so we broadcast a fresh `question.asked`
   * for the NEW id (read back from the store) — the remote pending question then
   * tracks the swap. Returns the store result (carries `newQuestionId`).
   */
  function randomizeQuestion(questionId: string) {
    const res = questions.randomizeQuestion(questionId)
    if (res.success) {
      const newId = questions.pendingQuestion?.questionId ?? res.newQuestionId
      if (newId) emit('question.asked', { questionId: newId })
    }
    return res
  }
  function answerQuestion(questionId: string, answer: string) {
    const res = questions.answerQuestion(questionId, answer)
    if (res.success) emit('question.answered', { questionId, answer })
    return res
  }
  function vetoQuestion(questionId: string) {
    const res = questions.vetoQuestion(questionId)
    if (res.success) emit('question.vetoed', { questionId })
    return res
  }
  function activateCurse(curseId: string) {
    const res = cards.activateCurseManually(curseId)
    if (res.success) emit('curse.activated', { curseId })
    return res
  }
  function triggerTimeTrap(trapInstanceId: string) {
    const res = cards.triggerTimeTrap(trapInstanceId)
    if (res.success) emit('timetrap.triggered', { trapInstanceId })
    return res
  }

  // ── Apply inbound events from other devices ──
  /**
   * Surface a remote event whose local store action did not apply. The relay
   * replays an action (not authoritative state), so a precondition mismatch
   * leaves this device silently out of sync — log it so it is diagnosable.
   */
  function checkApplied(kind: GameEventKind, res: ApplyResult | undefined) {
    if (res && !res.success) {
      console.warn(
        `[sync] remote ${kind} did not apply locally (state diverged): ${res.error ?? 'precondition failed'}`,
      )
    }
  }

  function applyRemoteEvent(kind: GameEventKind, payload: Record<string, unknown>) {
    applyingRemote = true
    try {
      let res: ApplyResult | undefined
      switch (kind) {
        case 'question.asked':
          if (typeof payload.questionId === 'string')
            res = questions.askQuestion(payload.questionId)
          break
        case 'question.answered':
          if (typeof payload.questionId === 'string' && typeof payload.answer === 'string') {
            res = questions.answerQuestion(payload.questionId, payload.answer)
          }
          break
        case 'question.vetoed':
          if (typeof payload.questionId === 'string')
            res = questions.vetoQuestion(payload.questionId)
          break
        case 'curse.activated':
          if (typeof payload.curseId === 'string')
            res = cards.activateCurseManually(payload.curseId)
          break
        case 'curse.cleared':
          // clear-by-instance handled in a later slice; no-op for now.
          break
        case 'timetrap.triggered':
          if (typeof payload.trapInstanceId === 'string') {
            res = cards.triggerTimeTrap(payload.trapInstanceId)
          }
          break
        case 'card.drawn':
          // Card draws are the hider's private hand; seekers do not apply them
          // (server withholds hider-only data). Hider-to-hider sync is a future
          // slice — no-op here to keep cards withheld from seekers.
          break
        case 'timer.sync':
          // Timer alignment uses the dedicated time.sync probe, not this relay.
          break
      }
      checkApplied(kind, res)
    } finally {
      applyingRemote = false
    }
  }

  const stop = sync.onGameEvent(({ kind, payload }) => applyRemoteEvent(kind, payload))

  return {
    askQuestion,
    reaskQuestion,
    randomizeQuestion,
    answerQuestion,
    vetoQuestion,
    activateCurse,
    triggerTimeTrap,
    applyRemoteEvent,
    stopQuestionCurseSync: stop,
  }
}

// App-wide singleton bridge — mounted once in GamePlayView (QSYNC-004). Both the
// mount point (owns the inbound subscription) and AskQuestionModal (calls the
// wrappers) share this instance.
let singleton: QuestionCurseSync | null = null

export function useQuestionCurseSync(): QuestionCurseSync {
  if (!singleton) singleton = createQuestionCurseSync()
  return singleton
}

/**
 * Test/teardown helper to reset the singleton. Also un-subscribes the previous
 * instance's `onGameEvent` handler so a fresh session doesn't accumulate stale
 * subscribers (mirrors `__resetSyncSession`).
 */
export function __resetQuestionCurseSync(): void {
  singleton?.stopQuestionCurseSync()
  singleton = null
}
