<script setup lang="ts">
import { RouterLink } from 'vue-router'
</script>

<template>
  <main class="min-h-screen bg-slate-900 text-white flex items-center justify-center">
    <div class="text-center">
      <h1 class="text-3xl font-bold mb-2">Jet Lag: Stillwater</h1>
      <p class="text-slate-400 mb-8">Hide and Seek on the OSU Bus System</p>
      <RouterLink
        to="/setup"
        class="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
      >
        New Game
      </RouterLink>
    </div>
  </main>
</template>
