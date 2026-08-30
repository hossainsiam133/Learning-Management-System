/**
 * Get the Strapi API base URL
 * Uses NEXT_PUBLIC_STRAPI_URL env variable for production (Vercel)
 * Falls back to http://localhost:1337 for local development
 */
export function getStrapiUrl(): string {
  if (typeof window === "undefined") {
    // Server-side: use env var if available
    return process.env.NEXT_PUBLIC_STRAPI_URL ?? "http://localhost:1337";
  }
  // Client-side: always available
  return process.env.NEXT_PUBLIC_STRAPI_URL ?? "http://localhost:1337";
}

/**
 * Get the Strapi API endpoint URL
 * Example: getStrapiApiUrl("/courses") -> "https://backend.railway.app/api/courses"
 */
export function getStrapiApiUrl(path: string): string {
  const base = getStrapiUrl();
  const cleanBase = base.replace(/\/$/, "");
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  return `${cleanBase}/api${cleanPath}`;
}
