// Import Next.js 15 cache utilities
import { cacheTag, cacheLife } from "next/cache";

// Import database client instance
import { db } from "@/lib/db/db";

// Import users schema definition
import { users } from "@/lib/db/schema";

// Import equality operator from Drizzle ORM
import { eq } from "drizzle-orm";

/**
 * getUserProfile — Cached Data Access Layer
 *
 * Retrieves the user profile details by ID and caches it per user ID.
 */
export async function getUserProfile(userId: string) {
  "use cache";
  cacheTag(`user-${userId}`);
  cacheLife("hours");

  const [user] = await db
    .select({
      id: users.id,
      firstName: users.firstName,
      lastName: users.lastName,
      email: users.email,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  return user || null;
}
