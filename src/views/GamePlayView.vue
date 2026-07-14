<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useGameStore, GamePhase } from '@/stores/gameStore'
import { useRoomStore } from '@/stores/roomStore'
import { useSync } from '@/composables/useSync'
import { useQuestionCurseSync } from '@/composables/useQuestionCurseSync'
import { useQuestionStore } from '@/stores/questionStore'
import HiderView from './HiderView.vue'
import SeekerView from './SeekerView.vue'
import HiderAnswerPrompt from '@/components/HiderAnswerPrompt.vue'
import BottomNav, { type NavTab } from '@/components/BottomNav.vue'
import RoundSummary from '@/components/RoundSummary.vue'
import HidingDurationTimer from '@/components/HidingDurationTimer.vue'
import HidingPeriodTimer from '@/components/HidingPeriodTimer.vue'
import QuestionHistory from '@/components/QuestionHistory.vue'
import MapPanel from '@/components/MapPanel.vue'
import AdminPanel from '@/components/AdminPanel.vue'
import GamePauseOverlay from '@/components/GamePauseOverlay.vue'
import JetLagLogo from '@/components/JetLagLogo.vue'
import { GameSize } from '@/types/question'

// Props
const props = withDefaults(
  defineProps<{
    gameSize?: GameSize
  }>(),
  {
    gameSize: GameSize.Small,
  },
)

const router = useRouter()
const gameStore = useGameStore()
const roomStore = useRoomStore()
const sync = useSync()
const questionStore = useQuestionStore()

// Mount the question/curse sync bridge for the whole game session (QSYNC-004).
// GamePlayView persists across the SeekerView/HiderView/MapPanel tab switches
// (those `v-if`-unmount), so mounting the bridge here keeps its inbound
// `onGameEvent` subscription alive for BOTH roles — the hider must stay
// subscribed to receive relayed asks/answers even while not on the questions
// tab. It's an app-singleton, so this shares one instance with AskQuestionModal.
useQuestionCurseSync()

// Host-only Admin tab visibility (ADMIN-001). Uses the persisted-or-live host
// flag so it survives a mid-game refresh (same source as the role-lock UI).
const isHost = computed(() => roomStore.isHost)

// Current role being viewed (for single-device / offline play)
type ViewRole = 'hider' | 'seeker'
const currentViewRole = ref<ViewRole>('seeker')

/**
 * Anti-cheat (SYNC-003): when in a multiplayer room, the device's role is
 * SERVER-assigned (bound to its rejoin token) — the player cannot freely switch
 * to the other role. The free toggle below is hidden in-room; it only exists for
 * offline single-device "pass the phone" play. (The server additionally
 * withholds hider-only data from seeker sockets — INFRA-006 — so even a tampered
 * client cannot see what it shouldn't.)
 */
const isInRoom = computed(() => roomStore.inRoom)
// Prefer the live WS role, but fall back to the persisted role so a refresh
// mid-game shows the correct role-locked view immediately, before (or without)
// a `welcome` — otherwise a hider is stranded on the default seeker content.
const serverRole = computed<ViewRole | null>(() => sync.role.value ?? roomStore.role)

// While in a room, force the viewed role to the server-assigned role.
watch(
  [isInRoom, serverRole],
  ([inRoom, role]) => {
    if (inRoom && role) {
      currentViewRole.value = role
    }
  },
  { immediate: true },
)

// Current navigation tab
const currentTab = ref<NavTab>('questions')

// Hider answer surface (QSYNC-006): when the viewer is the hider and a question
// is pending, alert them on ANY tab — the prompt renders in an always-mounted
// banner (not just inside the Cards-tab HiderView), and the Cards nav item gets
// a badge. This closes the discoverability gap where a hider on the default
// Questions tab wouldn't see a pending question.
const isHiderView = computed(() => currentViewRole.value === 'hider')
const showHiderAnswerPrompt = computed(() => isHiderView.value && questionStore.hasPendingQuestion)
const navBadgeTabs = computed<NavTab[]>(() => (showHiderAnswerPrompt.value ? ['cards'] : []))

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
      return 'phase-badge-hiding'
    case GamePhase.Seeking:
      return 'phase-badge-seeking'
    case GamePhase.EndGame:
      return 'phase-badge-endgame'
    case GamePhase.RoundComplete:
      return 'phase-badge-complete'
    default:
      return ''
  }
}

/**
 * Switch to hider view
 */
function switchToHider() {
  if (isInRoom.value) return // role is server-locked in multiplayer
  currentViewRole.value = 'hider'
  currentTab.value = 'cards'
}

/**
 * Switch to seeker view
 */
function switchToSeeker() {
  if (isInRoom.value) return // role is server-locked in multiplayer
  currentViewRole.value = 'seeker'
  currentTab.value = 'questions'
}

/**
 * Handle tab change from bottom navigation
 */
function handleTabChange(tab: NavTab) {
  currentTab.value = tab
  // Offline only: auto-switch role based on tab for better UX. In a room the
  // role is server-locked, so tab changes never change the role.
  if (isInRoom.value) return
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
  <main class="gameplay-view page-bg-gradient">
    <!-- Header with game info -->
    <header class="show-header gameplay-header">
      <div class="mx-auto max-w-2xl">
        <!-- Logo -->
        <div data-testid="gameplay-logo-container" class="gameplay-logo-container">
          <JetLagLogo size="sm" />
        </div>

        <!-- Phase Badge and Pause Button -->
        <div class="gameplay-header-top">
          <div class="w-20"></div>
          <span data-testid="phase-badge" class="phase-badge" :class="getPhaseBadgeClass()">
            <span class="phase-badge-dot"></span>
            {{ getPhaseBadgeText() }}
          </span>
          <div class="flex w-20 justify-end">
            <GamePauseOverlay :role="currentViewRole" />
          </div>
        </div>

        <!-- Player Info -->
        <div class="gameplay-players">
          <div class="gameplay-player">
            <span class="gameplay-player-icon role-indicator-hider">
              <svg viewBox="0 0 24 24" fill="currentColor" class="gameplay-role-icon">
                <path
                  d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"
                />
              </svg>
            </span>
            <span data-testid="hider-name" class="gameplay-player-name text-amber-400">
              {{ currentHider?.name ?? 'Unknown' }}
            </span>
          </div>
          <div class="gameplay-player-separator">vs</div>
          <div class="gameplay-player">
            <span class="gameplay-player-icon role-indicator-seeker">
              <svg viewBox="0 0 24 24" fill="currentColor" class="gameplay-role-icon">
                <path
                  d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"
                />
              </svg>
            </span>
            <span data-testid="seekers-list" class="gameplay-player-name text-blue-400">
              {{ seekers.map((s) => s.name).join(', ') || 'None' }}
            </span>
          </div>
        </div>
      </div>
    </header>

    <!-- Hidden timer to track hiding duration (always present during seeking/end-game) -->
    <HidingDurationTimer v-show="false" @final-time="handleFinalTime" />

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
      <!-- Host game controls now live in the Admin tab (ADMIN-001). -->

      <!-- Role Toggle — offline single-device only. In a multiplayer room the
           role is server-locked (SYNC-003), so this is hidden. -->
      <div v-if="!isInRoom" data-testid="role-toggle" class="gameplay-role-toggle">
        <button
          type="button"
          class="gameplay-role-btn"
          :class="{ 'gameplay-role-btn-hider-active': currentViewRole === 'hider' }"
          @click="switchToHider"
        >
          <svg viewBox="0 0 24 24" fill="currentColor" class="gameplay-toggle-icon">
            <path
              d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5z"
            />
          </svg>
          Hider
        </button>
        <button
          type="button"
          class="gameplay-role-btn"
          :class="{ 'gameplay-role-btn-seeker-active': currentViewRole === 'seeker' }"
          @click="switchToSeeker"
        >
          <svg viewBox="0 0 24 24" fill="currentColor" class="gameplay-toggle-icon">
            <path
              d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5z"
            />
          </svg>
          Seeker
        </button>
      </div>

      <!-- Current Role Display -->
      <div data-testid="current-role-display" class="gameplay-current-role">
        <span class="gameplay-current-role-label">
          {{ isInRoom ? 'Your role:' : 'Viewing as:' }}
        </span>
        <span
          class="gameplay-current-role-value"
          :class="currentViewRole === 'hider' ? 'text-amber-400' : 'text-blue-400'"
        >
          {{ currentViewRole === 'hider' ? 'Hider' : 'Seeker' }}
        </span>
        <span
          v-if="isInRoom"
          data-testid="role-locked-indicator"
          class="gameplay-role-locked"
          title="Your role is assigned by the host and locked for this round"
          aria-label="Role locked by the server"
        >
          🔒 locked
        </span>
      </div>

      <!-- Hider answer prompt (QSYNC-006): always-mounted for the hider so a
           pending question is answerable from ANY tab, not just Cards. The
           component self-gates on there being a pending question. -->
      <div v-if="isHiderView" class="gameplay-hider-answer">
        <HiderAnswerPrompt />
      </div>

      <!-- Main Content Area with tab-based content -->
      <div data-testid="main-content-area" class="gameplay-content content-with-nav">
        <!-- Questions Tab - Shows SeekerView with questions -->
        <SeekerView v-if="currentTab === 'questions'" :game-size="props.gameSize" />

        <!-- Timers Tab - Shows timer display -->
        <div v-else-if="currentTab === 'timers'" class="gameplay-timers-tab">
          <!-- Show HidingPeriodTimer during hiding period -->
          <HidingPeriodTimer v-if="isHidingPeriod" :role="currentViewRole" />
          <!-- Show HidingDurationTimer during seeking/end-game -->
          <HidingDurationTimer v-else />
        </div>

        <!-- Cards Tab - Shows HiderView with cards -->
        <HiderView v-else-if="currentTab === 'cards'" :game-size="props.gameSize" />

        <!-- History Tab - Question History View -->
        <QuestionHistory v-else-if="currentTab === 'history'" />

        <!-- Map Tab - shared Stillwater map + hiding zone (MAP-001/002/004) -->
        <div v-else-if="currentTab === 'map'" class="gameplay-map-tab" data-testid="map-tab">
          <MapPanel />
        </div>

        <!-- Admin Tab - host-only controls + player status (ADMIN-001) -->
        <AdminPanel v-else-if="currentTab === 'admin' && isHost" />
      </div>

      <!-- Bottom Navigation -->
      <BottomNav
        :current-tab="currentTab"
        :show-admin="isHost"
        :badge-tabs="navBadgeTabs"
        @tab-change="handleTabChange"
      />
    </template>
  </main>
</template>

<style scoped>
.gameplay-view {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

.gameplay-header {
  padding: 0.75rem 1rem 1rem;
}

.gameplay-logo-container {
  display: flex;
  justify-content: center;
  margin-bottom: 0.5rem;
}

.gameplay-header-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.75rem;
}

.phase-badge-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: currentColor;
  animation: pulse-dot 2s ease-in-out infinite;
}

@keyframes pulse-dot {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

.gameplay-players {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
}

.gameplay-player {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.gameplay-player-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 1.75rem;
  height: 1.75rem;
  border-radius: 6px;
}

.gameplay-role-icon {
  width: 1rem;
  height: 1rem;
}

.gameplay-player-name {
  font-weight: 600;
  font-size: 0.875rem;
}

.gameplay-player-separator {
  color: var(--color-ui-text-muted);
  font-size: 0.75rem;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

/* Role toggle */
.gameplay-role-toggle {
  display: flex;
  background: linear-gradient(180deg, rgba(30, 41, 59, 0.8) 0%, rgba(15, 23, 42, 0.9) 100%);
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}

.gameplay-role-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.875rem;
  font-weight: 600;
  font-size: 0.875rem;
  color: var(--color-ui-text-muted);
  background: transparent;
  border: none;
  cursor: pointer;
  transition: all 0.2s ease;
}

.gameplay-role-btn:hover {
  color: var(--color-ui-text-secondary);
  background: rgba(255, 255, 255, 0.05);
}

.gameplay-toggle-icon {
  width: 1.125rem;
  height: 1.125rem;
}

.gameplay-role-btn-hider-active {
  color: var(--color-role-hider);
  background: linear-gradient(180deg, rgba(245, 158, 11, 0.2) 0%, transparent 100%);
  border-bottom: 2px solid var(--color-role-hider);
}

.gameplay-role-btn-seeker-active {
  color: var(--color-role-seeker);
  background: linear-gradient(180deg, rgba(59, 130, 246, 0.2) 0%, transparent 100%);
  border-bottom: 2px solid var(--color-role-seeker);
}

/* Current role display */
.gameplay-current-role {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.5rem;
  background: rgba(0, 0, 0, 0.2);
  font-size: 0.75rem;
}

.gameplay-current-role-label {
  color: var(--color-ui-text-muted);
}

.gameplay-current-role-value {
  font-weight: 700;
  letter-spacing: 0.02em;
}

/* Content area */
.gameplay-content {
  flex: 1;
  overflow-y: auto;
}

/* Always-mounted hider answer prompt (QSYNC-006). No padding of its own when
   empty — HiderAnswerPrompt renders nothing until a question is pending. */
.gameplay-hider-answer {
  padding: 0 1rem;
}

.gameplay-timers-tab {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  padding: 1.5rem;
}

/* Map tab fills the content area so Leaflet has a sized container. It is
   absolutely positioned (so Leaflet gets a fixed-size box), which bypasses the
   parent's `.content-with-nav` padding — so it must clear the fixed BottomNav
   itself, otherwise the map (and its bottom-left legend) render underneath the
   nav bar and the legend covers it. Match BottomNav's height (60px + safe area). */
.gameplay-map-tab {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: calc(60px + env(safe-area-inset-bottom, 0px));
}
</style>
