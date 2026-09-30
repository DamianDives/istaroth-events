# 🌌 Istaroth Events Platform (`events.istaroth.tech`)

> A modern regional tech event discovery & monetized ticketing protocol with built-in automated commission revenue capture.

---

## ⚡ Overview

**Istaroth Events** connects developers, founders, researchers, and creators with premier tech conferences, hackathons, and afterhours summits in their specific region, while enabling the platform owner to capture a configurable percentage of all ticket sales (**Take-Rate / Platform Commission**).

---

## 💎 Key Features

### 1. 🌍 Regional Aggregation & Geolocation
- **8 Premier Global Hubs Supported**:
  - 🇺🇸 **San Francisco & Silicon Valley** (Autonomous AI, LLMs, Frontier Tech)
  - 🇺🇸 **New York City** (Quant, Fintech, Generative Media)
  - 🇬🇧 **London** (DeepTech, Quantum, Design Systems)
  - 🇩🇪 **Berlin** (Open Source, Systems, Rust)
  - 🇮🇳 **Bengaluru** (AI Founders, SaaS Scale, Cloud Native)
  - 🇯🇵 **Tokyo** (Humanoid Robotics, Computer Vision)
  - 🇦🇪 **Dubai** (Sovereign AI, Web3 World Congress)
  - 🌐 **Virtual / Global** (Decentralized Live Hackathons)
- **Auto-Detect My Region**: Intelligent timezone & location detection to immediately stream relevant events.
- **Persistent Selection**: Stores preferred region in `localStorage`.

### 2. 💰 Monetization & Commission Engine ("Sales Cut")
- **Automated Platform Take-Rate**:
  - Default rate: **8.0%** (Configurable from 3.0% to 15.0% in Treasury).
  - Every ticket checkout executes an automated split:
    - `Gross Subtotal = Ticket Price × Quantity`
    - `Istaroth Platform Cut = Gross Subtotal × (Take Rate %)` *(captured by you)*
    - `Organizer Net Payout = Gross Subtotal - Platform Cut` *(settled to organizer)*
- **Checkout Fee Transparency**:
  - Attendees see full transparency during booking.
  - Generates verifiable digital boarding pass with procedural QR check-in codes.
- **Treasury Dashboard (`Platform Treasury & Cut`)**:
  - Real-time Gross Merchandise Value (GMV) tracker.
  - Net Platform Revenue (Cumulative dollar cut captured).
  - Organizer Payouts disbursement ledger.
  - Interactive **Commission Rate Slider**: Simulates monthly platform ARR based on varying take-rates.

### 3. 🚀 Organizer Studio ("Host an Event")
- Organizers can publish events directly into any regional stream.
- **Real-Time Earnings Calculator**:
  - Organizers type expected ticket prices and venue capacity to immediately view their net payout vs the platform fee.
  - Published events are instantly live and saved into `localStorage`.

### 4. 🎟️ Digital Boarding Passes ("My Passes")
- Apple Wallet / Web3 style event passes with:
  - Cryptographic attendee check-in QR code & barcode.
  - Unique Ticket & Transaction IDs (`IST-XXXXXX`, `TXN-XXXXX`).
  - Fee split certification.

---

## 🚀 How to Run Locally

You can run this project with any local HTTP server:

```bash
# Using Node / npx serve (Port 3000)
npx -y serve . -p 3000
```

Or open `index.html` directly in modern web browsers (Chrome, Edge, Safari, Firefox).

---

## 📁 Project Structure

```
istaroth-events/
├── index.html            # Main SPA layout with Region Switcher, Discovery, Treasury, and Studio
├── styles.css            # Celestial glassmorphic design system matching istaroth.tech
├── app.js                # Core controller: Region filtering, checkout engine, commission logic
├── events-data.js        # Seeded regional database and historical transaction ledger
├── package.json          # Node scripts for quick local serving
├── istaroth_logo.png     # Official Istaroth brand assets
├── favicon.svg           # Brand favicon
└── README.md             # Platform documentation
```
