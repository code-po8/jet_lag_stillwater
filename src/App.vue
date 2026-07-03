<script setup lang="ts">
import { RouterView } from 'vue-router'
import ToastContainer from '@/components/ToastContainer.vue'
import { useMultiplayerBridge } from '@/composables/useMultiplayerBridge'

// App-level: bridges the multiplayer roster/phase into local state + navigation.
// Lives here so it survives view changes (e.g. Lobby → GamePlay).
useMultiplayerBridge()
</script>

<template>
  <RouterView />
  <ToastContainer />
</template>
