import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import GameSetupView from '../views/GameSetupView.vue'
import GamePlayView from '../views/GamePlayView.vue'
import FinalResultsView from '../views/FinalResultsView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView,
    },
    {
      path: '/setup',
      name: 'setup',
      component: GameSetupView,
    },
    {
      path: '/game',
      name: 'game',
      component: GamePlayView,
    },
    {
      path: '/results',
      name: 'results',
      component: FinalResultsView,
    },
  ],
})

export default router
