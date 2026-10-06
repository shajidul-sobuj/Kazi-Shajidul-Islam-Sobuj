# Tender Document Package Builder

A powerful frontend-only application for verifying, organizing, and merging PDF documents for tender submissions. Developed for the AI DevFest competition.

## Features

- **Schema Validation:** Ingests `requirements.json` to dynamically build the compliance checklist.
- **Smart Validation Engine:** Strictly verifies mandatory documents, expiry dates (inclusive of deadline), and optional fields without false positives.
- **Duplicate Detection:** In-browser cryptographic SHA-256 hash comparison instantly flags duplicated PDF attachments and prevents dual-assignments.
- **PDF Construction & Assembly:** Generates a pristine, compliant PDF package featuring:
  - Executive Cover Page (Tender metadata, timestamp, checklist).
  - Dynamic Table of Contents / Index Page.
  - Sequentially merged attachments.
  - Stamped pagination footers (`<tender_id> | Page X of Y`).
- **Auto-Match Heuristic:** Smart token-based filename matching instantly assigns uploaded PDFs to appropriate checklist slots.
- **CSV Audit Export:** Generates an Excel-ready compliance report.
- **Fully Bilingual:** Seamless English and Bengali (বাংলা) interface toggling.

## Tech Stack

- **Framework:** React 19 + TypeScript + Vite 8
- **Styling:** Tailwind CSS v4
- **PDF Engine:** `pdf-lib`
- **Icons:** `lucide-react`
- **Architecture:** 100% Client-side. No backend. No database. Zero server storage.

## How to Run Locally

1. Install dependencies:
   ```bash
   npm install
   ```
2. Start the development server:
   ```bash
   npm run dev
   ```
3. Open `http://localhost:5173` in your browser (Google Chrome recommended).

## AI Assistance Details
- **AI Tool Used:** Gemini 3.1 Pro (via Antigravity Workspace)
- **Most Useful Prompt:** The initial multi-phase strategy and constraints prompt that outlined exact PDF-lib coordinate stamping, timezone-safe date parsing, and strict duplicate-prevention state machines.

## Known Limitations
- Extremely large PDFs (>50MB total) may cause temporary browser memory pressure due to client-side binary processing.
- Filename Auto-match is heuristic-based; office staff should always verify matches before final generation.

## License
MIT License
