# Project Notes & Q&A Log

Welcome! This file tracks design decisions, explanations, and answers to your questions throughout development.

---

## Index of Q&A
1. [Next.js layouts vs page.tsx files](#q1-nextjs-layouts-vs-pagetsx-files)

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
