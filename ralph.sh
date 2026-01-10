#!/bin/bash

# Ralph Wiggum Iteration Launcher
# Starts a new Claude Code session to work on the next story card

# Change to project directory (adjust if needed)
cd "$(dirname "$0")"

# Launch Claude Code with the iteration prompt
# --allowedTools auto-approves these tools so it runs mostly unattended
claude \
  --allowedTools "Edit" \
  --allowedTools "Write" \
  --allowedTools "Bash(npm install*)" \
  --allowedTools "Bash(npm run *)" \
  --allowedTools "Bash(npx vitest*)" \
  --allowedTools "Bash(npx playwright*)" \
  --allowedTools "Bash(git add*)" \
  --allowedTools "Bash(git commit*)" \
  --allowedTools "Bash(git status*)" \
  --allowedTools "Bash(git diff*)" \
  --allowedTools "Bash(git log*)" \
  --allowedTools "Bash(mkdir*)" \
  -- "Start a Ralph Wiggum iteration. Read CLAUDE.md for workflow instructions, then read STORIES.md to analyze the backlog. IMPORTANT: The order of stories in the markdown file is arbitrary - do NOT simply pick the first pending card. Instead, analyze ALL pending cards, identify which ones have all dependencies satisfied, then select the optimal card based on: which unblocks the most other cards, logical grouping with recent work, and foundation-before-features. Explain your selection reasoning, then implement the card following TDD. After completing the card, update STORIES.md: mark the card complete, adjust dependencies on other cards if you discovered any were missing or unnecessary, add new cards if needed, and update the backlog summary counts. Stop and wait for my approval after completing the card."
