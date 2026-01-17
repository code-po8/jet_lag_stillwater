<script setup lang="ts">
import { computed } from 'vue'
import { BRAND_COLORS } from '@/design/colors'

type LogoSize = 'sm' | 'md' | 'lg'

interface Props {
  size?: LogoSize
}

const props = withDefaults(defineProps<Props>(), {
  size: 'md',
})

const dimensions = computed(() => {
  switch (props.size) {
    case 'sm':
      return { width: 120, height: 60 }
    case 'lg':
      return { width: 280, height: 140 }
    case 'md':
    default:
      return { width: 200, height: 100 }
  }
})
</script>

<template>
  <svg
    data-testid="jet-lag-logo"
    :width="dimensions.width"
    :height="dimensions.height"
    viewBox="0 0 200 100"
    role="img"
    aria-label="Jet Lag: Stillwater Edition logo"
    xmlns="http://www.w3.org/2000/svg"
  >
    <defs>
      <!-- Gradient for the radiating stripes -->
      <linearGradient id="stripeGradient" x1="0%" y1="50%" x2="100%" y2="50%">
        <stop offset="0%" :stop-color="BRAND_COLORS.red" />
        <stop offset="50%" :stop-color="BRAND_COLORS.orange" />
        <stop offset="100%" :stop-color="BRAND_COLORS.gold" />
      </linearGradient>
      <!-- Gradient for the OSU gold badge -->
      <linearGradient id="goldBadge" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stop-color="#f5b830" />
        <stop offset="100%" stop-color="#d4920a" />
      </linearGradient>
    </defs>

    <!-- Background rounded rectangle (badge shape) -->
    <rect x="5" y="5" width="190" height="65" rx="10" ry="10" :fill="BRAND_COLORS.navy" />

    <!-- Radiating stripe pattern behind text -->
    <g clip-path="url(#badgeClip)">
      <defs>
        <clipPath id="badgeClip">
          <rect x="5" y="5" width="190" height="65" rx="10" ry="10" />
        </clipPath>
      </defs>
      <!-- Diagonal stripes radiating from center -->
      <g opacity="0.3">
        <rect
          x="85"
          y="-20"
          width="8"
          height="110"
          fill="url(#stripeGradient)"
          transform="rotate(25 100 37.5)"
        />
        <rect
          x="95"
          y="-20"
          width="6"
          height="110"
          fill="url(#stripeGradient)"
          transform="rotate(15 100 37.5)"
        />
        <rect
          x="103"
          y="-20"
          width="4"
          height="110"
          fill="url(#stripeGradient)"
          transform="rotate(5 100 37.5)"
        />
        <rect
          x="93"
          y="-20"
          width="4"
          height="110"
          fill="url(#stripeGradient)"
          transform="rotate(-5 100 37.5)"
        />
        <rect
          x="83"
          y="-20"
          width="6"
          height="110"
          fill="url(#stripeGradient)"
          transform="rotate(-15 100 37.5)"
        />
        <rect
          x="71"
          y="-20"
          width="8"
          height="110"
          fill="url(#stripeGradient)"
          transform="rotate(-25 100 37.5)"
        />
      </g>
    </g>

    <!-- Main text: JET [pistol] LAG -->
    <text
      x="30"
      y="48"
      font-family="'Arial Black', 'Helvetica Neue', Helvetica, sans-serif"
      font-size="32"
      font-weight="900"
      fill="white"
      letter-spacing="2"
    >
      JET
    </text>

    <!-- Pistol firing hand gesture (OSU "Pistols Firing" symbol) -->
    <g data-testid="logo-pistol-hand" transform="translate(85, 22)">
      <!-- Hand silhouette facing right -->
      <path
        d="M0 18
           L10 18
           L10 12
           L28 12
           L28 18
           L30 18
           L30 8
           L10 8
           L10 0
           L6 0
           L6 8
           L0 8
           Z"
        :fill="BRAND_COLORS.orange"
      />
      <!-- Thumb extended up -->
      <rect x="6" y="-4" width="4" height="8" :fill="BRAND_COLORS.orange" />
    </g>

    <text
      x="120"
      y="48"
      font-family="'Arial Black', 'Helvetica Neue', Helvetica, sans-serif"
      font-size="32"
      font-weight="900"
      fill="white"
      letter-spacing="2"
    >
      LAG
    </text>

    <!-- Stillwater Edition badge below -->
    <rect x="35" y="75" width="130" height="20" rx="4" ry="4" fill="url(#goldBadge)" />
    <text
      x="100"
      y="89"
      font-family="'Arial', 'Helvetica Neue', Helvetica, sans-serif"
      font-size="10"
      font-weight="700"
      fill="#1a1a2e"
      text-anchor="middle"
      letter-spacing="1.5"
    >
      STILLWATER EDITION
    </text>
  </svg>
</template>
