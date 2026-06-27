/**
 * Question & curse sync bridge (MULTI-003b-2).
 *
 * Relays local question (ask/answer/veto) and curse-activation actions to the
 * room, and applies inbound ones to the local stores. Reuses the existing
 * questionStore / cardStore (no parallel state).
 *
 * Echo safety: applying a remote event sets `applyingRemote`, so the same store
 * action does not re-broadcast. The server also tags events with `from` and
 * never echoes them to the originator.
 */
import { useRoomStore } from '@/stores/roomStore'
import { useQuestionStore } from '@/stores/questionStore'
import { useCardStore } from '@/stores/cardStore'
import { useSync } from './useSync'
import type { GameEventKind } from '@/services/sync/protocol'

export function useQuestionCurseSync() {
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

  // ── Apply inbound events from other devices ──
  function applyRemoteEvent(kind: GameEventKind, payload: Record<string, unknown>) {
    applyingRemote = true
    try {
      switch (kind) {
        case 'question.asked':
          if (typeof payload.questionId === 'string') questions.askQuestion(payload.questionId)
          break
        case 'question.answered':
          if (typeof payload.questionId === 'string' && typeof payload.answer === 'string') {
            questions.answerQuestion(payload.questionId, payload.answer)
          }
          break
        case 'question.vetoed':
          if (typeof payload.questionId === 'string') questions.vetoQuestion(payload.questionId)
          break
        case 'curse.activated':
          if (typeof payload.curseId === 'string') cards.activateCurseManually(payload.curseId)
          break
        case 'curse.cleared':
          // clear-by-instance handled in a later slice; no-op for now.
          break
      }
    } finally {
      applyingRemote = false
    }
  }

  const stop = sync.onGameEvent(({ kind, payload }) => applyRemoteEvent(kind, payload))

  return {
    askQuestion,
    answerQuestion,
    vetoQuestion,
    activateCurse,
    applyRemoteEvent,
    stopQuestionCurseSync: stop,
  }
}
