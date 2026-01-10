<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useQuestionStore } from '@/stores/questionStore'
import { getCategoryById, type Question } from '@/types/question'

interface Props {
  question: Question | null
}

const props = defineProps<Props>()

const emit = defineEmits<{
  cancel: []
  asked: [{ questionId: string; cardsDraw: number; cardsKeep: number }]
  answered: [{ questionId: string; answer: string }]
}>()

const questionStore = useQuestionStore()

// State for answer input
const answerText = ref('')
const showConfirmation = ref(false)

// Get category info for the question
const category = computed(() => {
  if (!props.question) return null
  return getCategoryById(props.question.categoryId)
})

// Check if this question is already pending (to show answer mode directly)
const isAlreadyPending = computed(() => {
  return questionStore.pendingQuestion?.questionId === props.question?.id
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
  },
)

function handleCancel() {
  emit('cancel')
}

function handleAsk() {
  if (!props.question || !category.value) return

  const result = questionStore.askQuestion(props.question.id)
  if (result.success) {
    showConfirmation.value = true
    emit('asked', {
      questionId: props.question.id,
      cardsDraw: result.cardsDraw!,
      cardsKeep: result.cardsKeep!,
    })
  }
}

function handleSubmitAnswer() {
  if (!props.question) return

  const result = questionStore.answerQuestion(props.question.id, answerText.value)
  if (result.success) {
    emit('answered', {
      questionId: props.question.id,
      answer: answerText.value,
    })
  }
}
</script>

<template>
  <div
    v-if="question && category"
    data-testid="ask-question-modal"
    class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
  >
    <div class="w-full max-w-md rounded-lg bg-white shadow-xl">
      <!-- Header -->
      <div class="border-b border-gray-200 px-6 py-4">
        <div class="flex items-center justify-between">
          <span class="text-lg font-semibold">{{ category.name }}</span>
          <div class="text-right text-sm text-gray-600">
            <div>Draw {{ category.cardsDraw }}</div>
            <div>Keep {{ category.cardsKeep }}</div>
          </div>
        </div>
      </div>

      <!-- Content -->
      <div class="px-6 py-4">
        <p class="mb-4 text-gray-800">{{ question.text }}</p>

        <!-- Confirmation message when question is asked -->
        <div
          v-if="showConfirmation"
          class="mb-4 rounded-md bg-green-50 p-3 text-sm text-green-800"
        >
          Question asked! Waiting for hider's response.
        </div>

        <!-- Answer section (shown after question is asked) -->
        <div v-if="showAnswerSection" data-testid="answer-section" class="space-y-3">
          <label class="block text-sm font-medium text-gray-700">Record the answer:</label>
          <input
            v-model="answerText"
            type="text"
            placeholder="Enter the hider's answer..."
            class="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
      </div>

      <!-- Footer / Actions -->
      <div class="flex justify-end gap-3 border-t border-gray-200 px-6 py-4">
        <template v-if="!showAnswerSection">
          <button
            type="button"
            class="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            @click="handleCancel"
          >
            Cancel
          </button>
          <button
            type="button"
            class="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            @click="handleAsk"
          >
            Ask
          </button>
        </template>
        <template v-else>
          <button
            type="button"
            class="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            @click="handleSubmitAnswer"
          >
            Submit Answer
          </button>
        </template>
      </div>
    </div>
  </div>
</template>
