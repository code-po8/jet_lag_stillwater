<script setup lang="ts">
export type NavTab = 'questions' | 'timers' | 'cards' | 'history'

interface Props {
  currentTab: NavTab
}

const props = defineProps<Props>()

const emit = defineEmits<{
  (e: 'tab-change', tab: NavTab): void
}>()

interface TabConfig {
  id: NavTab
  label: string
  icon: string
}

const tabs: TabConfig[] = [
  { id: 'questions', label: 'Questions', icon: '?' },
  { id: 'timers', label: 'Timers', icon: '⏱' },
  { id: 'cards', label: 'Cards', icon: '🃏' },
  { id: 'history', label: 'History', icon: '📋' },
]

function handleTabClick(tabId: NavTab) {
  emit('tab-change', tabId)
}

function isActive(tabId: NavTab): boolean {
  return props.currentTab === tabId
}
</script>

<template>
  <nav
    data-testid="bottom-nav"
    role="navigation"
    aria-label="Main navigation"
    class="fixed bottom-0 left-0 flex w-full border-t border-slate-700 bg-slate-800"
  >
    <button
      v-for="tab in tabs"
      :key="tab.id"
      type="button"
      :data-testid="`nav-tab-${tab.id}`"
      :class="[
        'flex min-h-11 flex-1 flex-col items-center justify-center py-2 transition-colors',
        isActive(tab.id)
          ? 'active bg-slate-700 text-blue-400'
          : 'text-slate-400 hover:bg-slate-700/50 hover:text-slate-200',
      ]"
      :aria-current="isActive(tab.id) ? 'page' : undefined"
      @click="handleTabClick(tab.id)"
    >
      <span :data-testid="`nav-tab-${tab.id}-icon`" class="text-lg">
        {{ tab.icon }}
      </span>
      <span class="mt-1 text-xs font-medium">
        {{ tab.label }}
      </span>
    </button>
  </nav>
</template>
