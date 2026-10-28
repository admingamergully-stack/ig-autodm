import { useEffect, useState } from "react";
import { Header, Footer, DarkButton, OutlineButton, Badge } from "../components/ui";
import { useRouter } from "../lib/router";

/* ---------- Live chat mockup ---------- */
function ChatMockup() {
  const [step, setStep] = useState(0);
  const [key, setKey] = useState(0);
  useEffect(() => {
    const t = setInterval(() => {
      setStep((s) => (s >= 5 ? 0 : s + 1));
      if (step >= 5) setKey((k) => k + 1);
    }, 1600);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  return (
    <div key={key} className="overflow-hidden rounded-[20px] bg-white shadow-2xl">
      {/* phone header */}
      <div className="flex items-center gap-3 border-b border-[#dddddd] bg-white px-5 py-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#181d26] text-[14px] font-semibold text-white">
          maya
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[14px] font-semibold text-[#181d26]">@maya.makes</p>
          <p className="flex items-center gap-1.5 text-[12px] text-[#006400]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#006400]" /> Active now · AutoDM on
          </p>
        </div>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#41454d" strokeWidth="2" strokeLinecap="round">
          <path d="M23 7l-7 5 7 5V7z" /><rect x="1" y="5" width="15" height="14" rx="2" />
        </svg>
      </div>
      {/* comment trigger banner */}
      <div className="border-b border-[#dddddd] bg-[#f8fafc] px-5 py-3">
        <p className="text-[12px] text-[#41454d]">
          <span className="font-semibold text-[#181d26]">@jules.fit</span> commented on your reel:{" "}
          <span className="rounded bg-[#f4d35e] px-1.5 py-0.5 font-semibold text-[#181d26]">“GUIDE please!”</span>
        </p>
      </div>
      {/* messages */}
      <div className="space-y-3 bg-white px-5 py-5" style={{ minHeight: 300 }}>
        {step >= 1 && (
          <div className="chat-msg flex justify-start">
            <div className="max-w-[80%] rounded-2xl rounded-bl-md bg-[#f1f3f5] px-4 py-3 text-[14px] text-[#181d26]">
              GUIDE please! 🙏 — wait, this is automated?
            </div>
          </div>
        )}
        {step >= 2 && (
          <div className="chat-msg flex justify-end">
            <div className="max-w-[85%] rounded-2xl rounded-br-md bg-[#181d26] px-4 py-3 text-[14px] text-white">
              Yes! Here's your free Starter Guide — check your inbox link 👇
              <span className="mt-2 block rounded-lg bg-white/15 px-3 py-2 text-[13px] underline">maya.co/starter-guide</span>
            </div>
          </div>
        )}
        {step >= 3 && (
          <div className="chat-msg flex justify-start">
            <div className="max-w-[80%] rounded-2xl rounded-bl-md bg-[#f1f3f5] px-4 py-3 text-[14px] text-[#181d26]">
              Got it, thank you!! This is amazing
            </div>
          </div>
        )}
        {step >= 4 && (
          <div className="chat-msg flex justify-end">
            <div className="max-w-[85%] rounded-2xl rounded-br-md bg-[#0a2e0e] px-4 py-3 text-[14px] text-white">
              Anytime! Want the advanced workout plan too? Reply YES and I'll send it.
            </div>
          </div>
        )}
        {step >= 5 && (
          <div className="chat-msg flex items-center justify-center gap-2 pt-1">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#e8f3ec] px-3 py-1.5 text-[12px] font-medium text-[#006400]">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>
              Public reply posted + DM delivered in 4s
            </span>
          </div>
        )}
        {step === 0 && (
          <div className="flex items-center gap-2 px-1 py-6">
            <span className="typing-dot h-2 w-2 rounded-full bg-[#41454d]" style={{ animationDelay: "0ms" }} />
            <span className="typing-dot h-2 w-2 rounded-full bg-[#41454d]" style={{ animationDelay: "150ms" }} />
            <span className="typing-dot h-2 w-2 rounded-full bg-[#41454d]" style={{ animationDelay: "300ms" }} />
            <span className="ml-2 text-[13px] text-[#41454d]">Waiting for a comment with your trigger word…</span>
          </div>
        )}
      </div>
      {/* input */}
      <div className="border-t border-[#dddddd] bg-white px-5 py-3.5">
        <div className="flex items-center gap-2 rounded-full border border-[#dddddd] bg-[#f8fafc] px-4 py-2.5 text-[13px] text-[#41454d]">
          <span className="flex-1">AutoDM is handling this chat…</span>
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#181d26]">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M22 2 11 13" /><path d="M22 2 15 22l-4-9-9-4 20-7z" /></svg>
          </span>
        </div>
      </div>
    </div>
  );
}

/* ---------- FAQ ---------- */
const FAQS = [
  {
    q: "How does comment-to-DM actually work?",
    a: "You pick a trigger word like GUIDE for a post. When someone comments that word, AutoDM instantly posts a public reply to their comment and sends them a DM with your link or message. Fill a box = send it, empty = skip it.",
  },
  {
    q: "Do I need a Business or Creator Instagram account?",
    a: "Yes — Instagram's API requires a Professional account (Business or Creator) linked to a Facebook Page. Personal accounts can't use automation. Switching is free in Instagram settings and takes about a minute.",
  },
  {
    q: "Will Instagram ban me for this?",
    a: "No. AutoDM uses Instagram's official Messaging API via Meta with your permission. We follow rate limits, only reply once per comment, and never send spam. You can pause automation any time with one switch.",
  },
  {
    q: "Can I set different messages for different posts?",
    a: "Yes — that's the whole point. Tap any post in your dashboard and write a trigger word, a public reply, and a DM just for that post. Leave any box empty and that step is skipped.",
  },
  {
    q: "What happens if someone comments without the trigger word?",
    a: "Nothing — we stay quiet. AutoDM only responds when the comment contains your trigger word, so normal conversation on your posts is never interrupted.",
  },
  {
    q: "Can I use my own Meta app instead of yours?",
    a: "Yes — that's Bring Your Own Key. Create your own Meta app, paste its Instagram App ID and Secret into the Advanced section of your dashboard, and everything (login, tokens, webhooks) runs under your app. Your credentials stay encrypted and are never shown back. Most people just use the normal one-tap connect.",
  },
  {
    q: "How do I cancel or delete my data?",
    a: "Disconnect Instagram from your dashboard any time to stop all automation instantly. You can request full data deletion from our Data Deletion page and we'll remove everything within 30 days.",
  },
];

function FaqItem({ q, a, open, onToggle }: { q: string; a: string; open: boolean; onToggle: () => void }) {
  return (
    <div className={`rounded-[16px] border bg-white transition-all duration-200 ${open ? "faq-open border-[#181d26] shadow-md" : "border-[#dddddd] hover:border-[#181d26]"}`}>
      <button onClick={onToggle} className="flex w-full cursor-pointer items-center justify-between gap-4 px-6 py-5 text-left">
        <span className="text-[16px] font-medium text-[#181d26]">{q}</span>
        <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#f8fafc] transition-transform duration-200 ${open ? "rotate-45" : ""}`}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#181d26" strokeWidth="2.5" strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>
        </span>
      </button>
      <div className="faq-answer">
        <div className="faq-inner">
          <p className="px-6 pb-6 text-[15px] leading-relaxed text-[#41454d]">{a}</p>
        </div>
      </div>
    </div>
  );
}

/* ---------- Page ---------- */
export default function Landing() {
  const { navigate } = useRouter();
  const [openFaq, setOpenFaq] = useState<number>(0);

  return (
    <div className="min-h-screen bg-white">
      <Header />

      {/* 1. HERO — white, centered */}
      <section className="bg-white">
        <div className="mx-auto max-w-[1280px] px-5 pt-16 pb-20 text-center sm:px-8 sm:pt-24">
          <Badge tone="neutral">
            <span className="h-2 w-2 rounded-full bg-[#006400]" />
            Instagram comment-to-DM automation
          </Badge>
          <h1 className="mx-auto mt-6 max-w-[720px] text-[34px] leading-[1.12] font-normal tracking-tight text-[#181d26] sm:text-[40px] lg:text-[48px]">
            Turn comments into conversations, automatically
          </h1>
          <p className="mx-auto mt-5 max-w-[600px] text-[17px] leading-relaxed text-[#41454d]">
            Someone comments <span className="font-semibold text-[#181d26]">GUIDE</span> on your post — they get a
            public reply and a DM with your link in seconds. No code, no spreadsheets, no missed leads.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <DarkButton href="/login" className="w-full sm:w-auto">
              Start free — connect Instagram
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
            </DarkButton>
            <OutlineButton className="w-full sm:w-auto" onClick={() => document.getElementById("demo")?.scrollIntoView({ behavior: "smooth" })}>
              See how it works
            </OutlineButton>
          </div>
          <p className="mt-5 text-[13px] text-[#41454d]">
            Free to start · No credit card · Works with Creator & Business accounts
          </p>
        </div>
      </section>

      {/* 2. CORAL signature card with live DM mockup */}
      <section id="demo" className="bg-white pb-24">
        <div className="mx-auto max-w-[1280px] px-5 sm:px-8">
          <div className="grid-guarded grid overflow-hidden rounded-[28px] bg-[#aa2d00] lg:grid-cols-2">
            <div className="flex flex-col justify-center p-8 sm:p-12 lg:p-14">
              <Badge tone="white">
                <span className="h-2 w-2 animate-pulse rounded-full bg-white" />
                Live demo — watch it reply
              </Badge>
              <h2 className="mt-6 text-[32px] leading-tight font-normal tracking-tight text-white sm:text-[36px]">
                One word in the comments. A DM in their inbox.
              </h2>
              <p className="mt-4 max-w-[480px] text-[16px] leading-relaxed text-white/90">
                This is exactly what your followers see. They comment your trigger word, and AutoDM handles
                the public reply plus the DM — while you sleep, film, or post your next reel.
              </p>
              <ul className="mt-7 space-y-3.5">
                {[
                  ["Public reply in seconds", "Every trigger comment gets a warm public reply — social proof on autopilot."],
                  ["DM with your link", "The good stuff lands in their inbox: your guide, link, discount, or invite."],
                  ["Zero manual work", "Set it once per post. Pause everything with one switch, any time."],
                ].map(([t, d]) => (
                  <li key={t} className="flex gap-3">
                    <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#aa2d00" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>
                    </span>
                    <div>
                      <p className="text-[15px] font-semibold text-white">{t}</p>
                      <p className="text-[14px] text-white/80">{d}</p>
                    </div>
                  </li>
                ))}
              </ul>
              <div className="mt-8">
                <button
                  onClick={() => navigate("/login")}
                  className="cursor-pointer rounded-[12px] bg-white px-6 py-4 text-[15px] font-medium text-[#181d26] transition-all duration-200 hover:shadow-xl active:scale-[0.98]"
                >
                  Try it on your account
                </button>
              </div>
            </div>
            <div className="bg-[#8a2400]/40 p-6 sm:p-10 lg:p-12">
              <ChatMockup />
              <p className="mt-4 text-center text-[12px] text-white/70">Simulated preview — your messages, your words.</p>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Four pastel trigger cards */}
      <section className="bg-white pb-24">
        <div className="mx-auto max-w-[1280px] px-5 sm:px-8">
          <div className="text-center">
            <p className="text-[13px] font-semibold tracking-wide text-[#41454d] uppercase">Trigger ideas</p>
            <h2 className="mx-auto mt-3 max-w-[640px] text-[32px] leading-tight font-normal tracking-tight text-[#181d26]">
              One post, one word, one automatic DM
            </h2>
            <p className="mx-auto mt-3 max-w-[560px] text-[16px] text-[#41454d]">
              Pick a word your audience will actually type. Each post can have its own word and its own messages.
            </p>
          </div>
          <div className="grid-guarded mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { bg: "bg-[#fcab79]", word: "GUIDE", title: "Lead magnets", desc: "“Comment GUIDE and I'll DM you the free PDF.” Grow your list while you sleep.", comment: "@lena.writes: GUIDE!!", dm: "Here's your free guide ↓" },
              { bg: "bg-[#a8d8c4]", word: "PRICE", title: "Sales & offers", desc: "“Comment PRICE for today's deal.” Send pricing, links, and discount codes instantly.", comment: "@shop.tom: price?", dm: "It's $29 today — link inside" },
              { bg: "bg-[#f5e9d4]", word: "LINK", title: "Content & links", desc: "“Comment LINK for the full video.” Beat the link-in-bio bottleneck forever.", comment: "@ana.codes: link pls", dm: "Full tutorial right here ↓" },
              { bg: "bg-[#f4d35e]", word: "JOIN", title: "Community", desc: "“Comment JOIN for the invite.” Fill your challenge, group, or waitlist on autopilot.", comment: "@fit.with.zo: JOIN", dm: "You're in! Invite inside 🎉" },
            ].map((c) => (
              <div key={c.word} className={`flex flex-col rounded-[20px] ${c.bg} p-6 transition-transform duration-200 hover:-translate-y-1`}>
                <span className="inline-flex w-fit items-center rounded-full bg-[#181d26] px-3.5 py-1.5 text-[13px] font-semibold text-white">
                  “{c.word}”
                </span>
                <h3 className="mt-4 text-[18px] font-semibold text-[#181d26]">{c.title}</h3>
                <p className="mt-2 flex-1 text-[14px] leading-relaxed text-[#333840]">{c.desc}</p>
                <div className="mt-5 space-y-2">
                  <div className="rounded-xl bg-white/85 px-3.5 py-2.5 text-[13px] text-[#333840]">
                    <span className="font-medium">Comment · </span>{c.comment}
                  </div>
                  <div className="rounded-xl bg-[#181d26] px-3.5 py-2.5 text-[13px] text-white">
                    <span className="font-medium">AutoDM · </span>{c.dm}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 4. Dark 3-steps card */}
      <section id="how" className="bg-white pb-24">
        <div className="mx-auto max-w-[1280px] px-5 sm:px-8">
          <div className="rounded-[28px] bg-[#181d26] p-8 sm:p-12 lg:p-14">
            <div className="flex flex-col items-start justify-between gap-6 lg:flex-row lg:items-end">
              <div>
                <Badge tone="yellow">Setup takes 3 minutes</Badge>
                <h2 className="mt-5 max-w-[560px] text-[32px] leading-tight font-normal tracking-tight text-white">
                  From install to auto-DMs in three steps
                </h2>
              </div>
              <DarkButton href="/login" className="bg-white text-[#181d26] hover:bg-[#f1f3f5]">
                Connect Instagram
              </DarkButton>
            </div>
            <div className="grid-guarded mt-10 grid gap-5 md:grid-cols-3">
              {[
                { n: "1", t: "Connect Instagram", d: "Log in with Google, then link your Creator or Business account through Meta's official login. Two clicks, fully secure.", icon: <path d="M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7" /> },
                { n: "2", t: "Pick your posts", d: "Tap any post or reel in your dashboard. Each one gets its own trigger word — GUIDE for one, PRICE for another.", icon: <rect x="3" y="3" width="7" height="7" rx="1.5" /> },
                { n: "3", t: "Write your replies", d: "Fill a box = send it, empty = skip it. Write a public reply and a DM, hit save, and you're live. That's it.", icon: <path d="M21 11.5a8.4 8.4 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.4 8.4 0 0 1-3.8-.9L3 21l1.9-5.7a8.4 8.4 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.4 8.4 0 0 1 3.8-.9h.5a8.5 8.5 0 0 1 8 8v.5Z" /> },
              ].map((s) => (
                <div key={s.n} className="rounded-[20px] border border-white/15 bg-white/[0.06] p-7">
                  <div className="flex items-center justify-between">
                    <span className="flex h-11 w-11 items-center justify-center rounded-[12px] bg-white">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#181d26" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        {s.icon}
                        {s.n === "2" && (<><rect x="14" y="3" width="7" height="7" rx="1.5" /><rect x="3" y="14" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" /></>)}
                        {s.n === "1" && (<path d="M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7" />)}
                      </svg>
                    </span>
                    <span className="text-[40px] leading-none font-normal text-white/20">{s.n}</span>
                  </div>
                  <h3 className="mt-5 text-[18px] font-semibold text-white">{s.t}</h3>
                  <p className="mt-2 text-[14px] leading-relaxed text-white/75">{s.d}</p>
                </div>
              ))}
            </div>
            <p className="mt-8 text-center text-[13px] text-white/60">
              Simple rule for everything: fill a box = send it, empty = skip it.
            </p>
          </div>
        </div>
      </section>

      {/* 5. Cream comparison band */}
      <section className="bg-[#f5e9d4]">
        <div className="mx-auto max-w-[1280px] px-5 py-24 sm:px-8">
          <div className="grid-guarded grid items-center gap-10 lg:grid-cols-[1fr_1.1fr]">
            <div>
              <p className="text-[13px] font-semibold tracking-wide text-[#41454d] uppercase">Why AutoDM</p>
              <h2 className="mt-3 text-[32px] leading-tight font-normal tracking-tight text-[#181d26]">
                Stop losing leads to the comments section
              </h2>
              <p className="mt-4 max-w-[480px] text-[16px] leading-relaxed text-[#41454d]">
                Every “link please?” you answer by hand costs you minutes. Every one you miss costs you a
                follower, a subscriber, or a sale. AutoDM answers all of them in seconds.
              </p>
              <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                <DarkButton href="/login">Start free</DarkButton>
                <OutlineButton className="border-[#181d26]/20 bg-transparent" onClick={() => navigate("/dashboard")}>
                  Open dashboard
                </OutlineButton>
              </div>
            </div>
            <div className="overflow-hidden rounded-[20px] border border-[#181d26]/10 bg-white shadow-sm">
              <div className="thin-scroll overflow-x-auto">
              <div className="min-w-[560px]">
              <div className="grid grid-cols-[1fr_1fr] text-[14px] font-semibold">
                <div className="border-b border-r border-[#dddddd] bg-[#f8fafc] px-5 py-4 text-[#41454d]">Without AutoDM</div>
                <div className="border-b border-[#dddddd] bg-[#0a2e0e] px-5 py-4 text-white">With AutoDM</div>
              </div>
              {[
                ["Copy-paste the same reply 200 times", "Every trigger comment answered in ~4 seconds"],
                ["“DM me!” — then forget to follow up", "DM with your link sent automatically"],
                ["Leads go cold overnight", "24/7 replies, even while you sleep"],
                ["No idea which post drives DMs", "Per-post reply & DM counts"],
                ["Link-in-bio bottleneck", "The link lands right in their inbox"],
              ].map(([a, b], i) => (
                <div key={i} className="grid grid-cols-[1fr_1fr] text-[14px]">
                  <div className="flex items-start gap-2 border-b border-r border-[#dddddd] px-5 py-3.5 text-[#41454d]">
                    <svg className="mt-0.5 shrink-0" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#aa2d00" strokeWidth="2.5" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12" /></svg>
                    {a}
                  </div>
                  <div className="flex items-start gap-2 border-b border-[#dddddd] px-5 py-3.5 font-medium text-[#181d26]">
                    <svg className="mt-0.5 shrink-0" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#006400" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>
                    {b}
                  </div>
                </div>
              ))}
              </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 6. FAQ */}
      <section id="faq" className="bg-white">
        <div className="mx-auto max-w-[800px] px-5 py-24 sm:px-8">
          <div className="text-center">
            <p className="text-[13px] font-semibold tracking-wide text-[#41454d] uppercase">FAQ</p>
            <h2 className="mt-3 text-[32px] leading-tight font-normal tracking-tight text-[#181d26]">
              Questions, answered plainly
            </h2>
          </div>
          <div className="mt-10 space-y-3">
            {FAQS.map((f, i) => (
              <FaqItem key={i} q={f.q} a={f.a} open={openFaq === i} onToggle={() => setOpenFaq(openFaq === i ? -1 : i)} />
            ))}
          </div>
          <p className="mt-6 text-center text-[14px] text-[#41454d]">
            Stuck connecting an account?{" "}
            <button onClick={() => navigate("/connect-guide")} className="cursor-pointer font-medium text-[#1b61c9] hover:underline">
              Read the step-by-step connect guide →
            </button>
          </p>
        </div>
      </section>

      {/* 7. Trust strip */}
      <section className="border-t border-[#dddddd] bg-[#f8fafc]">
        <div className="mx-auto max-w-[1280px] px-5 py-10 sm:px-8">
          <div className="flex flex-col items-center gap-6 lg:flex-row lg:justify-between">
            <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-[14px] font-medium text-[#41454d]">
              <span className="inline-flex items-center gap-2">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#006400" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" /><path d="m9 12 2 2 4-4" /></svg>
                Official Meta API
              </span>
              <span className="inline-flex items-center gap-2">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#006400" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M13 2 3 14h7l-1 8 10-12h-7l1-8Z" /></svg>
                Replies in ~4 seconds
              </span>
              <span className="inline-flex items-center gap-2">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#006400" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" /></svg>
                Pause any time
              </span>
              <span className="inline-flex items-center gap-2">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#006400" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="10" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
                Your data stays yours
              </span>
            </div>
            <DarkButton href="/login" className="shrink-0">Get started free</DarkButton>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
