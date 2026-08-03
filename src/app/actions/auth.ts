"use server";

import crypto from "node:crypto";
import { cookies } from "next/headers";
import { db } from "@/lib/db/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

// Hashing a password using PBKDF2 (Password-Based Key Derivation Function 2)
function hashPassword(password: string): string {
  // Generate 16 bytes of cryptographically secure random data to use as a "salt"
  const salt = crypto.randomBytes(16).toString("hex");

  // Hash the password with the salt using SHA-512, running 10,000 iterations to make brute-forcing computationally expensive
  const hash = crypto.pbkdf2Sync(password, salt, 10000, 64, "sha512").toString("hex");

  // Return the salt and the hash joined by a colon. We need to store both to verify the password later
  return `${salt}:${hash}`;
}

// Verify password against stored hash
function verifyPassword(password: string, storedHash: string): boolean {
  try {
    // Split the stored string by the colon to separate the random salt from the hashed password
    const [salt, hash] = storedHash.split(":");
    if (!salt || !hash) return false;

    // Hash the incoming password using the exact same salt, iterations, and algorithm
    const testHash = crypto.pbkdf2Sync(password, salt, 10000, 64, "sha512").toString("hex");

    // Compare the newly generated hash with the stored hash. If they match, the password is correct
    return hash === testHash;
  } catch (err) {
    console.error("Password verification error:", err);
    return false;
  }
}

// Server Action for creating a new user account
export async function signUpAction(data: {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}) {
  try {
    const normalizedEmail = data.email.toLowerCase().trim();

    // checking whether user exist
    const existing = await db
      .select()                                   // Start a SELECT statement
      .from(users)                                // Select from the "users" table
      .where(eq(users.email, normalizedEmail))    // WHERE users.email is equal to the input email
      .limit(1);                                  // Stop searching after 1 match

    // If a user with that email already exists, return an error message
    if (existing.length > 0) {
      return { success: false, error: "Email is already registered" };
    }

    // Call our helper to hash the input password
    const passwordHash = hashPassword(data.password);

    // Query: INSERT INTO users (...) VALUES (...) RETURNING *
    const [newUser] = await db
      .insert(users)                              // Start an INSERT statement into "users" table
      .values({
        firstName: data.firstName.trim(),
        lastName: data.lastName.trim(),
        email: normalizedEmail,
        passwordHash,                             // Store the hashed string (salt + hash), never the raw text
      })
      .returning();                               // Instruct database to return the newly created row immediately

    // If the database insert failed or returned nothing, return an error
    if (!newUser) {
      return { success: false, error: "Failed to create user account" };
    }

    // Access the HTTP cookie jar for this request (next/headers)
    const cookieStore = await cookies();

    // Set a cookie in the user's browser named "session_user" containing the user's database ID
    cookieStore.set("session_user", newUser.id, {
      httpOnly: true,                             // Prevents client-side scripts (like XSS) from reading the cookie
      secure: process.env.NODE_ENV === "production", // Only send over HTTPS in production
      sameSite: "lax",                            // Protection against CSRF attacks
      maxAge: 60 * 60 * 24 * 7,                   // Keep session cookie valid for 7 days
      path: "/",                                  // Make the cookie accessible across all site paths
    });

    return { success: true };
  } catch (err: any) {
    if (err?.digest === "HANGING_PROMISE_REJECTION") throw err;
    console.error("SignUp Server Action Error:", err);
    return { success: false, error: "An unexpected error occurred. Please try again." };
  }
}

// Server Action for logging in a user
export async function loginAction(data: {
  email: string;
  password: string;
}) {
  try {
    const normalizedEmail = data.email.toLowerCase().trim();

    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, normalizedEmail))
      .limit(1);

    // If user not found, return a generic error (for security, don't reveal if the email was found or not)
    if (!user || !user.passwordHash) {
      return { success: false, error: "Invalid email address or password" };
    }

    // Verify if the input password matches the salt and hash stored in users.passwordHash
    const isPasswordValid = verifyPassword(data.password, user.passwordHash);
    if (!isPasswordValid) {
      return { success: false, error: "Invalid email address or password" };
    }

    // Access the HTTP cookie jar for this request
    const cookieStore = await cookies();

    // Write the "session_user" cookie to the client browser to keep them logged in
    cookieStore.set("session_user", user.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
    });

    return { success: true };
  } catch (err: any) {
    if (err?.digest === "HANGING_PROMISE_REJECTION") throw err;
    console.error("Login Server Action Error:", err);
    return { success: false, error: "An unexpected error occurred. Please try again." };
  }
}

// Server Action to log out the user
export async function logoutAction() {
  try {
    // Access the HTTP cookie jar
    const cookieStore = await cookies();

    // Delete the session cookie, causing the browser to clear it and logging the user out
    cookieStore.delete("session_user");
    return { success: true };
  } catch (err) {
    console.error("Logout Server Action Error:", err);
    return { success: false };
  }
}

// Server Action to retrieve the current logged in user details server-side
export async function getCurrentUserAction() {
  try {
    // Access the HTTP cookie jar
    const cookieStore = await cookies();

    // Read the user ID stored inside the "session_user" cookie
    const userId = cookieStore.get("session_user")?.value;

    // If the cookie is missing, the user is unauthenticated (return null)
    if (!userId) return null;

    // Query: SELECT * FROM users WHERE id = userId LIMIT 1
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    // If user record no longer exists in the DB, return null
    if (!user) return null;

    // Return the safe public profile details (exclude the password hash!)
    return {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      upiId: user.upiId,
      mobileNumber: user.mobileNumber,
    };
  } catch (err: any) {
    if (err?.digest === "HANGING_PROMISE_REJECTION") throw err;
    console.error("GetCurrentUser Action Error:", err);
    return null;
  }
}
