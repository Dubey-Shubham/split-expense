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
