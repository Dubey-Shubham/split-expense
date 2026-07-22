# Project Notes & Q&A Log

Welcome! This file tracks design decisions, explanations, and answers to your questions throughout development.

---

## Index of Q&A
1. [Next.js layouts vs page.tsx files](#q1-nextjs-layouts-vs-pagetsx-files)
2. [Metadata in layout.tsx and page heads](#q2-metadata-in-layouttsx-and-page-heads)
3. [Route Groups (app) and (marketing)](#q3-route-groups-app-and-marketing)

---

## Q&A Log

### Q1: Next.js layouts vs page.tsx files

**Question:**
I come from a React background. The layout has the header and footer while the root page.tsx has the home page content. Does layout act like a shell, and why didn't we add the footer and header in page.tsx?

**Answer:**
Yes, in Next.js App Router, `layout.tsx` acts as a global shell that wraps your page components.

Here is why we put the header (`TopNav`) and footer (`BottomNav`) in the layout instead of `page.tsx`:

* **State Persistence & Performance**: When navigating, the layout does not re-render. Only the page inside `{children}` changes. Placing navigation in the layout avoids page flashes and preserves component state.
* **DRY (Don't Repeat Yourself)**: Placing navigation in the layout automatically wraps all nested pages (like `/groups` or `/budget`), preventing the need to import them manually in every new page.
* **Separation of Concerns**: Layout handles the persistent structural frame, while page files handle only the specific page content.

### Q2: Metadata in layout.tsx and page heads

**Question:**
I can see we have a metadata tag in the layout. Does it set those tags in the head of this home page?

**Answer:**
Yes, absolutely. 

In Next.js, when you export a `metadata` object from a `layout.tsx` (or a `page.tsx`), Next.js automatically generates and injects the corresponding `<title>`, `<meta>`, and other SEO tags into the HTML `<head>` when rendering the page.

Here is how it works:
* **Default Values**: The metadata defined in your root `layout.tsx` serves as the fallback/default metadata for all pages nested under it (including the home `page.tsx`).
* **Inheritance & Merging**: If a specific nested page (e.g., `/groups/page.tsx`) needs a custom title, it can export its own `metadata` object. Next.js will automatically merge it, overriding fields like the title while keeping the default description from the parent layout.
* **No Manual `<head>` tags needed**: You do not need to write `<head>` or `<title>` tags inside your HTML markup; Next.js handles all head-injection safely under the hood.

### Q3: Route Groups (app) and (marketing)

**Question:**
Why have you used `(app)` and `(marketing)` folders inside the `app` directory?

**Answer:**
In Next.js App Router, wrapping a folder name in parentheses—like `(app)` or `(marketing)`—creates a **Route Group**.

Next.js uses Route Groups for two main reasons:

1. **Omitted from the URL Path**:
   Parentheses folders are completely ignored in the URL routing paths.
   - `src/app/(marketing)/login/page.tsx` resolves to the URL `/login` (not `/marketing/login`).
   - `src/app/(app)/page.tsx` resolves to the URL `/` (not `/app`).
   This lets us logically organize folders without affecting our clean URL structure.

2. **Isolating Layouts & Providers**:
   This is the primary architectural reason. Route Groups allow us to apply different layouts to different sets of pages:
   - **The `(app)` layout zone**: Pages like home, groups, and budgets need the global app shell (with the `TopNav` header and the mobile `BottomNav` menu). Placing them in `(app)` wraps them under the `(app)/layout.tsx` that contains those navbars.
   - **The `(marketing)` layout zone**: Pages like login and signup are public and should not show the dashboard navbars. Placing them inside `(marketing)` separates them from the app shell, inheriting only the root `layout.tsx` wrapper.


