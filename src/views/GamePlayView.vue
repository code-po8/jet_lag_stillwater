<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useGameStore, GamePhase } from '@/stores/gameStore'
import HiderView from './HiderView.vue'
import SeekerView from './SeekerView.vue'
import BottomNav, { type NavTab } from '@/components/BottomNav.vue'
import RoundSummary from '@/components/RoundSummary.vue'
import HidingDurationTimer from '@/components/HidingDurationTimer.vue'
import HidingPeriodTimer from '@/components/HidingPeriodTimer.vue'
import QuestionHistory from '@/components/QuestionHistory.vue'
import { GameSize } from '@/types/question'

// Props
const props = withDefaults(
  defineProps<{
    gameSize?: GameSize
  }>(),
  {
    gameSize: GameSize.Small,
  }
)

const router = useRouter()
const gameStore = useGameStore()

// Current role being viewed (for single-device play)
type ViewRole = 'hider' | 'seeker'
const currentViewRole = ref<ViewRole>('seeker')

// Current navigation tab
const currentTab = ref<NavTab>('questions')

// Track the final hiding time for round summary
const finalHidingTimeMs = ref<number>(0)

// Computed properties
const currentPhase = computed(() => gameStore.currentPhase)
const currentHider = computed(() => gameStore.currentHider)
const seekers = computed(() => gameStore.seekers)
const isRoundComplete = computed(() => currentPhase.value === GamePhase.RoundComplete)
const isHidingPeriod = computed(() => currentPhase.value === GamePhase.HidingPeriod)

/**
 * Get display text for the phase badge
 */
function getPhaseBadgeText(): string {
  switch (currentPhase.value) {
    case GamePhase.HidingPeriod:
      return 'Hiding Period'
    case GamePhase.Seeking:
      return 'Seeking'
    case GamePhase.EndGame:
      return 'End Game'
    case GamePhase.RoundComplete:
      return 'Round Complete'
    default:
      return currentPhase.value
  }
}

/**
 * Get CSS class for phase badge
 */
function getPhaseBadgeClass(): string {
  switch (currentPhase.value) {
    case GamePhase.HidingPeriod:
      return 'bg-amber-600'
    case GamePhase.Seeking:
      return 'bg-blue-600'
    case GamePhase.EndGame:
      return 'bg-red-600'
    case GamePhase.RoundComplete:
      return 'bg-green-600'
    default:
      return 'bg-slate-600'
  }
}

/**
 * Switch to hider view
 */
function switchToHider() {
  currentViewRole.value = 'hider'
  currentTab.value = 'cards'
}

/**
 * Switch to seeker view
 */
function switchToSeeker() {
  currentViewRole.value = 'seeker'
  currentTab.value = 'questions'
}

/**
 * Handle tab change from bottom navigation
 */
function handleTabChange(tab: NavTab) {
  currentTab.value = tab
  // Automatically switch role based on tab for better UX
  if (tab === 'cards') {
    currentViewRole.value = 'hider'
  } else if (tab === 'questions') {
    currentViewRole.value = 'seeker'
  }
}

/**
 * Handle final time from HidingDurationTimer
 */
function handleFinalTime(timeMs: number) {
  finalHidingTimeMs.value = timeMs
}

/**
 * Handle starting the next round
 */
function handleStartNextRound() {
  // Navigate to setup for next round's hider selection
  router.push('/setup')
}

/**
 * Handle ending the game
 */
function handleEndGame() {
  // Navigate to final results view
  router.push('/results')
}
</script>

<template>
  <main class="flex min-h-screen flex-col bg-slate-900 pb-16 text-white">
    <!-- Header with game info -->
    <header class="border-b border-slate-700 bg-slate-800 p-4">
      <div class="mx-auto max-w-2xl">
        <!-- Phase Badge -->
        <div class="mb-3 flex items-center justify-center">
          <span
            data-testid="phase-badge"
            :class="['rounded-full px-4 py-1 text-sm font-medium', getPhaseBadgeClass()]"
          >
            {{ getPhaseBadgeText() }}
          </span>
        </div>

        <!-- Player Info -->
        <div class="flex items-center justify-between text-sm">
          <div>
            <span class="text-slate-400">Hider: </span>
            <span data-testid="hider-name" class="font-medium text-amber-400">
              {{ currentHider?.name ?? 'Unknown' }}
            </span>
          </div>
          <div>
            <span class="text-slate-400">Seekers: </span>
            <span data-testid="seekers-list" class="font-medium text-blue-400">
              {{ seekers.map((s) => s.name).join(', ') || 'None' }}
            </span>
          </div>
        </div>
      </div>
    </header>

    <!-- Hidden timer to track hiding duration (always present during seeking/end-game) -->
    <HidingDurationTimer
      v-show="false"
      @final-time="handleFinalTime"
    />

    <!-- Round Summary (shown in round-complete phase) -->
    <RoundSummary
      v-if="isRoundComplete"
      :hiding-time-ms="finalHidingTimeMs"
      :game-size="props.gameSize"
      @start-next-round="handleStartNextRound"
      @end-game="handleEndGame"
    />

    <!-- Regular gameplay UI (hidden during round-complete) -->
    <template v-else>
      <!-- Role Toggle -->
      <div
        data-testid="role-toggle"
        class="flex border-b border-slate-700 bg-slate-800/50"
      >
        <button
          type="button"
          :class="[
            'flex-1 py-3 text-center font-medium transition-colors',
            currentViewRole === 'hider'
              ? 'active bg-amber-600 text-white'
              : 'text-slate-400 hover:bg-slate-700 hover:text-white',
          ]"
          @click="switchToHider"
        >
          Hider
        </button>
        <button
          type="button"
          :class="[
            'flex-1 py-3 text-center font-medium transition-colors',
            currentViewRole === 'seeker'
              ? 'active bg-blue-600 text-white'
              : 'text-slate-400 hover:bg-slate-700 hover:text-white',
          ]"
          @click="switchToSeeker"
        >
          Seeker
        </button>
      </div>

      <!-- Current Role Display -->
      <div
        data-testid="current-role-display"
        class="bg-slate-800/30 py-2 text-center text-sm text-slate-400"
      >
        Viewing as: <span class="font-medium text-white">{{ currentViewRole === 'hider' ? 'Hider' : 'Seeker' }}</span>
      </div>

      <!-- Main Content Area with tab-based content -->
      <div
        data-testid="main-content-area"
        class="flex-1 overflow-y-auto transition-opacity duration-200"
      >
        <!-- Questions Tab - Shows SeekerView with questions -->
        <SeekerView v-if="currentTab === 'questions'" />

        <!-- Timers Tab - Shows timer display -->
        <div
          v-else-if="currentTab === 'timers'"
          class="flex flex-col items-center gap-4 p-4"
        >
          <!-- Show HidingPeriodTimer during hiding period -->
          <HidingPeriodTimer v-if="isHidingPeriod" :role="currentViewRole" />
          <!-- Show HidingDurationTimer during seeking/end-game -->
          <HidingDurationTimer v-else />
        </div>

        <!-- Cards Tab - Shows HiderView with cards -->
        <HiderView v-else-if="currentTab === 'cards'" :game-size="props.gameSize" />

        <!-- History Tab - Question History View -->
        <QuestionHistory v-else-if="currentTab === 'history'" />
      </div>

      <!-- Bottom Navigation -->
      <BottomNav :current-tab="currentTab" @tab-change="handleTabChange" />
    </template>
  </main>
</template>
