// Build-time config. In production these are baked via env.
// Vite uses VITE_ prefix; we also accept PUBLIC_ for parity with the Astro brief.
function pick(...keys: string[]): string {
  for (const k of keys) {
    const v = (import.meta as any)?.env?.[k];
    if (typeof v === "string" && v.length > 0) return v;
  }
  return "";
}

export const SUPABASE_URL =
  pick("VITE_SUPABASE_URL", "PUBLIC_SUPABASE_URL", "VITE_PUBLIC_SUPABASE_URL") || "";

export const SUPABASE_ANON_KEY =
  pick("VITE_SUPABASE_ANON_KEY", "PUBLIC_SUPABASE_ANON_KEY", "VITE_PUBLIC_SUPABASE_ANON_KEY") || "";

export const API_BASE =
  pick("VITE_API_BASE", "PUBLIC_API_BASE", "VITE_PUBLIC_API_BASE") ||
  "https://ig-autodm-api.admingamergully.workers.dev";

export const hasSupabaseEnv = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);

export function apiHost(): string {
  try {
    return new URL(API_BASE).host;
  } catch {
    return API_BASE;
  }
}
