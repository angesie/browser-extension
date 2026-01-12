# Prompt Monitoring Browser Extension

A small browser extension that scans ChatGPT user requests for email addresses, records findings, anonimizes the messages and notifies the user via a popup UI.

## Features

- Detects email addresses in ChatGPT request body text
- Sanitizes and returns a sanitized body to the page
- Stores detected issues and provides a small popup UI to review them
- Dismissal logic to avoid repeat alerts for the same email

## Quick Start

Prerequisites:

- Node.js (18+) and npm

Install dependencies:

```bash
npm install
```

Run the UI in development (hot-reload):

```bash
npm run dev
```

Build for production (UI + extension bundles):

```bash
npm run build
```

Notes:

- The extension is currently only available for Chromium-based browsers
- The project provides several build scripts in `package.json` including `build:ui` and `build:backend` (which calls the content/page/background bundles). The top-level `build` script runs both.

## Loading the Extension Locally

1. Run `npm run build` to produce the production bundles.
2. Open `chrome://extensions` (or the equivalent in Chromium-based browsers).
3. Enable Developer Mode and click "Load unpacked".
4. Select the built output directory (`dist`).

## Project Layout (high level)

- `src/scripts/` — service worker script, content script, page script
- `src/shared/` — shared types, constants, and small utilities
- `src/ui/` — React UI for the popup page
- `config/` — Vite configuration files for each build target (`vite.ui.config.ts`, `vite.content.config.ts`, etc.)