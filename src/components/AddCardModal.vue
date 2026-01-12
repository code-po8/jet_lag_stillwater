<script setup lang="ts">
import { ref, computed } from 'vue'
import { useCardStore } from '@/stores/cardStore'
import { CardType, PowerupType, POWERUP_CARDS, CURSE_CARDS, TIME_BONUS_TIERS } from '@/types/card'

defineProps<{
  isOpen: boolean
}>()

const emit = defineEmits<{
  confirm: [
    payload: {
      cardType: CardType
      options: { tier?: number; powerupType?: PowerupType; curseId?: string }
    },
  ]
  cancel: []
}>()

const cardStore = useCardStore()

// Selection state
const selectedCardType = ref<CardType | null>(null)
const selectedTier = ref<number | null>(null)
const selectedPowerupType = ref<PowerupType | null>(null)
const selectedCurseId = ref<string | null>(null)

// Computed
const isHandFull = computed(() => cardStore.isHandFull)

const isSelectionComplete = computed(() => {
  if (!selectedCardType.value) return false
  if (isHandFull.value) return false

  switch (selectedCardType.value) {
    case CardType.TimeBonus:
      return selectedTier.value !== null
    case CardType.Powerup:
      return selectedPowerupType.value !== null
    case CardType.Curse:
      return selectedCurseId.value !== null
    case CardType.TimeTrap:
      return true
    default:
      return false
  }
})

// Actions
function selectCardType(type: CardType) {
  selectedCardType.value = type
  // Reset sub-selections
  selectedTier.value = null
  selectedPowerupType.value = null
  selectedCurseId.value = null
}

function selectTier(tier: number) {
  selectedTier.value = tier
}

function selectPowerupType(powerupType: PowerupType) {
  selectedPowerupType.value = powerupType
}

function selectCurse(curseId: string) {
  selectedCurseId.value = curseId
}

function handleConfirm() {
  if (!isSelectionComplete.value || !selectedCardType.value) return

  const options: { tier?: number; powerupType?: PowerupType; curseId?: string } = {}

  switch (selectedCardType.value) {
    case CardType.TimeBonus:
      options.tier = selectedTier.value!
      break
    case CardType.Powerup:
      options.powerupType = selectedPowerupType.value!
      break
    case CardType.Curse:
      options.curseId = selectedCurseId.value!
      break
  }

  emit('confirm', {
    cardType: selectedCardType.value,
    options,
  })

  // Reset selections
  selectedCardType.value = null
  selectedTier.value = null
  selectedPowerupType.value = null
  selectedCurseId.value = null
}

function handleCancel() {
  emit('cancel')
  // Reset selections
  selectedCardType.value = null
  selectedTier.value = null
  selectedPowerupType.value = null
  selectedCurseId.value = null
}

// Get tier display info
function getTierBonusText(tier: number): string {
  const tierData = TIME_BONUS_TIERS.find((t) => t.tier === tier)
  if (!tierData) return ''
  return `${tierData.minutes.small}/${tierData.minutes.medium}/${tierData.minutes.large} min`
}
</script>

<template>
  <div
    v-if="isOpen"
    data-testid="add-card-modal"
    role="dialog"
    aria-modal="true"
    aria-labelledby="add-card-modal-title"
    class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
  >
    <div
      class="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-xl bg-slate-800 p-4 shadow-2xl"
    >
      <!-- Header -->
      <h2 id="add-card-modal-title" class="mb-3 text-xl font-bold text-white">Add Card</h2>
      <p class="mb-4 text-sm text-slate-400">Select a card type to add to your hand</p>

      <!-- Hand Full Warning -->
      <div v-if="isHandFull" class="mb-4 rounded-lg bg-red-900/50 p-3 text-red-200">
        Hand is full. Discard or play a card before adding more.
      </div>

      <!-- Card Type Selection -->
      <div class="mb-4 grid grid-cols-2 gap-2">
        <button
          data-testid="card-type-time-bonus"
          class="flex flex-col items-center rounded-lg bg-green-800 p-3 text-white transition-all hover:bg-green-700"
          :class="{ 'ring-2 ring-green-400': selectedCardType === CardType.TimeBonus }"
          @click="selectCardType(CardType.TimeBonus)"
        >
          <span class="text-2xl">+</span>
          <span class="text-sm font-medium">Time Bonus</span>
        </button>

        <button
          data-testid="card-type-powerup"
          class="flex flex-col items-center rounded-lg bg-blue-800 p-3 text-white transition-all hover:bg-blue-700"
          :class="{ 'ring-2 ring-blue-400': selectedCardType === CardType.Powerup }"
          @click="selectCardType(CardType.Powerup)"
        >
          <span class="text-2xl">*</span>
          <span class="text-sm font-medium">Powerup</span>
        </button>

        <button
          data-testid="card-type-curse"
          class="flex flex-col items-center rounded-lg bg-purple-800 p-3 text-white transition-all hover:bg-purple-700"
          :class="{ 'ring-2 ring-purple-400': selectedCardType === CardType.Curse }"
          @click="selectCardType(CardType.Curse)"
        >
          <span class="text-2xl">~</span>
          <span class="text-sm font-medium">Curse</span>
        </button>

        <button
          data-testid="card-type-time-trap"
          class="flex flex-col items-center rounded-lg bg-amber-800 p-3 text-white transition-all hover:bg-amber-700"
          :class="{ 'ring-2 ring-amber-400': selectedCardType === CardType.TimeTrap }"
          @click="selectCardType(CardType.TimeTrap)"
        >
          <span class="text-2xl">!</span>
          <span class="text-sm font-medium">Time Trap</span>
        </button>
      </div>

      <!-- Time Bonus Tier Selection -->
      <div v-if="selectedCardType === CardType.TimeBonus" data-testid="tier-options" class="mb-4">
        <h3 class="mb-2 text-sm font-medium text-slate-300">Select Tier</h3>
        <div class="flex flex-wrap gap-2">
          <button
            v-for="tier in [1, 2, 3, 4, 5]"
            :key="tier"
            :data-testid="`tier-option-${tier}`"
            class="flex min-w-16 flex-col items-center rounded-lg bg-slate-700 px-3 py-2 text-white transition-all hover:bg-slate-600"
            :class="{ 'ring-2 ring-green-400': selectedTier === tier }"
            @click="selectTier(tier)"
          >
            <span class="font-bold">Tier {{ tier }}</span>
            <span class="text-xs text-slate-400">{{ getTierBonusText(tier) }}</span>
          </button>
        </div>
      </div>

      <!-- Powerup Type Selection -->
      <div v-if="selectedCardType === CardType.Powerup" data-testid="powerup-options" class="mb-4">
        <h3 class="mb-2 text-sm font-medium text-slate-300">Select Powerup</h3>
        <div class="max-h-48 space-y-2 overflow-y-auto">
          <button
            v-for="powerup in POWERUP_CARDS"
            :key="powerup.powerupType"
            :data-testid="`powerup-option-${powerup.powerupType}`"
            class="w-full rounded-lg bg-slate-700 p-3 text-left text-white transition-all hover:bg-slate-600"
            :class="{ 'ring-2 ring-blue-400': selectedPowerupType === powerup.powerupType }"
            @click="selectPowerupType(powerup.powerupType)"
          >
            <span class="font-medium">{{ powerup.name }}</span>
            <p class="text-xs text-slate-400">{{ powerup.description }}</p>
          </button>
        </div>
      </div>

      <!-- Curse Selection -->
      <div v-if="selectedCardType === CardType.Curse" data-testid="curse-options" class="mb-4">
        <h3 class="mb-2 text-sm font-medium text-slate-300">Select Curse</h3>
        <div class="max-h-48 space-y-2 overflow-y-auto">
          <button
            v-for="curse in CURSE_CARDS"
            :key="curse.id"
            :data-testid="`curse-option-${curse.id}`"
            class="w-full rounded-lg bg-slate-700 p-3 text-left text-white transition-all hover:bg-slate-600"
            :class="{ 'ring-2 ring-purple-400': selectedCurseId === curse.id }"
            @click="selectCurse(curse.id)"
          >
            <span class="font-medium">{{ curse.name }}</span>
            <p class="text-xs text-slate-400">{{ curse.description }}</p>
          </button>
        </div>
      </div>

      <!-- Action Buttons -->
      <div class="flex gap-3">
        <button
          data-testid="add-card-cancel-btn"
          class="min-h-11 flex-1 rounded-lg bg-slate-700 px-4 py-3 font-medium text-white transition-colors hover:bg-slate-600"
          @click="handleCancel"
        >
          Cancel
        </button>
        <button
          data-testid="add-card-confirm-btn"
          class="min-h-11 flex-1 rounded-lg bg-green-600 px-4 py-3 font-medium text-white transition-colors hover:bg-green-500 disabled:cursor-not-allowed disabled:opacity-50"
          :disabled="!isSelectionComplete"
          @click="handleConfirm"
        >
          Add Card
        </button>
      </div>
    </div>
  </div>
</template>
