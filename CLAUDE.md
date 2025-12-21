# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Anki Tracker is a single-page web application for tracking daily Anki study statistics. Users paste Anki statistics text, which is parsed and stored in Supabase, then visualized with charts.

## Development

**No build process required.** Open `anki-tracker.html` directly in a browser.

## Architecture

Single HTML file (`anki-tracker.html`) with embedded CSS and vanilla JavaScript.

**External Dependencies (CDN):**
- Chart.js - data visualization
- Supabase JS client - data persistence

**Data Flow:**
1. User pastes Anki stats → `parseAnkiText()` extracts metrics via regex
2. Data stored in Supabase `anki_records` table (upsert by date)
3. Local `dataCache` object mirrors remote data
4. UI updates: `updateStats()`, `updateHistory()`, `updateChart()`

## Supabase Schema

Table `anki_records` with fields: date (unique), duration, cards, avg_seconds, retry_count, retry_percent, learn, review, relearn, filtered. See README.md for full schema.

## Key Functions

- `parseAnkiText(text)` - Regex parsing of Anki stats (Chinese format)
- `loadData()`, `saveRecord()`, `deleteRecord()` - Supabase CRUD
- `updateChart()` - Chart.js rendering based on `currentChartType`
- `exportData()`, `importData()` - JSON import/export
