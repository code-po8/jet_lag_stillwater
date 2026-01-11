<script setup lang="ts">
/**
 * Final Results View (GS-006)
 *
 * Wrapper view for displaying final game results.
 * Handles navigation for starting a new game or returning home.
 */

import { useRouter } from 'vue-router'
import FinalResults from '@/components/FinalResults.vue'
import { useGameStore } from '@/stores/gameStore'
import { useCardStore } from '@/stores/cardStore'
import { useQuestionStore } from '@/stores/questionStore'

const router = useRouter()
const gameStore = useGameStore()
const cardStore = useCardStore()
const questionStore = useQuestionStore()

/**
 * Handle starting a new game - resets all stores and goes to setup
 */
function handleNewGame() {
  gameStore.resetGame()
  cardStore.reset()
  questionStore.reset()
  router.push('/setup')
}

/**
 * Handle returning to home screen
 */
function handleReturnHome() {
  router.push('/')
}
</script>

<template>
  <FinalResults
    @new-game="handleNewGame"
    @return-home="handleReturnHome"
  />
</template>
