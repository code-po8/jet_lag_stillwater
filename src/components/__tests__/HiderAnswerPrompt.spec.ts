import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { render, screen, cleanup, fireEvent } from '@testing-library/vue'
import { createPinia, setActivePinia } from 'pinia'
import { nextTick } from 'vue'
import HiderAnswerPrompt from '../HiderAnswerPrompt.vue'
import { useQuestionStore } from '@/stores/questionStore'
import { useRoomStore } from '@/stores/roomStore'
import { useSync, __resetSyncSession } from '@/composables/useSync'
import { __resetQuestionCurseSync } from '@/composables/useQuestionCurseSync'
import { __resetGeolocation } from '@/composables/useGeolocation'

const RADAR_Q = 'radar-0.5-miles'

describe('HiderAnswerPrompt (QSYNC-005)', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    localStorage.clear()
    __resetSyncSession()
    __resetQuestionCurseSync()
    __resetGeolocation()
  })
  afterEach(() => {
    cleanup()
    __resetSyncSession()
    __resetQuestionCurseSync()
    __resetGeolocation()
  })

  function enterRoom() {
    const room = useRoomStore()
    room.code = 'ABCD'
    room.rejoinToken = 'tok'
    room.self = { id: 'h1', name: 'Hank', role: 'hider', isHost: true, connected: true }
  }

  it('renders nothing when there is no pending question', () => {
    render(HiderAnswerPrompt)
    expect(screen.queryByTestId('hider-answer-prompt')).toBeNull()
  })

  it('shows the pending question text when one is pending', async () => {
    const questions = useQuestionStore()
    questions.askQuestion(RADAR_Q)

    render(HiderAnswerPrompt)
    await nextTick()

    expect(screen.getByTestId('hider-answer-prompt')).toBeInTheDocument()
    const q = questions.getQuestionById(RADAR_Q)!
    expect(screen.getByTestId('hider-answer-question')).toHaveTextContent(q.text)
  })

  it('answers "Yes" via the sync bridge, broadcasting question.answered in a room', async () => {
    enterRoom()
    const questions = useQuestionStore()
    questions.askQuestion(RADAR_Q)

    const sync = useSync()
    const sent: Array<{ kind: string; payload: unknown }> = []
    sync.sendGameEvent = (kind, payload) => sent.push({ kind, payload })

    render(HiderAnswerPrompt)
    await nextTick()
    await fireEvent.click(screen.getByTestId('hider-answer-yes'))

    // Pending cleared locally and recorded.
    expect(questions.pendingQuestion).toBeNull()
    expect(questions.askedQuestions.find((a) => a.questionId === RADAR_Q)?.answer).toBe('Yes')
    // Broadcast to the seeker.
    expect(sent).toEqual([
      { kind: 'question.answered', payload: { questionId: RADAR_Q, answer: 'Yes' } },
    ])
  })

  it('answers "No" via the quick button', async () => {
    const questions = useQuestionStore()
    questions.askQuestion(RADAR_Q)

    render(HiderAnswerPrompt)
    await nextTick()
    await fireEvent.click(screen.getByTestId('hider-answer-no'))

    expect(questions.askedQuestions.find((a) => a.questionId === RADAR_Q)?.answer).toBe('No')
  })

  it('answers with free text and clears the input', async () => {
    const questions = useQuestionStore()
    questions.askQuestion(RADAR_Q)

    render(HiderAnswerPrompt)
    await nextTick()

    const input = screen.getByTestId('hider-answer-input') as HTMLInputElement
    await fireEvent.update(input, '1.2 miles')
    await fireEvent.click(screen.getByTestId('hider-answer-submit'))

    expect(questions.askedQuestions.find((a) => a.questionId === RADAR_Q)?.answer).toBe('1.2 miles')
  })

  it('disables the free-text submit until there is text', async () => {
    const questions = useQuestionStore()
    questions.askQuestion(RADAR_Q)
    render(HiderAnswerPrompt)
    await nextTick()
    expect(screen.getByTestId('hider-answer-submit')).toBeDisabled()
  })

  it('offline (no room) records the answer but does not broadcast', async () => {
    const questions = useQuestionStore()
    questions.askQuestion(RADAR_Q)

    const sync = useSync()
    const sent: unknown[] = []
    sync.sendGameEvent = (kind, payload) => sent.push({ kind, payload })

    render(HiderAnswerPrompt)
    await nextTick()
    await fireEvent.click(screen.getByTestId('hider-answer-yes'))

    expect(questions.pendingQuestion).toBeNull()
    expect(sent).toHaveLength(0)
  })
})
