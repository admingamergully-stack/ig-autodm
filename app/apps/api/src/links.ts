import { and, eq } from "drizzle-orm";

const CODE_ABC = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

function randomCode(n = 6): string {
  const b = crypto.getRandomValues(new Uint8Array(n));
  let s = "";
  for (const x of b) s += CODE_ABC[x % CODE_ABC.length];
  return s;
}

// Find-or-create a tracked short link for (account, media, target).
export async function ensureLink(db: any, schema: any, accountId: number, mediaId: string | undefined, target: string) {
  const [existing] = await db
    .select()
    .from(schema.links)
    .where(and(eq(schema.links.accountId, accountId), eq(schema.links.target, target)));
  // Reuse per (account,target) so re-saves don't mint duplicates; media tracked separately below.
  if (existing) return existing;
  for (let i = 0; i < 5; i++) {
    const code = randomCode();
    try {
      const [row] = await db
        .insert(schema.links)
        .values({ accountId, mediaId, code, target, createdAt: new Date() })
        .returning();
      return row ?? { code };
    } catch {
      /* code collision → retry */
    }
  }
  throw new Error("could not mint link code");
}

export async function recordClick(db: any, schema: any, linkId: number) {
  await db.insert(schema.clicks).values({ linkId, createdAt: new Date() }).catch(() => {});
}

// Replace {link} (or append) with the tracked short URL.
export function renderLink(text: string, shortUrl: string | null): string {
  if (!shortUrl) return text;
  if (text.includes("{link}")) return text.replaceAll("{link}", shortUrl);
  return `${text}\n${shortUrl}`;
}
