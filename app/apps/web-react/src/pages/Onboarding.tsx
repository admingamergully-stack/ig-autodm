import { useEffect, useState } from "react";
import { Header, Footer, DarkButton, Badge } from "../components/ui";
import { useAuth } from "../lib/auth";
import { api } from "../lib/api";
import { API_BASE } from "../lib/config";
import type { ByokChecks } from "../lib/api";

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
      className="min-h-[44px] shrink-0 cursor-pointer rounded-[8px] border border-[#dddddd] bg-white px-3 py-1.5 text-[12px] font-medium text-[#181d26] hover:border-[#181d26]"
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

function CheckRow({ ok, label, hint }: { ok: boolean | null; label: string; hint?: string }) {
  return (
    <div className="flex items-start gap-2.5 py-1.5">
      <span
        className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${
          ok === true ? "bg-[#0a2e0e]" : ok === false ? "bg-[#aa2d00]" : "bg-[#dddddd]"
        }`}
      >
        {ok === true && (
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>
        )}
        {ok === false && (
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12" /></svg>
        )}
      </span>
      <div className="min-w-0">
        <p className="text-[14px] font-medium text-[#181d26]">{label}</p>
        {hint && <p className="text-[13px] text-[#41454d]">{hint}</p>}
      </div>
    </div>
  );
}

function Help({ children }: { children: React.ReactNode }) {
  return (
    <details className="mt-3 rounded-[10px] bg-[#f8fafc] px-4 py-3">
      <summary className="cursor-pointer text-[13px] font-medium text-[#1b61c9]">Need help? →</summary>
      <div className="mt-2 space-y-1.5 text-[13px] leading-relaxed text-[#41454d]">{children}</div>
    </details>
  );
}

function TaskCard({
  title,
  children,
  done,
  action,
  compact,
  onExpand,
  help,
}: {
  title: string;
  children: React.ReactNode;
  done: boolean;
  action?: React.ReactNode;
  compact?: boolean;
  onExpand?: () => void;
  help?: React.ReactNode;
}) {
  if (compact) {
    return (
      <button
        onClick={onExpand}
        className="flex w-full cursor-pointer items-center gap-3 rounded-[16px] border border-[#dddddd] bg-white px-5 py-4 text-left"
      >
        <span
          className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${
            done ? "bg-[#0a2e0e]" : "bg-white ring-1 ring-[#dddddd]"
          }`}
        >
          {done && (
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>
          )}
        </span>
        <span className={`flex-1 text-[15px] ${done ? "text-[#41454d]" : "text-[#181d26] font-medium"}`}>{title}</span>
        <span className="text-[13px] text-[#41454d]">{done ? "Completed" : "Review →"}</span>
      </button>
    );
  }
  return (
    <div className={`rounded-[16px] border bg-white p-5 sm:p-6 ${done ? "border-[#006400]/40" : "border-[#dddddd]"}`}>
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-[16px] font-semibold text-[#181d26]">{title}</h3>
        {done && (
          <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-[#0a2e0e] px-2.5 py-1 text-[12px] font-medium text-white">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>
            Done
          </span>
        )}
      </div>
      <div className="mt-2 text-[14px] leading-relaxed text-[#41454d]">{children}</div>
      {help && <Help>{help}</Help>}
      {action && <div className="mt-4 flex flex-col gap-2.5 sm:flex-row sm:flex-wrap">{action}</div>}
    </div>
  );
}

function ExtButton({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="inline-flex min-h-[48px] w-full cursor-pointer items-center justify-center gap-2 rounded-[12px] border border-[#dddddd] bg-white px-5 py-3 text-[14px] font-medium text-[#181d26] transition-all duration-200 hover:border-[#181d26] sm:w-auto"
    >
      {children}
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" /><path d="M15 3h6v6" /><path d="M10 14 21 3" /></svg>
    </a>
  );
}

function ActionButton({ onClick, disabled, busy, busyLabel, children, primary }: {
  onClick: () => void;
  disabled?: boolean;
  busy?: boolean;
  busyLabel?: string;
  children: React.ReactNode;
  primary?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled || busy}
      className={`inline-flex min-h-[48px] w-full cursor-pointer items-center justify-center rounded-[12px] px-5 py-3 text-[14px] font-medium transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto ${
        primary ? "bg-[#181d26] text-white hover:bg-[#2a3140]" : "border border-[#dddddd] bg-white text-[#181d26] hover:border-[#181d26]"
      }`}
    >
      {busy ? busyLabel ?? "Checking…" : children}
    </button>
  );
}

const STEPS = [
  { n: 1, short: "Meta Setup", title: "Set up your Meta app", desc: "Create your own Meta app in 3 short tasks." },
  { n: 2, short: "App Connect", title: "Connect your Meta app", desc: "Add credentials, then copy two URLs into Meta." },
  { n: 3, short: "Authorize", title: "Authorize your Instagram", desc: "Link your account, accept the invite, connect." },
];

export default function Onboarding() {
  const { user, token, loading: authLoading } = useAuth();
  const [booting, setBooting] = useState(true);
  const [step, setStep] = useState(1);
  const [checks, setChecks] = useState<Record<string, boolean>>({});
  const [byokOn, setByokOn] = useState(false);
  const [verifyToken, setVerifyToken] = useState("");
  const [webhookVerified, setWebhookVerified] = useState(false);
  const [accounts, setAccounts] = useState<{ igUserId: string; username: string }[]>([]);
  const [appId, setAppId] = useState("");
  const [appSecret, setAppSecret] = useState("");
  const [busy, setBusy] = useState(false);
  const [checkRes, setCheckRes] = useState<{ ok: boolean; checks?: ByokChecks; appName?: string | null; warning?: string; error?: string } | null>(null);
  const [connecting, setConnecting] = useState(false);
  const [banner, setBanner] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);

  const redirectUri = `${API_BASE}/connect/meta/callback`;
  const webhookUrl = `${API_BASE}/webhook/meta`;

  async function persist(nextStep?: number, patch?: Record<string, boolean>) {
    if (!token) return;
    const merged = { ...checks, ...(patch ?? {}) };
    setChecks(merged);
    if (nextStep) setStep(nextStep);
    try {
      await api.onboardingSave(token, { step: nextStep ?? step, checks: patch });
    } catch {
      /* progress loss is non-fatal; server already had older state */
    }
  }

  async function refreshByok() {
    if (!token) return;
    try {
      const j = await api.byok(token);
      setByokOn(!!j.configured);
      if (j.verifyToken) setVerifyToken(j.verifyToken);
      setWebhookVerified(!!(j as any).webhookVerified);
    } catch {
      /* stays as-is on failure */
    }
  }

  useEffect(() => {
    if (authLoading) return;
    if (!user || !token) {
      navigate("/login");
      return;
    }
    (async () => {
      try {
        const [ob, acc] = await Promise.all([
          api.onboardingGet(token).catch(() => ({ step: 1, checks: {} })),
          api.accounts(token).catch(() => ({ accounts: [] })),
        ]);
        setChecks(ob.checks ?? {});
        setAccounts((acc.accounts ?? []).map((a: any) => ({ igUserId: a.igUserId, username: a.username })));
        await refreshByok();
        if ((acc.accounts ?? []).length > 0) {
          setStep(4);
        } else {
          setStep(Math.min(3, Math.max(1, ob.step || 1)));
        }
      } finally {
        setBooting(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, token]);

  async function handleSaveVerify() {
    if (!token) return;
    setBusy(true);
    setCheckRes(null);
    try {
      const r = await api.byokCheck(token, { igAppId: appId.trim(), igAppSecret: appSecret.trim() });
      setCheckRes(r);
      if (!r.ok) return;
      await api.saveByok(token, { igAppId: appId.trim(), igAppSecret: appSecret.trim() });
      setByokOn(true);
      setAppSecret("");
      await refreshByok();
    } catch (e: any) {
      setCheckRes({ ok: false, error: e?.message || "Couldn't verify. Try again." });
    } finally {
      setBusy(false);
    }
  }

  function goStep(n: number) {
    persist(n);
    window.scrollTo({ top: 0 });
  }

  async function handleConnect() {
    if (!token) return;
    setConnecting(true);
    try {
      const { url } = await api.connectUrlByok(token);
      window.location.href = url;
    } catch (e: any) {
      setBanner(e?.message || "Couldn't start Instagram connect.");
      setConnecting(false);
    }
  }

  async function refreshAll() {
    if (!token) return;
    try {
      const j = await api.byok(token);
      setByokOn(!!j.configured);
      if (j.verifyToken) setVerifyToken(j.verifyToken);
      setWebhookVerified(!!(j as any).webhookVerified);
    } catch {
      /* stays as-is on failure */
    }
  }

  function navigate(path: string) {
    window.location.href = path;
  }

  if (authLoading || booting) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-white px-5">
        <p className="text-[15px] text-[#41454d]">Loading your setup…</p>
      </div>
    );
  }

  const step1Done = !!(checks.devAccount && checks.appCreated && checks.permissions);
  const step2Done = byokOn && webhookVerified;
  const first = accounts[0];
  const step1Tasks = [
    { key: "devAccount", done: !!checks.devAccount },
    { key: "appCreated", done: !!checks.appCreated },
    { key: "permissions", done: !!checks.permissions },
  ];
  const nextTask = step1Tasks.find((t) => !t.done)?.key ?? null;

  return (
    <div className="min-h-screen bg-white">
      <Header cta={false} />
      <main className="mx-auto max-w-[720px] px-5 py-10 sm:px-8 sm:py-14">
        {/* progress: ● Meta Setup ── ○ App Connect ── ○ Authorize */}
        {step <= 3 && (
          <>
            <div className="flex items-start" aria-label="Onboarding progress">
              {STEPS.map((s, i) => {
                const done = step > s.n || (s.n === 1 && step1Done) || (s.n === 2 && step2Done);
                const current = step === s.n;
                return (
                  <div key={s.n} className="flex flex-1 items-start last:flex-none">
                    <div className="flex w-16 flex-col items-center gap-1.5 sm:w-20">
                      <span
                        className={`flex h-10 w-10 items-center justify-center rounded-full text-[15px] font-semibold sm:h-11 sm:w-11 ${
                          done
                            ? "bg-[#0a2e0e] text-white"
                            : current
                              ? "bg-[#181d26] text-white ring-4 ring-[#181d26]/10"
                              : "border border-[#dddddd] bg-white text-[#41454d]"
                        }`}
                      >
                        {done ? (
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>
                        ) : (
                          s.n
                        )}
                      </span>
                      <span className={`text-center text-[10px] leading-tight font-medium sm:text-[11px] ${current || done ? "text-[#181d26]" : "text-[#41454d]/60"}`}>
                        {current ? <b>{s.short}</b> : done ? `✓ ${s.short}` : s.short}
                      </span>
                    </div>
                    {i < STEPS.length - 1 && (
                      <div className={`mt-5 h-0.5 flex-1 sm:mt-[22px] ${step > s.n ? "bg-[#0a2e0e]" : "bg-[#dddddd]"}`} />
                    )}
                  </div>
                );
              })}
            </div>
            <p className="mt-5 text-center text-[13px] font-medium text-[#181d26]">Step {step} of 3</p>
            <p className="mt-1 text-center text-[12px] text-[#41454d]">
              📱 Leaving for Meta/Instagram? Keep this tab open — your progress is saved.
            </p>
          </>
        )}

        {banner && (
          <div className="mt-5 rounded-[14px] border border-[#aa2d00]/30 bg-white px-5 py-3.5 text-[14px] text-[#aa2d00]" role="alert">
            {banner}
          </div>
        )}

        {/* ============ STEP 1 ============ */}
        {step === 1 && (
          <div className="mt-6">
            <h1 className="text-[28px] leading-tight font-normal tracking-tight text-[#181d26]">Set up your Meta app</h1>
            <p className="mt-2 text-[15px] text-[#41454d]">Create your own Meta app in 3 short tasks.</p>
            <div className="mt-6 space-y-3.5">
              <TaskCard
                title="A. Developer account"
                done={!!checks.devAccount}
                compact={nextTask !== "devAccount" && (expanded === "devAccount" ? false : !!checks.devAccount || nextTask !== null)}
                onExpand={() => setExpanded(expanded === "devAccount" ? null : "devAccount")}
                help={<><p>Where: developers.facebook.com → Get Started (top-right).</p><p>Meta may ask for phone or ID verification — follow its prompts.</p><p>Common issue: use an account with real details, not a fresh empty one.</p></>}
                action={
                  <>
                    <ExtButton href="https://developers.facebook.com/">Open Meta Developer ↗</ExtButton>
                    <button
                      onClick={() => persist(undefined, { devAccount: !checks.devAccount })}
                      className="inline-flex min-h-[48px] w-full cursor-pointer items-center justify-center rounded-[12px] border border-[#dddddd] bg-white px-5 py-3 text-[14px] font-medium text-[#181d26] hover:border-[#181d26] sm:w-auto"
                    >
                      {checks.devAccount ? "✓ Done — undo" : "✓ Account created"}
                    </button>
                  </>
                }
              >
                <p>You need a Facebook/Meta account. Meta may ask for identity verification.</p>
              </TaskCard>
              <TaskCard
                title="B. Create the app"
                done={!!checks.appCreated}
                compact={expanded === "appCreated" ? false : !!checks.appCreated || (nextTask !== null && nextTask !== "appCreated")}
                onExpand={() => setExpanded(expanded === "appCreated" ? null : "appCreated")}
                help={<><p>Where: App Dashboard → Create App → name it → pick the Instagram use case.</p><p>If asked about a business portfolio, choose “not now” if shown.</p><p>Screens change often — the shape is always name → use case → create.</p></>}
                action={
                  <>
                    <ExtButton href="https://developers.facebook.com/apps">Open App Dashboard ↗</ExtButton>
                    <button
                      onClick={() => persist(undefined, { appCreated: !checks.appCreated })}
                      className="inline-flex min-h-[48px] w-full cursor-pointer items-center justify-center rounded-[12px] border border-[#dddddd] bg-white px-5 py-3 text-[14px] font-medium text-[#181d26] hover:border-[#181d26] sm:w-auto"
                    >
                      {checks.appCreated ? "✓ Done — undo" : "✓ App created"}
                    </button>
                  </>
                }
              >
                <p>Create an app, pick the Instagram use case, finish creating it.</p>
              </TaskCard>
              <TaskCard
                title="C. Messaging permissions"
                done={!!checks.permissions}
                compact={expanded === "permissions" ? false : !!checks.permissions || (nextTask !== null && nextTask !== "permissions")}
                onExpand={() => setExpanded(expanded === "permissions" ? null : "permissions")}
                help={<><p>Where: Use Cases → Instagram → Customize → add permissions.</p><p>You need: basic profile, manage comments, manage messages.</p><p>Common issue: adding only 1–2 of the three — all three are required.</p></>}
                action={
                  <>
                    <ExtButton href="https://developers.facebook.com/apps">Open Meta App ↗</ExtButton>
                    <button
                      onClick={() => persist(undefined, { permissions: !checks.permissions })}
                      className="inline-flex min-h-[48px] w-full cursor-pointer items-center justify-center rounded-[12px] border border-[#dddddd] bg-white px-5 py-3 text-[14px] font-medium text-[#181d26] hover:border-[#181d26] sm:w-auto"
                    >
                      {checks.permissions ? "✓ Done — undo" : "✓ Permissions added"}
                    </button>
                  </>
                }
              >
                <p>Use Cases → Instagram → Customize → add the messaging permissions.</p>
              </TaskCard>
            </div>
            <div className="mt-6">
              <DarkButton className={`w-full !py-4 text-center ${!step1Done ? "cursor-not-allowed opacity-50" : ""}`} onClick={() => step1Done && goStep(2)}>
                Continue to Step 2 →
              </DarkButton>
            </div>
            {!step1Done && (
              <p className="mt-3 text-center text-[13px] text-[#41454d]">Finish the tasks above to continue.</p>
            )}
          </div>
        )}

        {/* ============ STEP 2 ============ */}
        {step === 2 && (
          <div className="mt-6">
            <h1 className="text-[28px] leading-tight font-normal tracking-tight text-[#181d26]">Connect your Meta app</h1>
            <p className="mt-2 text-[15px] text-[#41454d]">Save credentials, then copy two URLs into Meta.</p>
            <div className="mt-6 space-y-3.5">
              <TaskCard
                title="1. App credentials"
                done={byokOn}
                action={
                  <button
                    onClick={async () => {
                      if (!token) return;
                      setBusy(true);
                      setCheckRes(null);
                      try {
                        const r = await api.byokCheck(token, { igAppId: appId.trim(), igAppSecret: appSecret.trim() });
                        setCheckRes(r);
                        if (!r.ok) return;
                        await api.saveByok(token, { igAppId: appId.trim(), igAppSecret: appSecret.trim() });
                        setByokOn(true);
                        setAppSecret("");
                        await refreshByok();
                      } catch (e: any) {
                        setCheckRes({ ok: false, error: e?.message || "Couldn't verify. Try again." });
                      } finally {
                        setBusy(false);
                      }
                    }}
                    disabled={busy || !appId.trim() || !appSecret.trim()}
                    className="inline-flex min-h-[48px] w-full cursor-pointer items-center justify-center rounded-[12px] bg-[#181d26] px-5 py-3 text-[14px] font-medium text-white hover:bg-[#2a3140] disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
                  >
                    {busy ? "Verifying…" : "Save & verify credentials"}
                  </button>
                }
                help={<><p>Where: your Meta app → Instagram → Business login settings.</p><p>🔒 We never ask for your Instagram password — only these two app values.</p><p>Common issue: ID and Secret from two different apps — they must be a pair.</p></>}
              >
                <p>
                  From Business login settings. We verify them with Meta instantly.
                </p>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <input
                    value={appId}
                    onChange={(e) => setAppId(e.target.value)}
                    placeholder="Meta App ID"
                    inputMode="numeric"
                    className="h-[44px] w-full rounded-[6px] border border-[#dddddd] bg-white px-3.5 text-[15px] text-[#181d26] placeholder:text-[#41454d]/60 focus:border-[#181d26] focus:outline-none"
                  />
                  <input
                    type="password"
                    value={appSecret}
                    onChange={(e) => setAppSecret(e.target.value)}
                    placeholder="Meta App Secret"
                    className="h-[44px] w-full rounded-[6px] border border-[#dddddd] bg-white px-3.5 text-[15px] text-[#181d26] placeholder:text-[#41454d]/60 focus:border-[#181d26] focus:outline-none"
                  />
                </div>
                {checkRes && (
                  <div className="mt-3 rounded-[10px] bg-[#f8fafc] px-4 py-3">
                    {checkRes.ok ? (
                      <>
                        <p className="text-[14px] font-medium text-[#006400]">
                          {checkRes.appName ? `Connected to “${checkRes.appName}”.` : "Format looks right."}{" "}
                          {byokOn ? "Saved ✓" : "Saving…"}
                        </p>
                        {checkRes.warning && (
                          <p className="mt-1 text-[13px] text-[#41454d]">{checkRes.warning}</p>
                        )}
                      </>
                    ) : (
                      <>
                        <p className="text-[14px] font-medium text-[#aa2d00]">{checkRes.error}</p>
                        <div className="mt-2 flex flex-wrap gap-2.5">
                          <ExtButton href="https://developers.facebook.com/apps">Open Meta</ExtButton>
                          <span className="self-center text-[13px] text-[#41454d]">Fix it there, then press Save & verify again.</span>
                        </div>
                      </>
                    )}
                    {checkRes.checks && (
                      <div className="mt-1">
                        <CheckRow ok={checkRes.checks.appIdValid} label="App ID valid" />
                        <CheckRow ok={checkRes.checks.secretValid} label="App Secret valid" />
                        <CheckRow
                          ok={checkRes.checks.accessible}
                          label="Meta app accessible"
                          hint={checkRes.checks.accessible === null ? "Confirms automatically at connect" : undefined}
                        />
                      </div>
                    )}
                  </div>
                )}
              </TaskCard>

              {!byokOn ? (
                <div className="rounded-[16px] border border-dashed border-[#dddddd] bg-white p-5 text-[14px] text-[#41454d]">
                  <p className="font-medium text-[#181d26]">2. Webhook — unlocks after credentials</p>
                  <p className="mt-1">Save verified credentials above and your personal URLs appear here.</p>
                </div>
              ) : (
                <TaskCard
                  title="2. Webhook"
                  done={webhookVerified}
                  action={
                    <button
                      onClick={async () => {
                        await refreshByok();
                        if (!webhookVerified) {
                          setBanner("Not verified yet — paste the URL + token into your Meta app's webhook settings, hit Verify there, then Check again.");
                        }
                      }}
                      className="inline-flex min-h-[48px] w-full cursor-pointer items-center justify-center rounded-[12px] border border-[#dddddd] bg-white px-5 py-3 text-[14px] font-medium text-[#181d26] hover:border-[#181d26] sm:w-auto"
                    >
                      Check webhook
                    </button>
                  }
                  help={<><p>Where: Meta app → Webhooks → callback URL field + Verify Token field.</p><p>After pasting, hit Verify inside Meta — we detect it here automatically.</p><p>Common issue: subscribing but never pressing Verify in Meta.</p></>}
                >
                  <p>Copy into your Meta app's webhook settings:</p>
                  <Code text={webhookUrl} />
                  <p className="mt-2.5">Verify token:</p>
                  <div className="mt-1.5 flex items-center gap-2">
                    <code className="min-w-0 flex-1 truncate rounded-[6px] border border-[#dddddd] bg-white px-2.5 py-1.5 text-[12px] text-[#181d26]">
                      {verifyToken ? "••••••••••••" : "…"}
                    </code>
                    {verifyToken ? <Copy text={verifyToken} /> : null}
                  </div>
                  <p className="mt-2.5">{webhookVerified ? "Verified ✓" : "We detect Meta's verification automatically."}</p>
                </TaskCard>
              )}

              {byokOn && webhookVerified && (
                <TaskCard
                  title="3. Redirect URL"
                  done={false}
                  help={<><p>Where: Instagram → Business login settings → OAuth redirect URIs.</p><p>Paste exactly — no trailing slash. We confirm it when you connect next.</p></>}
                >
                  <p>Add this exact URL to Instagram Business Login settings:</p>
                  <Code text={redirectUri} />
                </TaskCard>
              )}
            </div>
            <div className="mt-3 rounded-[12px] bg-[#f8fafc] px-4 py-3 text-[13px] text-[#41454d]">
              {byokOn ? "✓ Credentials verified" : "○ Credentials pending"}
              {" · "}
              {webhookVerified ? "✓ Webhook configured" : "○ Webhook pending"}
              {" · "}
              ○ Redirect URL — auto-checks at connect
            </div>
            <div className="mt-4 flex flex-col gap-3 sm:flex-row">
              <button
                onClick={() => goStep(1)}
                className="inline-flex min-h-[48px] cursor-pointer items-center justify-center rounded-[12px] border border-[#dddddd] bg-white px-6 py-4 text-[15px] font-medium text-[#181d26] hover:border-[#181d26]"
              >
                ← Back
              </button>
              <DarkButton className={`flex-1 !py-4 text-center ${!step2Done ? "cursor-not-allowed opacity-50" : ""}`} onClick={() => step2Done && goStep(3)}>
                Continue to Step 3 →
              </DarkButton>
            </div>
            {!step2Done && (
              <p className="mt-3 text-center text-[13px] text-[#41454d]">
                {!byokOn ? "Save verified credentials to unlock the next sections." : "Finish webhook verification to continue."}
              </p>
            )}
          </div>
        )}

        {/* ============ STEP 3 ============ */}
        {step === 3 && (
          <div className="mt-6">
            <h1 className="text-[28px] leading-tight font-normal tracking-tight text-[#181d26]">Authorize your Instagram</h1>
            <p className="mt-2 text-[15px] text-[#41454d]">Link your account, accept the invite, connect.</p>
            <div className="mt-6 space-y-3.5">
              <TaskCard
                title="A. Add your account to the app"
                done={!!checks.roleAdded}
                action={
                  <>
                    <ExtButton href="https://developers.facebook.com/apps">Open App Roles ↗</ExtButton>
                    <button
                      onClick={() => persist(undefined, { roleAdded: !checks.roleAdded })}
                      className="inline-flex min-h-[48px] w-full cursor-pointer items-center justify-center rounded-[12px] border border-[#dddddd] bg-white px-5 py-3 text-[14px] font-medium text-[#181d26] hover:border-[#181d26] sm:w-auto"
                    >
                      {checks.roleAdded ? "✓ Done — undo" : "Check app role"}
                    </button>
                  </>
                }
                help={<><p>Where: App Dashboard → App Roles → Roles → Add People.</p><p>Add the Facebook account you'll test with. The connect step proves it worked.</p></>}
              >
                <p>Add your Facebook account under App Roles → Roles → Add People.</p>
              </TaskCard>
              <TaskCard
                title="B. Accept the test invitation"
                done={!!checks.inviteAccepted}
                action={
                  <>
                    <ExtButton href="https://www.instagram.com/">Open Instagram.com ↗</ExtButton>
                    <button
                      onClick={() => persist(undefined, { inviteAccepted: !checks.inviteAccepted })}
                      className="inline-flex min-h-[48px] w-full cursor-pointer items-center justify-center rounded-[12px] border border-[#dddddd] bg-white px-5 py-3 text-[14px] font-medium text-[#181d26] hover:border-[#181d26] sm:w-auto"
                    >
                      {checks.inviteAccepted ? "✓ Done — undo" : "I accepted the invitation"}
                    </button>
                  </>
                }
                help={<><p>Where: Instagram → Settings → Apps and Websites → invites.</p><p>Android: open Instagram.com in Chrome — the invite often hides in the app. Keep this tab open.</p><p>Common issue: accepting with a different account than the one you added.</p></>}
              >
                <p>Accept the invite under Apps and Websites. Android: use Chrome, keep this tab open.</p>
              </TaskCard>
              <TaskCard
                title="C. Connect Instagram"
                done={false}
                action={
                  <button
                    onClick={handleConnect}
                    disabled={connecting}
                    className="inline-flex min-h-[48px] w-full cursor-pointer items-center justify-center rounded-[12px] bg-[#181d26] px-6 py-4 text-[15px] font-medium text-white hover:bg-[#2a3140] disabled:cursor-wait disabled:opacity-70 sm:w-auto"
                  >
                    {connecting ? "Opening…" : "Connect Instagram"}
                  </button>
                }
              >
                <p>Official Meta login — we verify account, permissions, and token automatically.</p>
              </TaskCard>
            </div>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <button
                onClick={() => goStep(2)}
                className="inline-flex min-h-[48px] cursor-pointer items-center justify-center rounded-[12px] border border-[#dddddd] bg-white px-6 py-4 text-[15px] font-medium text-[#181d26] hover:border-[#181d26]"
              >
                ← Back
              </button>
            </div>
          </div>
        )}

        {/* ============ SUCCESS ============ */}
        {step >= 4 && first && (
          <div className="mt-6 text-center">
            <p className="text-[52px]">🎉</p>
            <h1 className="mt-2 text-[32px] leading-tight font-normal tracking-tight text-[#181d26]">Instagram connected!</h1>
            <div className="mx-auto mt-6 max-w-[420px] rounded-[16px] border border-[#dddddd] bg-white p-6 text-left">
              <p className="text-[14px] text-[#41454d]">Instagram</p>
              <p className="text-[18px] font-semibold text-[#181d26]">@{first.username}</p>
              <div className="mt-4 space-y-2">
                <CheckRow ok={true} label="Meta app connected" />
                <CheckRow ok={step1Done || undefined} label="Permissions configured" hint={step1Done ? undefined : "Confirmed during setup"} />
                <CheckRow ok={webhookVerified || undefined} label="Webhook connected" hint={webhookVerified ? undefined : "Connect to verify live"} />
                <CheckRow ok={true} label="Instagram authorized" />
              </div>
              <p className="mt-4 text-[15px] font-medium text-[#181d26]">Automation is ready.</p>
            </div>
            <div className="mt-6">
              <DarkButton href="/dashboard">Create your first automation →</DarkButton>
            </div>
            <p className="mt-4 text-[13px] text-[#41454d]">
              Want to connect another account?{" "}
              <button onClick={() => goStep(3)} className="cursor-pointer font-medium text-[#1b61c9] hover:underline">
                Back to Step 3
              </button>
            </p>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
