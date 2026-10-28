import { createMiddleware } from "hono/factory";

// AES-GCM via WebCrypto (Workers + Node 18+). Key: 64 hex chars in ENCRYPTION_KEY.
async function importAes(hexKey: string) {
  const bytes = new Uint8Array((hexKey.match(/../g) ?? []).map((b) => parseInt(b, 16)));
  return crypto.subtle.importKey("raw", bytes.buffer as ArrayBuffer, "AES-GCM", false, [
    "encrypt",
    "decrypt",
  ]);
}

export async function encryptToken(plain: string, hexKey: string): Promise<string> {
  const key = await importAes(hexKey);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ct = new Uint8Array(
    await crypto.subtle.encrypt({ name: "AES-GCM", iv: iv.buffer as ArrayBuffer }, key, new TextEncoder().encode(plain)),
  );
  const out = new Uint8Array(12 + ct.byteLength);
  out.set(iv, 0);
  out.set(ct, 12);
  let s = "";
  for (const b of out) s += String.fromCharCode(b);
  return btoa(s);
}

export async function decryptToken(enc: string, hexKey: string): Promise<string> {
  const raw = Uint8Array.from(atob(enc), (c) => c.charCodeAt(0));
  const key = await importAes(hexKey);
  const pt = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: raw.slice(0, 12).buffer as ArrayBuffer },
    key,
    raw.slice(12).buffer as ArrayBuffer,
  );
  return new TextDecoder().decode(pt);
}

// HMAC-SHA256 hex, for signing OAuth state with META_APP_SECRET.
export async function hmacHex(data: string, secret: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = new Uint8Array(await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(data)));
  return [...sig].map((b) => b.toString(16).padStart(2, "0")).join("");
}

export function b64urlEncode(s: string): string {
  return btoa(s).replaceAll("+", "-").replaceAll("/", "_").replace(/=+$/, "");
}

export function b64urlDecode(s: string): string {
  return atob(s.replaceAll("-", "+").replaceAll("_", "/"));
}

export function randomHex(bytes = 24): string {
  const b = crypto.getRandomValues(new Uint8Array(bytes));
  return [...b].map((x) => x.toString(16).padStart(2, "0")).join("");
}

// Stateless OAuth state: { u: supabaseUserId, n: nonce, b: byok flag, s: hmac(u.n.b) }. No KV needed.
export async function makeState(supabaseUserId: string, appSecret: string, byok = false): Promise<string> {
  const n = b64urlEncode(String(Date.now())) + b64urlEncode(crypto.getRandomValues(new Uint8Array(6)).join(""));
  const flag = byok ? "1" : "0";
  const s = await hmacHex(`${supabaseUserId}.${n}.${flag}`, appSecret);
  return b64urlEncode(JSON.stringify({ u: supabaseUserId, n, b: flag, s }));
}

export async function verifyState(
  state: string,
  appSecret: string,
): Promise<{ userId: string; byok: boolean } | null> {
  try {
    const parsed = JSON.parse(b64urlDecode(state));
    const { u, n, s } = parsed;
    if (!u || !n || !s) return null;
    // Current format carries the flag; legacy states (pre-BYOK) verify as platform flow.
    for (const flag of [parsed.b ?? "0", "0"]) {
      const expect = await hmacHex(`${u}.${n}.${flag}`, appSecret);
      if (s === expect) return { userId: u as string, byok: flag === "1" };
    }
    return null;
  } catch {
    return null;
  }
}

export const requireEnv = createMiddleware(async (c, next) => {
  const env = c.env as Record<string, string | undefined>;
  for (const k of ["META_APP_ID", "META_APP_SECRET", "ENCRYPTION_KEY", "TURSO_DATABASE_URL"]) {
    if (!env[k]) return c.json({ error: `server misconfigured: ${k} missing` }, 500);
  }
  await next();
});
