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
  -- "Start a Ralph Wiggum iteration.

CRITICAL RULE: When committing, NEVER add Co-Authored-By lines. No AI attribution in commits.

FIRST: Run the full test suite (lint, type-check, unit tests) before doing anything else. If any tests fail, fix them before proceeding to card selection. You own the codebase as it exists now - do not blame previous iterations.

Read CLAUDE.md for workflow instructions, then read STORIES.md to analyze the backlog.

Card selection: The order in STORIES.md is arbitrary - do NOT simply pick the first pending card. Analyze ALL pending cards, identify which have all dependencies satisfied, then select the optimal card based on:
1. UI visibility preference: Prioritize cards that make the app viewable/usable in a browser so progress can be seen and direction validated early
2. Which unblocks the most other cards
3. Logical grouping with recent work
4. Foundation-before-features (but don't let infrastructure block UI progress indefinitely)
Explain your selection reasoning.

Implementation: Follow TDD as described in CLAUDE.md.

After completing the card: Update STORIES.md (mark card complete, adjust dependencies, add new cards if needed, update backlog summary counts). Commit changes. Then STOP and wait for human approval."
