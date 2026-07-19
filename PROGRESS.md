# Project Progress Journal

This document maintains the context of our development steps for the Shared Expense Tracker app. It ensures that any AI assistant on any machine can understand the project's current state and history.

## Architecture
- **Framework**: Next.js 16 (stable v16 release)
- **Database**: Neon (Serverless Postgres) with Drizzle ORM
- **Styling**: Tailwind CSS + shadcn/ui (Mobile-first responsive design)
- **Auth**: Auth.js
- **Goal**: Build a personal budget + shared group expenses tracker with UPI settlement and real-time chat.

## Development Log

### Phase 0: Project Setup

**Step 1: Initialize Next.js Project**
- Initialized a brand new Next.js project. Initially used canary, but downgraded to the stable Next.js 16 release per user request.
- **Command:** `npx create-next-app@canary expense-tracker --ts --tailwind --eslint --app --src-dir --import-alias "@/*" --use-npm --yes`
- **Command (Downgrade to stable):** `npm install next@latest eslint-config-next@latest`
- **Dependencies installed:**
  - `next` (v16.2.x)
  - `react` (v19)
  - `react-dom` (v19)
- **Dev Dependencies installed:**
  - `@tailwindcss/postcss`, `tailwindcss`
  - `@types/node`, `@types/react`, `@types/react-dom`
  - `eslint`, `eslint-config-next`
  - `typescript`

**Step 2: Base UI and Layout Setup**
- **[Completed]**: Initialized `shadcn/ui` with default configuration.
- **[Completed]**: Designed and implemented the mobile-first base layout (`layout.tsx` max-width container, bottom navigation bar, and premium welcome page).
