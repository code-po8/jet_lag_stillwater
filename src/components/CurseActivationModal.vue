<script setup lang="ts">
import { ref, computed } from 'vue'
import { CURSE_CARDS, type CurseCard } from '@/types/card'
import { GameSize } from '@/types/question'

// Props
const props = withDefaults(
  defineProps<{
    isOpen: boolean
    gameSize?: GameSize
  }>(),
  {
    gameSize: GameSize.Small,
  },
)

// Emits
const emit = defineEmits<{
  (e: 'confirm', payload: { curseId: string }): void
  (e: 'cancel'): void
}>()

// State
const selectedCurseId = ref<string | null>(null)

// Computed
const hasSelection = computed(() => selectedCurseId.value !== null)

/**
 * Get duration text for a curse based on game size
 */
function getDurationText(curse: CurseCard): string | null {
  if (!curse.durationMinutes) return null
  switch (props.gameSize) {
    case GameSize.Small:
      return `${curse.durationMinutes[GameSize.Small]} min`
    case GameSize.Medium:
      return `${curse.durationMinutes[GameSize.Medium]} min`
    case GameSize.Large:
      return `${curse.durationMinutes[GameSize.Large]} min`
    default:
      return `${curse.durationMinutes[GameSize.Small]} min`
  }
}

/**
 * Check if a curse is selected
 */
function isSelected(curseId: string): boolean {
  return selectedCurseId.value === curseId
}

/**
 * Toggle curse selection
 */
function toggleSelection(curseId: string): void {
  if (selectedCurseId.value === curseId) {
    selectedCurseId.value = null
  } else {
    selectedCurseId.value = curseId
  }
}

/**
 * Handle confirm button click
 */
function handleConfirm(): void {
  if (selectedCurseId.value) {
    emit('confirm', { curseId: selectedCurseId.value })
    selectedCurseId.value = null
  }
}

/**
 * Handle cancel button click
 */
function handleCancel(): void {
  selectedCurseId.value = null
  emit('cancel')
}
</script>

<template>
  <div
    v-if="isOpen"
    data-testid="curse-activation-modal"
    role="dialog"
    aria-labelledby="curse-activation-title"
    class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
  >
    <div class="flex max-h-[90vh] w-full max-w-lg flex-col rounded-xl bg-slate-800 shadow-xl">
      <!-- Header -->
      <div class="border-b border-slate-700 p-4">
        <h2 id="curse-activation-title" class="text-xl font-bold text-purple-300">
          Hider Played Curse
        </h2>
        <p class="mt-1 text-sm text-slate-400">
          Select the curse the hider announced to track its restrictions.
        </p>
      </div>

      <!-- Curse List -->
      <div data-testid="curse-list" class="flex-1 overflow-y-auto p-4">
        <div class="flex flex-col gap-2">
          <button
            v-for="curse in CURSE_CARDS"
            :key="curse.id"
            :data-testid="`curse-item-${curse.id}`"
            :aria-label="`Select ${curse.name}`"
            type="button"
            class="min-h-11 w-full rounded-lg border border-purple-800/50 bg-purple-900/30 p-3 text-left transition-all hover:bg-purple-900/50"
            :class="{
              'ring-2 ring-purple-500': isSelected(curse.id),
            }"
            @click="toggleSelection(curse.id)"
          >
            <!-- Curse Name -->
            <div class="flex items-center justify-between">
              <span class="font-semibold text-purple-200">{{ curse.name }}</span>
              <span
                v-if="getDurationText(curse)"
                class="rounded bg-blue-900/50 px-2 py-0.5 text-xs text-blue-300"
              >
                {{ getDurationText(curse) }}
              </span>
            </div>
            <!-- Description -->
            <p class="mt-1 text-sm text-slate-400">{{ curse.description }}</p>
            <!-- Effect -->
            <p class="mt-2 text-xs text-purple-300/70">{{ curse.effect }}</p>
            <!-- Status Badges -->
            <div class="mt-2 flex flex-wrap gap-1">
              <span
                v-if="curse.blocksQuestions"
                class="rounded bg-amber-900/50 px-2 py-0.5 text-xs text-amber-300"
              >
                Blocks Questions
              </span>
              <span
                v-if="curse.blocksTransit"
                class="rounded bg-red-900/50 px-2 py-0.5 text-xs text-red-300"
              >
                Blocks Transit
              </span>
            </div>
          </button>
        </div>
      </div>

      <!-- Footer with Buttons -->
      <div class="flex gap-3 border-t border-slate-700 p-4">
        <button
          data-testid="cancel-button"
          type="button"
          class="flex-1 rounded-lg bg-slate-700 px-4 py-3 font-medium text-white transition-colors hover:bg-slate-600"
          @click="handleCancel"
        >
          Cancel
        </button>
        <button
          data-testid="confirm-button"
          type="button"
          class="min-h-11 flex-1 rounded-lg px-4 py-3 font-medium text-white transition-colors"
          :class="
            hasSelection
              ? 'bg-purple-600 hover:bg-purple-500'
              : 'cursor-not-allowed bg-slate-600 opacity-50'
          "
          :disabled="!hasSelection"
          @click="handleConfirm"
        >
          Activate Curse
        </button>
      </div>
    </div>
  </div>
</template>
