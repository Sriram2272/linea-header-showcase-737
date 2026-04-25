# Lumen AI Jewelry — AI-Powered Luxury Jewelry Experience

> A modern, AI-enhanced jewelry e-commerce platform that combines elegant minimalist design with intelligent product discovery, side-by-side AI comparison, and an interactive 3D product viewer.

---

## ✨ Overview

**Lumen AI Jewelry** reimagines online jewelry shopping by blending an editorial, gallery-style storefront with state-of-the-art AI capabilities. Customers don't just browse — they converse with an AI stylist, compare pieces intelligently, and explore products in 3D / AI-rendered visualizations before they buy.

The platform was built end-to-end as a full-stack web application with a strong focus on **performance, design fidelity, and AI integration**.

---

## 👥 The Team

This project was designed, architected and built by a two-person engineering team.

### 🧭 Ratakonda Dheeraj — *Project Lead · Frontend & System Architect*

Owned the overall product vision, system architecture, and the entire frontend experience.

**Responsibilities & Contributions:**
- Defined the **end-to-end system architecture** (frontend ↔ backend ↔ AI services ↔ database).
- Designed and implemented the **complete UI/UX** using React, TypeScript, Tailwind CSS, and shadcn/ui.
- Built the **design system** (semantic tokens, typography scale, color palette, motion language) in `src/index.css` and `tailwind.config.ts`.
- Implemented all major user-facing surfaces:
  - Editorial homepage, category & product detail pages
  - Shopping bag, checkout flow, and account pages
  - About / Story / Sustainability / Store locator sections
- Built the **AI Chatbot widget** (floating "Lumi" assistant) with streaming responses and conversational UX.
- Built the **Product Comparison feature** — multi-select state management (`CompareContext`), floating compare bar, and AI-driven side-by-side analysis.
- Built the **3D Product Viewer** page using `three.js`, `@react-three/fiber`, and `@react-three/drei` — including the toggleable AI image / interactive 3D model view.
- Set up routing, global state, error boundaries, and the responsive layout system.
- Owned project planning, code review, integration, and release coordination.

### ⚙️ G Tharun — *Backend Engineer*

Owned all server-side logic, AI service integration, and the data layer.

**Responsibilities & Contributions:**
- Designed and implemented the **backend infrastructure** on a managed Postgres + Edge Functions stack.
- Built the **`chat` Edge Function** (`supabase/functions/chat/index.ts`) — handles streaming conversations with the AI gateway, prompt construction, and the Lumi assistant persona.
- Built the **`product-analyze` Edge Function** (`supabase/functions/product-analyze/index.ts`) that:
  - Accepts an external product URL
  - Scrapes and parses the page
  - Calls **Gemini** to extract structured product data (materials, pros/cons, shape primitives, colors, finish)
  - Calls the **Gemini image model** to generate a photorealistic studio render
  - Returns a unified payload to the frontend
- Designed the **database schema**, RLS (Row-Level Security) policies, and migrations.
- Configured **secrets management**, CORS, and authenticated/unauthenticated function access.
- Implemented robust **error handling, retries, and rate-limit awareness** for AI calls.
- Owned observability — logs, edge function diagnostics, and uptime monitoring.

---

## 🧩 Feature Highlights

| Feature | Description | Owner |
|---|---|---|
| 🛍️ Editorial Storefront | Minimalist, gallery-style product browsing | Dheeraj |
| 🤖 AI Stylist Chatbot ("Lumi") | Floating assistant for product Q&A and styling advice | Dheeraj (UI) · Tharun (API) |
| ⚖️ AI Product Comparison | Select 2 products → AI analyzes design, materials, value, recommendation | Dheeraj (UI) · Tharun (API) |
| 🧊 3D Product Viewer | Paste any product URL → AI analysis + AI image + interactive 3D model | Dheeraj (3D/UI) · Tharun (analysis API) |
| 🛒 Cart & Checkout | Full shopping flow with bag management | Dheeraj |
| 📱 Responsive Design | Mobile-first, refined on every breakpoint | Dheeraj |
| 🔐 Secure Backend | RLS policies, secret management, validated inputs | Tharun |

---

## 🏗️ System Architecture

```
                        ┌─────────────────────────────┐
                        │          Browser            │
                        │  React + Vite + TypeScript  │
                        │  Tailwind + shadcn/ui       │
                        │  three.js / R3F (3D viewer) │
                        └──────────────┬──────────────┘
                                       │ HTTPS / WebSocket
                                       ▼
        ┌──────────────────────────────────────────────────────┐
        │                  Backend (Edge Layer)                │
        │   ┌────────────────────┐   ┌──────────────────────┐  │
        │   │  /functions/chat   │   │ /functions/          │  │
        │   │  Lumi AI assistant │   │   product-analyze    │  │
        │   └─────────┬──────────┘   └──────────┬───────────┘  │
        └─────────────┼────────────────────────┼───────────────┘
                      │                        │
                      ▼                        ▼
            ┌──────────────────┐     ┌─────────────────────┐
            │   AI Gateway     │     │  Web Scraper +      │
            │   Gemini / GPT   │     │  Gemini Vision +    │
            │   text models    │     │  Gemini Image gen   │
            └──────────────────┘     └─────────────────────┘

                      ┌────────────────────────┐
                      │   PostgreSQL Database  │
                      │   + Row-Level Security │
                      └────────────────────────┘
```

---

## 🔄 End-to-End Workflow

### 1. Browsing → Chat
1. User lands on the storefront (rendered by Dheeraj's frontend).
2. Clicks the floating **Lumi** button → opens the chatbot.
3. Message is sent to the `chat` Edge Function (built by Tharun).
4. The function streams an AI response back to the UI.

### 2. Compare Mode
1. User toggles **Compare** on two products in the grid.
2. The floating **Compare Bar** appears (`CompareContext`).
3. Clicking **Compare with AI** dispatches an event the chatbot listens to.
4. A structured comparison prompt is sent → AI returns a side-by-side analysis.

### 3. 3D Product Viewer
1. User opens **3D Product Viewer** from the navigation.
2. Pastes any product URL (Amazon, Etsy, etc.).
3. Frontend calls `product-analyze` (Tharun's edge function).
4. The function scrapes the page, runs Gemini analysis, and generates an AI image.
5. Frontend renders:
   - The **AI-generated photorealistic image** (default view), and
   - An **interactive 3D model** built from extracted shape primitives.

---

## 🛠️ Tech Stack

**Frontend**
- React 18 · TypeScript 5 · Vite 5
- Tailwind CSS v3 · shadcn/ui · Radix UI
- React Router · TanStack Query · React Hook Form · Zod
- three.js · @react-three/fiber · @react-three/drei
- lucide-react · sonner · framer-motion-style transitions

**Backend**
- Edge Functions (TypeScript / Deno runtime)
- PostgreSQL with Row-Level Security
- Managed Auth + Storage
- AI Gateway (Google Gemini text + image models)

**Tooling**
- ESLint · TypeScript strict mode · PostCSS · Autoprefixer

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ and npm (or `bun`)

### Installation

```bash
# 1. Clone the repository
git clone <YOUR_GIT_URL>
cd lumen-ai-jewelry

# 2. Install dependencies
npm install

# 3. Start the dev server
npm run dev
```

The app will be available at `http://localhost:5173`.

### Environment

The project uses managed cloud services for the database and AI gateway. The `.env` file is auto-provisioned with:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`
- `VITE_SUPABASE_PROJECT_ID`

Backend secrets (AI keys, etc.) are managed through the cloud secrets manager and never committed.

### Available Scripts

| Command | Purpose |
|---|---|
| `npm run dev` | Start the local dev server |
| `npm run build` | Production build |
| `npm run build:dev` | Development-mode build |
| `npm run lint` | Lint the codebase |
| `npm run preview` | Preview the production build |

---

## 📁 Project Structure

```
src/
├── assets/                 # Static images & illustrations
├── components/
│   ├── about/              # About / story / sustainability blocks
│   ├── category/           # Product grids, filters, pagination
│   ├── chatbot/            # Lumi AI floating chat
│   ├── compare/            # Compare context + floating bar
│   ├── content/            # Editorial homepage sections
│   ├── footer/ · header/   # Layout chrome
│   ├── product/            # PDP gallery, info, reviews
│   ├── viewer/             # 3D product renderer (R3F)
│   └── ui/                 # shadcn/ui primitives
├── pages/                  # Route-level pages
├── hooks/ · lib/           # Shared utilities
├── integrations/supabase/  # Auto-generated client + types
└── index.css               # Design tokens & global styles

supabase/
└── functions/
    ├── chat/               # Lumi AI chat endpoint
    └── product-analyze/    # URL → AI analysis + image
```

---

## 🎨 Design Philosophy

- **Editorial minimalism** — generous whitespace, refined typography, restrained color.
- **Semantic design tokens** — every color, shadow and radius defined once in `index.css` and consumed via Tailwind, ensuring perfect light/dark consistency.
- **Performance first** — code-split routes, lazy 3D scene loading, optimized image rendering.
- **Accessibility** — semantic HTML, keyboard navigation, ARIA where needed, color contrast verified.

---

## 🔒 Security

- All database tables protected by **Row-Level Security**.
- Server secrets stored in the managed secret store — never in client code.
- Input validation on all edge functions.
- No raw user data ever forwarded to AI providers without sanitization.

---

## 🗺️ Roadmap

- [ ] Wishlist with cross-device sync
- [ ] AI try-on (AR) for rings & necklaces
- [ ] Personalized recommendations from chat history
- [ ] Multi-currency & i18n
- [ ] Order tracking with email notifications

---

## 📜 License

© Lumen AI Jewelry. All rights reserved.

---

## 🙏 Credits

Designed, architected and engineered by:

- **Ratakonda Dheeraj** — Project Lead, Frontend & System Architect
- **G Tharun** — Backend Engineer

Built with care, ☕, and a shared obsession for great product experiences.
