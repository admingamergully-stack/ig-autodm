import { useState } from "react";
import { Header, Footer, DarkButton, Badge } from "../components/ui";
import { useRouter, useQuery } from "../lib/router";
import { API_BASE } from "../lib/config";

export default function GetAccess() {
  const { navigate } = useRouter();
  const query = useQuery();
  const verified = query.get("verify");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [consent, setConsent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{ kind: "ok" | "err"; text: string } | null>(
    verified === "ok"
      ? { kind: "ok", text: "Email verified! We'll message you the moment you're approved." }
      : verified === "bad"
        ? { kind: "err", text: "That verification link is invalid or expired. Request again below." }
        : null,
  );

  async function submit() {
    setMsg(null);
    const u = username.replace(/^@/, "").trim();
    if (!/^[A-Za-z0-9._]{1,30}$/.test(u)) {
      setMsg({ kind: "err", text: "Enter a valid Instagram username (letters, numbers, . and _)." });
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setMsg({ kind: "err", text: "Enter a valid email address." });
      return;
    }
    if (!consent) {
      setMsg({ kind: "err", text: "Please accept the privacy policy first." });
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/access/request`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ igUsername: u, email: email.trim() }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j.error || "Request failed. Try again.");
      setMsg({ kind: "ok", text: `Request received for @${u}! Check ${email.trim()} for a verification link.` });
      setUsername("");
      setEmail("");
      setConsent(false);
    } catch (e: any) {
      setMsg({ kind: "err", text: e?.message || "Request failed. Try again." });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-white">
      <Header />
      <main className="mx-auto max-w-[560px] px-5 py-16 sm:px-8 sm:py-24">
        <div className="text-center">
          <Badge tone="yellow">Early access</Badge>
          <h1 className="mt-5 text-[36px] leading-tight font-normal tracking-tight text-[#181d26]">
            Get access for your Instagram
          </h1>
          <p className="mt-3 text-[16px] text-[#41454d]">
            Tell us your handle. We verify your email, approve you, then you connect in one tap.
          </p>
        </div>
        <div className="mt-8 rounded-[20px] border border-[#dddddd] bg-white p-6 shadow-sm sm:p-8">
          <label className="mb-1.5 block text-[13px] font-semibold text-[#181d26]" htmlFor="ga-user">
            Instagram username
          </label>
          <input
            id="ga-user"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="@your.handle"
            className="h-[44px] w-full rounded-[6px] border border-[#dddddd] bg-white px-3.5 text-[15px] text-[#181d26] placeholder:text-[#41454d]/60 focus:border-[#181d26] focus:outline-none"
          />
          <label className="mt-4 mb-1.5 block text-[13px] font-semibold text-[#181d26]" htmlFor="ga-email">
            Email
          </label>
          <input
            id="ga-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="h-[44px] w-full rounded-[6px] border border-[#dddddd] bg-white px-3.5 text-[15px] text-[#181d26] placeholder:text-[#41454d]/60 focus:border-[#181d26] focus:outline-none"
          />
          <label className="mt-4 flex cursor-pointer items-start gap-2.5 text-[13px] text-[#41454d]">
            <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-0.5 h-4 w-4 accent-[#181d26]" />
            <span>
              I accept the{" "}
              <button onClick={() => navigate("/privacy")} className="cursor-pointer font-medium text-[#1b61c9] hover:underline">
                privacy policy
              </button>{" "}
              and agree to be contacted about my request.
            </span>
          </label>
          {msg && (
            <div
              className={`mt-4 rounded-[10px] px-4 py-3 text-[13px] font-medium ${msg.kind === "ok" ? "bg-[#0a2e0e] text-white" : "bg-[#aa2d00] text-white"}`}
              role="status"
            >
              {msg.text}
            </div>
          )}
          <DarkButton className="mt-5 w-full" onClick={submit}>
            {loading ? "Sending…" : "Request access"}
          </DarkButton>
        </div>
        <p className="mt-6 text-center text-[13px] text-[#41454d]">
          How it works: request → verify email → we approve → connect Instagram. Usually within a day.
        </p>
      </main>
      <Footer />
    </div>
  );
}
