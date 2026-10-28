import { useCallback, useEffect, useMemo, useState } from "react";
import { Logo } from "../components/ui";
import { useRouter } from "../lib/router";
import { useAuth } from "../lib/auth";
import { api, type Account, type MediaItem, type Stats } from "../lib/api";
import { API_BASE, apiHost, hasSupabaseEnv } from "../lib/config";

/* ---------- Demo data (used when signed out / API unreachable) ---------- */
const DEMO_ACCOUNTS: Account[] = [
  {
    igUserId: "demo_178414",
    username: "maya.makes",
    keyword: "GUIDE",
    dmEnabled: true,
    replyEnabled: true,
    tokenExpires: new Date(Date.now() + 42 * 864e5).toISOString(),
    defaultCommentReply: null,
    defaultDmText: null,
  },
];

const DEMO_MEDIA: MediaItem[] = [
  { mediaId: "m1", caption: "POV: you finally found a morning routine that sticks. Comment GUIDE and I'll DM you the free PDF with all 7 steps + my exact grocery list.", mediaType: "REEL", thumbnailUrl: "https://picsum.photos/seed/autodm1/300/300", permalink: "https://instagram.com/p/demo1", timestamp: new Date(Date.now() - 1 * 864e5).toISOString(), stats: { replies: 48, dms: 132 }, config: { keyword: "GUIDE", commentReply: "Sent! Check your DMs for the guide ✨", dmText: "Here's your free Starter Guide: maya.co/starter-guide — let me know which step helps most!", replyEnabled: true, dmEnabled: true } },
  { mediaId: "m2", caption: "What I eat in a day as a busy creator (high protein, 20-min meals). Full recipes in my story highlights!", mediaType: "CAROUSEL", thumbnailUrl: "https://picsum.photos/seed/autodm2/300/300", permalink: "https://instagram.com/p/demo2", timestamp: new Date(Date.now() - 3 * 864e5).toISOString(), stats: { replies: 21, dms: 64 }, config: { keyword: "MEALS", commentReply: "Just sent the recipes to your DMs!", dmText: "Here are all 5 recipes + grocery list: maya.co/meals", replyEnabled: true, dmEnabled: true } },
  { mediaId: "m3", caption: "I tried waking up at 5am for 30 days. Here's what actually happened (day 17 broke me).", mediaType: "REEL", thumbnailUrl: "https://picsum.photos/seed/autodm3/300/300", permalink: "https://instagram.com/p/demo3", timestamp: new Date(Date.now() - 5 * 864e5).toISOString(), stats: { replies: 0, dms: 0 }, config: null },
  { mediaId: "m4", caption: "My $29 preset pack is live — 12 presets I use on every single photo. Launch price ends Sunday.", mediaType: "IMAGE", thumbnailUrl: "https://picsum.photos/seed/autodm4/300/300", permalink: "https://instagram.com/p/demo4", timestamp: new Date(Date.now() - 8 * 864e5).toISOString(), stats: { replies: 35, dms: 89 }, config: { keyword: "PRESETS", commentReply: null, dmText: "Here's the launch link (40% off ends Sunday): maya.co/presets", replyEnabled: false, dmEnabled: true } },
  { mediaId: "m5", caption: "Rating every protein bar so you don't have to. #3 genuinely tastes like dessert.", mediaType: "REEL", thumbnailUrl: "https://picsum.photos/seed/autodm5/300/300", permalink: "https://instagram.com/p/demo5", timestamp: new Date(Date.now() - 12 * 864e5).toISOString(), stats: { replies: 0, dms: 0 }, config: null },
  { mediaId: "m6", caption: "Q&A: how I grew to 100k in 11 months with zero ads. Drop your questions below!", mediaType: "IMAGE", thumbnailUrl: "https://picsum.photos/seed/autodm6/300/300", permalink: "https://instagram.com/p/demo6", timestamp: new Date(Date.now() - 15 * 864e5).toISOString(), stats: { replies: 12, dms: 31 }, config: { keyword: "GROW", commentReply: "Love this question — sent you my playbook!", dmText: "My full 0→100k playbook: maya.co/grow — chapter 3 is the one nobody talks about.", replyEnabled: true, dmEnabled: true } },
  { mediaId: "m7", caption: "Behind the scenes: filming day for the new course. Launching next month!", mediaType: "REEL", thumbnailUrl: "https://picsum.photos/seed/autodm7/300/300", permalink: "https://instagram.com/p/demo7", timestamp: new Date(Date.now() - 20 * 864e5).toISOString(), stats: { replies: 0, dms: 0 }, config: null },
  { mediaId: "m8", caption: "Unpopular opinion: you don't need to post every day. You need THIS instead.", mediaType: "CAROUSEL", thumbnailUrl: "https://picsum.photos/seed/autodm8/300/300", permalink: "https://instagram.com/p/demo8", timestamp: new Date(Date.now() - 25 * 864e5).toISOString(), stats: { replies: 0, dms: 0 }, config: null },
];

const DEMO_STATS: Stats = { connectedAccounts: 1, activeConfigs: 3, dmsSent7d: 196, repliesSent7d: 69 };

function timeAgo(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso).getTime();
  const diff = Date.now() - d;
  const days = Math.floor(diff / 864e5);
  if (days <= 0) return "today";
  if (days === 1) return "yesterday";
  if (days < 7) return `${days}d ago`;
  if (days < 30) return `${Math.floor(days / 7)}w ago`;
  return new Date(iso).toLocaleDateString();
}

function tokenDaysLeft(iso: string | null): number | null {
  if (!iso) return null;
  return Math.ceil((new Date(iso).getTime() - Date.now()) / 864e5);
}

/* ---------- Bits ---------- */
function ApiPill({ ok }: { ok: boolean | null }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-[#dddddd] bg-white px-3 py-1.5 text-[12px] font-medium text-[#41454d]" title={API_BASE}>
      <span className={`h-2 w-2 rounded-full ${ok === false ? "bg-[#aa2d00]" : ok ? "bg-[#006400]" : "bg-[#dddddd]"}`} />
      API<span className="hidden min-[420px]:inline">&nbsp;· {apiHost()}</span>
    </span>
  );
}

function BigSwitch({ on, onToggle, disabled }: { on: boolean; onToggle: () => void; disabled?: boolean }) {
  return (
    <button
      onClick={onToggle}
      disabled={disabled}
      role="switch"
      aria-checked={on}
      aria-label="Automation on or off"
      className={`relative h-[44px] w-[84px] shrink-0 cursor-pointer rounded-full transition-colors duration-200 disabled:cursor-wait disabled:opacity-60 ${on ? "bg-[#2f7a3d]" : "bg-white/25"}`}
      style={{ boxShadow: "inset 0 0 0 2px rgba(255,255,255,0.35)" }}
    >
      <span
        className="switch-thumb absolute top-[5px] left-[5px] flex h-[34px] w-[34px] items-center justify-center rounded-full bg-white shadow"
        style={{ transform: on ? "translateX(40px)" : "translateX(0)" }}
      >
        {on ? (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#006400" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>
        ) : (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#41454d" strokeWidth="2.5" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12" /></svg>
        )}
      </span>
      <span className={`absolute top-1/2 -translate-y-1/2 text-[11px] font-bold ${on ? "left-3.5 text-white" : "right-3 text-white/90"}`}>
        {on ? "ON" : "OFF"}
      </span>
    </button>
  );
}

/* ---------- Page ---------- */
export default function Dashboard() {
  const { navigate } = useRouter();
  const { user, token, loading: authLoading, signOut } = useAuth();

  const [accounts, setAccounts] = useState<Account[]>([]);
  const [activeId, setActiveId] = useState<string>("");
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [selectedId, setSelectedId] = useState<string>("");
  const [booting, setBooting] = useState(true);
  const [mediaLoading, setMediaLoading] = useState(false);
  const [demoMode, setDemoMode] = useState(false);
  const [apiOk, setApiOk] = useState<boolean | null>(null);
  const [banner, setBanner] = useState<string>("");
  const [toggling, setToggling] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [byokOn, setByokOn] = useState(false);
  const [byokAppId, setByokAppId] = useState("");
  const [byokSecret, setByokSecret] = useState("");
  const [byokVerify, setByokVerify] = useState("");
  const [byokMsg, setByokMsg] = useState<{ kind: "ok" | "err"; text: string } | null>(null);
  const [byokSaving, setByokSaving] = useState(false);

  // Editor state
  const [keyword, setKeyword] = useState("");
  const [reply, setReply] = useState("");
  const [dm, setDm] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [gate, setGate] = useState(false);
  const [track, setTrack] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState<{ kind: "ok" | "err"; text: string } | null>(null);

  const active = useMemo(() => accounts.find((a) => a.igUserId === activeId) ?? null, [accounts, activeId]);
  const selected = useMemo(() => media.find((m) => m.mediaId === selectedId) ?? null, [media, selectedId]);
  const automationOn = active ? active.dmEnabled || active.replyEnabled : false;

  /* Session guard */
  useEffect(() => {
    if (!authLoading && !user && hasSupabaseEnv) {
      navigate("/login");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, user]);

  /* Health ping */
  useEffect(() => {
    api.health().then(() => setApiOk(true)).catch(() => setApiOk(false));
  }, []);

  /* Boot: accounts + stats */
  const boot = useCallback(async () => {
    // No session → demo mode (also covers missing env)
    if (!token) {
      setDemoMode(true);
      setAccounts(DEMO_ACCOUNTS);
      setActiveId(DEMO_ACCOUNTS[0].igUserId);
      setStats(DEMO_STATS);
      setMedia(DEMO_MEDIA);
      setSelectedId(DEMO_MEDIA[0].mediaId);
      setBooting(false);
      return;
    }
    setBooting(true);
    setBanner("");
    try {
      const [accRes, statsRes] = await Promise.all([api.accounts(token), api.stats(token).catch(() => null)]);
      if (!accRes.accounts || accRes.accounts.length === 0) {
        setAccounts([]);
        setStats(statsRes);
        setDemoMode(false);
      } else {
        setAccounts(accRes.accounts);
        setActiveId((prev) => (accRes.accounts.some((a) => a.igUserId === prev) ? prev : accRes.accounts[0].igUserId));
        setStats(statsRes);
        setDemoMode(false);
      }
      setApiOk(true);
    } catch (e: any) {
      // Fall back to demo so the UI is never a dead end
      setDemoMode(true);
      setAccounts(DEMO_ACCOUNTS);
      setActiveId(DEMO_ACCOUNTS[0].igUserId);
      setStats(DEMO_STATS);
      setMedia(DEMO_MEDIA);
      setSelectedId(DEMO_MEDIA[0].mediaId);
      setBanner(e?.message || "Couldn't reach the API — showing demo data.");
      setApiOk(false);
    } finally {
      setBooting(false);
    }
  }, [token]);

  useEffect(() => {
    if (!authLoading) boot();
  }, [authLoading, boot]);

  /* Load media when account changes (live mode) */
  useEffect(() => {
    if (!token || !activeId || demoMode) return;
    let cancelled = false;
    (async () => {
      setMediaLoading(true);
      try {
        const res = await api.media(token, activeId);
        if (cancelled) return;
        setMedia(res.media || []);
        setSelectedId((prev) => {
          if (res.media?.some((m) => m.mediaId === prev)) return prev;
          return res.media?.[0]?.mediaId || "";
        });
      } catch (e: any) {
        if (!cancelled) setBanner(e?.message || "Couldn't load your posts.");
      } finally {
        if (!cancelled) setMediaLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [token, activeId, demoMode]);

  /* Load BYOK status (logged-in users only) */
  useEffect(() => {
    if (!token || demoMode) return;
    (async () => {
      try {
        const j = await api.byok(token);
        setByokOn(!!j.configured);
        if (j.verifyToken) setByokVerify(j.verifyToken);
      } catch {
        /* section stays hidden on failure */
      }
    })();
  }, [token, demoMode]);

  function copyText(t: string) {
    try {
      navigator.clipboard.writeText(t);
    } catch {
      /* clipboard unavailable — user copies manually */
    }
  }

  async function handleByokSave() {
    if (!token) return;
    setByokSaving(true);
    setByokMsg(null);
    try {
      await api.saveByok(token, { igAppId: byokAppId.trim(), igAppSecret: byokSecret.trim() });
      setByokOn(true);
      setByokAppId("");
      setByokSecret("");
      const j = await api.byok(token).catch(() => null);
      if (j?.verifyToken) setByokVerify(j.verifyToken);
      setByokMsg({ kind: "ok", text: "Saved — your app is linked. Finish the 3 Meta steps below, then connect." });
    } catch (e: any) {
      setByokMsg({ kind: "err", text: e?.message || "Couldn't save. Check the App ID format." });
    } finally {
      setByokSaving(false);
    }
  }

  async function handleByokRemove() {
    if (!token) return;
    try {
      await api.removeByok(token);
      setByokOn(false);
      setByokMsg({ kind: "ok", text: "Removed — connecting now uses the shared app." });
    } catch (e: any) {
      setByokMsg({ kind: "err", text: e?.message || "Couldn't remove." });
    }
  }

  async function handleByokConnect() {
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

  /* Sync editor when selection changes */
  useEffect(() => {
    if (!selected) {
      setKeyword("");
      setReply("");
      setDm("");
      setLinkUrl("");
      setGate(false);
      setTrack(false);
      return;
    }
    setKeyword(selected.config?.keyword || "");
    setReply(selected.config?.commentReply || "");
    setDm(selected.config?.dmText || "");
    setLinkUrl(selected.config?.linkUrl || "");
    setGate(!!selected.config?.followGate);
    setTrack(!!selected.config?.linkTrack);
    setSaveMsg(null);
  }, [selectedId]); // eslint-disable-line react-hooks/exhaustive-deps

  /* Actions: BYOK-only connect (own Meta app required — see Advanced below) */
  async function handleConnect() {
    if (demoMode || !token) {
      setBanner("Demo mode — sign in to connect your real Instagram account.");
      return;
    }
    // First-time (no accounts yet): guided 3-step wizard. Reconnect: direct.
    if (accounts.length === 0) {
      navigate("/onboarding");
      return;
    }
    if (!byokOn) {
      setBanner("Save your App ID + Secret in the Advanced section below first — connecting needs your own Meta app.");
      document.getElementById("byok-advanced")?.scrollIntoView({ behavior: "smooth" });
      return;
    }
    setConnecting(true);
    setBanner("");
    try {
      const { url } = await api.connectUrlByok(token);
      window.location.href = url;
    } catch (e: any) {
      setBanner(e?.message || "Couldn't start Instagram connect.");
      setConnecting(false);
    }
  }

  async function handleToggleAutomation() {
    if (!active) return;
    if (demoMode) {
      const next = !automationOn;
      setAccounts((prev) => prev.map((a) => (a.igUserId === active.igUserId ? { ...a, dmEnabled: next, replyEnabled: next } : a)));
      return;
    }
    if (!token) return;
    setToggling(true);
    try {
      const next = !automationOn;
      const res = await api.updateDefaults(token, active.igUserId, { dmEnabled: next, replyEnabled: next });
      const updated = (res as any)?.account ?? { ...active, dmEnabled: next, replyEnabled: next };
      setAccounts((prev) => prev.map((a) => (a.igUserId === active.igUserId ? { ...a, ...updated } : a)));
    } catch (e: any) {
      setBanner(e?.message || "Couldn't update automation.");
    } finally {
      setToggling(false);
    }
  }

  async function handleSave() {
    if (!selected || !active) return;
    setSaving(true);
    setSaveMsg(null);
    const k = keyword.trim();
    const r = reply.trim();
    const d = dm.trim();
    const l = linkUrl.trim();
    if (demoMode) {
      await new Promise((res) => setTimeout(res, 500));
      setMedia((prev) =>
        prev.map((m) =>
          m.mediaId === selected.mediaId
            ? { ...m, config: { keyword: k || null, commentReply: r || null, dmText: d || null, replyEnabled: r.length > 0, dmEnabled: d.length > 0, linkUrl: l || null, followGate: gate, linkTrack: track } }
            : m
        )
      );
      setSaveMsg({ kind: "ok", text: r || d ? "Saved — this post will reply automatically." : "Saved — nothing will be sent for this post (both boxes empty)." });
      setSaving(false);
      return;
    }
    if (!token) return;
    try {
      await api.saveMediaConfig(token, {
        igUserId: active.igUserId,
        mediaId: selected.mediaId,
        keyword: k || null,
        commentReply: r || null,
        dmText: d || null,
        replyEnabled: r.length > 0,
        dmEnabled: d.length > 0,
        linkUrl: l || null,
        followGate: gate,
        linkTrack: track,
      });
      setMedia((prev) =>
        prev.map((m) =>
          m.mediaId === selected.mediaId
            ? { ...m, config: { keyword: k || null, commentReply: r || null, dmText: d || null, replyEnabled: r.length > 0, dmEnabled: d.length > 0, linkUrl: l || null, followGate: gate, linkTrack: track } }
            : m
        )
      );
      // refresh stats (counts may change)
      api.stats(token).then(setStats).catch(() => {});
      setSaveMsg({ kind: "ok", text: r || d ? "Saved — this post will reply automatically." : "Saved — nothing will be sent for this post (both boxes empty)." });
    } catch (e: any) {
      setSaveMsg({ kind: "err", text: e?.message || "Couldn't save. Try again." });
    } finally {
      setSaving(false);
    }
  }

  async function handleRemove() {
    if (!selected || !active) return;
    setSaving(true);
    setSaveMsg(null);
    if (demoMode) {
      await new Promise((res) => setTimeout(res, 400));
      setMedia((prev) => prev.map((m) => (m.mediaId === selected.mediaId ? { ...m, config: null } : m)));
      setKeyword("");
      setReply("");
      setDm("");
      setLinkUrl("");
      setGate(false);
      setTrack(false);
      setSaveMsg({ kind: "ok", text: "Removed — this post won't reply." });
      setSaving(false);
      return;
    }
    if (!token) return;
    try {
      await api.clearMediaConfig(token, active.igUserId, selected.mediaId);
      setMedia((prev) => prev.map((m) => (m.mediaId === selected.mediaId ? { ...m, config: null } : m)));
      setKeyword("");
      setReply("");
      setDm("");
      setLinkUrl("");
      setGate(false);
      setTrack(false);
      api.stats(token).then(setStats).catch(() => {});
      setSaveMsg({ kind: "ok", text: "Removed — this post won't reply." });
    } catch (e: any) {
      setSaveMsg({ kind: "err", text: e?.message || "Couldn't remove. Try again." });
    } finally {
      setSaving(false);
    }
  }

  async function handleLogout() {
    await signOut();
    navigate("/login");
  }

  async function handleDisconnect() {
    if (!active || !token || demoMode) return;
    if (!window.confirm(`Disconnect @${active.username}? This stops all automation and deletes its messages, settings, and history.`)) return;
    try {
      const res = await fetch(`${API_BASE}/accounts/${encodeURIComponent(active.igUserId)}/disconnect`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Disconnect failed.");
      setSelectedId("");
      setMedia([]);
      await boot();
    } catch (e: any) {
      setBanner(e?.message || "Couldn't disconnect.");
    }
  }

  if (authLoading || (hasSupabaseEnv && !user && !demoMode && booting)) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#f8fafc]">
        <Logo />
        <p className="mt-5 text-[15px] text-[#41454d]">Loading your dashboard…</p>
      </div>
    );
  }

  const daysLeft = tokenDaysLeft(active?.tokenExpires ?? null);
  const hasCustom = (m: MediaItem) => Boolean(m.config && (m.config.commentReply || m.config.dmText));

  return (
    <div className="min-h-screen bg-[#f8fafc]">
      {/* Top bar */}
      <header className="sticky top-0 z-40 border-b border-[#dddddd] bg-white">
        <div className="mx-auto flex h-[64px] max-w-[1280px] items-center justify-between gap-3 px-5 sm:px-8">
          <button onClick={() => navigate("/")} className="cursor-pointer" aria-label="AutoDM home">
            <Logo />
          </button>
          <div className="flex items-center gap-2.5">
            <span className="hidden text-[13px] text-[#41454d] sm:block">{user?.email || (demoMode ? "demo@autodm.app" : "")}</span>
            <ApiPill ok={apiOk} />
            <button onClick={handleLogout} className="cursor-pointer rounded-[10px] border border-[#dddddd] px-3.5 py-2 text-[13px] font-medium text-[#41454d] transition-colors duration-200 hover:border-[#181d26] hover:text-[#181d26]">
              Log out
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1280px] px-5 py-8 sm:px-8">
        {demoMode && (
          <div className="mb-5 flex flex-col items-start justify-between gap-3 rounded-[14px] border border-[#e5c04a] bg-[#f4d35e] px-5 py-3.5 text-[14px] text-[#181d26] sm:flex-row sm:items-center">
            <span>
              <span className="font-semibold">You're viewing demo data.</span>{" "}
              {hasSupabaseEnv ? "Sign in and connect Instagram to manage your real posts." : "Sign-in isn't configured in this build."}
            </span>
            <button onClick={() => navigate("/login")} className="shrink-0 cursor-pointer rounded-[10px] bg-[#181d26] px-4 py-2 text-[13px] font-medium text-white transition-all duration-200 hover:bg-[#2a3140]">
              Sign in
            </button>
          </div>
        )}

        {banner && !demoMode && (
          <div className="mb-5 rounded-[14px] border border-[#aa2d00]/30 bg-white px-5 py-3.5 text-[14px] text-[#aa2d00]" role="alert">
            {banner}
          </div>
        )}
        {banner && demoMode && banner !== "Demo mode — sign in to connect your real Instagram account." && (
          <div className="mb-5 rounded-[14px] border border-[#aa2d00]/30 bg-white px-5 py-3.5 text-[14px] text-[#aa2d00]" role="alert">
            {banner}
          </div>
        )}

        {booting ? (
          <div className="space-y-5">
            <div className="h-[220px] animate-pulse rounded-[24px] bg-[#0a2e0e]/10" />
            <div className="h-[300px] animate-pulse rounded-[24px] bg-white" />
          </div>
        ) : accounts.length === 0 ? (
          /* ---- No accounts: connect state ---- */
          <div className="overflow-hidden rounded-[24px] bg-[#0a2e0e] p-8 text-center sm:p-14">
            <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-1.5 text-[13px] font-medium text-white">
              <span className="h-2 w-2 rounded-full bg-[#f4d35e]" /> No Instagram connected yet
            </span>
            <h1 className="mx-auto mt-5 max-w-[520px] text-[30px] leading-tight font-normal tracking-tight text-white">
              Connect your Instagram to start auto-replying
            </h1>
            <p className="mx-auto mt-3 max-w-[440px] text-[15px] text-white/80">
              You'll log in through Meta's official screen. We only read comments on your posts and send the replies you write.
            </p>
            <button
              onClick={handleConnect}
              disabled={connecting}
              className="mt-7 cursor-pointer rounded-[12px] bg-white px-7 py-4 text-[15px] font-medium text-[#181d26] transition-all duration-200 hover:shadow-xl active:scale-[0.98] disabled:cursor-wait disabled:opacity-70"
            >
              {connecting ? "Opening Meta login…" : "Connect Instagram"}
            </button>
            <p className="mt-4 text-[13px] text-white/60">Needs a Creator or Business account · Takes ~1 minute</p>
          </div>
        ) : (
          <>
            {/* Account picker — only when >1 */}
            {accounts.length > 1 && (
              <div className="mb-5 flex flex-wrap items-center gap-2">
                <span className="mr-1 text-[13px] font-medium text-[#41454d]">Account:</span>
                {accounts.map((a) => (
                  <button
                    key={a.igUserId}
                    onClick={() => setActiveId(a.igUserId)}
                    className={`cursor-pointer rounded-full px-4 py-2 text-[13px] font-medium transition-all duration-200 ${
                      a.igUserId === activeId
                        ? "bg-[#181d26] text-white"
                        : "border border-[#dddddd] bg-white text-[#41454d] hover:border-[#181d26]"
                    }`}
                  >
                    @{a.username}
                  </button>
                ))}
              </div>
            )}

            {/* ===== 1. STATUS CARD (forest) ===== */}
            <section className="overflow-hidden rounded-[24px] bg-[#0a2e0e] p-6 sm:p-8">
              <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <span className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-[15px] font-bold text-[#0a2e0e]">
                      {(active?.username || "?").slice(0, 1).toUpperCase()}
                    </span>
                    <div>
                      <p className="flex items-center gap-2 text-[19px] font-semibold text-white">
                        @{active?.username}
                        <span className="inline-flex items-center gap-1 rounded-full bg-white/15 px-2.5 py-1 text-[12px] font-medium text-white">
                          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>
                          Connected
                        </span>
                        {active?.viaByok && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-[#f4d35e] px-2.5 py-1 text-[12px] font-semibold text-[#181d26]" title="Connected through your own Meta app">
                            own app
                          </span>
                        )}
                      </p>
                      <p className="text-[13px] text-white/70">
                        {automationOn ? "Automation is on — new comments get replies." : "Automation is off — nothing is being sent."}
                      </p>
                    </div>
                  </div>
                  <div className="mt-5 flex flex-wrap gap-2.5">
                    <span className="inline-flex items-center gap-2 rounded-full bg-[#2f7a3d] px-4 py-2 text-[13px] font-semibold text-white">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 11.5a8.4 8.4 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.4 8.4 0 0 1-3.8-.9L3 21l1.9-5.7a8.4 8.4 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.4 8.4 0 0 1 3.8-.9h.5a8.5 8.5 0 0 1 8 8v.5Z" /></svg>
                      {stats?.repliesSent7d ?? 0} replies · last 7 days
                    </span>
                    <span className="inline-flex items-center gap-2 rounded-full bg-[#f5e9d4] px-4 py-2 text-[13px] font-semibold text-[#181d26]">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 2 11 13" /><path d="M22 2 15 22l-4-9-9-4 20-7z" /></svg>
                      {stats?.dmsSent7d ?? 0} DMs · last 7 days
                    </span>
                  </div>
                </div>
                <div className="flex flex-col items-start gap-4 lg:items-end">
                  <div className="flex items-center gap-3">
                    <span className="text-[14px] font-medium text-white/85">Automation</span>
                    <BigSwitch on={automationOn} onToggle={handleToggleAutomation} disabled={toggling} />
                  </div>
                  <button
                    onClick={handleConnect}
                    disabled={connecting}
                    className="cursor-pointer rounded-[12px] border border-white/40 bg-transparent px-5 py-3 text-[14px] font-medium text-white transition-all duration-200 hover:bg-white hover:text-[#181d26] disabled:cursor-wait disabled:opacity-60"
                  >
                    {connecting ? "Opening…" : demoMode ? "Connect Instagram" : "Reconnect Instagram"}
                    </button>
                    {!demoMode && (
                      <button
                        onClick={handleDisconnect}
                        className="cursor-pointer rounded-[12px] border border-white/25 bg-transparent px-5 py-3 text-[14px] font-medium text-white/70 transition-all duration-200 hover:border-white/60 hover:text-white"
                      >
                        Disconnect
                      </button>
                    )}
                </div>
              </div>

              {/* connect banners */}
              {!automationOn && (
                <div className="mt-6 rounded-[14px] bg-[#f4d35e] px-5 py-3.5 text-[14px] font-medium text-[#181d26]">
                  Automation is paused. Flip the switch on to start replying again.
                </div>
              )}
              {daysLeft !== null && daysLeft <= 14 && (
                <div className="mt-3 rounded-[14px] bg-white/12 px-5 py-3.5 text-[14px] text-white" style={{ background: "rgba(255,255,255,0.12)" }}>
                  Your Instagram connection expires in {daysLeft} day{daysLeft === 1 ? "" : "s"}. Hit{" "}
                  <span className="font-semibold">Reconnect Instagram</span> to keep replies running.
                </div>
              )}
            </section>

            <div className="grid-guarded mt-5 grid gap-5 lg:grid-cols-[1fr_400px] lg:items-start">
              {/* ===== 2. POSTS CARD ===== */}
              <section className="min-w-0 rounded-[24px] border border-[#dddddd] bg-white p-6 sm:p-7">
                <div className="flex items-baseline justify-between gap-3">
                  <div>
                    <h2 className="text-[19px] font-semibold text-[#181d26]">Your posts</h2>
                    <p className="mt-0.5 text-[14px] text-[#41454d]">Tap a post to write its replies. R = replies sent · D = DMs sent.</p>
                  </div>
                  <span className="shrink-0 rounded-full bg-[#f8fafc] px-3 py-1 text-[12px] font-medium text-[#41454d]">
                    {media.length} posts
                  </span>
                </div>

                {mediaLoading ? (
                  <div className="mt-5 grid gap-3" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(88px, 1fr))" }}>
                    {Array.from({ length: 8 }).map((_, i) => (
                      <div key={i} className="aspect-square animate-pulse rounded-[12px] bg-[#f8fafc]" />
                    ))}
                  </div>
                ) : media.length === 0 ? (
                  <div className="mt-5 rounded-[14px] bg-[#f8fafc] px-5 py-10 text-center">
                    <p className="text-[15px] font-medium text-[#181d26]">No posts found</p>
                    <p className="mt-1 text-[14px] text-[#41454d]">Post something on Instagram, then come back here.</p>
                    <button onClick={() => boot()} className="mt-4 cursor-pointer rounded-[10px] border border-[#dddddd] bg-white px-4 py-2.5 text-[13px] font-medium text-[#181d26] hover:border-[#181d26]">
                      Refresh
                    </button>
                  </div>
                ) : (
                  <div className="grid-guarded mt-5 grid gap-3" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(88px, 1fr))" }}>
                    {media.map((m) => {
                      const isSel = m.mediaId === selectedId;
                      return (
                        <button
                          key={m.mediaId}
                          onClick={() => {
                            setSelectedId(m.mediaId);
                            if (window.matchMedia("(max-width: 1023px)").matches) {
                              setTimeout(() => document.getElementById("post-editor")?.scrollIntoView({ behavior: "smooth", block: "start" }), 80);
                            }
                          }}
                          aria-pressed={isSel}
                          className="post-thumb group relative aspect-square w-full cursor-pointer overflow-hidden rounded-[12px] bg-[#f8fafc]"
                          style={isSel ? { boxShadow: "0 0 0 3px #181d26" } : { boxShadow: "inset 0 0 0 1px #dddddd" }}
                        >
                          {m.thumbnailUrl ? (
                            <img
                              src={m.thumbnailUrl}
                              alt=""
                              loading="lazy"
                              className="h-full w-full object-cover"
                              style={{ maxWidth: "100%" }}
                              onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                            />
                          ) : (
                            <span className="flex h-full w-full items-center justify-center bg-[#f8fafc]">
                              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#41454d" strokeWidth="1.8"><rect x="3" y="3" width="18" height="18" rx="3" /><circle cx="9" cy="9" r="2" /><path d="m21 15-5-5L5 21" /></svg>
                            </span>
                          )}
                          {/* counts */}
                          <span className="absolute inset-x-0 bottom-0 flex items-center justify-center gap-1.5 bg-black/65 px-1 py-1 text-[10.5px] font-semibold text-white">
                            <span>R {m.stats.replies}</span>
                            <span className="opacity-50">·</span>
                            <span>D {m.stats.dms}</span>
                          </span>
                          {/* custom dot */}
                          {hasCustom(m) && (
                            <span className="absolute top-1.5 right-1.5 h-2.5 w-2.5 rounded-full bg-[#f4d35e]" style={{ boxShadow: "0 0 0 2px rgba(0,0,0,0.45)" }} title="Has a message set" />
                          )}
                          {m.mediaType === "REEL" && (
                            <span className="absolute top-1.5 left-1.5 rounded bg-black/55 px-1.5 py-0.5 text-[9px] font-bold text-white">REEL</span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
                <p className="mt-4 flex items-center gap-2 text-[12px] text-[#41454d]">
                  <span className="h-2.5 w-2.5 rounded-full bg-[#f4d35e]" style={{ boxShadow: "0 0 0 1px #181d26" }} />
                  Yellow dot = this post has its own message set
                </p>
              </section>

              {/* ===== 3. PER-POST EDITOR (cream) ===== */}
              <section id="post-editor" className="min-w-0 rounded-[24px] bg-[#f5e9d4] p-6 sm:p-7 lg:sticky lg:top-[84px] scroll-mt-20">
                <h2 className="text-[19px] font-semibold text-[#181d26]">Replies for this post</h2>
                <p className="mt-1 rounded-[10px] bg-[#181d26] px-3.5 py-2.5 text-[13px] font-medium text-white">
                  Simple rule: fill a box = send it, empty = skip it.
                </p>

                {!selected ? (
                  <div className="mt-4 rounded-[14px] bg-white/70 px-5 py-10 text-center text-[14px] text-[#41454d]">
                    Pick a post on the left to write its replies.
                  </div>
                ) : (
                  <>
                    {/* selected post summary */}
                    <div className="mt-4 flex gap-3 rounded-[14px] border border-[#181d26]/10 bg-white p-3">
                      <span className="h-14 w-14 shrink-0 overflow-hidden rounded-[10px] bg-[#f8fafc]">
                        {selected.thumbnailUrl ? (
                          <img src={selected.thumbnailUrl} alt="" className="h-full w-full object-cover" style={{ maxWidth: "100%" }} />
                        ) : (
                          <span className="flex h-full w-full items-center justify-center">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#41454d" strokeWidth="1.8"><rect x="3" y="3" width="18" height="18" rx="3" /><circle cx="9" cy="9" r="2" /><path d="m21 15-5-5L5 21" /></svg>
                          </span>
                        )}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[13px] font-medium text-[#181d26]">
                          {selected.caption ? selected.caption.slice(0, 90) : "Untitled post"}{selected.caption && selected.caption.length > 90 ? "…" : ""}
                        </p>
                        <p className="mt-0.5 text-[12px] text-[#41454d]">
                          {selected.mediaType} · {timeAgo(selected.timestamp)} · R {selected.stats.replies} · D {selected.stats.dms} · {(selected.clicks ?? 0)} clicks
                        </p>
                        {selected.permalink && (
                          <a href={selected.permalink} target="_blank" rel="noreferrer" className="text-[12px] font-medium text-[#1b61c9] hover:underline">
                            View on Instagram →
                          </a>
                        )}
                      </div>
                    </div>

                    <div className="mt-4 space-y-4">
                      <div>
                        <label htmlFor="trigger" className="mb-1.5 block text-[13px] font-semibold text-[#181d26]">
                          Trigger word
                        </label>
                        <input
                          id="trigger"
                          value={keyword}
                          onChange={(e) => setKeyword(e.target.value.toUpperCase().slice(0, 30))}
                          placeholder="e.g. GUIDE"
                          className="h-[44px] w-full rounded-[6px] border border-[#181d26]/20 bg-white px-3.5 text-[15px] font-medium tracking-wide text-[#181d26] placeholder:font-normal placeholder:text-[#41454d]/60 focus:border-[#181d26] focus:outline-none"
                        />
                        <p className="mt-1 text-[12px] text-[#41454d]">When a comment has this word, we reply to it.</p>
                      </div>
                      <div>
                        <label htmlFor="reply" className="mb-1.5 block text-[13px] font-semibold text-[#181d26]">
                          Public reply <span className="font-normal text-[#41454d]">(shown under their comment)</span>
                        </label>
                        <textarea
                          id="reply"
                          value={reply}
                          onChange={(e) => setReply(e.target.value.slice(0, 500))}
                          placeholder="e.g. Just sent it — check your DMs!"
                          rows={3}
                          className="w-full resize-none rounded-[6px] border border-[#181d26]/20 bg-white px-3.5 py-3 text-[14px] leading-relaxed text-[#181d26] placeholder:text-[#41454d]/60 focus:border-[#181d26] focus:outline-none"
                        />
                      </div>
                      <div>
                        <label htmlFor="dm" className="mb-1.5 block text-[13px] font-semibold text-[#181d26]">
                          DM <span className="font-normal text-[#41454d]">(sent to their inbox)</span>
                        </label>
                        <textarea
                          id="dm"
                          value={dm}
                          onChange={(e) => setDm(e.target.value.slice(0, 1000))}
                          placeholder="e.g. Here's your guide: yoursite.com/guide"
                          rows={4}
                          className="w-full resize-none rounded-[6px] border border-[#181d26]/20 bg-white px-3.5 py-3 text-[14px] leading-relaxed text-[#181d26] placeholder:text-[#41454d]/60 focus:border-[#181d26] focus:outline-none"
                        />
                      </div>
                      <div>
                        <label htmlFor="link" className="mb-1.5 block text-[13px] font-semibold text-[#181d26]">
                          Link to send <span className="font-normal text-[#41454d]">(tracked automatically)</span>
                        </label>
                        <input
                          id="link"
                          value={linkUrl}
                          onChange={(e) => setLinkUrl(e.target.value.slice(0, 500))}
                          placeholder="e.g. https://yoursite.com/guide"
                          inputMode="url"
                          className="h-[44px] w-full rounded-[6px] border border-[#181d26]/20 bg-white px-3.5 text-[14px] text-[#181d26] placeholder:text-[#41454d]/60 focus:border-[#181d26] focus:outline-none"
                        />
                        <p className="mt-1 text-[12px] text-[#41454d]">
                          Clicks are counted{(selected.clicks ?? 0) > 0 ? `: ${selected.clicks} so far` : ""}. Use {"{link}"} in your DM to place it, or we append it.
                        </p>
                        <label className="mt-2 flex cursor-pointer items-center gap-2 text-[13px] text-[#41454d]">
                          <input type="checkbox" checked={track} onChange={(e) => setTrack(e.target.checked)} className="h-4 w-4 accent-[#181d26]" />
                          Count clicks (link goes through our short address — uncheck to send your plain URL)
                        </label>
                      </div>
                      <label className="flex cursor-pointer items-start gap-2.5 rounded-[10px] border border-[#dddddd] bg-white px-3.5 py-3">
                        <input type="checkbox" checked={gate} onChange={(e) => setGate(e.target.checked)} className="mt-0.5 h-4 w-4 accent-[#181d26]" />
                        <span className="text-[13px] leading-relaxed text-[#41454d]">
                          <span className="font-semibold text-[#181d26]">Follow gate</span> — only deliver the link after they follow you (we ask, they tap ✓, we check, then send).
                        </span>
                      </label>
                    </div>

                    {saveMsg && (
                      <div
                        className={`mt-4 rounded-[10px] px-4 py-3 text-[13px] font-medium ${saveMsg.kind === "ok" ? "bg-[#0a2e0e] text-white" : "bg-[#aa2d00] text-white"}`}
                        role="status"
                      >
                        {saveMsg.text}
                      </div>
                    )}

                    <div className="mt-4 flex flex-col gap-2.5">
                      <button
                        onClick={handleSave}
                        disabled={saving}
                        className="w-full cursor-pointer rounded-[12px] bg-[#181d26] px-6 py-4 text-[15px] font-medium text-white transition-all duration-200 hover:bg-[#2a3140] active:scale-[0.99] disabled:cursor-wait disabled:opacity-70"
                      >
                        {saving ? "Saving…" : "Save for this post"}
                      </button>
                      <button
                        onClick={handleRemove}
                        disabled={saving}
                        className="w-full cursor-pointer rounded-[12px] border border-[#aa2d00]/40 bg-transparent px-6 py-3 text-[14px] font-medium text-[#aa2d00] transition-all duration-200 hover:bg-[#aa2d00] hover:text-white disabled:cursor-wait disabled:opacity-60"
                      >
                        Remove message
                      </button>
                    </div>
                  </>
                )}
              </section>
            </div>
          </>
        )}

        {/* ===== YOUR META APP (the only way to connect) ===== */}
        {demoMode ? (
          <section className="mt-5 rounded-[24px] border border-[#dddddd] bg-white p-6 sm:p-7">
            <h2 className="text-[19px] font-semibold text-[#181d26]">Connect with your own Meta app</h2>
            <p className="mt-1 max-w-[560px] text-[14px] text-[#41454d]">
              Your App ID, Secret, and webhook token appear here — but only after you sign in.{" "}
              <button onClick={() => navigate("/login")} className="cursor-pointer font-medium text-[#1b61c9] hover:underline">
                Sign in to unlock it →
              </button>
            </p>
          </section>
        ) : (
          <section id="byok-advanced" className="mt-5 rounded-[24px] border border-[#dddddd] bg-white p-6 sm:p-7">
            <div className="flex items-baseline justify-between gap-3">
              <div>
                <h2 className="text-[19px] font-semibold text-[#181d26]">Your Meta app (required to connect)</h2>
                <p className="mt-0.5 max-w-[560px] text-[14px] text-[#41454d]">
                  Paste your Instagram App ID + Secret below — connecting runs entirely on your app.{" "}
                  {byokOn ? (
                    <span className="font-semibold text-[#006400]">Linked ✓</span>
                  ) : (
                    <span className="text-[#41454d]">Setup takes ~15 min, once — guide below.</span>
                  )}
                </p>
              </div>
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-[13px] font-semibold text-[#181d26]" htmlFor="byok-id">
                  Instagram App ID
                </label>
                <input
                  id="byok-id"
                  value={byokAppId}
                  onChange={(e) => setByokAppId(e.target.value)}
                  placeholder="e.g. 1558293262261028"
                  inputMode="numeric"
                  className="h-[44px] w-full rounded-[6px] border border-[#dddddd] bg-white px-3.5 text-[15px] text-[#181d26] placeholder:text-[#41454d]/60 focus:border-[#181d26] focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-[13px] font-semibold text-[#181d26]" htmlFor="byok-secret">
                  Instagram App Secret
                </label>
                <input
                  id="byok-secret"
                  type="password"
                  value={byokSecret}
                  onChange={(e) => setByokSecret(e.target.value)}
                  placeholder="from Business login settings"
                  className="h-[44px] w-full rounded-[6px] border border-[#dddddd] bg-white px-3.5 text-[15px] text-[#181d26] placeholder:text-[#41454d]/60 focus:border-[#181d26] focus:outline-none"
                />
              </div>
            </div>
            {byokMsg && (
              <div className={`mt-3 rounded-[10px] px-4 py-3 text-[13px] font-medium ${byokMsg.kind === "ok" ? "bg-[#0a2e0e] text-white" : "bg-[#aa2d00] text-white"}`} role="status">
                {byokMsg.text}
              </div>
            )}
            <div className="mt-3 flex flex-wrap gap-2.5">
              <button onClick={handleByokSave} disabled={byokSaving} className="cursor-pointer rounded-[12px] bg-[#181d26] px-5 py-3 text-[14px] font-medium text-white hover:bg-[#2a3140] disabled:cursor-wait disabled:opacity-70">
                {byokSaving ? "Saving…" : byokOn ? "Update my app keys" : "Save my app keys"}
              </button>
              {byokOn && (
                <>
                  <button onClick={handleByokConnect} disabled={connecting} className="cursor-pointer rounded-[12px] bg-[#0a2e0e] px-5 py-3 text-[14px] font-medium text-white hover:brightness-125 disabled:cursor-wait disabled:opacity-70">
                    {connecting ? "Opening…" : "Connect Instagram with my app"}
                  </button>
                  <button onClick={handleByokRemove} className="cursor-pointer rounded-[12px] border border-[#dddddd] px-5 py-3 text-[14px] font-medium text-[#41454d] hover:border-[#181d26]">
                    Remove my keys
                  </button>
                </>
              )}
            </div>
            <details className="mt-4 rounded-[14px] bg-[#f8fafc] px-5 py-4">
              <summary className="cursor-pointer text-[14px] font-semibold text-[#181d26]">
                Meta setup steps for your own app (3 things to paste) —{" "}
                <button onClick={() => navigate("/connect-guide")} className="cursor-pointer font-medium text-[#1b61c9] hover:underline">
                  full guide with troubleshooting →
                </button>
              </summary>
              <ol className="mt-3 list-decimal space-y-3 pl-5 text-[13px] leading-relaxed text-[#41454d]">
                <li>
                  Create a Meta app (<b>Other</b> use case, <b>Business</b> type), add the <b>Instagram</b> product
                  with <b>API setup with Instagram login</b>. Request the same 3 permissions.
                </li>
                <li>
                  In <b>Business login settings → OAuth redirect URIs</b>, add:
                  <div className="mt-1.5 flex items-center gap-2">
                    <code className="min-w-0 flex-1 truncate rounded-[6px] border border-[#dddddd] bg-white px-2.5 py-1.5 text-[12px] text-[#181d26]">{`${API_BASE}/connect/meta/callback`}</code>
                    <button onClick={() => copyText(`${API_BASE}/connect/meta/callback`)} className="shrink-0 cursor-pointer rounded-[8px] border border-[#dddddd] bg-white px-3 py-1.5 text-[12px] font-medium hover:border-[#181d26]">
                      Copy
                    </button>
                  </div>
                </li>
                <li>
                  In <b>Configure webhooks</b>, set callback URL + verify token, subscribe to <b>comments</b>
                  (plus <b>messages</b> + <b>messaging_postbacks</b> for follow-gate confirmations):
                  <div className="mt-1.5 space-y-1.5">
                    <p className="text-[12px] text-[#41454d]">Your personal verify token (unique to your app — paste it as the Verify Token):</p>
                    <div className="flex items-center gap-2">
                      <code className="min-w-0 flex-1 truncate rounded-[6px] border border-[#dddddd] bg-white px-2.5 py-1.5 text-[12px] text-[#181d26]">{`${API_BASE}/webhook/meta`}</code>
                      <button onClick={() => copyText(`${API_BASE}/webhook/meta`)} className="shrink-0 cursor-pointer rounded-[8px] border border-[#dddddd] bg-white px-3 py-1.5 text-[12px] font-medium hover:border-[#181d26]">
                        Copy
                      </button>
                    </div>
                    <div className="flex items-center gap-2">
                      <code className="min-w-0 flex-1 truncate rounded-[6px] border border-[#dddddd] bg-white px-2.5 py-1.5 text-[12px] text-[#181d26]">{byokVerify || "(loads after login)"}</code>
                      <button onClick={() => byokVerify && copyText(byokVerify)} className="shrink-0 cursor-pointer rounded-[8px] border border-[#dddddd] bg-white px-3 py-1.5 text-[12px] font-medium hover:border-[#181d26]">
                        Copy
                      </button>
                    </div>
                  </div>
                </li>
              </ol>
              <p className="mt-3 text-[12px] text-[#41454d]">
                You own the app, so you're auto-admin — no tester invite needed. Secrets are encrypted and never shown back.
              </p>
            </details>
          </section>
        )}

        <p className="mt-8 text-center text-[12px] text-[#41454d]">
          Fill a box = send it, empty = skip it. ·{" "}
          <button onClick={() => navigate("/privacy")} className="cursor-pointer text-[#1b61c9] hover:underline">Privacy</button> ·{" "}
          <button onClick={() => navigate("/data-deletion")} className="cursor-pointer text-[#1b61c9] hover:underline">Data deletion</button>
        </p>
      </main>
    </div>
  );
}
