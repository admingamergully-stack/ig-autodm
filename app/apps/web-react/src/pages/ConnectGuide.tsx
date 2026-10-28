import { useState } from "react";
import { Header, Footer, DarkButton, Badge } from "../components/ui";
import { useRouter } from "../lib/router";
import { API_BASE } from "../lib/config";

function Copy({ text }: { text: string }) {
  const [done, setDone] = useState(false);
  return (
    <button
      onClick={() => {
        try {
          navigator.clipboard.writeText(text);
          setDone(true);
          setTimeout(() => setDone(false), 1200);
        } catch {
          /* manual copy fallback */
        }
      }}
      className="shrink-0 cursor-pointer rounded-[8px] border border-[#dddddd] bg-white px-3 py-1.5 text-[12px] font-medium text-[#181d26] hover:border-[#181d26]"
    >
      {done ? "Copied ✓" : "Copy"}
    </button>
  );
}

function Code({ text }: { text: string }) {
  return (
    <div className="mt-1.5 flex items-center gap-2">
      <code className="min-w-0 flex-1 truncate rounded-[6px] border border-[#dddddd] bg-white px-2.5 py-1.5 text-[12px] text-[#181d26]">
        {text}
      </code>
      <Copy text={text} />
    </div>
  );
}

function Step({ n, title, children }: { n: string; title: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-4 rounded-[16px] border border-[#dddddd] bg-white p-5 sm:p-6">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#181d26] text-[15px] font-semibold text-white">
        {n}
      </span>
      <div className="min-w-0 flex-1">
        <h3 className="text-[16px] font-semibold text-[#181d26]">{title}</h3>
        <div className="mt-2 text-[14px] leading-relaxed text-[#41454d]">{children}</div>
      </div>
    </div>
  );
}

export default function ConnectGuide() {
  const { navigate } = useRouter();
  const redirectUri = `${API_BASE}/connect/meta/callback`;
  const webhookUrl = `${API_BASE}/webhook/meta`;

  return (
    <div className="min-h-screen bg-white">
      <Header />
      <main className="mx-auto max-w-[800px] px-5 py-14 sm:px-8 sm:py-20">
        <div className="text-center">
          <Badge tone="mint">Setup guide</Badge>
          <h1 className="mt-5 text-[36px] leading-tight font-normal tracking-tight text-[#181d26]">
            How to connect your Instagram
          </h1>
          <p className="mx-auto mt-3 max-w-[560px] text-[16px] text-[#41454d]">
            Everyone connects through their own Meta app — your keys, your data, no approval queue.
            One-time setup (~15 min), then one tap to connect.
          </p>
        </div>

        <div className="mt-10 space-y-3.5">
          <Step n="1" title="Make your Instagram professional">
            <p>
              Instagram app → Settings → Account type → switch to <b>Business</b> or <b>Creator</b>
              (free). Personal accounts can't use any automation — Meta's rule, not ours. Account must be public.
            </p>
          </Step>
          <Step n="2" title="Create your Meta app">
            <p>
              <a href="https://developers.facebook.com/apps" target="_blank" rel="noreferrer" className="font-medium text-[#1b61c9] hover:underline">developers.facebook.com → Create App</a>:
              use case <b>Other</b>, type <b>Business</b>. Add the <b>Instagram</b> product with{" "}
              <b>API setup with Instagram login</b> (not Facebook login). As the app owner you never
              need a tester invite.
            </p>
          </Step>
          <Step n="3" title="Tick the 3 permissions">
            <p>
              Instagram → API setup → Permissions: <code>instagram_business_basic</code>,{" "}
              <code>instagram_business_manage_comments</code>, <code>instagram_business_manage_messages</code>.
            </p>
          </Step>
          <Step n="4" title="Paste our URLs into your app">
            <p>Business login settings → <b>OAuth redirect URIs</b>, add:</p>
            <Code text={redirectUri} />
            <p className="mt-2.5">Webhooks → <b>Callback URL</b>, add (subscribe to <b>comments</b>, plus <b>messages</b> + <b>messaging_postbacks</b> for follow-gate confirmations):</p>
            <Code text={webhookUrl} />
            <p className="mt-2.5">Verify Token → use your <b>personal token</b> from the dashboard (Advanced section generates one per user).</p>
          </Step>
          <Step n="5" title="Save your keys here, then connect">
            <p>
              Copy your <b>Instagram App ID + Secret</b> from Business login settings →{" "}
              <button onClick={() => navigate("/dashboard")} className="cursor-pointer font-medium text-[#1b61c9] hover:underline">dashboard</button>{" "}
              → your Meta app section → save keys → <b>Connect Instagram with my app</b> → approve →
              connected with an “own app” badge.
            </p>
          </Step>
          <Step n="6" title="Set messages, test">
            <p>
              Tap a post → fill trigger, reply, DM → Save → comment from another account → reply + DM
              arrive within ~1 minute.
            </p>
          </Step>
        </div>

        {/* TROUBLESHOOTING */}
        <h2 className="mt-12 text-[24px] font-normal tracking-tight text-[#181d26]">When it fails</h2>
        <div className="mt-5 overflow-hidden rounded-[16px] border border-[#dddddd]">
          {[
            ["Invalid redirect_uri", "The URI in your app doesn't match exactly. Re-copy from step 4 above (no trailing slash, https)."],
            ["Unsupported request (all API calls fail)", "Account isn't linked to your app: add it under Generate access tokens → Add account, accept any invite, retry."],
            ["Token expired", "Long-lived tokens last 60 days. Hit Reconnect Instagram on the dashboard for a fresh one."],
            ["No reply to a comment", "Check: automation ON, keyword matches (or empty), message box filled, comment isn't your own."],
          ].map(([e, f], i) => (
            <div key={i} className={`grid gap-1 px-5 py-4 text-[14px] sm:grid-cols-[220px_1fr] sm:gap-4 ${i > 0 ? "border-t border-[#dddddd]" : ""}`}>
              <p className="font-semibold text-[#181d26]">{e}</p>
              <p className="text-[#41454d]">{f}</p>
            </div>
          ))}
        </div>

        <div className="mt-10 text-center">
          <DarkButton href="/dashboard">Open dashboard</DarkButton>
          <p className="mt-4 text-[13px] text-[#41454d]">
            <a href="https://developers.facebook.com/apps" target="_blank" rel="noreferrer" className="font-medium text-[#1b61c9] hover:underline">Meta App Dashboard</a>
            {" · "}
            <a href="https://business.facebook.com/settings" target="_blank" rel="noreferrer" className="font-medium text-[#1b61c9] hover:underline">Business Settings</a>
          </p>
        </div>
      </main>
      <Footer />
    </div>
  );
}
