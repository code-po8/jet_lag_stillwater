<script setup lang="ts">
/**
 * Hider answer prompt (QSYNC-005).
 *
 * Shown to the HIDER when a question is pending (synced from the seeker via the
 * QSYNC-004 relay). Lets the hider answer IN-APP; the answer is routed through
 * the sync bridge's `answerQuestion`, which broadcasts `question.answered` so the
 * seeker's device records it and clears the pending question — no new protocol.
 *
 * The seeker's own manual-entry path (`AskQuestionModal`) still exists for when
 * the hider answers out-of-band. Whichever device answers first wins; the store's
 * `answerQuestion` no-ops on the other once the pending question is gone, so a
 * stale second answer is safe (the bridge surfaces any divergence via warn).
 */
import { computed, ref } from 'vue'
import { useQuestionStore } from '@/stores/questionStore'
import { useQuestionCurseSync } from '@/composables/useQuestionCurseSync'
import { getCategoryById } from '@/types/question'

const questionStore = useQuestionStore()
const questionSync = useQuestionCurseSync()

/** Free-text answer input (quick Yes/No answer directly without this). */
const customAnswer = ref('')

const pending = computed(() => questionStore.pendingQuestion)

const question = computed(() =>
  pending.value ? questionStore.getQuestionById(pending.value.questionId) : undefined,
)

const category = computed(() =>
  pending.value ? getCategoryById(pending.value.categoryId) : undefined,
)

/** Submit an answer for the pending question via the sync bridge. */
function answer(text: string) {
  const trimmed = text.trim()
  if (!pending.value || !trimmed) return
  questionSync.answerQuestion(pending.value.questionId, trimmed)
  customAnswer.value = ''
}
</script>

<template>
  <section
    v-if="pending && question"
    data-testid="hider-answer-prompt"
    class="answer-prompt"
    role="group"
    aria-label="Answer the pending question"
  >
    <p class="answer-prompt-label">
      <span v-if="category" class="answer-prompt-cat">{{ category.name }}</span>
      Seekers asked:
    </p>
    <p class="answer-prompt-question" data-testid="hider-answer-question">{{ question.text }}</p>

    <!-- Quick yes/no for the common radar/matching answers. -->
    <div class="answer-prompt-quick">
      <button
        type="button"
        class="answer-quick-btn answer-quick-yes"
        data-testid="hider-answer-yes"
        @click="answer('Yes')"
      >
        Yes
      </button>
      <button
        type="button"
        class="answer-quick-btn answer-quick-no"
        data-testid="hider-answer-no"
        @click="answer('No')"
      >
        No
      </button>
    </div>

    <!-- Free-text for anything else (distances, photo notes, etc.). -->
    <form class="answer-prompt-form" @submit.prevent="answer(customAnswer)">
      <label class="answer-prompt-custom-label" for="hider-custom-answer">Or type an answer</label>
      <div class="answer-prompt-row">
        <input
          id="hider-custom-answer"
          v-model="customAnswer"
          type="text"
          data-testid="hider-answer-input"
          class="answer-prompt-input"
          placeholder="Type the answer…"
        />
        <button
          type="submit"
          class="answer-prompt-submit"
          data-testid="hider-answer-submit"
          :disabled="!customAnswer.trim()"
        >
          Send
        </button>
      </div>
    </form>
  </section>
</template>

<style scoped>
.answer-prompt {
  margin: 0.75rem 0;
  padding: 0.85rem 1rem;
  border-radius: 10px;
  border: 1px solid var(--color-brand-cyan, #00aaff);
  background: rgba(6, 38, 58, 0.55);
  color: var(--color-ui-text-primary, #f8fafc);
}
.answer-prompt-label {
  margin: 0 0 4px;
  font-size: 0.72rem;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--color-ui-text-secondary, #94a3b8);
}
.answer-prompt-cat {
  color: var(--color-brand-cyan, #00aaff);
  font-weight: 700;
  margin-right: 6px;
}
.answer-prompt-question {
  margin: 0 0 10px;
  font-size: 0.95rem;
  font-weight: 600;
}
.answer-prompt-quick {
  display: flex;
  gap: 8px;
  margin-bottom: 10px;
}
.answer-quick-btn {
  flex: 1;
  min-height: 44px;
  border-radius: 8px;
  border: none;
  font-size: 0.95rem;
  font-weight: 700;
  cursor: pointer;
}
.answer-quick-yes {
  background: #16a34a;
  color: #fff;
}
.answer-quick-no {
  background: #b91c1c;
  color: #fff;
}
.answer-prompt-custom-label {
  display: block;
  font-size: 0.72rem;
  color: var(--color-ui-text-secondary, #94a3b8);
  margin-bottom: 4px;
}
.answer-prompt-row {
  display: flex;
  gap: 8px;
}
.answer-prompt-input {
  flex: 1;
  min-height: 40px;
  border-radius: 8px;
  border: 1px solid var(--color-ui-border, #475569);
  background: var(--color-ui-bg, #0f172a);
  color: inherit;
  padding: 0 10px;
  font-size: 0.9rem;
}
.answer-prompt-submit {
  min-height: 40px;
  padding: 0 16px;
  border-radius: 8px;
  border: none;
  background: var(--color-brand-cyan, #00aaff);
  color: #06263a;
  font-weight: 700;
  cursor: pointer;
}
.answer-prompt-submit:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
