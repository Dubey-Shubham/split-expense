# Project Notes & Q&A Log

Welcome! This file tracks design decisions, explanations, and answers to your questions throughout development.

---

## Index of Q&A
1. [Next.js layouts vs page.tsx files](#q1-nextjs-layouts-vs-pagetsx-files)
2. [Metadata in layout.tsx and page heads](#q2-metadata-in-layouttsx-and-page-heads)
3. [Route Groups (app) and (marketing)](#q3-route-groups-app-and-marketing)
4. [PostgreSQL vs. MongoDB & What is NeonDB](#q4-postgresql-vs-mongodb--what-is-neondb)
5. [How to Setup Neon DB + Drizzle in Future Projects](#q5-how-to-setup-neon-db--drizzle-in-future-projects)
6. [How to View DB Tables in the Browser](#q6-how-to-view-db-tables-in-the-browser)
7. [Server Actions vs. Route Handlers](#q7-server-actions-vs-route-handlers)
8. [The Next.js 16 "proxy.ts" File Convention](#q8-the-nextjs-16-proxyts-file-convention)
9. [Cookie-Based Sessions vs. JWT Access/Refresh Tokens](#q9-cookie-based-sessions-vs-jwt-accessrefresh-tokens)
10. [Database Design: Junction Tables vs. Array Columns](#q10-database-design-junction-tables-vs-array-columns)



---

## NPM Commands Reference

Here are the key commands configured in [package.json](file:///c:/Projects/split-expense/package.json) for this project:

### Development & Build
* **`npm run dev`**: Starts the Next.js local development server (accessible at `http://localhost:3000`).
* **`npm run build`**: Compiles the Next.js application for production.
* **`npm run start`**: Runs the compiled Next.js production server.
* **`npm run lint`**: Runs ESLint checks on your code to find syntax, TypeScript, and React formatting errors.

### Database & Drizzle ORM
* **`npm run db:generate`**: Compiles your TypeScript schemas in `src/lib/db/schema.ts` and outputs standard SQL migration files under `src/lib/db/migrations/`.
* **`npm run db:migrate`**: Executes generated SQL migration files against your live Neon database to synchronize structural table changes.
* **`npm run db:push`**: Directly pushes your TypeScript `schema.ts` changes to your live Neon database instantly, without generating migration SQL logs (best for fast local iterations).
* **`npm run db:studio`**: Launches a spreadsheet-like browser interface (at `https://local.drizzle.studio`) that lets you view, search, and edit database rows and tables.



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

### Q4: PostgreSQL vs. MongoDB & What is NeonDB

**Question:**
I have only used MongoDB Atlas in the past. What is PostgreSQL, and why did we choose NeonDB? What is NeonDB?

**Answer:**
Coming from MongoDB Atlas, you will find PostgreSQL (Postgres) very powerful, but it handles data with a different philosophy.

#### 1. PostgreSQL vs. MongoDB

* **Data Model (Relational vs. Document)**:
  * **MongoDB (NoSQL)**: Stores data in flexible, JSON-like document structures. You can put any fields in any document without defining them beforehand.
  * **PostgreSQL (SQL)**: A relational database. Data is stored in rigid **tables** with columns and rows. You must define a **schema** (table names, column types like text, integer, timestamp) beforehand. Drizzle ORM acts as the bridge to define these schemas in TypeScript.
* **Relations & Integrity (Links vs. Joins)**:
  * In MongoDB, linking two items (like an expense and the user who paid it) is done using `ObjectId` references, but MongoDB doesn't strictly check if the target exists.
  * In Postgres, we use **Foreign Keys** (`references`). The database itself enforces relational integrity. For example, you cannot insert an expense for a `userId` that doesn't exist in the `users` table. 
  * Postgres excels at **JOINS**, letting you write high-performance queries that merge data across tables (e.g. matching an expense split list with user profiles) in a single request.
* **Transactions (ACID)**:
  * Postgres is highly optimized for strict financial transactions. If a user logs a group expense, and we must create 1 expense record + 4 split entries, Postgres guarantees that either **all of them succeed** or **all of them roll back** (no partial database states).

#### 2. What is NeonDB?

Think of **NeonDB (Neon)** as the **MongoDB Atlas equivalent for PostgreSQL**. It is a cloud Postgres hosting platform.

We chose it for this project because of its unique serverless design:

* **Compute & Storage Separation (Autoscaling)**:
  Unlike traditional databases that run 24/7 (costing money), Neon separates storage from compute. If nobody is visiting your app, Neon automatically spins down to 0 compute power (free). As soon as a request hits your site, it spins up in under a second.
* **Database Branching**:
  Just like Git branches, Neon allows you to create instant copies of your database schema and data in seconds. You can create a `development` branch to test Drizzle schema migrations safely, without breaking your main database.
* **Serverless Connection Pooling**:
  Next.js Server Actions run in serverless functions (which spin up and down constantly). Standard Postgres connections require persistent TCP links, which break when hundreds of functions spin up. Neon includes a built-in serverless driver (WebSocket connection pooling) which allows the serverless app to connect instantly and scale safely.

### Q5: How to Setup Neon DB + Drizzle in Future Projects

**Question:**
How can I set up Neon DB and connect it to a Next.js app in a way that I can reuse for future projects?

**Answer:**
Here is a step-by-step boilerplate guide you can reuse to set up Neon Postgres and Drizzle ORM in any new Next.js project.

#### Step 1: Create a Database on Neon
1. Go to [neon.tech](https://neon.tech) and sign up for a free account.
2. Create a new project (select a region close to your users/hosting, e.g. AWS ap-south-1).
3. Copy the **Connection String** from your dashboard. It looks like:
   `postgresql://alex:passwd@ep-cool-glow-a123.ap-south-1.aws.neon.tech/neondb?sslmode=require`

#### Step 2: Configure Environment Variables
Create a `.env.local` (for development) or `.env` file at the root of your Next.js project and paste your connection string:
```env
DATABASE_URL="postgresql://alex:passwd@ep-cool-glow-a123.ap-south-1.aws.neon.tech/neondb?sslmode=require"
```

#### Step 3: Install Required Packages
Run the following command in your terminal to install the Drizzle ORM runtime, Neon's serverless client, and Drizzle Kit development tools:
```bash
npm install drizzle-orm @neondatabase/serverless
npm install -D drizzle-kit
```

#### Step 4: Configure Drizzle Kit
Create a `drizzle.config.ts` file in the root folder of your project:
```typescript
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  dialect: "postgresql",
  schema: "./src/lib/db/schema.ts", // where you define your TypeScript tables
  out: "./src/lib/db/migrations",    // where SQL migrations will be generated
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
```

#### Step 5: Setup the Connection Client
Create a file at `src/lib/db/db.ts` to export your database connector. This setup ensures that in development mode, hot-reloading does not exhaust your connection pool limits:
```typescript
import { drizzle } from "drizzle-orm/neon-serverless";
import { Pool } from "@neondatabase/serverless";

const connectionString = process.env.DATABASE_URL || "";

const globalForDb = globalThis as unknown as {
  pool: Pool | undefined;
};

const pool = globalForDb.pool ?? new Pool({ connectionString });

if (process.env.NODE_ENV !== "production") {
  globalForDb.pool = pool;
}

export const db = drizzle({ client: pool });
```

#### Step 6: Create your Schemas
Create your tables at `src/lib/db/schema.ts` using Drizzle columns:
```typescript
import { pgTable, text, timestamp } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
```

#### Step 7: Configure Migration Scripts
Add these scripts inside your `package.json`'s `"scripts"` block:
```json
"db:generate": "drizzle-kit generate",
"db:push": "drizzle-kit push",
"db:studio": "drizzle-kit studio"
```

* **`npm run db:generate`**: Inspects your TypeScript schema files and outputs standard `.sql` migration files.
* **`npm run db:push`**: Directly pushes your TypeScript schema updates into your live Neon cloud database (perfect for quick iterations without tracking migrations).
* **`npm run db:studio`**: Opens a visual browser dashboard to view and edit your database tables and data.

### Q6: How to View DB Tables in the Browser

**Question:**
How can I check the current tables and rows in our database right now in the browser?

**Answer:**
There are two main ways to explore and edit your database tables directly inside a web browser:

#### Method A: Drizzle Studio (Local & Universal)
Drizzle includes a built-in GUI explorer called **Drizzle Studio** that reads your local schemas and links to your database.
1. Run this command in your project terminal:
   ```bash
   npm run db:studio
   ```
2. Drizzle Kit will read your `.env` variables and launch a local web service at:
   `https://local.drizzle.studio` (or `http://localhost:1234`)
3. Open that link in your browser. You will see a spreadsheet-like interface where you can view tables, add rows, search records, and edit values visually.

#### Method B: Neon Console Dashboard (Cloud-Specific)
Because Neon is a cloud database hosting provider, it has a built-in browser-based GUI.
1. Log into your dashboard at [neon.tech](https://neon.tech).
2. Click on your active project, and navigate to **Tables** or **SQL Editor** in the left-hand sidebar:
   - **Tables View**: Displays all tables, column metadata, schemas, and lets you browse row records.
    - **SQL Editor**: Lets you write and run SQL queries (like `SELECT * FROM users;`) directly in your browser.

### Q7: Server Actions vs. Route Handlers

**Question:**
Are the functions in `auth.ts` Server Actions? What are Server Actions, how do you create them, and how are they different from Route Handlers?

**Answer:**
Yes, the functions in `auth.ts` (`signUpAction`, `loginAction`, `logoutAction`, etc.) are indeed **Server Actions**.

Here is a breakdown of what Server Actions are, how they work, and how they compare to Route Handlers.

#### 1. What are Server Actions?
Server Actions are asynchronous functions that run strictly on the server but can be invoked directly from Client Components (like forms, buttons, or custom event handlers) as if they were standard client-side JavaScript functions.

Under the hood, Next.js automatically sets up a secure POST request to communicate with the server. This means you do not have to write custom client-side fetch requests (`fetch('/api/something')`) or build JSON controllers to save form inputs to your database.

#### 2. How to Create and Use Them
There are two ways to declare Server Actions:

* **File-Level (Recommended for reusable actions)**:
  Place `"use server";` at the very top of a file. Every function exported from this file becomes a Server Action.
  ```typescript
  // src/app/actions/auth.ts
  "use server";

  export async function myAction(data: any) {
    // This runs strictly on the server
    return { success: true };
  }
  ```
* **Inline-Level (Directly inside a Server Component)**:
  Add `"use server";` inside the body of an async function defined inside a Server Component:
  ```typescript
  export default function MyServerComponent() {
    async function handleFormSubmit() {
      "use server";
      // DB operations here...
    }
    return <form action={handleFormSubmit}>...</form>;
  }
  ```

#### 3. Server Actions vs. Route Handlers (`route.ts`)
While both run server-side code, they serve different architectural purposes:

| Feature | Server Actions | Route Handlers (`route.ts`) |
| :--- | :--- | :--- |
| **Communication Style** | RPC (Remote Procedure Call) | REST API endpoints (GET, POST, etc.) |
| **Data Format** | Returns plain JS objects/types | Returns standard HTTP `Response` (JSON) |
| **Primary Use Case** | Web UI form submissions, toggles, button actions | Public API access, webhooks, mobile app links |
| **React Integration** | Integrates with `useTransition`, `useActionState` | Independent of React; consumed via HTTP `fetch` |
| **File Convention** | Defined in standard `.ts`/`.tsx` files | Defined strictly in `route.ts` folders |

* **When to use Server Actions**: For internal user actions on your website (such as submitting forms, registering users, deleting items, or sending a chat message).
* **When to use Route Handlers**: When you need to build endpoint URLs that external clients need to access (for example: Webhook endpoints for Razorpay/Stripe, or endpoints consumed by external mobile apps).

### Q8: The Next.js 16 "proxy.ts" File Convention

**Question:**
Why does Next.js 16 use `proxy.ts` instead of `middleware.ts`? What is it, and how is it different from traditional middleware?

**Answer:**
Starting with **Next.js 16**, the file convention previously known as `middleware.ts` has been officially renamed to **`proxy.ts`** (or `proxy.js`), and the main exported handler must be named `proxy`.

Here is why this change was introduced and how it compares to traditional middleware:

#### 1. Why the Rename?
In traditional backend frameworks like Express, "middleware" refers to functions that run in a sequential chain inside your server application.
* Next.js's routing interceptor is different: it runs on the **edge network layer** before the request even enters the application server routing logic.
* To prevent confusion, the Next.js team renamed the convention to `proxy.ts`. This term better signals that the feature acts as a **gateway proxy** at the network boundary, used for routing, rewriting, redirecting, and header modification.

#### 2. Key Details of `proxy.ts`
* **File Location**: Placed in the root directory or inside the `src/` folder (e.g. `src/proxy.ts`).
* **Export Signature**: You export a function named `proxy`:
  ```typescript
  import { NextResponse } from "next/server";
  import type { NextRequest } from "next/server";

  export function proxy(request: NextRequest) {
    // Intercept logic here
    return NextResponse.next();
  }
  ```
* **Matcher Config**: You can export a `config` object with a `matcher` array to filter which routes the proxy intercepts, preventing it from executing on public assets or unrelated pages.

#### 3. How it Differs from Traditional Proxies
* **Network Proxies (Nginx, Cloudflare)**: Standalone servers that route traffic. They have no access to your Next.js project code, routes, or local variables.
* **Next.js `proxy.ts`**: Runs inside a lightweight Edge JavaScript runtime in your project. It can dynamically inspect application cookies, URLs, and redirect/rewrite paths, though it cannot query databases directly due to runtime restrictions.


### Q9: Cookie-Based Sessions vs. JWT Access/Refresh Tokens

**Question:**
In standard SPA React + Express setups, we do JWT authentication where we store access/refresh tokens in memory or localStorage and refresh them every few minutes. How are we doing authentication here, and why?

**Answer:**
In our Next.js application, we are using **HttpOnly Session Cookies** instead of manual client-side JWT token storage.

Here is why Next.js authentication is designed differently and why session cookies are highly secure for this architecture.

#### 1. Why standard SPAs need Access/Refresh Tokens:
* In a decoupled setup (e.g. React running on `localhost:3000` and Express API running on `localhost:8000`), you are running cross-origin (CORS). Standard cookies are harder to pass securely across domains.
* Developers store **Access Tokens** (which expire in 15m) in browser memory, and **Refresh Tokens** (which last longer) inside a cookie or database to fetch new access tokens. This prevents attackers from stealing a long-lived key if your site is vulnerable to cross-site scripting (XSS).

#### 2. How we are doing it here (Session Cookies):
In Next.js, because your client-side React code and your server-side database actions run on the **same domain**, we can use browser cookies directly.
1. When you login, the server sets a cookie named `session_user` containing the user's ID.
2. The cookie is marked `httpOnly: true` (which blocks all JavaScript access; hackers cannot steal it via XSS) and `secure: true` (only sent over HTTPS).
3. The browser automatically attaches this cookie to every request—including page navigation, Server Actions, and Middleware.
4. We read this cookie server-side via `cookies().get("session_user")` and check it against the database.

#### 3. Why we don't need token refresh mechanics:
* Because the browser natively secures `httpOnly` cookies from XSS scripting, we do not need to constantly refresh short-lived keys. The browser handles token transmission, and we can set the cookie to expire in 7 days safely.

#### 4. The Production Standard (Auth.js / NextAuth)
For our database-backed authentication phase in production, we will use **Auth.js** (formerly NextAuth.js). 
* Auth.js automates this cookie strategy by signing, encrypting (using JWE - JSON Web Encryption), and rotating the session token in the cookie. This guarantees that clients cannot temper with or read the ID inside the cookie directly, providing production-ready security with zero manual cookie manipulation.


### Q10: Database Design: Junction Tables vs. Array Columns

**Question:**
In our database, we have 3 tables: `users`, `groups`, and `groupMembers`. Why do we have a separate table for members instead of just storing an array of member IDs in a column on the `groups` table?

**Answer:**
What you are describing (the `groupMembers` table) is called a **Junction Table** (or mapping table). It is used to create a **Many-to-Many relationship**, because:
- One **User** can belong to *many* Groups.
- One **Group** can have *many* Users.

While PostgreSQL *does* technically support storing arrays in a single column (e.g., `memberIds: [1, 5, 9]`), we use a separate `groupMembers` table for four critical reasons:

#### 1. Data Integrity (Foreign Keys)
If you store IDs in an array, the database doesn't actually "know" those numbers represent real users. With a junction table, we use **Foreign Keys**. This means the database strictly enforces that every member in a group actually exists in the `users` table. 
If a user deletes their account, the database can automatically remove them from all their groups using "Cascade Delete". You can't do this automatically with an array column.

#### 2. Query Performance
Imagine you have 10,000 groups, and you want to load the dashboard to show *only* the groups you belong to. 
- **With an Array:** The database has to scan through the array column of *every single group* to see if your ID is inside it. This is very slow without specialized JSONB/Array operators and indexing.
- **With a Junction Table:** The database creates an index on `userId`. It can instantly say, "User #5 is in Group A and Group B" without scanning the whole database. This makes our `innerJoin()` incredibly fast.

#### 3. Future-Proofing (Extensibility)
Right now, `groupMembers` only maps a User to a Group. But what if, later on, we want to add:
- **Roles:** Who is the Admin of the group vs a regular member?
- **Join Date:** When did a specific user join the group?
- **Nicknames:** Allowing users to have a specific nickname inside a specific group.
- With a junction table, we just add a new column (e.g., `role: text`). If we used an array of IDs, adding this metadata would become a nightmare.

#### 4. Relational Database Standards (Normalization)
In traditional SQL databases (unlike NoSQL databases like MongoDB), storing lists of things inside a single column violates a core principle called **First Normal Form (1NF)**. Keeping data flat and relational makes it infinitely easier to write complex SQL queries later, like calculating how much money a specific user owes across all their groups.


### Q11: Why do we separate Data Access (`src/lib/data/`) from Server Actions (`src/app/actions/`)?

#### 1. 🔒 Security (Public vs. Private Functions)
- **`src/app/actions/` (`"use server"`)**: Any exported function here is compiled by Next.js into a **public HTTP POST endpoint**. Anyone on the internet can inspect the Network tab and call this action via `cURL`, `Postman`, or browser devtools directly.
- **`src/lib/data/` (Plain TypeScript)**: Functions here are **private internal helper functions**. They cannot be called over HTTP by external users.
- **Security Rule**: Cached data getters (like `getGroupsForUser(userId: string)`) accept `userId` as a parameter. If placed inside a `"use server"` file, an attacker could send a POST payload with `{ userId: "victim_id" }` to steal another user's private data! Placed inside `src/lib/data/`, it is physically impossible for an external HTTP request to reach it directly.

#### 2. ⚡ Caching Mechanics (`"use cache"` vs `revalidateTag`)
- **Data Access Layer (`src/lib/data/`)**: Uses `"use cache"`, `cacheTag()`, and `cacheLife()`. It executes database queries and caches the output in server memory per `userId`. It accepts `userId` as a parameter and does NOT call `cookies()` directly inside the cached block.
- **Server Actions (`src/app/actions/`)**: Marked with `"use server"`. Reads `cookies()` to authenticate the caller, performs database mutations (INSERT/DELETE), and calls `revalidateTag("groups-" + userId, "hours")` to purge the cached data in `src/lib/data/`.

#### Summary Matrix

| Feature | `src/lib/data/` (Data Layer) | `src/app/actions/` (Server Actions) |
|---|---|---|
| **Directive** | `"use cache"` | `"use server"` |
| **Purpose** | Reading & Caching Data | Modifying Data & Auth Validation |
| **Exposure** | Private (Server-only internal) | Public (HTTP POST Endpoint) |
| **Accepts `userId` parameter?** | ✅ Safe (Private function) | ❌ Insecure (Can be spoofed by client) |
| **Accesses `cookies()` directly?** | ❌ No (Takes `userId` parameter) | ✅ Yes (To authenticate incoming caller) |
| **Cache Management** | Configures `cacheTag` / `cacheLife` | Triggers `revalidateTag()` |


### Q12: Is it a good idea to write standard server-side functions for data fetching, and why do Server Actions exist if standard functions are recommended?

#### 1. Why Standard Server Functions (`src/lib/data/`) are recommended for Data Fetching
- **Security by Default**: Standard server-side functions (plain TypeScript without `"use server"`) cannot be reached over HTTP by clients or attackers.
- **`"use cache"` Compatibility**: They accept clean arguments (like `userId`) without calling dynamic APIs (`cookies()`) inside the cached function, allowing Next.js 15+ to cache DB query results per user ID in server memory.
- **Reusability**: A single standard function like `getGroupsForUser(userId)` can be imported across Server Components, API routes, or background workers on the server without creating extra HTTP RPC overhead.

#### 2. Why Server Actions (`src/app/actions/`) exist
Server Actions exist specifically for **MUTATIONS (changing data from the browser UI)**:
- **Replacing REST API Routes**: Before Server Actions, every browser interaction (form submit, delete button click) required building an API route (`app/api/create-group/route.ts`) and writing manual `fetch('/api/create-group', { method: 'POST', body: ... })` calls.
- **Bridging Client & Server**: Server Actions allow a browser Client Component (like `<form action={createGroupAction}>`) to trigger server-side database mutations directly without writing REST API boilerplate.
- **Automatic UI Revalidation**: In a single round-trip, a Server Action can mutate the DB, call `revalidateTag()`, and trigger React to update affected Server Components on screen seamlessly.

#### Mental Model Analogy

| Layer | Analogy | Primary Goal | Calling Location |
|---|---|---|---|
| **Standard Server Functions (`src/lib/data/`)** | SQL Queries / DB Helpers | **READING** data safely | Server Components during HTML build |
| **Server Actions (`src/app/actions/`)** | REST API Endpoints (`POST`/`DELETE`) | **MUTATING** data from browser | Client Component Forms & Event Handlers |

---

### Q13: Can standard server functions be created in ANY folder, or only in `src/lib/`?

**ANY folder you want!** Next.js does not restrict standard server functions to `src/lib/`. 

You can organize your standard server functions anywhere:
- `src/lib/data/` (Centralized Data Access Layer)
- `src/db/queries/` (Database query files)
- `src/services/` (Business logic services)
- `src/app/(app)/groups/data.ts` (Colocated right next to the page using it)

#### 🛡️ Best Practice: Prevent Accidental Client Imports
Any TypeScript file **without `"use server"`** is a standard module. 
To ensure a team member or future you doesn't accidentally import a heavy server database function into a Client Component (`"use client"`), add `import "server-only";` at the top:

```typescript
import "server-only"; // Throws a build error if imported by a "use client" file!
import { cacheTag, cacheLife } from "next/cache";

export async function getGroupsForUser(userId: string) {
  "use cache";
  // ...
}
```
