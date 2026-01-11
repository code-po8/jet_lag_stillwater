#!/usr/bin/env node

/**
 * Script to generate PWA icons from SVG source.
 * Run with: node scripts/generate-pwa-icons.mjs
 */

import sharp from 'sharp';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const publicDir = join(__dirname, '..', 'public');

// Read the SVG source
const svgPath = join(publicDir, 'pwa-icon.svg');
const svgBuffer = readFileSync(svgPath);

// Icon sizes to generate
const sizes = [
  { size: 192, name: 'pwa-192x192.png' },
  { size: 512, name: 'pwa-512x512.png' },
  { size: 180, name: 'apple-touch-icon.png' },
];

async function generateIcons() {
  console.log('Generating PWA icons...');

  for (const { size, name } of sizes) {
    const outputPath = join(publicDir, name);
    await sharp(svgBuffer)
      .resize(size, size)
      .png()
      .toFile(outputPath);
    console.log(`Generated: ${name} (${size}x${size})`);
  }

  console.log('PWA icons generated successfully!');
}

generateIcons().catch(console.error);
