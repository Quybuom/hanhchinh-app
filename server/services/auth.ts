// Admin authentication service
// Requires ADMIN_PASSWORD environment variable to be set

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
  return password === ADMIN_PASSWORD;
}
