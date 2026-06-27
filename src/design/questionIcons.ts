/**
 * Question Icons - SVG icon definitions for each question
 *
 * Icons are designed to match the official Jet Lag: Hide and Seek show aesthetic.
 * White icons on colored tile backgrounds, simple geometric shapes that read well at small sizes.
 *
 * Icon reference from RESEARCH_NOTES.md
 */

/**
 * SVG icon definition with viewBox and path data
 */
export interface IconDefinition {
  viewBox: string
  paths: string[]
  /** Optional secondary paths for overlays like map markers */
  overlay?: string[]
}

/**
 * All question icons mapped by question ID
 */
export const QUESTION_ICONS: Record<string, IconDefinition> = {
  // ═══════════════════════════════════════════════════════════════════════════
  // MATCHING QUESTIONS (Navy Blue)
  // ═══════════════════════════════════════════════════════════════════════════

  // Transit
  'matching-transit-airport': {
    // Plane + control tower
    viewBox: '0 0 24 24',
    paths: [
      // Plane
      'M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z',
      // Tower
      'M3 13h2v8H3z M2 21h4v1H2z M3 11h2l.5-2h-3l.5 2z',
    ],
  },

  'matching-transit-line': {
    // Bus/Train front view
    viewBox: '0 0 24 24',
    paths: [
      // Bus body
      'M4 16c0 .88.39 1.67 1 2.22V20c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h8v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1.78c.61-.55 1-1.34 1-2.22V6c0-3.5-3.58-4-8-4s-8 .5-8 4v10z',
      // Windows
      'M6 6h12v6H6z',
      // Headlights
      'M6 13.5c0 .83.67 1.5 1.5 1.5s1.5-.67 1.5-1.5S8.33 12 7.5 12 6 12.67 6 13.5z M15 13.5c0 .83.67 1.5 1.5 1.5s1.5-.67 1.5-1.5-.67-1.5-1.5-1.5-1.5.67-1.5 1.5z',
    ],
  },

  'matching-transit-station-name-length': {
    // Train + letter A
    viewBox: '0 0 24 24',
    paths: [
      // Train silhouette
      'M4 15.5C4 17.43 5.57 19 7.5 19L6 20.5v.5h12v-.5L16.5 19c1.93 0 3.5-1.57 3.5-3.5V5c0-3.5-3.58-4-8-4s-8 .5-8 4v10.5z',
      // Letter A
      'M12 7l-3 8h1.5l.5-1.5h2l.5 1.5H15l-3-8zm-.75 5L12 9.5l.75 2.5h-1.5z',
    ],
  },

  'matching-transit-street': {
    // Road with dashed line
    viewBox: '0 0 24 24',
    paths: [
      // Road edges
      'M4 4l2 16h1L5.5 4H4z M18.5 4L17 20h1l2-16h-1.5z',
      // Center dashed line
      'M11 5h2v3h-2z M11 10h2v3h-2z M11 15h2v3h-2z',
    ],
  },

  // Administrative Divisions
  'matching-admin-1st': {
    // Region shape + "1"
    viewBox: '0 0 24 24',
    paths: [
      // State/region outline
      'M3 3h18v18H3V3zm2 2v14h14V5H5z',
      // Division line
      'M12 5v14',
      // Number 1
      'M11 8v8h2V8h-2z M10 8h4',
    ],
  },

  'matching-admin-2nd': {
    // Region shape + "2"
    viewBox: '0 0 24 24',
    paths: [
      // Region outline with grid
      'M3 3h18v18H3V3zm2 2v14h14V5H5z M12 5v14 M5 12h14',
      // Number 2
      'M9 9c0-1.1.9-2 2-2h2c1.1 0 2 .9 2 2v1c0 .55-.22 1.05-.59 1.41L11 15h4v2H9v-2l4-4v-1h-2v1H9V9z',
    ],
  },

  'matching-admin-3rd': {
    // Region shape + "3"
    viewBox: '0 0 24 24',
    paths: [
      // Region with more divisions
      'M3 3h18v18H3V3zm2 2v14h14V5H5z M9 5v14 M15 5v14 M5 9h14 M5 15h14',
      // Number 3
      'M9 8h4c1.1 0 2 .9 2 2 0 .74-.4 1.39-1 1.73.6.34 1 .99 1 1.73 0 1.1-.9 2-2 2H9v-2h4v-1h-2v-2h2v-1H9V8z',
    ],
  },

  'matching-admin-4th': {
    // Quadrant grid + "4"
    viewBox: '0 0 24 24',
    paths: [
      // Quadrant grid
      'M3 3h18v18H3V3zm2 2v14h14V5H5z M12 5v14 M5 12h14',
      // Number 4
      'M14 8v4h1v2h-1v2h-2v-2h-3v-2l3-4h2zm-2 4V9.5L10.5 12H12z',
    ],
  },

  // Natural
  'matching-natural-mountain': {
    // Mountain peaks
    viewBox: '0 0 24 24',
    paths: ['M14 6l-3.75 5 2.85 3.8-1.6 1.2C9.81 13.75 7 10 7 10l-6 8h22L14 6z'],
  },

  'matching-natural-landmass': {
    // Island with palm tree and sun
    viewBox: '0 0 24 24',
    paths: [
      // Sun
      'M6.76 4.84l-1.8-1.79-1.41 1.41 1.79 1.8 1.42-1.42zM4 10.5H1v2h3v-2zm9-9.95h-2V3.5h2V.55z',
      // Palm tree
      'M12 6c-2 0-3.5.5-3.5.5S10 8 12 8s3.5-1.5 3.5-1.5S14 6 12 6z M12 8v9',
      // Island
      'M5 17c0 2.76 3.13 5 7 5s7-2.24 7-5H5z',
    ],
  },

  'matching-natural-park': {
    // Tree with bench
    viewBox: '0 0 24 24',
    paths: [
      // Tree crown
      'M12 2C9.24 2 7 4.24 7 7c0 2.76 2.24 5 5 5s5-2.24 5-5c0-2.76-2.24-5-5-5z',
      // Tree trunk
      'M11 12h2v5h-2z',
      // Ground/bench
      'M4 17h16v2H4z M6 19h3v3H6z M15 19h3v3h-3z',
    ],
  },

  // Places of Interest
  'matching-poi-amusement-park': {
    // Ferris wheel
    viewBox: '0 0 24 24',
    paths: [
      // Wheel circle
      'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z',
      // Center hub
      'M12 10c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z',
      // Spokes
      'M12 4v4 M12 16v4 M4 12h4 M16 12h4 M6.34 6.34l2.83 2.83 M14.83 14.83l2.83 2.83 M6.34 17.66l2.83-2.83 M14.83 9.17l2.83-2.83',
      // Cabins (small circles)
      'M12 5a1 1 0 100-2 1 1 0 000 2z M12 21a1 1 0 100-2 1 1 0 000 2z M5 12a1 1 0 10-2 0 1 1 0 002 0z M21 12a1 1 0 10-2 0 1 1 0 002 0z',
    ],
  },

  'matching-poi-zoo': {
    // Paw print
    viewBox: '0 0 24 24',
    paths: [
      // Main pad
      'M12 12c-2 0-4 2.5-4 5s2 4 4 4 4-1.5 4-4-2-5-4-5z',
      // Toe pads
      'M7 9c0 1.1.9 2 2 2s2-.9 2-2-.9-2-2-2-2 .9-2 2z',
      'M13 9c0 1.1.9 2 2 2s2-.9 2-2-.9-2-2-2-2 .9-2 2z',
      'M5 13c0 1.1.9 2 2 2s2-.9 2-2-.9-2-2-2-2 .9-2 2z',
      'M15 13c0 1.1.9 2 2 2s2-.9 2-2-.9-2-2-2-2 .9-2 2z',
    ],
  },

  'matching-poi-aquarium': {
    // Fish in bowl
    viewBox: '0 0 24 24',
    paths: [
      // Bowl
      'M12 2C6.48 2 2 6.48 2 12c0 4.5 3 8.33 7.13 9.63.5.13.87-.37.87-.82V19c0-2.76 2.24-5 5-5h4c1.1 0 2-.9 2-2 0-5.52-4.48-10-10-10z',
      // Fish
      'M15 10c-.83 0-1.5.67-1.5 1.5s.67 1.5 1.5 1.5 1.5-.67 1.5-1.5-.67-1.5-1.5-1.5z M10 11l2 1.5-2 1.5v-3z',
      // Bubbles
      'M8 8a1 1 0 100-2 1 1 0 000 2z M6 11a.5.5 0 100-1 .5.5 0 000 1z',
    ],
  },

  'matching-poi-golf-course': {
    // Flag and golf ball
    viewBox: '0 0 24 24',
    paths: [
      // Flag pole
      'M10 2v18',
      // Flag
      'M10 2h7l-3 4 3 4h-7V2z',
      // Hole
      'M8 20h4c.55 0 1 .45 1 1s-.45 1-1 1H8c-.55 0-1-.45-1-1s.45-1 1-1z',
      // Golf ball
      'M17 17c0 1.66-1.34 3-3 3s-3-1.34-3-3 1.34-3 3-3 3 1.34 3 3z',
    ],
  },

  'matching-poi-museum': {
    // Museum building with columns
    viewBox: '0 0 24 24',
    paths: [
      // Roof/pediment
      'M12 2L2 7h20L12 2z',
      // Columns
      'M4 9v10h2V9H4z M9 9v10h2V9H9z M13 9v10h2V9h-2z M18 9v10h2V9h-2z',
      // Base
      'M2 19h20v2H2z',
    ],
  },

  'matching-poi-movie-theater': {
    // Film reel
    viewBox: '0 0 24 24',
    paths: [
      // Outer circle
      'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8z',
      // Inner hub
      'M12 8c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4zm0 6c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2z',
      // Sprocket holes
      'M12 5a1.5 1.5 0 110-3 1.5 1.5 0 010 3z M12 22a1.5 1.5 0 110-3 1.5 1.5 0 010 3z M5 12a1.5 1.5 0 110-3 1.5 1.5 0 010 3z M19 12a1.5 1.5 0 110-3 1.5 1.5 0 010 3z',
    ],
  },

  'matching-poi-restaurant': {
    // Fork and knife (custom for Stillwater)
    viewBox: '0 0 24 24',
    paths: [
      // Fork
      'M7 2v8c0 1.86 1.28 3.41 3 3.86V21h2v-7.14c1.72-.45 3-2 3-3.86V2h-2v7h-1V2H9v7H8V2H7z',
      // Knife
      'M17 2c-1.66 0-3 1.34-3 3v11h2v6h2v-6h2V5c0-1.66-1.34-3-3-3z',
    ],
  },

  // Public Utilities
  'matching-utility-hospital': {
    // Hospital building with cross
    viewBox: '0 0 24 24',
    paths: [
      // Building
      'M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2z',
      // Cross
      'M10 8h4v3h3v4h-3v3h-4v-3H7v-4h3V8z',
    ],
  },

  'matching-utility-library': {
    // Open book
    viewBox: '0 0 24 24',
    paths: [
      // Left page
      'M12 21.5c-1.2-.7-2.6-1-4-1-1.9 0-3.8.5-5.5 1.5V6c1.7-1 3.6-1.5 5.5-1.5 1.4 0 2.8.3 4 1v16z',
      // Right page
      'M12 21.5V5.5c1.2-.7 2.6-1 4-1 1.9 0 3.8.5 5.5 1.5v16c-1.7-1-3.6-1.5-5.5-1.5-1.4 0-2.8.3-4 1z',
      // Spine
      'M12 5.5v16',
    ],
  },

  'matching-utility-consulate': {
    // Speech bubbles
    viewBox: '0 0 24 24',
    paths: [
      // First bubble
      'M20 2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h14l4 4V4c0-1.1-.9-2-2-2z',
      // Second bubble (smaller, offset)
      'M6 12h2v2H6zm4 0h2v2h-2zm4 0h2v2h-2z',
    ],
  },

  'matching-utility-school': {
    // School building (custom for Stillwater)
    viewBox: '0 0 24 24',
    paths: [
      // Building
      'M5 13.18v4L12 21l7-3.82v-4L12 17l-7-3.82z',
      // Roof
      'M12 3L1 9l11 6 9-4.91V17h2V9L12 3z',
    ],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // MEASURING QUESTIONS (Green) - Same icons with map marker overlay
  // ═══════════════════════════════════════════════════════════════════════════

  'measuring-transit-airport': {
    viewBox: '0 0 24 24',
    paths: [
      'M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z',
    ],
    overlay: [
      // Map marker in corner
      'M19 10c-1.66 0-3 1.34-3 3 0 2.25 3 5 3 5s3-2.75 3-5c0-1.66-1.34-3-3-3zm0 4c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1z',
    ],
  },

  'measuring-transit-high-speed-train': {
    // Bullet train side profile
    viewBox: '0 0 24 24',
    paths: [
      // Streamlined train
      'M12 2c-4 0-8 .5-8 4v9.5C4 17.43 5.57 19 7.5 19L6 20.5v.5h12v-.5L16.5 19c1.93 0 3.5-1.57 3.5-3.5V6c0-3.5-4-4-8-4z',
      // Windows
      'M5 10h14v4H5z',
      // Nose cone
      'M4 6c2-2 5-2 8-2s6 0 8 2H4z',
    ],
    overlay: [
      'M19 10c-1.66 0-3 1.34-3 3 0 2.25 3 5 3 5s3-2.75 3-5c0-1.66-1.34-3-3-3zm0 4c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1z',
    ],
  },

  'measuring-transit-rail-station': {
    // Train station front
    viewBox: '0 0 24 24',
    paths: [
      // Station building
      'M12 2l-8 4v2h16V6l-8-4z',
      // Pillars
      'M5 8v10h2V8H5z M17 8v10h2V8h-2z',
      // Base
      'M3 18h18v2H3z',
      // Train silhouette
      'M9 12h6v4H9z',
    ],
    overlay: [
      'M19 10c-1.66 0-3 1.34-3 3 0 2.25 3 5 3 5s3-2.75 3-5c0-1.66-1.34-3-3-3zm0 4c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1z',
    ],
  },

  'measuring-border-international': {
    // International border
    viewBox: '0 0 24 24',
    paths: [
      // Globe outline
      'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.94-.49-7-3.85-7-7.93s3.05-7.44 7-7.93v15.86zm2 0V4.07c3.94.49 7 3.85 7 7.93s-3.06 7.44-7 7.93z',
      // Latitude line
      'M2 12h20',
    ],
    overlay: [
      'M19 10c-1.66 0-3 1.34-3 3 0 2.25 3 5 3 5s3-2.75 3-5c0-1.66-1.34-3-3-3zm0 4c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1z',
    ],
  },

  'measuring-border-1st-admin': {
    viewBox: '0 0 24 24',
    paths: ['M3 3h18v18H3V3zm2 2v14h14V5H5z', 'M12 5v14'],
    overlay: [
      'M19 10c-1.66 0-3 1.34-3 3 0 2.25 3 5 3 5s3-2.75 3-5c0-1.66-1.34-3-3-3zm0 4c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1z',
    ],
  },

  'measuring-border-2nd-admin': {
    viewBox: '0 0 24 24',
    paths: ['M3 3h18v18H3V3zm2 2v14h14V5H5z M12 5v14 M5 12h14'],
    overlay: [
      'M19 10c-1.66 0-3 1.34-3 3 0 2.25 3 5 3 5s3-2.75 3-5c0-1.66-1.34-3-3-3zm0 4c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1z',
    ],
  },

  'measuring-natural-sea-level': {
    // Waves with horizon
    viewBox: '0 0 24 24',
    paths: [
      // Waves
      'M2 16c1.5 0 2.5-1 4-1s2.5 1 4 1 2.5-1 4-1 2.5 1 4 1 2.5-1 4-1v2c-1.5 0-2.5 1-4 1s-2.5-1-4-1-2.5 1-4 1-2.5-1-4-1-2.5 1-4 1v-2z',
      'M2 12c1.5 0 2.5-1 4-1s2.5 1 4 1 2.5-1 4-1 2.5 1 4 1 2.5-1 4-1v2c-1.5 0-2.5 1-4 1s-2.5-1-4-1-2.5 1-4 1-2.5-1-4-1-2.5 1-4 1v-2z',
      // Shore line
      'M2 8h20',
    ],
    overlay: [
      'M19 2c-1.66 0-3 1.34-3 3 0 2.25 3 5 3 5s3-2.75 3-5c0-1.66-1.34-3-3-3zm0 4c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1z',
    ],
  },

  'measuring-natural-body-of-water': {
    // Water/lake
    viewBox: '0 0 24 24',
    paths: [
      'M12 2c-5.52 0-10 4.48-10 10s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z',
      // Wave pattern inside
      'M6 12c1 0 1.5-.5 2-.5s1 .5 2 .5 1.5-.5 2-.5 1 .5 2 .5 1.5-.5 2-.5 1 .5 2 .5',
      'M6 14c1 0 1.5-.5 2-.5s1 .5 2 .5 1.5-.5 2-.5 1 .5 2 .5 1.5-.5 2-.5 1 .5 2 .5',
    ],
    overlay: [
      'M19 2c-1.66 0-3 1.34-3 3 0 2.25 3 5 3 5s3-2.75 3-5c0-1.66-1.34-3-3-3zm0 4c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1z',
    ],
  },

  'measuring-natural-coastline': {
    // Palm tree + water
    viewBox: '0 0 24 24',
    paths: [
      // Palm tree
      'M12 4c-2 0-3.5.5-3.5.5S10 6 12 6s3.5-1.5 3.5-1.5S14 4 12 4z M12 6v8',
      // Beach/shore
      'M4 14c2 0 3 1 5 1s3-1 5-1 3 1 5 1v4c-2 0-3-1-5-1s-3 1-5 1-3-1-5-1v-4z',
      // Water
      'M4 18c1 0 1.5-.5 2-.5s1 .5 2 .5 1.5-.5 2-.5 1 .5 2 .5 1.5-.5 2-.5 1 .5 2 .5 1.5-.5 2-.5 1 .5 2 .5',
    ],
    overlay: [
      'M19 2c-1.66 0-3 1.34-3 3 0 2.25 3 5 3 5s3-2.75 3-5c0-1.66-1.34-3-3-3zm0 4c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1z',
    ],
  },

  'measuring-natural-mountain': {
    viewBox: '0 0 24 24',
    paths: ['M14 6l-3.75 5 2.85 3.8-1.6 1.2C9.81 13.75 7 10 7 10l-6 8h22L14 6z'],
    overlay: [
      'M19 2c-1.66 0-3 1.34-3 3 0 2.25 3 5 3 5s3-2.75 3-5c0-1.66-1.34-3-3-3zm0 4c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1z',
    ],
  },

  'measuring-natural-park': {
    viewBox: '0 0 24 24',
    paths: [
      'M12 2C9.24 2 7 4.24 7 7c0 2.76 2.24 5 5 5s5-2.24 5-5c0-2.76-2.24-5-5-5z',
      'M11 12h2v5h-2z',
      'M4 17h16v2H4z M6 19h3v3H6z M15 19h3v3h-3z',
    ],
    overlay: [
      'M19 10c-1.66 0-3 1.34-3 3 0 2.25 3 5 3 5s3-2.75 3-5c0-1.66-1.34-3-3-3zm0 4c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1z',
    ],
  },

  'measuring-poi-amusement-park': {
    viewBox: '0 0 24 24',
    paths: [
      'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z',
      'M12 10c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z',
      'M12 4v4 M12 16v4 M4 12h4 M16 12h4',
    ],
    overlay: [
      'M19 10c-1.66 0-3 1.34-3 3 0 2.25 3 5 3 5s3-2.75 3-5c0-1.66-1.34-3-3-3zm0 4c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1z',
    ],
  },

  'measuring-poi-zoo': {
    viewBox: '0 0 24 24',
    paths: [
      'M12 12c-2 0-4 2.5-4 5s2 4 4 4 4-1.5 4-4-2-5-4-5z',
      'M7 9c0 1.1.9 2 2 2s2-.9 2-2-.9-2-2-2-2 .9-2 2z',
      'M13 9c0 1.1.9 2 2 2s2-.9 2-2-.9-2-2-2-2 .9-2 2z',
      'M5 13c0 1.1.9 2 2 2s2-.9 2-2-.9-2-2-2-2 .9-2 2z',
      'M15 13c0 1.1.9 2 2 2s2-.9 2-2-.9-2-2-2-2 .9-2 2z',
    ],
    overlay: [
      'M2 18c-1.66 0-3 1.34-3 3 0 2.25 3 5 3 5s3-2.75 3-5c0-1.66-1.34-3-3-3zm0 4c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1z',
    ],
  },

  'measuring-poi-aquarium': {
    viewBox: '0 0 24 24',
    paths: [
      'M12 2C6.48 2 2 6.48 2 12c0 4.5 3 8.33 7.13 9.63.5.13.87-.37.87-.82V19c0-2.76 2.24-5 5-5h4c1.1 0 2-.9 2-2 0-5.52-4.48-10-10-10z',
      'M15 10c-.83 0-1.5.67-1.5 1.5s.67 1.5 1.5 1.5 1.5-.67 1.5-1.5-.67-1.5-1.5-1.5z M10 11l2 1.5-2 1.5v-3z',
    ],
    overlay: [
      'M19 14c-1.66 0-3 1.34-3 3 0 2.25 3 5 3 5s3-2.75 3-5c0-1.66-1.34-3-3-3zm0 4c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1z',
    ],
  },

  'measuring-poi-golf-course': {
    viewBox: '0 0 24 24',
    paths: [
      'M10 2v18',
      'M10 2h7l-3 4 3 4h-7V2z',
      'M8 20h4c.55 0 1 .45 1 1s-.45 1-1 1H8c-.55 0-1-.45-1-1s.45-1 1-1z',
    ],
    overlay: [
      'M19 12c-1.66 0-3 1.34-3 3 0 2.25 3 5 3 5s3-2.75 3-5c0-1.66-1.34-3-3-3zm0 4c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1z',
    ],
  },

  'measuring-poi-museum': {
    viewBox: '0 0 24 24',
    paths: [
      'M12 2L2 7h20L12 2z',
      'M4 9v10h2V9H4z M9 9v10h2V9H9z M13 9v10h2V9h-2z M18 9v10h2V9h-2z',
      'M2 19h20v2H2z',
    ],
    overlay: [
      'M19 10c-1.66 0-3 1.34-3 3 0 2.25 3 5 3 5s3-2.75 3-5c0-1.66-1.34-3-3-3zm0 4c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1z',
    ],
  },

  'measuring-poi-movie-theater': {
    viewBox: '0 0 24 24',
    paths: [
      'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8z',
      'M12 8c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4zm0 6c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2z',
    ],
    overlay: [
      'M19 10c-1.66 0-3 1.34-3 3 0 2.25 3 5 3 5s3-2.75 3-5c0-1.66-1.34-3-3-3zm0 4c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1z',
    ],
  },

  'measuring-utility-hospital': {
    viewBox: '0 0 24 24',
    paths: [
      'M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2z',
      'M10 8h4v3h3v4h-3v3h-4v-3H7v-4h3V8z',
    ],
    overlay: [
      'M19 10c-1.66 0-3 1.34-3 3 0 2.25 3 5 3 5s3-2.75 3-5c0-1.66-1.34-3-3-3zm0 4c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1z',
    ],
  },

  'measuring-utility-library': {
    viewBox: '0 0 24 24',
    paths: [
      'M12 21.5c-1.2-.7-2.6-1-4-1-1.9 0-3.8.5-5.5 1.5V6c1.7-1 3.6-1.5 5.5-1.5 1.4 0 2.8.3 4 1v16z',
      'M12 21.5V5.5c1.2-.7 2.6-1 4-1 1.9 0 3.8.5 5.5 1.5v16c-1.7-1-3.6-1.5-5.5-1.5-1.4 0-2.8.3-4 1z',
    ],
    overlay: [
      'M19 10c-1.66 0-3 1.34-3 3 0 2.25 3 5 3 5s3-2.75 3-5c0-1.66-1.34-3-3-3zm0 4c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1z',
    ],
  },

  'measuring-utility-consulate': {
    viewBox: '0 0 24 24',
    paths: [
      'M20 2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h14l4 4V4c0-1.1-.9-2-2-2z',
      'M6 12h2v2H6zm4 0h2v2h-2zm4 0h2v2h-2z',
    ],
    overlay: [
      'M19 10c-1.66 0-3 1.34-3 3 0 2.25 3 5 3 5s3-2.75 3-5c0-1.66-1.34-3-3-3zm0 4c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1z',
    ],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // RADAR QUESTIONS (Orange) - Concentric circles with distance
  // ═══════════════════════════════════════════════════════════════════════════

  'radar-0.2-miles': {
    viewBox: '0 0 24 24',
    paths: [
      // Radar circles
      'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8z',
      'M12 6c-3.31 0-6 2.69-6 6s2.69 6 6 6 6-2.69 6-6-2.69-6-6-6zm0 10c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4z',
      // Center dot
      'M12 10c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z',
      // Sweep line
      'M12 12l6-6',
    ],
  },

  'radar-0.5-miles': {
    viewBox: '0 0 24 24',
    paths: [
      'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8z',
      'M12 6c-3.31 0-6 2.69-6 6s2.69 6 6 6 6-2.69 6-6-2.69-6-6-6zm0 10c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4z',
      'M12 10c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z',
      'M12 12l6-6',
    ],
  },

  'radar-1-mile': {
    viewBox: '0 0 24 24',
    paths: [
      'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8z',
      'M12 6c-3.31 0-6 2.69-6 6s2.69 6 6 6 6-2.69 6-6-2.69-6-6-6zm0 10c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4z',
      'M12 10c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z',
      'M12 12l6-6',
    ],
  },

  'radar-3-miles': {
    viewBox: '0 0 24 24',
    paths: [
      'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8z',
      'M12 6c-3.31 0-6 2.69-6 6s2.69 6 6 6 6-2.69 6-6-2.69-6-6-6zm0 10c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4z',
      'M12 10c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z',
      'M12 12l6-6',
    ],
  },

  'radar-5-miles': {
    viewBox: '0 0 24 24',
    paths: [
      'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8z',
      'M12 6c-3.31 0-6 2.69-6 6s2.69 6 6 6 6-2.69 6-6-2.69-6-6-6zm0 10c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4z',
      'M12 10c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z',
      'M12 12l6-6',
    ],
  },

  'radar-10-miles': {
    viewBox: '0 0 24 24',
    paths: [
      'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8z',
      'M12 6c-3.31 0-6 2.69-6 6s2.69 6 6 6 6-2.69 6-6-2.69-6-6-6zm0 10c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4z',
      'M12 10c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z',
      'M12 12l6-6',
    ],
  },

  'radar-25-miles': {
    viewBox: '0 0 24 24',
    paths: [
      'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8z',
      'M12 6c-3.31 0-6 2.69-6 6s2.69 6 6 6 6-2.69 6-6-2.69-6-6-6zm0 10c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4z',
      'M12 10c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z',
      'M12 12l6-6',
    ],
  },

  'radar-50-miles': {
    viewBox: '0 0 24 24',
    paths: [
      'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8z',
      'M12 6c-3.31 0-6 2.69-6 6s2.69 6 6 6 6-2.69 6-6-2.69-6-6-6zm0 10c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4z',
      'M12 10c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z',
      'M12 12l6-6',
    ],
  },

  'radar-100-miles': {
    viewBox: '0 0 24 24',
    paths: [
      'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8z',
      'M12 6c-3.31 0-6 2.69-6 6s2.69 6 6 6 6-2.69 6-6-2.69-6-6-6zm0 10c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4z',
      'M12 10c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z',
      'M12 12l6-6',
    ],
  },

  'radar-custom': {
    // Question mark with radar
    viewBox: '0 0 24 24',
    paths: [
      'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8z',
      // Question mark
      'M11 16h2v2h-2zm1-10c-2.21 0-4 1.79-4 4h2c0-1.1.9-2 2-2s2 .9 2 2c0 2-3 1.75-3 5h2c0-2.25 3-2.5 3-5 0-2.21-1.79-4-4-4z',
    ],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // THERMOMETER QUESTIONS (Yellow) - Thermometer icon with arrows
  // ═══════════════════════════════════════════════════════════════════════════

  'thermometer-0.2-miles': {
    viewBox: '0 0 24 24',
    paths: [
      // Thermometer body
      'M15 13V5c0-1.66-1.34-3-3-3S9 3.34 9 5v8c-1.21.91-2 2.37-2 4 0 2.76 2.24 5 5 5s5-2.24 5-5c0-1.63-.79-3.09-2-4z',
      // Mercury
      'M11 5h2v9h-2z',
      // Bulb
      'M12 20c1.66 0 3-1.34 3-3 0-1.09-.59-2.04-1.47-2.56l-.03-.02-.02-.02C13.17 14.17 13 13.87 13 13.5V5c0-.55-.45-1-1-1s-1 .45-1 1v8.5c0 .37-.17.67-.48.9l-.02.02-.03.02C9.59 14.96 9 15.91 9 17c0 1.66 1.34 3 3 3z',
      // Hot/cold arrows
      'M3 8l3-3v2h3v2H6v2L3 8zm15 6l3 3-3 3v-2h-3v-2h3v-2z',
    ],
  },

  'thermometer-0.5-miles': {
    viewBox: '0 0 24 24',
    paths: [
      'M15 13V5c0-1.66-1.34-3-3-3S9 3.34 9 5v8c-1.21.91-2 2.37-2 4 0 2.76 2.24 5 5 5s5-2.24 5-5c0-1.63-.79-3.09-2-4z',
      'M11 5h2v9h-2z',
      'M12 20c1.66 0 3-1.34 3-3 0-1.09-.59-2.04-1.47-2.56l-.03-.02-.02-.02C13.17 14.17 13 13.87 13 13.5V5c0-.55-.45-1-1-1s-1 .45-1 1v8.5c0 .37-.17.67-.48.9l-.02.02-.03.02C9.59 14.96 9 15.91 9 17c0 1.66 1.34 3 3 3z',
      'M3 8l3-3v2h3v2H6v2L3 8zm15 6l3 3-3 3v-2h-3v-2h3v-2z',
    ],
  },

  'thermometer-3-miles': {
    viewBox: '0 0 24 24',
    paths: [
      'M15 13V5c0-1.66-1.34-3-3-3S9 3.34 9 5v8c-1.21.91-2 2.37-2 4 0 2.76 2.24 5 5 5s5-2.24 5-5c0-1.63-.79-3.09-2-4z',
      'M11 5h2v9h-2z',
      'M12 20c1.66 0 3-1.34 3-3 0-1.09-.59-2.04-1.47-2.56l-.03-.02-.02-.02C13.17 14.17 13 13.87 13 13.5V5c0-.55-.45-1-1-1s-1 .45-1 1v8.5c0 .37-.17.67-.48.9l-.02.02-.03.02C9.59 14.96 9 15.91 9 17c0 1.66 1.34 3 3 3z',
      'M3 8l3-3v2h3v2H6v2L3 8zm15 6l3 3-3 3v-2h-3v-2h3v-2z',
    ],
  },

  'thermometer-10-miles': {
    viewBox: '0 0 24 24',
    paths: [
      'M15 13V5c0-1.66-1.34-3-3-3S9 3.34 9 5v8c-1.21.91-2 2.37-2 4 0 2.76 2.24 5 5 5s5-2.24 5-5c0-1.63-.79-3.09-2-4z',
      'M11 5h2v9h-2z',
      'M12 20c1.66 0 3-1.34 3-3 0-1.09-.59-2.04-1.47-2.56l-.03-.02-.02-.02C13.17 14.17 13 13.87 13 13.5V5c0-.55-.45-1-1-1s-1 .45-1 1v8.5c0 .37-.17.67-.48.9l-.02.02-.03.02C9.59 14.96 9 15.91 9 17c0 1.66 1.34 3 3 3z',
      'M3 8l3-3v2h3v2H6v2L3 8zm15 6l3 3-3 3v-2h-3v-2h3v-2z',
    ],
  },

  'thermometer-50-miles': {
    viewBox: '0 0 24 24',
    paths: [
      'M15 13V5c0-1.66-1.34-3-3-3S9 3.34 9 5v8c-1.21.91-2 2.37-2 4 0 2.76 2.24 5 5 5s5-2.24 5-5c0-1.63-.79-3.09-2-4z',
      'M11 5h2v9h-2z',
      'M12 20c1.66 0 3-1.34 3-3 0-1.09-.59-2.04-1.47-2.56l-.03-.02-.02-.02C13.17 14.17 13 13.87 13 13.5V5c0-.55-.45-1-1-1s-1 .45-1 1v8.5c0 .37-.17.67-.48.9l-.02.02-.03.02C9.59 14.96 9 15.91 9 17c0 1.66 1.34 3 3 3z',
      'M3 8l3-3v2h3v2H6v2L3 8zm15 6l3 3-3 3v-2h-3v-2h3v-2z',
    ],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // PHOTO QUESTIONS (Cyan) - Camera frame with subject icons
  // ═══════════════════════════════════════════════════════════════════════════

  'photo-tree': {
    viewBox: '0 0 24 24',
    paths: [
      // Photo frame
      'M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM5 5h14v14H5V5z',
      // Tree
      'M12 6c-1.66 0-3 1.34-3 3 0 1.3.84 2.4 2 2.82V17h2v-5.18c1.16-.42 2-1.52 2-2.82 0-1.66-1.34-3-3-3z',
      'M11 17h2v2h-2z',
    ],
  },

  'photo-sky': {
    viewBox: '0 0 24 24',
    paths: [
      // Photo frame
      'M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM5 5h14v14H5V5z',
      // Sun
      'M12 9c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z',
      // Rays
      'M12 6v2 M12 16v2 M6 12h2 M16 12h2 M7.76 7.76l1.41 1.41 M14.83 14.83l1.41 1.41 M7.76 16.24l1.41-1.41 M14.83 9.17l1.41-1.41',
      // Cloud
      'M6 14c-1.1 0-2 .45-2 1s.9 1 2 1h4c.55 0 1-.45 1-1s-.45-1-1-1c0-.55-.45-1-1-1s-1 .45-1 1H6z',
    ],
  },

  'photo-selfie': {
    viewBox: '0 0 24 24',
    paths: [
      // Photo frame
      'M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM5 5h14v14H5V5z',
      // Person head
      'M12 8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z',
      // Person body
      'M12 14c-2.67 0-8 1.34-8 4v1h16v-1c0-2.66-5.33-4-8-4z',
    ],
  },

  'photo-widest-street': {
    viewBox: '0 0 24 24',
    paths: [
      // Photo frame
      'M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM5 5h14v14H5V5z',
      // Road
      'M6 8h1v8H6z M17 8h1v8h-1z',
      // Dashed center line
      'M11 7h2v2h-2z M11 11h2v2h-2z M11 15h2v2h-2z',
      // Double arrows indicating width
      'M8 12h2l-2-2v4l2-2zm8 0h-2l2-2v4l-2-2z',
    ],
  },

  'photo-tallest-structure': {
    viewBox: '0 0 24 24',
    paths: [
      // Photo frame
      'M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM5 5h14v14H5V5z',
      // Tall building
      'M10 6h4v12h-4z',
      // Windows
      'M11 8h2v1h-2z M11 10h2v1h-2z M11 12h2v1h-2z M11 14h2v1h-2z',
      // Short buildings
      'M6 12h3v6H6z M15 10h3v8h-3z',
      // Arrow pointing up
      'M12 3l-2 3h4l-2-3z',
    ],
  },

  'photo-any-building-from-station': {
    viewBox: '0 0 24 24',
    paths: [
      // Photo frame
      'M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM5 5h14v14H5V5z',
      // Building
      'M9 7h6v11H9z',
      // Windows
      'M10 9h1v1h-1z M13 9h1v1h-1z M10 12h1v1h-1z M13 12h1v1h-1z',
      // Station platform
      'M6 18h12v1H6z',
      // Train icon
      'M7 15h3v2H7z',
    ],
  },

  'photo-tallest-building-from-station': {
    viewBox: '0 0 24 24',
    paths: [
      // Photo frame
      'M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM5 5h14v14H5V5z',
      // Tall building
      'M10 6h4v12h-4z',
      // Windows
      'M11 8h2v1h-2z M11 10h2v1h-2z M11 12h2v1h-2z M11 14h2v1h-2z',
      // Train
      'M6 15h3v2H6z',
      // Arrow
      'M12 3l-2 3h4l-2-3z',
    ],
  },

  'photo-trace-street': {
    viewBox: '0 0 24 24',
    paths: [
      // Photo frame
      'M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM5 5h14v14H5V5z',
      // Person running
      'M13.5 5.5c.83 0 1.5-.67 1.5-1.5S14.33 2.5 13.5 2.5 12 3.17 12 4s.67 1.5 1.5 1.5z',
      'M9.8 8.9L7 23h2.1l1.8-8 2.1 2v6h2v-7.5l-2.1-2 .6-3c1.1 1.2 2.7 2 4.5 2v-2c-1.5 0-2.8-.8-3.5-2l-1-1.6c-.4-.6-1-1-1.7-1-.3 0-.5.1-.8.1L6 8v5h2V9.6l1.8-.7z',
      // Dashed path
      'M8 17l1-1 M10 15l1-1 M12 13l1-1',
    ],
  },

  'photo-two-buildings': {
    viewBox: '0 0 24 24',
    paths: [
      // Photo frame
      'M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM5 5h14v14H5V5z',
      // Building 1
      'M6 9h5v9H6z',
      // Building 2
      'M13 7h5v11h-5z',
      // Windows
      'M7 11h1v1H7z M9 11h1v1H9z M7 14h1v1H7z M9 14h1v1H9z',
      'M14 9h1v1h-1z M16 9h1v1h-1z M14 12h1v1h-1z M16 12h1v1h-1z M14 15h1v1h-1z M16 15h1v1h-1z',
    ],
  },

  'photo-restaurant-interior': {
    viewBox: '0 0 24 24',
    paths: [
      // Photo frame
      'M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM5 5h14v14H5V5z',
      // Table
      'M7 16h10v1H7z',
      'M8 17v2 M16 17v2',
      // Fork
      'M9 9v5 M8 9v2 M10 9v2',
      // Knife
      'M14 9v5 M14 9c0-1 1-1 1 0v3h-1',
      // Plate
      'M12 14c-1.1 0-2 .9-2 2h4c0-1.1-.9-2-2-2z',
    ],
  },

  'photo-train-platform': {
    viewBox: '0 0 24 24',
    paths: [
      // Photo frame
      'M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM5 5h14v14H5V5z',
      // Platform
      'M6 16h12v2H6z',
      // Train
      'M8 10h8v5H8z',
      'M9 11h2v2H9z M13 11h2v2h-2z',
      // Roof structure
      'M6 8h12v1H6z',
      'M8 8v-2 M16 8v-2',
    ],
  },

  'photo-park': {
    viewBox: '0 0 24 24',
    paths: [
      // Photo frame
      'M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM5 5h14v14H5V5z',
      // Trees
      'M8 8c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z M8 12v4',
      'M16 9c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z M16 13v3',
      // Path
      'M6 17c2 0 3-.5 4-.5s2 .5 4 .5 3-.5 4-.5',
      // Bench
      'M11 14h2v1h-2z M10 15h4v.5h-4z',
    ],
  },

  'photo-grocery-aisle': {
    viewBox: '0 0 24 24',
    paths: [
      // Photo frame
      'M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM5 5h14v14H5V5z',
      // Left shelf
      'M6 7h3v10H6z',
      // Right shelf
      'M15 7h3v10h-3z',
      // Shelf lines
      'M6 10h3 M6 13h3 M6 16h3',
      'M15 10h3 M15 13h3 M15 16h3',
      // Cart
      'M10 15h4l1 3H9l1-3z',
      'M10 18c-.55 0-1 .45-1 1s.45 1 1 1 1-.45 1-1-.45-1-1-1z',
      'M14 18c-.55 0-1 .45-1 1s.45 1 1 1 1-.45 1-1-.45-1-1-1z',
    ],
  },

  'photo-place-of-worship': {
    viewBox: '0 0 24 24',
    paths: [
      // Photo frame
      'M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM5 5h14v14H5V5z',
      // Church/building
      'M12 4l-5 5v9h10v-9l-5-5z',
      // Cross/spire
      'M11 7h2v3h-2z M10 8h4v1h-4z',
      // Door
      'M10 14h4v4h-4z',
      // Window
      'M10 11h4v2h-4z',
    ],
  },

  'photo-half-mile-streets': {
    viewBox: '0 0 24 24',
    paths: [
      // Photo frame
      'M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM5 5h14v14H5V5z',
      // Winding path
      'M7 17L9 14 12 16 15 12 17 8',
      // Runner
      'M8 10c.55 0 1-.45 1-1s-.45-1-1-1-1 .45-1 1 .45 1 1 1z',
      'M7 11l1 2 1-1 1 2',
      // 1/2 label
      'M14 6h1v2h-1z M16 7h1v1h-1z',
    ],
  },

  'photo-tallest-mountain-from-station': {
    viewBox: '0 0 24 24',
    paths: [
      // Photo frame
      'M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM5 5h14v14H5V5z',
      // Mountain
      'M12 6l-6 10h12L12 6z',
      // Snow cap
      'M12 6l-2 3.5h4L12 6z',
      // Station
      'M7 17h3v1H7z',
    ],
  },

  'photo-biggest-body-of-water': {
    viewBox: '0 0 24 24',
    paths: [
      // Photo frame
      'M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM5 5h14v14H5V5z',
      // Water body (lake shape)
      'M7 10c0 3 2 5 5 5s5-2 5-5-2-3-5-3-5 0-5 3z',
      // Waves
      'M8 11c.5 0 1-.25 1.5-.25s1 .25 1.5.25 1-.25 1.5-.25 1 .25 1.5.25',
      'M8 13c.5 0 1-.25 1.5-.25s1 .25 1.5.25 1-.25 1.5-.25 1 .25 1.5.25',
    ],
  },

  'photo-five-buildings': {
    viewBox: '0 0 24 24',
    paths: [
      // Photo frame
      'M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM5 5h14v14H5V5z',
      // 5 buildings of varying height
      'M4 12h2v6H4z',
      'M7 9h2v9H7z',
      'M10 6h2v12h-2z',
      'M13 10h2v8h-2z',
      'M16 8h2v10h-2z',
    ],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // TENTACLE QUESTIONS (Purple) - Location with radiating reach
  // ═══════════════════════════════════════════════════════════════════════════

  'tentacle-1mi-museums': {
    viewBox: '0 0 24 24',
    paths: [
      // Museum
      'M12 4L4 8h16l-8-4z',
      'M5 10v8h2v-8H5z M9 10v8h2v-8H9z M13 10v8h2v-8h-2z M17 10v8h2v-8h-2z',
      'M4 18h16v2H4z',
      // Tentacle reach lines
      'M2 12l2-2 M2 12l2 2 M22 12l-2-2 M22 12l-2 2',
    ],
  },

  'tentacle-1mi-libraries': {
    viewBox: '0 0 24 24',
    paths: [
      // Book
      'M12 21.5c-1.2-.7-2.6-1-4-1-1.9 0-3.8.5-5.5 1.5V6c1.7-1 3.6-1.5 5.5-1.5 1.4 0 2.8.3 4 1v16z',
      'M12 21.5V5.5c1.2-.7 2.6-1 4-1 1.9 0 3.8.5 5.5 1.5v16c-1.7-1-3.6-1.5-5.5-1.5-1.4 0-2.8.3-4 1z',
      // Tentacle reach
      'M2 12l2-2 M2 12l2 2 M22 12l-2-2 M22 12l-2 2',
    ],
  },

  'tentacle-1mi-movie-theaters': {
    viewBox: '0 0 24 24',
    paths: [
      // Film reel
      'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8z',
      'M12 8c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4z',
      // Reach lines
      'M2 6l3 2 M2 18l3-2 M22 6l-3 2 M22 18l-3-2',
    ],
  },

  'tentacle-1mi-hospitals': {
    viewBox: '0 0 24 24',
    paths: [
      // Hospital
      'M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2z',
      'M10 8h4v3h3v4h-3v3h-4v-3H7v-4h3V8z',
      // Reach
      'M2 12h2 M20 12h2 M12 2v2 M12 20v2',
    ],
  },

  'tentacle-15mi-metro-lines': {
    viewBox: '0 0 24 24',
    paths: [
      // Train
      'M4 16c0 .88.39 1.67 1 2.22V20c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h8v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1.78c.61-.55 1-1.34 1-2.22V6c0-3.5-3.58-4-8-4s-8 .5-8 4v10z',
      'M6 6h12v6H6z',
      // Wide reach
      'M1 8l3 4-3 4 M23 8l-3 4 3 4',
    ],
  },

  'tentacle-15mi-zoos': {
    viewBox: '0 0 24 24',
    paths: [
      // Paw
      'M12 12c-2 0-4 2.5-4 5s2 4 4 4 4-1.5 4-4-2-5-4-5z',
      'M7 9c0 1.1.9 2 2 2s2-.9 2-2-.9-2-2-2-2 .9-2 2z',
      'M13 9c0 1.1.9 2 2 2s2-.9 2-2-.9-2-2-2-2 .9-2 2z',
      'M5 13c0 1.1.9 2 2 2s2-.9 2-2-.9-2-2-2-2 .9-2 2z',
      'M15 13c0 1.1.9 2 2 2s2-.9 2-2-.9-2-2-2-2 .9-2 2z',
      // Wide reach
      'M1 8l3 4-3 4 M23 8l-3 4 3 4',
    ],
  },

  'tentacle-15mi-aquariums': {
    viewBox: '0 0 24 24',
    paths: [
      // Fish bowl
      'M12 2C6.48 2 2 6.48 2 12c0 4.5 3 8.33 7.13 9.63.5.13.87-.37.87-.82V19c0-2.76 2.24-5 5-5h4c1.1 0 2-.9 2-2 0-5.52-4.48-10-10-10z',
      'M15 10c-.83 0-1.5.67-1.5 1.5s.67 1.5 1.5 1.5 1.5-.67 1.5-1.5-.67-1.5-1.5-1.5z',
      // Wide reach
      'M1 8l3 4-3 4 M23 8l-3 4 3 4',
    ],
  },

  'tentacle-15mi-amusement-parks': {
    viewBox: '0 0 24 24',
    paths: [
      // Ferris wheel
      'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z',
      'M12 10c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z',
      'M12 4v4 M12 16v4 M4 12h4 M16 12h4',
      // Wide reach
      'M1 6l2 3 M1 18l2-3 M23 6l-2 3 M23 18l-2-3',
    ],
  },
}

/**
 * Category icons for the header tiles
 */
export const CATEGORY_ICONS: Record<string, IconDefinition> = {
  matching: {
    // Balance scale icon
    viewBox: '0 0 24 24',
    paths: [
      'M12 3v18',
      'M4 7l8-4 8 4',
      'M4 7c0 2 2 4 4 4s4-2 4-4',
      'M12 7c0 2 2 4 4 4s4-2 4-4',
      'M2 11h4l2-4 2 4h4',
      'M14 11h4l2-4 2 4h4',
    ],
  },

  measuring: {
    // Ruler with compass icon
    viewBox: '0 0 24 24',
    paths: [
      'M3 5h18v14H3z',
      'M6 5v4 M9 5v3 M12 5v4 M15 5v3 M18 5v4',
      'M12 19l-3-6 M12 19l3-6 M9 13h6',
    ],
  },

  radar: {
    // Radar sweep icon
    viewBox: '0 0 24 24',
    paths: [
      'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z',
      'M12 6c-3.31 0-6 2.69-6 6s2.69 6 6 6 6-2.69 6-6-2.69-6-6-6z',
      'M12 10c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z',
      'M12 12l7-7',
    ],
  },

  thermometer: {
    // Thermometer icon
    viewBox: '0 0 24 24',
    paths: [
      'M15 13V5c0-1.66-1.34-3-3-3S9 3.34 9 5v8c-1.21.91-2 2.37-2 4 0 2.76 2.24 5 5 5s5-2.24 5-5c0-1.63-.79-3.09-2-4z',
      'M12 17c1.1 0 2-.9 2-2 0-.73-.4-1.38-1-1.72V5c0-.55-.45-1-1-1s-1 .45-1 1v8.28c-.6.34-1 .99-1 1.72 0 1.1.9 2 2 2z',
    ],
  },

  tentacle: {
    // Octopus/tentacle icon
    viewBox: '0 0 24 24',
    paths: [
      // Head
      'M12 2C8.13 2 5 5.13 5 9c0 2.76 1.56 5.15 3.86 6.33',
      'M12 2c3.87 0 7 3.13 7 9 0 2.76-1.56 5.15-3.86 6.33',
      // Tentacles
      'M5 15c-1 2-2 4-1 6',
      'M8 16c0 2-.5 4 0 6',
      'M12 17v5',
      'M16 16c0 2 .5 4 0 6',
      'M19 15c1 2 2 4 1 6',
      // Eyes
      'M10 8c0 .55-.45 1-1 1s-1-.45-1-1 .45-1 1-1 1 .45 1 1z',
      'M16 8c0 .55-.45 1-1 1s-1-.45-1-1 .45-1 1-1 1 .45 1 1z',
    ],
  },

  photo: {
    // Camera icon
    viewBox: '0 0 24 24',
    paths: [
      'M12 15c1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3 1.34 3 3 3z',
      'M20 4h-3.17L15 2H9L7.17 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2z',
    ],
  },
}

/**
 * Get the icon definition for a question ID
 * Falls back to category icon if no specific icon exists
 */
export function getQuestionIcon(questionId: string): IconDefinition | null {
  return QUESTION_ICONS[questionId] || null
}

/**
 * Get the icon definition for a category
 */
export function getCategoryIcon(categoryId: string): IconDefinition | null {
  return CATEGORY_ICONS[categoryId] || null
}

/**
 * Default fallback icon (question mark)
 */
export const FALLBACK_ICON: IconDefinition = {
  viewBox: '0 0 24 24',
  paths: [
    'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17h-2v-2h2v2zm2.07-7.75l-.9.92C13.45 12.9 13 13.5 13 15h-2v-.5c0-1.1.45-2.1 1.17-2.83l1.24-1.26c.37-.36.59-.86.59-1.41 0-1.1-.9-2-2-2s-2 .9-2 2H8c0-2.21 1.79-4 4-4s4 1.79 4 4c0 .88-.36 1.68-.93 2.25z',
  ],
}
