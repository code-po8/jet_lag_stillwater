<script setup lang="ts">
import { ref, computed } from 'vue'
import { useQuestionStore } from '@/stores/questionStore'
import { useGameStore, GamePhase } from '@/stores/gameStore'
import { QUESTION_CATEGORIES, QuestionCategoryId, type Question } from '@/types/question'
import { ALL_QUESTIONS } from '@/data/questions'
import { getCategoryColor } from '@/design/colors'
import {
  getQuestionIcon,
  getCategoryIcon as getCategoryIconDef,
  getQuestionRangeBadge,
  FALLBACK_ICON,
  type IconDefinition,
} from '@/design/questionIcons'

// Emit event when question is selected or re-ask is clicked
const emit = defineEmits<{
  questionSelect: [question: Question]
  reaskSelect: [{ question: Question; isReask: boolean }]
}>()

const questionStore = useQuestionStore()
const gameStore = useGameStore()

// Categories disabled during end-game phase
const END_GAME_DISABLED_CATEGORIES = [QuestionCategoryId.Photo, QuestionCategoryId.Tentacle]

// Check if currently in hiding-period phase (questions are locked)
const isHidingPeriodPhase = computed(() => gameStore.currentPhase === GamePhase.HidingPeriod)

// Check if currently in end-game phase
const isEndGamePhase = computed(() => gameStore.currentPhase === GamePhase.EndGame)

// Get all questions grouped by category (including asked and pending)
const questionsByCategory = computed(() => {
  const grouped = new Map<string, Question[]>()

  QUESTION_CATEGORIES.forEach((category) => {
    const questions = ALL_QUESTIONS.filter((q) => q.categoryId === category.id)
    grouped.set(category.id, questions)
  })

  return grouped
})

// Get set of asked question IDs
const askedQuestionIds = computed(() => {
  return new Set(questionStore.askedQuestions.map((aq) => aq.questionId))
})

// Get pending question ID
const pendingQuestionId = computed(() => {
  return questionStore.pendingQuestion?.questionId ?? null
})

// Get stats for each category
const categoryStats = computed(() => questionStore.getCategoryStats())

function getCategoryStats(categoryId: string) {
  return categoryStats.value.find((s) => s.categoryId === categoryId)
}

/**
 * Check if a category is disabled (e.g., Photo/Tentacle during end-game)
 */
function isCategoryDisabled(categoryId: string): boolean {
  if (
    isEndGamePhase.value &&
    END_GAME_DISABLED_CATEGORIES.includes(categoryId as QuestionCategoryId)
  ) {
    return true
  }
  return false
}

/**
 * Get the status of a question
 */
function getQuestionStatus(questionId: string): 'available' | 'asked' | 'pending' {
  if (pendingQuestionId.value === questionId) {
    return 'pending'
  }
  if (askedQuestionIds.value.has(questionId)) {
    return 'asked'
  }
  return 'available'
}

/**
 * Check if a question can be selected
 */
function isQuestionSelectable(questionId: string): boolean {
  if (isHidingPeriodPhase.value) return false
  const status = getQuestionStatus(questionId)
  if (status === 'asked') return false
  if (pendingQuestionId.value !== null) return false
  const question = ALL_QUESTIONS.find((q) => q.id === questionId)
  if (question && isCategoryDisabled(question.categoryId)) return false
  return true
}

/**
 * Handle question click
 */
function handleQuestionClick(question: Question) {
  // Reopen the answer modal for the pending question (issue #25) so the seeker
  // can record the answer even after dismissing the modal. The modal opens in
  // answer mode because the store already has this question pending.
  if (getQuestionStatus(question.id) === 'pending') {
    emit('questionSelect', question)
    return
  }
  if (isQuestionSelectable(question.id)) {
    emit('questionSelect', question)
  }
}

/**
 * Handle re-ask button click
 */
function handleReaskClick(event: Event, question: Question) {
  event.stopPropagation()
  if (pendingQuestionId.value === null) {
    emit('reaskSelect', { question, isReask: true })
  }
}

// Selected question for detail view
const selectedQuestion = ref<Question | null>(null)

function showQuestionDetail(question: Question) {
  selectedQuestion.value = question
}

function hideQuestionDetail() {
  selectedQuestion.value = null
}

/**
 * Ask the selected question from the detail overlay, then close it.
 */
function askFromDetail(question: Question) {
  handleQuestionClick(question)
  hideQuestionDetail()
}

/**
 * Re-ask the selected question from the detail overlay, then close it.
 */
function reaskFromDetail(event: Event, question: Question) {
  handleReaskClick(event, question)
  hideQuestionDetail()
}

/**
 * Get short label for question tile
 */
function getQuestionShortLabel(question: Question): string {
  // Extract key term from question text
  const text = question.text.toLowerCase()

  // Radar/Thermometer distance questions
  const distanceMatch = text.match(/(\d+(?:\.\d+)?)\s*(miles?|mi)/i)
  if (distanceMatch) {
    return `${distanceMatch[1]} mi`
  }

  // Location type questions - extract the key noun
  const locationTypes: Record<string, string> = {
    airport: 'Airport',
    'transit line': 'Transit',
    station: 'Station',
    street: 'Street',
    state: 'State',
    county: 'County',
    city: 'City',
    quadrant: 'Quadrant',
    mountain: 'Mountain',
    landmass: 'Landmass',
    park: 'Park',
    amusement: 'Amusement',
    zoo: 'Zoo',
    aquarium: 'Aquarium',
    golf: 'Golf',
    museum: 'Museum',
    movie: 'Movies',
    restaurant: 'Food',
    hospital: 'Hospital',
    library: 'Library',
    consulate: 'Consulate',
    school: 'School',
    border: 'Border',
    'sea level': 'Sea Level',
    'body of water': 'Water',
    coastline: 'Coast',
    'high speed': 'HSR',
    'rail station': 'Rail',
    tree: 'Tree',
    sky: 'Sky',
    selfie: 'Selfie',
    'widest street': 'Street',
    tallest: 'Tallest',
    building: 'Building',
    platform: 'Platform',
    grocery: 'Grocery',
    worship: 'Worship',
    metro: 'Metro',
    custom: 'Custom',
  }

  for (const [key, label] of Object.entries(locationTypes)) {
    if (text.includes(key)) {
      return label
    }
  }

  return '?'
}

/**
 * Get icon definition for question category header
 */
function getCategoryHeaderIcon(categoryId: string): IconDefinition {
  return getCategoryIconDef(categoryId) || FALLBACK_ICON
}

/**
 * Get icon definition for a question tile
 */
function getQuestionTileIcon(questionId: string): IconDefinition {
  return getQuestionIcon(questionId) || FALLBACK_ICON
}

/**
 * Check if a question has a defined icon
 */
function hasQuestionIcon(questionId: string): boolean {
  return getQuestionIcon(questionId) !== null
}

/**
 * The range/distance badge for a tile (issue #26), e.g. '0.5' or '25'. Null for
 * questions without a meaningful range (their icons are already distinct).
 */
function rangeBadge(questionId: string): string | null {
  return getQuestionRangeBadge(questionId)
}
</script>

<template>
  <div class="question-menu" data-testid="question-list-container">
    <!-- Header Banner -->
    <div class="menu-header">
      <div class="header-stripe"></div>
      <h1 class="header-title">QUESTION MENU</h1>
    </div>

    <!-- Locked Notice -->
    <div v-if="isHidingPeriodPhase" class="locked-notice">
      <span class="lock-icon">🔒</span>
      <span>Questions locked during hiding period</span>
    </div>

    <!-- Categories Grid -->
    <div class="categories-container">
      <div
        v-for="category in QUESTION_CATEGORIES"
        :key="category.id"
        class="category-column"
        :class="{ 'category-disabled': isCategoryDisabled(category.id) }"
      >
        <!-- Category Header -->
        <div
          class="category-header"
          :style="{ backgroundColor: getCategoryColor(category.id as QuestionCategoryId) }"
        >
          <svg
            class="category-icon-svg"
            :viewBox="getCategoryHeaderIcon(category.id).viewBox"
            fill="currentColor"
          >
            <path
              v-for="(path, idx) in getCategoryHeaderIcon(category.id).paths"
              :key="idx"
              :d="path"
            />
          </svg>
          <div class="category-info">
            <span class="category-name">{{ category.name.toUpperCase() }}</span>
            <span class="category-cost"
              >DRAW {{ category.cardsDraw }}, PICK {{ category.cardsKeep }}</span
            >
          </div>
        </div>

        <!-- Disabled Notice -->
        <div v-if="isCategoryDisabled(category.id)" class="disabled-overlay">
          <span>Not available in end-game</span>
        </div>

        <!-- Question Tiles Grid -->
        <div class="tiles-grid">
          <button
            v-for="question in questionsByCategory.get(category.id)"
            :key="question.id"
            :data-testid="`question-tile-${question.id}`"
            class="question-tile"
            :class="{
              'tile-available':
                getQuestionStatus(question.id) === 'available' && isQuestionSelectable(question.id),
              'tile-asked': getQuestionStatus(question.id) === 'asked',
              'tile-pending': getQuestionStatus(question.id) === 'pending',
              'tile-locked':
                isHidingPeriodPhase ||
                (!isQuestionSelectable(question.id) &&
                  getQuestionStatus(question.id) !== 'asked' &&
                  getQuestionStatus(question.id) !== 'pending'),
              'tile-has-icon': hasQuestionIcon(question.id),
            }"
            :style="{
              '--tile-color': getCategoryColor(category.id as QuestionCategoryId),
            }"
            :disabled="
              !isQuestionSelectable(question.id) &&
              getQuestionStatus(question.id) !== 'asked' &&
              getQuestionStatus(question.id) !== 'pending'
            "
            @click="
              getQuestionStatus(question.id) === 'asked'
                ? showQuestionDetail(question)
                : handleQuestionClick(question)
            "
            :title="question.text"
          >
            <!-- SVG Icon if available -->
            <svg
              v-if="hasQuestionIcon(question.id)"
              class="tile-icon"
              :viewBox="getQuestionTileIcon(question.id).viewBox"
              fill="currentColor"
            >
              <path
                v-for="(path, idx) in getQuestionTileIcon(question.id).paths"
                :key="idx"
                :d="path"
              />
              <!-- Overlay paths (for measuring icons with map markers) -->
              <path
                v-for="(path, idx) in getQuestionTileIcon(question.id).overlay || []"
                :key="'overlay-' + idx"
                :d="path"
                class="icon-overlay"
              />
            </svg>
            <!-- Fallback text label -->
            <span v-else class="tile-label">{{ getQuestionShortLabel(question) }}</span>
            <!-- Range badge (issue #26): the distance, so radar/thermometer tiles
                 that share one icon are distinguishable at a glance. -->
            <span
              v-if="rangeBadge(question.id)"
              class="tile-range-badge"
              data-testid="tile-range-badge"
              aria-hidden="true"
              >{{ rangeBadge(question.id) }}</span
            >
            <!-- Pending indicator -->
            <span v-if="getQuestionStatus(question.id) === 'pending'" class="tile-pending-indicator"
              >⏳</span
            >
          </button>
        </div>

        <!-- Category Stats -->
        <div class="category-stats">
          {{ getCategoryStats(category.id)?.available ?? 0 }} /
          {{ questionsByCategory.get(category.id)?.length ?? 0 }} available
        </div>
      </div>
    </div>

    <!-- Question Detail Modal -->
    <Teleport to="body">
      <div v-if="selectedQuestion" class="detail-overlay" @click.self="hideQuestionDetail">
        <div class="detail-modal">
          <div
            class="detail-header"
            :style="{ backgroundColor: getCategoryColor(selectedQuestion.categoryId) }"
          >
            <span class="detail-category">{{ selectedQuestion.categoryId.toUpperCase() }}</span>
            <button class="detail-close" @click="hideQuestionDetail">✕</button>
          </div>
          <div class="detail-content">
            <p class="detail-text">{{ selectedQuestion.text }}</p>
            <p v-if="selectedQuestion.instructions" class="detail-instructions">
              {{ selectedQuestion.instructions }}
            </p>
            <div class="detail-status">
              <span
                class="status-badge"
                :class="{
                  'status-available': getQuestionStatus(selectedQuestion.id) === 'available',
                  'status-asked': getQuestionStatus(selectedQuestion.id) === 'asked',
                  'status-pending': getQuestionStatus(selectedQuestion.id) === 'pending',
                }"
              >
                {{ getQuestionStatus(selectedQuestion.id).toUpperCase() }}
              </span>
            </div>
          </div>
          <div class="detail-actions">
            <button
              v-if="
                getQuestionStatus(selectedQuestion.id) === 'available' &&
                isQuestionSelectable(selectedQuestion.id)
              "
              class="action-ask"
              @click="askFromDetail(selectedQuestion)"
            >
              Ask Question
            </button>
            <button
              v-if="getQuestionStatus(selectedQuestion.id) === 'asked'"
              class="action-reask"
              :disabled="pendingQuestionId !== null"
              @click="reaskFromDetail($event, selectedQuestion)"
            >
              Re-ask (2× Cost)
            </button>
            <button class="action-cancel" @click="hideQuestionDetail">Close</button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<style scoped>
/*
 * Question Menu - Jet Lag Show Style
 * Designed to match the official Nebula series UI
 */

@import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Barlow:wght@400;500;600;700&display=swap');

.question-menu {
  --menu-bg: linear-gradient(180deg, #d4d4d4 0%, #9ca3af 50%, #6b7280 100%);
  --header-red: #dc2626;
  --tile-radius: 8px;

  min-height: 100vh;
  background: var(--menu-bg);
  font-family: 'Barlow', system-ui, sans-serif;
}

/* Header Banner */
.menu-header {
  position: relative;
  text-align: center;
  padding: 1rem 0;
  margin-bottom: 0.5rem;
}

.header-stripe {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 6px;
  background: var(--header-red);
}

.header-title {
  font-family: 'Bebas Neue', 'Impact', sans-serif;
  font-size: 2rem;
  font-weight: 400;
  letter-spacing: 0.15em;
  color: #1f2937;
  margin: 0.5rem 0 0;
  text-shadow: 1px 1px 0 rgba(255, 255, 255, 0.5);
}

/* Locked Notice */
.locked-notice {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  margin: 0 1rem 1rem;
  background: rgba(251, 191, 36, 0.2);
  border: 2px solid #f59e0b;
  border-radius: 8px;
  color: #92400e;
  font-weight: 600;
}

.lock-icon {
  font-size: 1.25rem;
}

/* Categories Container */
.categories-container {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 0.75rem;
  padding: 0 0.75rem 1rem;
  max-width: 100%;
  overflow-x: auto;
}

@media (min-width: 768px) {
  .categories-container {
    grid-template-columns: repeat(6, 1fr);
    gap: 1rem;
    padding: 0 1rem 1.5rem;
  }
}

/* Category Column */
.category-column {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.category-disabled {
  opacity: 0.5;
  pointer-events: none;
}

/* Category Header */
.category-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem;
  border-radius: var(--tile-radius) var(--tile-radius) 0 0;
  color: white;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.3);
}

.category-icon {
  font-size: 1.5rem;
  filter: drop-shadow(1px 1px 1px rgba(0, 0, 0, 0.3));
}

.category-icon-svg {
  width: 28px;
  height: 28px;
  flex-shrink: 0;
  filter: drop-shadow(1px 1px 1px rgba(0, 0, 0, 0.3));
}

.category-info {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.category-name {
  font-family: 'Bebas Neue', 'Impact', sans-serif;
  font-size: 1rem;
  font-weight: 400;
  letter-spacing: 0.05em;
  line-height: 1.1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.category-cost {
  font-size: 0.65rem;
  font-weight: 600;
  opacity: 0.9;
  letter-spacing: 0.02em;
}

/* Disabled Overlay */
.disabled-overlay {
  padding: 0.5rem;
  background: rgba(0, 0, 0, 0.6);
  color: #fca5a5;
  font-size: 0.7rem;
  font-weight: 600;
  text-align: center;
}

/* Tiles Grid */
.tiles-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 4px;
  padding: 4px;
  background: rgba(0, 0, 0, 0.15);
  border-radius: 0 0 var(--tile-radius) var(--tile-radius);
}

@media (min-width: 768px) {
  .tiles-grid {
    grid-template-columns: repeat(4, 1fr);
  }
}

@media (min-width: 1024px) {
  .tiles-grid {
    grid-template-columns: repeat(5, 1fr);
  }
}

/* Question Tile */
.question-tile {
  position: relative;
  aspect-ratio: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 0.25rem;
  border: none;
  border-radius: 6px;
  background: var(--tile-color);
  color: white;
  font-family: 'Barlow', system-ui, sans-serif;
  font-size: 0.6rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.02em;
  text-shadow: 1px 1px 1px rgba(0, 0, 0, 0.4);
  cursor: pointer;
  transition: all 0.15s ease;
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.2),
    inset 0 -2px 0 rgba(0, 0, 0, 0.15),
    0 2px 4px rgba(0, 0, 0, 0.2);
}

.tile-label {
  text-align: center;
  line-height: 1.2;
  word-break: break-word;
  hyphens: auto;
}

/* SVG Icon in tile */
.tile-icon {
  width: 70%;
  height: 70%;
  max-width: 32px;
  max-height: 32px;
  filter: drop-shadow(1px 1px 1px rgba(0, 0, 0, 0.3));
}

.tile-icon .icon-overlay {
  opacity: 0.9;
}

.tile-has-icon {
  padding: 0.375rem;
}

/* Tile States */
.tile-available {
  opacity: 1;
}

.tile-available:hover {
  transform: scale(1.05);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.3),
    inset 0 -2px 0 rgba(0, 0, 0, 0.2),
    0 4px 8px rgba(0, 0, 0, 0.3);
}

.tile-available:active {
  transform: scale(0.98);
}

.tile-asked {
  opacity: 0.35;
  background: #6b7280 !important;
  cursor: pointer;
}

.tile-asked .tile-label {
  text-decoration: line-through;
}

.tile-pending {
  animation: pulse-pending 1.5s ease-in-out infinite;
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.3),
    0 0 0 3px rgba(251, 191, 36, 0.6),
    0 4px 12px rgba(251, 191, 36, 0.4);
}

@keyframes pulse-pending {
  0%,
  100% {
    box-shadow:
      inset 0 1px 0 rgba(255, 255, 255, 0.3),
      0 0 0 3px rgba(251, 191, 36, 0.6),
      0 4px 12px rgba(251, 191, 36, 0.4);
  }
  50% {
    box-shadow:
      inset 0 1px 0 rgba(255, 255, 255, 0.3),
      0 0 0 5px rgba(251, 191, 36, 0.8),
      0 4px 16px rgba(251, 191, 36, 0.6);
  }
}

.tile-pending-indicator {
  position: absolute;
  top: 2px;
  right: 2px;
  font-size: 0.7rem;
}

/* Range badge (issue #26): the question's distance overlaid on the icon so
   same-icon radar/thermometer tiles are distinguishable at a glance. A small
   high-contrast pill pinned to the bottom of the tile. */
.tile-range-badge {
  position: absolute;
  bottom: 2px;
  left: 50%;
  transform: translateX(-50%);
  min-width: 1.1rem;
  padding: 0 3px;
  border-radius: 6px;
  background: rgba(0, 0, 0, 0.72);
  color: #fff;
  font-size: 0.6rem;
  font-weight: 800;
  line-height: 1.25;
  letter-spacing: 0.01em;
  text-align: center;
  text-shadow: none;
  pointer-events: none;
}

.tile-locked {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Category Stats */
.category-stats {
  padding: 0.5rem;
  font-size: 0.65rem;
  font-weight: 500;
  color: #374151;
  text-align: center;
  background: rgba(255, 255, 255, 0.3);
  border-radius: 0 0 var(--tile-radius) var(--tile-radius);
  margin-top: -1px;
}

/* Detail Modal */
.detail-overlay {
  position: fixed;
  inset: 0;
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(4px);
  animation: fade-in 0.2s ease;
}

@keyframes fade-in {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.detail-modal {
  width: 100%;
  max-width: 400px;
  background: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.4);
  animation: slide-up 0.25s ease;
}

@keyframes slide-up {
  from {
    opacity: 0;
    transform: translateY(20px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.detail-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 1.25rem;
  color: white;
}

.detail-category {
  font-family: 'Bebas Neue', 'Impact', sans-serif;
  font-size: 1.25rem;
  letter-spacing: 0.1em;
}

.detail-close {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.2);
  color: white;
  font-size: 1rem;
  cursor: pointer;
  transition: background 0.15s;
}

.detail-close:hover {
  background: rgba(255, 255, 255, 0.3);
}

.detail-content {
  padding: 1.5rem 1.25rem;
}

.detail-text {
  font-size: 1.1rem;
  font-weight: 500;
  color: #1f2937;
  line-height: 1.5;
  margin: 0 0 1rem;
}

.detail-instructions {
  font-size: 0.875rem;
  color: #6b7280;
  font-style: italic;
  padding: 0.75rem;
  background: #f3f4f6;
  border-radius: 6px;
  margin: 0 0 1rem;
}

.detail-status {
  display: flex;
  justify-content: center;
}

.status-badge {
  padding: 0.375rem 1rem;
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.05em;
}

.status-available {
  background: #dcfce7;
  color: #166534;
}

.status-asked {
  background: #e5e7eb;
  color: #374151;
}

.status-pending {
  background: #fef3c7;
  color: #92400e;
}

.detail-actions {
  display: flex;
  gap: 0.75rem;
  padding: 1rem 1.25rem 1.25rem;
  border-top: 1px solid #e5e7eb;
}

.detail-actions button {
  flex: 1;
  padding: 0.875rem 1rem;
  border: none;
  border-radius: 8px;
  font-family: 'Barlow', system-ui, sans-serif;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s;
}

.action-ask {
  background: #2563eb;
  color: white;
}

.action-ask:hover {
  background: #1d4ed8;
}

.action-reask {
  background: #7c3aed;
  color: white;
}

.action-reask:hover:not(:disabled) {
  background: #6d28d9;
}

.action-reask:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.action-cancel {
  background: #f3f4f6;
  color: #374151;
}

.action-cancel:hover {
  background: #e5e7eb;
}
</style>
