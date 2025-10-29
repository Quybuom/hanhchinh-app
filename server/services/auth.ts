// Authentication service for both admin and staff
// Requires ADMIN_PASSWORD environment variable to be set

import bcrypt from "bcrypt";

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

if (!ADMIN_PASSWORD) {
  console.error("CRITICAL: ADMIN_PASSWORD environment variable is not set!");
  console.error("Please set ADMIN_PASSWORD in your Replit Secrets to enable admin authentication.");
}

export function verifyAdminPassword(password: string): boolean {
  if (!ADMIN_PASSWORD) {
    console.warn("Admin authentication attempted but ADMIN_PASSWORD is not configured");
    return false;
  }
  
  // Trim the stored password as well in case it has whitespace
  const trimmedAdminPassword = ADMIN_PASSWORD.trim();
  const isValid = password === trimmedAdminPassword;
  
  if (!isValid) {
    console.log("Password comparison failed");
    console.log(`Provided password length: ${password.length}`);
    console.log(`Stored password length: ${trimmedAdminPassword.length}`);
  }
  
  return isValid;
}

// Staff authentication helpers
const SALT_ROUNDS = 10;

export async function hashPassword(password: string): Promise<string> {
  return await bcrypt.hash(password, SALT_ROUNDS);
}

export async function verifyPassword(password: string, passwordHash: string): Promise<boolean> {
  return await bcrypt.compare(password, passwordHash);
}
