<script setup lang="ts">
import { useNotifications } from '@/composables/useNotifications'

const { toasts, dismissToast } = useNotifications()
</script>

<template>
  <Teleport to="body">
    <div
      data-testid="toast-container"
      class="fixed top-4 left-1/2 z-[100] flex -translate-x-1/2 flex-col gap-2"
      aria-live="polite"
    >
      <TransitionGroup name="toast">
        <div
          v-for="toast in toasts"
          :key="toast.id"
          :data-testid="`toast-${toast.id}`"
          role="alert"
          class="flex min-w-[280px] max-w-[90vw] items-center gap-3 rounded-lg px-4 py-3 text-sm shadow-lg"
          :class="[
            `toast-${toast.type}`,
            {
              'toast-info': toast.type === 'info',
              'toast-success': toast.type === 'success',
              'toast-warning': toast.type === 'warning',
              'toast-error': toast.type === 'error',
            },
          ]"
        >
          <!-- Icon based on type -->
          <span class="flex-shrink-0 text-lg">
            <template v-if="toast.type === 'info'">&#8505;</template>
            <template v-else-if="toast.type === 'success'">&#10003;</template>
            <template v-else-if="toast.type === 'warning'">&#9888;</template>
            <template v-else-if="toast.type === 'error'">&#10005;</template>
          </span>

          <!-- Message -->
          <span class="flex-1">{{ toast.message }}</span>

          <!-- Dismiss button -->
          <button
            type="button"
            data-testid="toast-dismiss"
            class="min-h-11 min-w-11 flex-shrink-0 rounded p-2 opacity-70 hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-white/30"
            aria-label="Dismiss notification"
            @click="dismissToast(toast.id)"
          >
            &#10005;
          </button>
        </div>
      </TransitionGroup>
    </div>
  </Teleport>
</template>

<style scoped>
/* Toast type colors */
.toast-info {
  background-color: #1e40af; /* blue-800 */
  color: #fff;
}

.toast-success {
  background-color: #166534; /* green-800 */
  color: #fff;
}

.toast-warning {
  background-color: #b45309; /* amber-700 */
  color: #fff;
}

.toast-error {
  background-color: #b91c1c; /* red-700 */
  color: #fff;
}

/* Toast transition animations */
.toast-enter-active,
.toast-leave-active {
  transition: all 0.3s ease;
}

.toast-enter-from {
  opacity: 0;
  transform: translateY(-20px);
}

.toast-leave-to {
  opacity: 0;
  transform: translateX(100%);
}

.toast-move {
  transition: transform 0.3s ease;
}
</style>
