# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Anki Tracker is a web application for tracking daily Anki study statistics. Users paste Anki statistics text, which is parsed and stored in Supabase, then visualized with charts.

## Development

**No build process required.** Open `index.html` directly in a browser, or deploy to Vercel.

## Project Structure

```
anki-tracker/
├── index.html          # Main HTML structure
├── css/
│   └── styles.css      # All styles (~400 lines)
├── js/
│   ├── config.js       # Supabase config & global state
│   ├── auth.js         # Authentication (signIn, signUp, OAuth, signOut)
│   ├── data.js         # CRUD operations (loadData, saveRecord, deleteRecord)
│   ├── ui.js           # UI updates (showToast, updateStats, updateHistory)
│   ├── charts.js       # Chart.js rendering
│   └── app.js          # Entry point, event bindings, DOMContentLoaded
└── CLAUDE.md
```

## External Dependencies (CDN)

- Chart.js - data visualization
- Supabase JS client - auth & data persistence

## Key Functions

| File | Functions |
|------|-----------|
| `auth.js` | `signIn`, `signUp`, `signOut`, `signInWithOAuth`, `checkAuth`, `initApp` |
| `data.js` | `loadData`, `saveRecord`, `deleteRecord`, `parseAnkiText`, `exportData`, `importData` |
| `ui.js` | `showApp`, `showAuthForm`, `showToast`, `updatePreview`, `updateStats`, `updateHistory` |
| `charts.js` | `updateChart` |

## Supabase Schema

Table `anki_records`:
- `id` (uuid, PK)
- `user_id` (uuid, FK to auth.users)
- `date` (date, unique per user)
- `duration`, `cards`, `avg_seconds`, `retry_count`, `retry_percent`
- `learn`, `review`, `relearn`, `filtered`

RLS Policy: Users can only access their own data (`auth.uid() = user_id`).

## Deployment

Hosted on Vercel. Push to `main` triggers auto-deploy.
