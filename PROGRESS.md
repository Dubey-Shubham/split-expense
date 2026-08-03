# Project Progress Journal

This document maintains the context of our development steps for the Shared Expense Tracker app. It ensures that any AI assistant on any machine can understand the project's current state and history.

## Architecture
- **Framework**: Next.js 16 (Next.js App Router with Partial Prerendering & `"use cache"`)
- **Database**: Neon (Serverless Postgres) with Drizzle ORM
- **Styling**: Tailwind CSS + shadcn/ui (Mobile-first responsive design)
- **Auth**: Cookie-based session authentication with PBKDF2 password hashing
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

### Phase 3: Performance, PPR Architecture & Data Caching

**Step 7: Partial Prerendering (PPR) & `"use cache"` Data Access Layer**
- **[Completed]**: Enabled `experimental.cacheComponents: true` in `next.config.ts` to activate Next.js 15+ Partial Prerendering (PPR) for static shell prerendering with dynamic streaming.
- **[Completed]**: **Data Access Layer (`src/lib/data/groups.ts`)**: Built `getGroupsForUser(userId)` decorated with `"use cache"`, `cacheTag("groups-" + userId)`, and `cacheLife("hours")`. Optimized SQL query waterfalls using `Promise.all` parallelization to fetch member counts and creator details concurrently.
- **[Completed]**: **User Data Layer (`src/lib/data/users.ts`)**: Built `getUserProfile(userId)` decorated with `"use cache"`, `cacheTag("user-" + userId)`, and `cacheLife("hours")`.
- **[Completed]**: **Security Architecture**: Separated private, parameter-based data access functions (`src/lib/data/`) from public Server Actions (`src/app/actions/` marked with `"use server"`). This prevents external malicious actors from spoofing `userId` parameters via POST API calls.
- **[Completed]**: **Fine-Grained Suspense Boundaries & Shimmer Optimization**:
  - `src/app/(app)/groups/page.tsx`: Isolated dynamic components (`<LedgerAmounts />` and `<GroupsGrid />`) within `<Suspense>` boundaries. The outer page heading, create modal button, and ledger card container render statically without shimmering.
  - `src/app/components/WelcomeCard.tsx`: Kept the card shell (border, background glow, sparkle icon, calendar badge, active badge) 100% static. Wrapped only the `<UserNameText />` inside `<Suspense>`, providing a focused micro-shimmer line fallback for the name text only.
  - `src/app/(app)/page.tsx`: Embedded the static `<WelcomeCard />`, `<QuickActionsSection />`, and `<StatsSection />` inside `HomeSkeleton` so the entire home page shell renders statically on initial load.
- **[Completed]**: **Cache Invalidation**: Updated `createGroupAction` and `deleteGroupAction` in `src/app/actions/groups.ts` to invoke `revalidateTag("groups-" + userId, "hours")` alongside `revalidatePath("/groups")` for instant on-demand cache busting.
- **[Completed]**: **PPR Signal Handling**: Added `if (err?.digest === "HANGING_PROMISE_REJECTION") throw err;` to catch blocks in auth and group Server Actions to support Next.js PPR static prerender signal pass-through.

### Phase 4: Structural Refactoring, User Profiles & Theming

**Step 8: Route-based Component Refactoring**
- **[Completed]**: Restructured `src/components/` moving feature-specific UI elements into collocated `src/app/components/{route}/` directories for better encapsulation and maintenance (`home`, `groups`, `layout`).
- **[Completed]**: Successfully validated imports and Next.js builds post-refactoring.

**Step 9: Profile Section & Dark Mode**
- **[Completed]**: Upgraded the Neon Database schema adding an optional `mobileNumber` column to the `users` table and pushed migrations.
- **[Completed]**: Configured Tailwind v4 class-based dark mode (`@custom-variant dark`) and integrated `next-themes` seamlessly via a global `<ThemeProvider>` inside `RootLayout`.
- **[Completed]**: Built a dedicated User Profile settings page (`/profile`) that allows users to edit personal details, mobile numbers, and UPI handles, persisting instantly via Server Actions (`updateProfileAction`) with localized `revalidateTag` cache busting.
- **[Completed]**: Developed an `<InitialsAvatar>` component mapping first and last names to dynamic deterministic background colors to avoid complex file storage requirements.
- **[Completed]**: Replaced manual HTML Form data scraping with `react-hook-form` for enhanced controlled-component form handling in `<ProfileForm>`.
