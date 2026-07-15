<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useQuestionStore } from '@/stores/questionStore'
import { useQuestionCurseSync } from '@/composables/useQuestionCurseSync'
import { getCategoryById, type Question } from '@/types/question'

interface Props {
  question: Question | null
  isReask?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  isReask: false,
})

const emit = defineEmits<{
  cancel: []
  close: []
  asked: [{ questionId: string; cardsDraw: number; cardsKeep: number }]
  answered: [{ questionId: string; answer: string }]
  remoteAnswered: [{ questionId: string; answer: string }]
  cardDraw: [{ cardsDraw: number; cardsKeep: number }]
  vetoed: [{ questionId: string }]
  randomized: [{ originalQuestionId: string; newQuestionId: string }]
}>()

const questionStore = useQuestionStore()
// Route question actions through the sync bridge (QSYNC-004) so they broadcast
// to the room (ask/re-ask/randomize/answer/veto). The bridge wraps the same
// questionStore actions and only emits when in a room, so offline play is
// unchanged. `questionStore` is still used directly for read-only lookups
// (pendingQuestion / getQuestionById) below.
const questionSync = useQuestionCurseSync()

// State for answer input
const answerText = ref('')
const showConfirmation = ref(false)
const confirmationMessage = ref('')
// True once the seeker submits an answer from THIS modal, so the pendingQuestion
// watcher can distinguish a local answer from a remote one (issue #25).
const answeredLocally = ref(false)

// Get category info for the question
const category = computed(() => {
  if (!props.question) return null
  return getCategoryById(props.question.categoryId)
})

// Get draw/keep values, doubled if isReask
const cardsDraw = computed(() => {
  if (!category.value) return 0
  return props.isReask ? category.value.cardsDraw * 2 : category.value.cardsDraw
})

const cardsKeep = computed(() => {
  if (!category.value) return 0
  return props.isReask ? category.value.cardsKeep * 2 : category.value.cardsKeep
})

// Check if this question is already pending (to show answer mode directly)
const isAlreadyPending = computed(() => {
  return questionStore.pendingQuestion?.questionId === props.question?.id
})

// Get the currently displayed question (may differ from prop after randomize)
const displayedQuestion = computed(() => {
  // If there's a pending question in the store that matches our initial question's category,
  // use the pending question (it may have been randomized)
  if (
    questionStore.pendingQuestion &&
    props.question &&
    questionStore.pendingQuestion.categoryId === props.question.categoryId
  ) {
    return questionStore.getQuestionById(questionStore.pendingQuestion.questionId)
  }
  return props.question
})

// Show answer section when question is pending
const showAnswerSection = computed(() => {
  return isAlreadyPending.value || showConfirmation.value
})

// Reset state when question changes
watch(
  () => props.question,
  () => {
    answerText.value = ''
    showConfirmation.value = false
    confirmationMessage.value = ''
    answeredLocally.value = false
  },
)

// Remote-answer sync (issue #25): while the seeker's modal is open awaiting the
// answer, the hider may answer on their device. That arrives as a store mutation
// (pendingQuestion cleared, answer pushed to askedQuestions). Detect the pending
// question for THIS modal disappearing without a local submit, surface the
// received answer, and ask the parent to close — instead of silently reverting
// to the "Ask" prompt.
watch(
  () => questionStore.pendingQuestion,
  (pending, prev) => {
    // Only react to a pending question being CLEARED (not asked/randomized).
    if (pending !== null || prev === null) return
    // Ignore our own local submit — handleSubmitAnswer already closed the modal.
    if (answeredLocally.value) return
    // Only if the question that cleared is the one this modal is showing.
    if (!props.question || prev.questionId !== props.question.id) return

    // Only treat this as a remote ANSWER if the question actually landed in
    // askedQuestions with an answer. A local veto also clears pendingQuestion but
    // records no answer — leave its existing in-modal confirmation flow alone.
    const answered = questionStore.askedQuestions.find(
      (q) => q.questionId === prev.questionId && !q.vetoed,
    )
    if (!answered) return

    confirmationMessage.value = `Hider answered: ${answered.answer}`
    emit('remoteAnswered', { questionId: prev.questionId, answer: answered.answer })
    emit('close')
  },
)

function handleCancel() {
  emit('cancel')
}

function handleAsk() {
  if (!props.question || !category.value) return

  // Use reaskQuestion for re-asks, askQuestion for normal asks. Routed through
  // the sync bridge so the ask broadcasts to the room (QSYNC-004).
  const result = props.isReask
    ? questionSync.reaskQuestion(props.question.id)
    : questionSync.askQuestion(props.question.id)

  if (result.success) {
    showConfirmation.value = true
    confirmationMessage.value = props.isReask
      ? "Question re-asked (2x cost)! Waiting for hider's response."
      : "Question asked! Waiting for hider's response."
    emit('asked', {
      questionId: props.question.id,
      cardsDraw: result.cardsDraw!,
      cardsKeep: result.cardsKeep!,
    })
  }
}

function handleSubmitAnswer() {
  if (!displayedQuestion.value || !category.value) return

  // Guard empty answers: recording a blank answer silently loses the question
  // (issue #25). Do nothing until the seeker types something.
  const answer = answerText.value.trim()
  if (!answer) return

  const result = questionSync.answerQuestion(displayedQuestion.value.id, answer)
  if (result.success) {
    // Mark this as a locally-driven answer so the pendingQuestion watcher does
    // not also treat the resulting clear as a remote answer.
    answeredLocally.value = true
    confirmationMessage.value = 'Answer recorded! Hider draws cards.'
    emit('answered', {
      questionId: displayedQuestion.value.id,
      answer,
    })
    emit('cardDraw', {
      cardsDraw: cardsDraw.value,
      cardsKeep: cardsKeep.value,
    })
    // Close the modal so the seeker returns to the question menu (issue #25:
    // previously the modal stayed open and appeared to do nothing on submit).
    emit('close')
  }
}

function handleVeto() {
  if (!displayedQuestion.value || !category.value) return

  const result = questionSync.vetoQuestion(displayedQuestion.value.id)
  if (result.success) {
    confirmationMessage.value = 'Question vetoed! Returned to available.'
    emit('vetoed', {
      questionId: displayedQuestion.value.id,
    })
    emit('cardDraw', {
      cardsDraw: result.cardsDraw!,
      cardsKeep: result.cardsKeep!,
    })
  }
}

function handleRandomize() {
  if (!displayedQuestion.value) return

  const originalId = displayedQuestion.value.id
  const result = questionSync.randomizeQuestion(originalId)
  if (result.success) {
    confirmationMessage.value = 'Question randomized! Answer the new question.'
    emit('randomized', {
      originalQuestionId: originalId,
      newQuestionId: result.newQuestionId!,
    })
  }
}
</script>

<template>
  <div
    v-if="displayedQuestion && category"
    data-testid="ask-question-modal"
    class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
  >
    <div class="w-full max-w-md rounded-lg bg-white shadow-xl">
      <!-- Header -->
      <div class="border-b border-gray-200 px-6 py-4">
        <div class="flex items-center justify-between">
          <div>
            <span class="text-lg font-semibold">{{ category.name }}</span>
            <span
              v-if="isReask"
              class="ml-2 rounded bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700"
            >
              Re-ask (2x cost)
            </span>
          </div>
          <div class="text-right text-sm text-gray-600">
            <div>Draw {{ cardsDraw }}</div>
            <div>Keep {{ cardsKeep }}</div>
          </div>
        </div>
      </div>

      <!-- Content -->
      <div class="px-6 py-4">
        <p class="mb-4 text-gray-800">{{ displayedQuestion.text }}</p>

        <!-- Confirmation message -->
        <div
          v-if="confirmationMessage"
          class="mb-4 rounded-md bg-green-50 p-3 text-sm text-green-800"
        >
          {{ confirmationMessage }}
        </div>

        <!-- Answer section (shown after question is asked) -->
        <div v-if="showAnswerSection" data-testid="answer-section" class="space-y-3">
          <label class="block text-sm font-medium text-gray-700">Record the answer:</label>
          <input
            v-model="answerText"
            type="text"
            placeholder="Enter the hider's answer..."
            class="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
      </div>

      <!-- Footer / Actions -->
      <div
        class="flex flex-col gap-3 border-t border-gray-200 px-6 py-4 sm:flex-row sm:flex-wrap sm:justify-end"
      >
        <template v-if="!showAnswerSection">
          <button
            type="button"
            class="min-h-11 rounded-md border border-gray-300 bg-white px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50"
            @click="handleCancel"
          >
            Cancel
          </button>
          <button
            type="button"
            class="min-h-11 rounded-md bg-blue-600 px-4 py-3 text-sm font-medium text-white hover:bg-blue-700"
            @click="handleAsk"
          >
            Ask
          </button>
        </template>
        <template v-else>
          <button
            type="button"
            class="min-h-11 rounded-md border border-orange-300 bg-orange-50 px-4 py-3 text-sm font-medium text-orange-700 hover:bg-orange-100"
            @click="handleVeto"
          >
            Veto
          </button>
          <button
            type="button"
            class="min-h-11 rounded-md border border-purple-300 bg-purple-50 px-4 py-3 text-sm font-medium text-purple-700 hover:bg-purple-100"
            @click="handleRandomize"
          >
            Randomize
          </button>
          <button
            type="button"
            class="min-h-11 rounded-md bg-blue-600 px-4 py-3 text-sm font-medium text-white hover:bg-blue-700"
            @click="handleSubmitAnswer"
          >
            Submit Answer
          </button>
        </template>
      </div>
    </div>
  </div>
</template>
