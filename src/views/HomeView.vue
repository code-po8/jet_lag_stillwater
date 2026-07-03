<script setup lang="ts">
import { RouterLink } from 'vue-router'
</script>

<template>
  <main class="home-view">
    <!-- Animated background pattern -->
    <div class="home-bg-pattern" aria-hidden="true"></div>

    <!-- Content -->
    <div class="home-content">
      <!-- Logo/Title Block -->
      <div class="home-logo-block">
        <div class="home-logo-stripe"></div>
        <h1 class="home-title">
          <span class="home-title-jet">JET</span>
          <span class="home-title-lag">LAG</span>
        </h1>
        <div class="home-subtitle-wrapper">
          <span class="home-subtitle">STILLWATER</span>
        </div>
      </div>

      <!-- Tagline -->
      <p class="home-tagline">Hide and Seek on the OSU Bus System</p>

      <!-- Start Button -->
      <RouterLink to="/setup" class="home-start-btn">
        <svg class="home-start-icon" viewBox="0 0 24 24" fill="currentColor">
          <path d="M8 5v14l11-7z" />
        </svg>
        <span>NEW GAME</span>
      </RouterLink>

      <!-- Multiplayer entry (MULTI-002) -->
      <RouterLink to="/lobby" class="home-multiplayer-btn">
        <svg class="home-start-icon" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path
            d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"
          />
        </svg>
        <span>MULTIPLAYER</span>
      </RouterLink>

      <!-- Footer credits -->
      <div class="home-credits">
        <span>Inspired by</span>
        <a
          href="https://nebula.tv/jetlag"
          target="_blank"
          rel="noopener noreferrer"
          class="home-credits-link"
        >
          Jet Lag: The Game
        </a>
      </div>
    </div>
  </main>
</template>

<style scoped>
.home-view {
  position: relative;
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  background: linear-gradient(180deg, #374151 0%, #1f2937 40%, #111827 100%);
}

/* Subtle animated diagonal stripes */
.home-bg-pattern {
  position: absolute;
  inset: 0;
  opacity: 0.03;
  background-image: repeating-linear-gradient(
    -45deg,
    transparent,
    transparent 30px,
    white 30px,
    white 32px
  );
  animation: pattern-drift 20s linear infinite;
}

@keyframes pattern-drift {
  0% {
    transform: translateX(0) translateY(0);
  }
  100% {
    transform: translateX(60px) translateY(60px);
  }
}

.home-content {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2rem;
  padding: 2rem;
  text-align: center;
}

/* Logo block styling */
.home-logo-block {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.home-logo-stripe {
  width: 120%;
  height: 6px;
  margin-bottom: 1rem;
  background: linear-gradient(
    90deg,
    transparent 0%,
    var(--color-brand-red) 15%,
    var(--color-brand-orange) 50%,
    var(--color-brand-gold) 85%,
    transparent 100%
  );
  border-radius: 3px;
}

.home-title {
  font-family: var(--font-display);
  font-size: clamp(4rem, 15vw, 7rem);
  line-height: 0.85;
  letter-spacing: 0.15em;
  display: flex;
  gap: 0.15em;
}

.home-title-jet {
  color: white;
  text-shadow:
    2px 2px 0 rgba(0, 0, 0, 0.3),
    4px 4px 8px rgba(0, 0, 0, 0.2);
}

.home-title-lag {
  color: var(--color-brand-red);
  text-shadow:
    2px 2px 0 rgba(0, 0, 0, 0.3),
    4px 4px 8px rgba(0, 0, 0, 0.2);
}

.home-subtitle-wrapper {
  margin-top: 0.5rem;
  padding: 0.25rem 1rem;
  background: linear-gradient(135deg, var(--color-brand-gold) 0%, var(--color-brand-orange) 100%);
  border-radius: 4px;
  box-shadow: 0 2px 8px rgba(240, 125, 46, 0.4);
}

.home-subtitle {
  font-family: var(--font-display);
  font-size: clamp(1.25rem, 5vw, 2rem);
  letter-spacing: 0.3em;
  color: white;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.3);
}

.home-tagline {
  font-family: var(--font-body);
  font-size: 1rem;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.7);
  letter-spacing: 0.02em;
  max-width: 280px;
}

/* Start button */
.home-start-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  padding: 1rem 2.5rem;
  margin-top: 1rem;
  font-family: var(--font-display);
  font-size: 1.5rem;
  letter-spacing: 0.1em;
  color: white;
  background: linear-gradient(135deg, var(--color-brand-red) 0%, var(--color-brand-red-dark) 100%);
  border-radius: 12px;
  text-decoration: none;
  box-shadow:
    0 4px 12px rgba(220, 38, 38, 0.4),
    0 2px 4px rgba(0, 0, 0, 0.2),
    inset 0 1px 0 rgba(255, 255, 255, 0.15);
  transition: all 0.2s ease;
}

.home-start-btn:hover {
  transform: translateY(-2px);
  box-shadow:
    0 6px 20px rgba(220, 38, 38, 0.5),
    0 4px 8px rgba(0, 0, 0, 0.2),
    inset 0 1px 0 rgba(255, 255, 255, 0.15);
}

.home-start-btn:active {
  transform: translateY(0);
  box-shadow:
    0 2px 8px rgba(220, 38, 38, 0.4),
    0 1px 2px rgba(0, 0, 0, 0.2),
    inset 0 1px 0 rgba(255, 255, 255, 0.15);
}

.home-start-icon {
  width: 1.5rem;
  height: 1.5rem;
}

/* Credits */
.home-credits {
  margin-top: 2rem;
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.4);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.25rem;
}

.home-credits-link {
  color: var(--color-brand-cyan);
  text-decoration: none;
  font-weight: 600;
  transition: color 0.2s ease;
}

.home-credits-link:hover {
  color: white;
}
</style>
