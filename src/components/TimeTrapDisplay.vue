<script setup lang="ts">
import { computed } from 'vue'
import { type ActiveTimeTrap } from '@/stores/cardStore'

// Props
const props = defineProps<{
  traps: ActiveTimeTrap[]
  isHider: boolean
}>()

// Events
const emit = defineEmits<{
  trigger: [trapInstanceId: string]
}>()

// Computed
const hasTraps = computed(() => props.traps.length > 0)

// Methods
function handleTrigger(trapInstanceId: string) {
  emit('trigger', trapInstanceId)
}

function formatTrapStatus(trap: ActiveTimeTrap): string {
  if (trap.isTriggered) {
    return 'Triggered!'
  }
  return `+${trap.bonusMinutes} min if triggered`
}
</script>

<template>
  <div
    v-if="hasTraps"
    data-testid="time-trap-display"
    role="region"
    aria-label="Active Time Traps"
    class="rounded-lg bg-slate-800 p-4"
  >
    <!-- Header -->
    <h3 class="mb-3 text-sm font-semibold uppercase tracking-wide text-orange-400">
      Active Time Traps
    </h3>

    <!-- Trap List -->
    <ul class="space-y-2">
      <li
        v-for="trap in traps"
        :key="trap.instanceId"
        data-testid="trap-item"
        class="rounded-lg p-3 transition-colors"
        :class="trap.isTriggered
          ? 'bg-green-900/40 border border-green-500/30'
          : 'bg-orange-900/40 border border-orange-500/30'"
      >
        <div class="flex items-center justify-between">
          <!-- Trap Info -->
          <div class="flex-1">
            <div class="font-medium text-white">
              {{ trap.stationName }}
            </div>
            <div
              class="text-sm"
              :class="trap.isTriggered ? 'text-green-300' : 'text-orange-300'"
            >
              {{ formatTrapStatus(trap) }}
            </div>
          </div>

          <!-- Trigger Button (for seekers only) -->
          <button
            v-if="!isHider && !trap.isTriggered"
            data-testid="trigger-trap-btn"
            class="min-h-11 rounded-lg bg-orange-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-orange-400"
            @click="handleTrigger(trap.instanceId)"
          >
            I Visited
          </button>

          <!-- Triggered Badge -->
          <div
            v-if="trap.isTriggered"
            class="rounded-full bg-green-500/20 px-3 py-1 text-sm font-medium text-green-300"
          >
            Triggered
          </div>
        </div>
      </li>
    </ul>

    <!-- Warning for seekers -->
    <p
      v-if="!isHider"
      class="mt-3 text-xs text-slate-400"
    >
      Click "I Visited" if you visited a trapped station. This gives the hider bonus time.
    </p>
  </div>
</template>
