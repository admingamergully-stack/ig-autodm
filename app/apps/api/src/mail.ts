// Transactional email via Brevo REST API (free 300/day).
// Secrets: BREVO_API_KEY, MAIL_FROM. Swappable later with zero code change.
export async function sendMail(
  env: { BREVO_API_KEY: string; MAIL_FROM: string },
  to: string,
  subject: string,
  html: string,
  text: string,
): Promise<void> {
  const res = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: { "Content-Type": "application/json", "api-key": env.BREVO_API_KEY },
    body: JSON.stringify({
      sender: { email: env.MAIL_FROM, name: "IG AutoDM" },
      to: [{ email: to }],
      subject,
      htmlContent: html,
      textContent: text,
    }),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`email send failed (${res.status}): ${body.slice(0, 160)}`);
  }
}

export function verifyEmailHtml(appBase: string, token: string, igUsername: string): { subject: string; html: string; text: string } {
  const url = `${appBase}/get-access?verify=${encodeURIComponent(token)}`;
  return {
    subject: "Verify your email — IG AutoDM access request",
    html: `<p>Hi,</p><p>You requested access for Instagram <b>@${igUsername}</b>.</p><p><a href="${url}">Click here to verify your email and accept the privacy policy</a>.</p><p>Privacy: ${appBase}/privacy</p>`,
    text: `You requested access for Instagram @${igUsername}.\nVerify here: ${url}\nPrivacy: ${appBase}/privacy`,
  };
}

export function approvalEmailHtml(appBase: string, igUsername: string): { subject: string; html: string; text: string } {
  return {
    subject: "You're approved — connect your Instagram",
    html: `<p>Hi,</p><p>Your request for Instagram <b>@${igUsername}</b> is approved.</p><p>Next: accept the Instagram tester invite in your IG app, then <a href="${appBase}/dashboard">connect your Instagram</a>.</p>`,
    text: `Your request for Instagram @${igUsername} is approved.\nAccept the tester invite in your IG app, then connect: ${appBase}/dashboard`,
  };
}
