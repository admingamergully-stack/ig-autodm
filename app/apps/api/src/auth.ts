import { createMiddleware } from "hono/factory";

// Verifies the Supabase session by asking Supabase Auth who owns the token.
// No extra deps: one fetch, correct by construction.
export const requireUser = createMiddleware(async (c, next) => {
  const token = c.req.header("Authorization")?.replace(/^Bearer /i, "");
  if (!token) return c.json({ error: "missing token" }, 401);
  const env = c.env as { SUPABASE_URL: string; SUPABASE_ANON_KEY: string };
  const res = await fetch(`${env.SUPABASE_URL}/auth/v1/user`, {
    headers: { apikey: env.SUPABASE_ANON_KEY, Authorization: `Bearer ${token}` },
  });
  if (!res.ok) return c.json({ error: "invalid session" }, 401);
  c.set("user", await res.json());
  await next();
});
