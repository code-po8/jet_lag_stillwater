<script setup lang="ts">
/**
 * DevSkipHidingPeriod (DEV-001)
 *
 * A developer tool button that allows skipping the 30-minute hiding period
 * to quickly test seeking and end-game phases.
 *
 * Only visible in development mode (import.meta.env.DEV).
 * Only visible during the hiding-period phase.
 */
import { computed } from 'vue'
import { useGameStore, GamePhase } from '@/stores/gameStore'

const gameStore = useGameStore()

// Only show in dev mode
const isDevMode = computed(() => import.meta.env.DEV)

// Only show during hiding period phase
const isHidingPeriod = computed(() => gameStore.currentPhase === GamePhase.HidingPeriod)

// Combined visibility check
const shouldShow = computed(() => isDevMode.value && isHidingPeriod.value)

/**
 * Skip the hiding period and transition to seeking phase
 */
function handleSkip() {
  gameStore.startSeeking()
}
</script>

<template>
  <button
    v-if="shouldShow"
    type="button"
    class="dev-skip-button"
    aria-label="Skip Hiding Period (Dev Tool)"
    @click="handleSkip"
  >
    <span class="dev-badge">DEV</span>
    <span>Skip to Seeking</span>
  </button>
</template>

<style scoped>
.dev-skip-button {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  min-height: 2.75rem; /* 44px for touch target */
  padding: 0.5rem 1rem;
  font-weight: 600;
  font-size: 0.875rem;
  color: #713f12; /* Yellow-900 */
  background: linear-gradient(135deg, #fef08a 0%, #fde047 100%);
  border: 2px dashed #ca8a04;
  border-radius: 0.5rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.dev-skip-button:hover {
  background: linear-gradient(135deg, #fde047 0%, #facc15 100%);
  border-color: #a16207;
}

.dev-skip-button:focus {
  outline: none;
  box-shadow: 0 0 0 3px rgba(250, 204, 21, 0.5);
}

.dev-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.125rem 0.375rem;
  font-size: 0.625rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: white;
  background: #b91c1c; /* Red-700 */
  border-radius: 0.25rem;
}
</style>
