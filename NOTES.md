# Next.js 16 Architectural Notes & Q&A

This document contains key technical concepts, security practices, and caching architectural decisions used in this repository for quick reference across projects.

---

## Architectural Q&A Notes

### Q: Why do we separate Data Access (`src/lib/data/`) from Server Actions (`src/app/actions/`)?

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

---

### Q: Is it a good idea to write standard server-side functions for data fetching, and why do Server Actions exist if standard functions are recommended?

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

### Q: Can standard server functions be created in ANY folder, or only in `src/lib/`?

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
