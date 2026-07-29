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

### Phase 1: Auth & User Onboarding (UI Setup)

**Step 3: Route Restructuring & Authentication Screens UI**
- **[Completed]**: Restructured routes using Next.js Route Groups into `(app)` (authenticated layout with `TopNav` and `BottomNav` navigation bars) and `(marketing)` (public/auth shell without global navigation).
- **[Completed]**: Designed a premium, dark-themed, glassmorphic Sign-Up UI page (`src/app/(marketing)/signup/page.tsx`) requesting First Name, Last Name, Email, and Password with local storage registration simulation, integrated with React Hook Form and Zod schema validation.
- **[Completed]**: Designed an aligned Login UI page (`src/app/(marketing)/login/page.tsx`) that verifies user credentials against local storage accounts using React Hook Form and Zod schemas, routing the user into the main app dashboard on success.

**Step 4: Database & Drizzle ORM Setup**
- **[Completed]**: Installed Drizzle ORM and Neon Postgres driver dependencies (`drizzle-orm`, `@neondatabase/serverless`, `drizzle-kit`).
- **[Completed]**: Created `drizzle.config.ts` configuration file mapping schemas to `src/lib/db/schema.ts` and output migrations to `src/lib/db/migrations`.
- **[Completed]**: Programmed the DB connection client at `src/lib/db/db.ts` utilizing pooled socket connections safe for local and serverless execution environments.
- **[Completed]**: Declared the initial `users` relational table schema at `src/lib/db/schema.ts` representing user account details (First Name, Last Name, Email, Password Hash, UPI ID).
- **[Completed]**: Ran Drizzle Kit migrations generator successfully, creating the initial database SQL schema file.

**Step 5: Database-Connected Signup, Login, and Auth Navigation**
- **[Completed]**: Written Server Actions for authentication (`signUpAction`, `loginAction`, `logoutAction`, `getCurrentUserAction`) in `src/app/actions/auth.ts` containing secure Node-native PBKDF2 password hashing.
- **[Completed]**: Replaced mocked local-storage logins/signups with live cloud database reads and writes.
- **[Completed]**: Programmed user-session cookies (`session_user`) that auto-propagate to React Server Components.
- **[Completed]**: Upgraded route layout checks (`src/app/(app)/layout.tsx`) to pass active login states down to client views.
- **[Completed]**: Configured `TopNav` to hide dashboard routing tabs and show clean "Log In" / "Sign Up" pills for guests, while exposing profile and logout triggers to members.
- **[Completed]**: Configured `BottomNav` to hide entirely on mobile for logged-out guests.
- **[Completed]**: Redesigned the root Home dashboard (`src/app/(app)/page.tsx`) to render a high-converting, dark-themed, glassmorphic marketing landing page listing features (Personal Budgets, Shared Groups, UPI, Real-time Chat) for unauthenticated visitors, while loading a private dashboard welcoming authenticated users.
- **[Completed]**: Added a global routing proxy (`src/proxy.ts`) to intercept `/login` and `/signup` requests, redirecting authenticated users (possessing active session cookies) back to the home page `/`.

### Phase 2: Group Expenses Management

**Step 6: Group Expenses Schema & UI**
- **[Completed]**: Added `groups` and `groupMembers` relational tables to `src/lib/db/schema.ts`, linking groups to creators and members to user profiles with cascade deletes.
- **[Completed]**: Ran migrations (`db:generate`) and updated the live Neon cloud PostgreSQL database (`db:push`).
- **[Completed]**: Developed Server Actions (`getGroupsAction`, `createGroupAction`, `deleteGroupAction`) in `src/app/actions/groups.ts` to perform database operations.
- **[Completed]**: Built a premium, glassmorphic UI layout at `src/app/(app)/groups/page.tsx` showing a Splitwise-like balance overview card (calculating Net balance, You are owed, and You owe summaries for pre-seeded dummy groups), category avatar selectors (Rent, Travel, Food, Drinks, Other), group creation dialog forms, and delete triggers.
- **[Completed]**: Verified build compilation with `npm run lint` returning zero warnings and zero errors.
