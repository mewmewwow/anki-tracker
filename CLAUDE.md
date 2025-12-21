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


new requirements:

现在所有的代码都在一个文件中不方便管理，如果要做拆分请给出你的方案和文件目录

接下来我希望把代码部署到云端服务器，让所有人都可以注册账号、访问服务、管理自己的数据

请你给出技术实现方案，以及Tell me what you need from me to do this well
