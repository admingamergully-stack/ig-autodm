// Cloudinary thumbnail cache. CLOUDINARY_URL=cloudinary://key:secret@cloud.
// If unset, callers fall back to Meta's own media URLs (no upload).
export async function cacheThumbnail(cloudinaryUrl: string | undefined, remoteUrl: string | undefined, publicId: string): Promise<string | undefined> {
  if (!remoteUrl) return undefined;
  if (!cloudinaryUrl) return remoteUrl;
  const m = cloudinaryUrl.match(/^cloudinary:\/\/([^:]+):([^@]+)@(.+)$/);
  if (!m) return remoteUrl;
  const [, apiKey, apiSecret, cloudName] = m;
  const timestamp = Math.floor(Date.now() / 1000);
  const toSign = `public_id=${publicId}&timestamp=${timestamp}${apiSecret}`;
  const digest = new Uint8Array(await crypto.subtle.digest("SHA-1", new TextEncoder().encode(toSign)));
  const signature = [...digest].map((b) => b.toString(16).padStart(2, "0")).join("");
  const form = new FormData();
  form.set("file", remoteUrl);
  form.set("public_id", publicId);
  form.set("timestamp", String(timestamp));
  form.set("api_key", apiKey);
  form.set("signature", signature);
  try {
    const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, { method: "POST", body: form });
    const json = (await res.json().catch(() => ({}))) as any;
    return json.secure_url ?? remoteUrl;
  } catch {
    return remoteUrl;
  }
}
