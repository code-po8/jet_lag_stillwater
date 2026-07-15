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
import { useGeolocation } from './useGeolocation'
import type { GameEventKind } from '@/services/sync/protocol'

/** Common shape of the precondition-guarded store actions we replay. */
type ApplyResult = { success: boolean; error?: string }

/** A bare lat/lng — the ask-time position stamped on a question (MAP-009). */
type LatLng = { lat: number; lng: number }

/**
 * Validate an inbound `askedFrom` payload field (untyped over the wire) into a
 * LatLng, or undefined if absent/malformed — a bad position must not block the
 * ask from applying.
 */
function parseAskedFrom(raw: unknown): LatLng | undefined {
  if (!raw || typeof raw !== 'object') return undefined
  const { lat, lng } = raw as Record<string, unknown>
  if (typeof lat !== 'number' || typeof lng !== 'number') return undefined
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return undefined
  return { lat, lng }
}

/**
 * Validate an inbound thermometer vector endpoint (issue #29). A malformed
 * coordinate must not corrupt the pending question, so return undefined and let
 * the caller drop the whole vector.
 */
function parseLatLng(raw: unknown): LatLng | undefined {
  return parseAskedFrom(raw)
}

export type QuestionCurseSync = ReturnType<typeof createQuestionCurseSync>

function createQuestionCurseSync() {
  const room = useRoomStore()
  const questions = useQuestionStore()
  const cards = useCardStore()
  const sync = useSync()
  const geo = useGeolocation()

  let applyingRemote = false

  function emit(kind: GameEventKind, payload: Record<string, unknown>) {
    if (applyingRemote || !room.inRoom) return
    sync.sendGameEvent(kind, payload)
  }

  /**
   * The LOCAL asker's ask-time position (MAP-009): the seeker's own live GPS at
   * the moment they ask. Undefined offline / before a fix. Read only for locally
   * originated asks — a remote apply uses the position from the wire instead, so
   * the hider never overwrites it with their own location.
   */
  function ownAskedFrom(): LatLng | undefined {
    const p = geo.ownPosition.value
    return p ? { lat: p.lat, lng: p.lng } : undefined
  }

  // ── Local action wrappers (call these instead of the raw store actions) ──
  function askQuestion(questionId: string) {
    const askedFrom = ownAskedFrom()
    const res = questions.askQuestion(questionId, askedFrom)
    if (res.success) emit('question.asked', { questionId, ...(askedFrom ? { askedFrom } : {}) })
    return res
  }
  /**
   * Re-ask (2x card cost, handled in the store). On the wire it is the SAME
   * `question.asked` event — the remote side just needs the pending question to
   * appear; the doubled cost is a hider-local card concern. A re-ask is a fresh
   * ask, so it carries its own ask-time position (MAP-009).
   */
  function reaskQuestion(questionId: string) {
    const askedFrom = ownAskedFrom()
    const res = questions.reaskQuestion(questionId, askedFrom)
    if (res.success) emit('question.asked', { questionId, ...(askedFrom ? { askedFrom } : {}) })
    return res
  }
  /**
   * Randomize a pending question in-place. The store swaps the pending question
   * to a new id in the same category, so we broadcast a fresh `question.asked`
   * for the NEW id (read back from the store) — the remote pending question then
   * tracks the swap. The randomized question keeps the original's ask-time
   * position (the store preserves it), which we re-broadcast so the hider's pin
   * follows the swap. Returns the store result (carries `newQuestionId`).
   */
  function randomizeQuestion(questionId: string) {
    const res = questions.randomizeQuestion(questionId)
    if (res.success) {
      const pending = questions.pendingQuestion
      const newId = pending?.questionId ?? res.newQuestionId
      if (newId) {
        const askedFrom = pending?.askedFrom
        emit('question.asked', { questionId: newId, ...(askedFrom ? { askedFrom } : {}) })
      }
    }
    return res
  }
  function answerQuestion(questionId: string, answer: string) {
    const res = questions.answerQuestion(questionId, answer)
    if (res.success) emit('question.answered', { questionId, answer })
    return res
  }
  /**
   * Attach a thermometer travel vector to a question and broadcast it (issue
   * #29). The seeker places the start/end pins on their map after asking; this
   * stamps them locally and relays `question.vector` so the hider's map shows the
   * two pins + travel arrow.
   */
  function setThermometerVector(questionId: string, start: LatLng, end: LatLng) {
    const res = questions.setThermometerVector(questionId, start, end)
    if (res.success) emit('question.vector', { questionId, start, end })
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
            // Carry the asker's ask-time position from the wire (MAP-009) so the
            // hider pins where the question was measured from. Missing/malformed
            // → undefined, and the ask still applies.
            res = questions.askQuestion(payload.questionId, parseAskedFrom(payload.askedFrom))
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
        case 'question.vector': {
          // Thermometer travel vector from the seeker (issue #29). Both endpoints
          // must be valid; a malformed one drops the whole vector rather than
          // stamping a half-vector the hider can't interpret.
          const s = parseLatLng(payload.start)
          const e = parseLatLng(payload.end)
          if (typeof payload.questionId === 'string' && s && e)
            res = questions.setThermometerVector(payload.questionId, s, e)
          break
        }
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
    setThermometerVector,
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
