<script setup lang="ts">
import { computed } from 'vue'

export type NavTab = 'questions' | 'timers' | 'cards' | 'history' | 'map' | 'admin'

interface Props {
  currentTab: NavTab
  /** Show the host-only Admin tab (ADMIN-001). Default false. */
  showAdmin?: boolean
  /**
   * Tabs to mark with an attention badge (QSYNC-006) — e.g. `['cards']` while a
   * question is pending for the hider, so it's visible from any tab.
   */
  badgeTabs?: NavTab[]
}

const props = withDefaults(defineProps<Props>(), { showAdmin: false, badgeTabs: () => [] })

function hasBadge(tabId: NavTab): boolean {
  return props.badgeTabs.includes(tabId)
}

const emit = defineEmits<{
  (e: 'tab-change', tab: NavTab): void
}>()

interface TabConfig {
  id: NavTab
  label: string
}

const tabs = computed<TabConfig[]>(() => {
  const base: TabConfig[] = [
    { id: 'questions', label: 'Questions' },
    { id: 'map', label: 'Map' },
    { id: 'timers', label: 'Timers' },
    { id: 'cards', label: 'Cards' },
    { id: 'history', label: 'History' },
  ]
  // Host-only Admin tab, appended last so the common tabs keep their positions.
  if (props.showAdmin) base.push({ id: 'admin', label: 'Admin' })
  return base
})

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
    class="bottom-nav safe-area-bottom"
  >
    <button
      v-for="tab in tabs"
      :key="tab.id"
      type="button"
      :data-testid="`nav-tab-${tab.id}`"
      class="bottom-nav-item"
      :class="{ active: isActive(tab.id) }"
      :aria-current="isActive(tab.id) ? 'page' : undefined"
      @click="handleTabClick(tab.id)"
    >
      <!-- Questions Icon -->
      <svg
        v-if="tab.id === 'questions'"
        :data-testid="`nav-tab-${tab.id}-icon`"
        class="bottom-nav-icon"
        viewBox="0 0 24 24"
        fill="currentColor"
      >
        <path
          d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17h-2v-2h2v2zm2.07-7.75l-.9.92C13.45 12.9 13 13.5 13 15h-2v-.5c0-1.1.45-2.1 1.17-2.83l1.24-1.26c.37-.36.59-.86.59-1.41 0-1.1-.9-2-2-2s-2 .9-2 2H8c0-2.21 1.79-4 4-4s4 1.79 4 4c0 .88-.36 1.68-.93 2.25z"
        />
      </svg>

      <!-- Timers Icon -->
      <svg
        v-else-if="tab.id === 'timers'"
        :data-testid="`nav-tab-${tab.id}-icon`"
        class="bottom-nav-icon"
        viewBox="0 0 24 24"
        fill="currentColor"
      >
        <path
          d="M15 1H9v2h6V1zm-4 13h2V8h-2v6zm8.03-6.61l1.42-1.42c-.43-.51-.9-.99-1.41-1.41l-1.42 1.42C16.07 4.74 14.12 4 12 4c-4.97 0-9 4.03-9 9s4.02 9 9 9 9-4.03 9-9c0-2.12-.74-4.07-1.97-5.61zM12 20c-3.87 0-7-3.13-7-7s3.13-7 7-7 7 3.13 7 7-3.13 7-7 7z"
        />
      </svg>

      <!-- Cards Icon -->
      <svg
        v-else-if="tab.id === 'cards'"
        :data-testid="`nav-tab-${tab.id}-icon`"
        class="bottom-nav-icon"
        viewBox="0 0 24 24"
        fill="currentColor"
      >
        <path
          d="M21.47 4.35l-1.34-.56v9.03l2.43-5.86c.41-1.02-.06-2.19-1.09-2.61zm-19.5 3.7L6.93 20a2.01 2.01 0 001.81 1.26c.26 0 .53-.05.79-.16l7.37-3.05c.75-.31 1.21-1.05 1.23-1.79.01-.26-.04-.55-.13-.81L13 3.5c-.29-.72-.97-1.17-1.73-1.17-.27 0-.54.05-.79.15L3.11 5.54c-1.03.42-1.51 1.6-1.14 2.51zm16.15-3.8c-.55-.22-1.17 0-1.44.49L14.13 9.4l1.49-6.71c.09-.41.07-.8-.11-1.1z"
        />
      </svg>

      <!-- History Icon -->
      <svg
        v-else-if="tab.id === 'history'"
        :data-testid="`nav-tab-${tab.id}-icon`"
        class="bottom-nav-icon"
        viewBox="0 0 24 24"
        fill="currentColor"
      >
        <path
          d="M13 3c-4.97 0-9 4.03-9 9H1l3.89 3.89.07.14L9 12H6c0-3.87 3.13-7 7-7s7 3.13 7 7-3.13 7-7 7c-1.93 0-3.68-.79-4.94-2.06l-1.42 1.42C8.27 19.99 10.51 21 13 21c4.97 0 9-4.03 9-9s-4.03-9-9-9zm-1 5v5l4.28 2.54.72-1.21-3.5-2.08V8H12z"
        />
      </svg>

      <!-- Map Icon -->
      <svg
        v-else-if="tab.id === 'map'"
        :data-testid="`nav-tab-${tab.id}-icon`"
        class="bottom-nav-icon"
        viewBox="0 0 24 24"
        fill="currentColor"
      >
        <path
          d="M20.5 3l-.16.03L15 5.1 9 3 3.36 4.9c-.21.07-.36.25-.36.48V20.5c0 .28.22.5.5.5l.16-.03L9 18.9l6 2.1 5.64-1.9c.21-.07.36-.25.36-.48V3.5c0-.28-.22-.5-.5-.5zM15 19l-6-2.11V5l6 2.11V19z"
        />
      </svg>

      <!-- Admin Icon (host-only) -->
      <svg
        v-else-if="tab.id === 'admin'"
        :data-testid="`nav-tab-${tab.id}-icon`"
        class="bottom-nav-icon"
        viewBox="0 0 24 24"
        fill="currentColor"
      >
        <path
          d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 10.99h7c-.53 4.12-3.28 7.79-7 8.94V12H5V6.3l7-3.11V11.99z"
        />
      </svg>

      <!-- Attention badge (QSYNC-006): drawn on top-right of the tab icon. -->
      <span
        v-if="hasBadge(tab.id)"
        :data-testid="`nav-badge-${tab.id}`"
        class="bottom-nav-badge"
        aria-label="Action needed"
      ></span>

      <span class="bottom-nav-label">{{ tab.label }}</span>
    </button>
  </nav>
</template>

<style scoped>
.bottom-nav-icon {
  width: 1.375rem;
  height: 1.375rem;
}

.bottom-nav-label {
  margin-top: 0.25rem;
  font-size: 0.65rem;
  font-weight: 600;
  letter-spacing: 0.03em;
  text-transform: uppercase;
}

/* Active state indicator */
.bottom-nav-item {
  position: relative;
}

/* Attention badge (QSYNC-006): a pulsing dot on the tab icon's top-right. */
.bottom-nav-badge {
  position: absolute;
  top: 6px;
  right: calc(50% - 16px);
  width: 9px;
  height: 9px;
  border-radius: 50%;
  background: var(--color-brand-cyan, #00aaff);
  box-shadow: 0 0 0 2px var(--color-ui-bg, #0f172a);
  animation: nav-badge-pulse 1.4s ease-in-out infinite;
}
@keyframes nav-badge-pulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.45;
  }
}

.bottom-nav-item.active::before {
  content: '';
  position: absolute;
  top: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 40%;
  height: 3px;
  background: linear-gradient(90deg, var(--color-brand-red) 0%, var(--color-brand-orange) 100%);
  border-radius: 0 0 3px 3px;
}

.bottom-nav-item.active {
  color: white;
  background: linear-gradient(180deg, rgba(220, 38, 38, 0.15) 0%, transparent 100%);
}
</style>
