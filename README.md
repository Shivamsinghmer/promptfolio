# PromptFolio

> **Talk to your portfolio. Invest, rebalance, and pay — in plain English.**

PromptFolio is an AI-powered Web3 portfolio assistant built on Solana. It lets users manage their crypto holdings through natural language prompts — rebalancing allocations, sending funds, and analyzing performance without touching a single button.

---

## 🏷️ Hackathon Details

| Field | Details |
|---|---|
| **Team Name** | BRX Devs |
| **Project Name** | PromptFolio |
| **Track** | Web3 |

---

## 👥 Team

### 🏆 Team Lead

| Name | Contact | Role |
|---|---|---|
| **Shivam Singh Mer** | +91 94512 01779 | Team Lead & Full-Stack Developer |

### 👨‍💻 Team Members

| Name | Contact | Role |
|---|---|---|
| **Lakhan Tekchandani** | +91 84679 32305 | Frontend Developer |
| **Shreya Shukla** | +91 95690 67085 | UI/UX Designer |
| **Janvi Chaturvedi** | +91 98388 00556 | AI Integration & Backend Developer |
| **Hansika Katiyar** | +91 92366 72709 | Frontend Developer & QA |

---

## 🚀 Project Overview

PromptFolio is a next-generation Web3 intent parser and portfolio manager for Solana. Users connect their Phantom or Solflare wallet, then interact with their portfolio entirely through natural language commands powered by Groq's LLaMA 3.3 model.

### Key Features

- 🗣️ **Natural Language Portfolio Control** — Type commands like *"Rebalance 50% SOL, 30% USDC, 20% JUP"* and the AI parses and executes the intent
- 📊 **Real-Time Portfolio Dashboard** — Live asset allocation tracker with donut chart visualization
- 📈 **Performance Analytics** — Monthly reports, trade history, and rebalance timeline
- 🤖 **AI Portfolio Advisor** — Ask for investment advice and get AI-powered insights via Groq
- 🔐 **Web3 Wallet Auth** — Phantom & Solflare wallet support with on-chain transaction simulation
- 📬 **Contacts & Quick Send** — Address book for fast token sends with prefill support

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 18, Vite, TailwindCSS v4 |
| **AI Engine** | Groq API (LLaMA-3.3-70b-versatile) |
| **Blockchain** | Solana Web3.js, Phantom / Solflare Wallet Adapter |
| **Charts** | Recharts |
| **Animations** | OGL WebGL (Dot Matrix Background) |
| **Routing** | React Router v6 |

---

## ⚙️ Getting Started

### Prerequisites

- Node.js 18+
- A Groq API key from [console.groq.com](https://console.groq.com)
- Phantom or Solflare browser extension (optional — demo mode available)

### Installation

```bash
# Clone the repository
git clone https://github.com/Shivamsinghmer/promptfolio.git
cd promptfolio

# Install dependencies
npm install

# Create environment file
cp .env.example .env.local
# Add your Groq API key to .env.local:
# VITE_GROQ_API_KEY=gsk_...

# Start development server
npm run dev
```

The app runs at `http://localhost:5173`.

---

## 📁 Project Structure

```
src/
├── components/         # Reusable UI components (Sidebar, SafetyGateModal, DottedBackground)
├── context/            # PortfolioContext — global state management
├── pages/              # Route pages (Landing, Dashboard, Tracking, Contacts, Settings)
├── services/           # AI service (Groq integration, intent parsing)
└── index.css           # Global theme (OKLCH color system, IBM Plex Mono typography)
```

---

## 📄 License

Built for hackathon purposes by **BRX Devs**. All rights reserved.
