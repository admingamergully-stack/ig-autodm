import { useState } from "react";
import { useRouter } from "../lib/router";
import { cn } from "../utils/cn";

/* ---------- Logo ---------- */
export function Logo({ dark = false }: { dark?: boolean }) {
  return (
    <span className="inline-flex items-center gap-2.5">
      <span
        className={cn(
          "flex h-9 w-9 items-center justify-center rounded-[10px]",
          dark ? "bg-white" : "bg-[#181d26]"
        )}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path
            d="M12 2.5c3.2 0 3.6 0 4.9.1 1.2.1 1.8.2 2.2.4.6.2 1 .5 1.4.9.4.4.7.8.9 1.4.2.4.4 1 .4 2.2.1 1.3.1 1.7.1 4.9s0 3.6-.1 4.9c-.1 1.2-.2 1.8-.4 2.2-.2.6-.5 1-.9 1.4-.4.4-.8.7-1.4.9-.4.2-1 .4-2.2.4-1.3.1-1.7.1-4.9.1s-3.6 0-4.9-.1c-1.2-.1-1.8-.2-2.2-.4-.6-.2-1-.5-1.4-.9-.4-.4-.7-.8-.9-1.4-.2-.4-.4-1-.4-2.2C2.5 15.6 2.5 15.2 2.5 12s0-3.6.1-4.9c.1-1.2.2-1.8.4-2.2.2-.6.5-1 .9-1.4.4-.4.8-.7 1.4-.9.4-.2 1-.4 2.2-.4C8.4 2.5 8.8 2.5 12 2.5Z"
            stroke={dark ? "#181d26" : "#fff"}
            strokeWidth="1.8"
          />
          <path
            d="M12 7.2a4.8 4.8 0 1 0 0 9.6 4.8 4.8 0 0 0 0-9.6Z"
            stroke={dark ? "#181d26" : "#fff"}
            strokeWidth="1.8"
          />
          <circle cx="17.4" cy="6.6" r="1.3" fill={dark ? "#181d26" : "#fff"} />
        </svg>
      </span>
      <span className={cn("text-[17px] font-semibold tracking-tight", dark ? "text-white" : "text-[#181d26]")}>
        AutoDM
      </span>
    </span>
  );
}

/* ---------- Buttons ---------- */
export function DarkButton({
  children,
  className,
  onClick,
  href,
}: {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  href?: string;
}) {
  const { navigate } = useRouter();
  const cls = cn(
    "inline-flex cursor-pointer items-center justify-center gap-2 rounded-[12px] bg-[#181d26] px-6 py-4 text-[15px] font-medium text-white transition-all duration-200 hover:bg-[#2a3140] hover:shadow-lg active:scale-[0.98]",
    className
  );
  if (href) {
    return (
      <button
        className={cls}
        onClick={() => {
          if (href.startsWith("http")) window.location.href = href;
          else navigate(href);
        }}
      >
        {children}
      </button>
    );
  }
  return (
    <button className={cls} onClick={onClick}>
      {children}
    </button>
  );
}

export function OutlineButton({
  children,
  className,
  onClick,
  href,
}: {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  href?: string;
}) {
  const { navigate } = useRouter();
  const cls = cn(
    "inline-flex cursor-pointer items-center justify-center gap-2 rounded-[12px] border border-[#dddddd] bg-white px-6 py-4 text-[15px] font-medium text-[#181d26] transition-all duration-200 hover:border-[#181d26] hover:shadow-md active:scale-[0.98]",
    className
  );
  if (href) {
    return (
      <button
        className={cls}
        onClick={() => {
          if (href.startsWith("http")) window.location.href = href;
          else navigate(href);
        }}
      >
        {children}
      </button>
    );
  }
  return (
    <button className={cls} onClick={onClick}>
      {children}
    </button>
  );
}

/* ---------- Header ---------- */
export function Header({ cta = true }: { cta?: boolean }) {
  const { navigate, path } = useRouter();
  const [open, setOpen] = useState(false);
  const go = (to: string) => {
    setOpen(false);
    navigate(to);
  };
  const goAnchor = (id: string) => {
    setOpen(false);
    navigate("/");
    setTimeout(() => document.getElementById(id)?.scrollIntoView({ behavior: "smooth" }), 80);
  };
  return (
    <header className="sticky top-0 z-50 border-b border-[#dddddd] bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-[68px] max-w-[1280px] items-center justify-between px-5 sm:px-8">
        <button onClick={() => go("/")} className="cursor-pointer" aria-label="AutoDM home">
          <Logo />
        </button>
        <nav className="hidden items-center gap-8 text-[14px] font-medium text-[#41454d] md:flex">
          <button onClick={() => navigate("/")} className={cn("cursor-pointer transition-colors duration-200 hover:text-[#181d26]", path === "/" && "text-[#181d26]")}>
            Home
          </button>
          <a href="#how" onClick={(e) => { e.preventDefault(); navigate("/"); setTimeout(() => document.getElementById("how")?.scrollIntoView({ behavior: "smooth" }), 80); }} className="cursor-pointer transition-colors duration-200 hover:text-[#181d26]">
            How it works
          </a>
          <a href="#faq" onClick={(e) => { e.preventDefault(); navigate("/"); setTimeout(() => document.getElementById("faq")?.scrollIntoView({ behavior: "smooth" }), 80); }} className="cursor-pointer transition-colors duration-200 hover:text-[#181d26]">
            FAQ
          </a>
          <button onClick={() => navigate("/dashboard")} className={cn("cursor-pointer transition-colors duration-200 hover:text-[#181d26]", path === "/dashboard" && "text-[#181d26]")}>
            Dashboard
          </button>
        </nav>
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate("/login")}
            className="hidden cursor-pointer text-[14px] font-medium text-[#41454d] transition-colors duration-200 hover:text-[#181d26] sm:block"
          >
            Log in
          </button>
          {cta && (
            <button
              onClick={() => navigate("/login")}
              className="cursor-pointer rounded-[12px] bg-[#181d26] px-4 py-2.5 text-[14px] font-medium text-white transition-all duration-200 hover:bg-[#2a3140] active:scale-[0.98] sm:px-5"
            >
              Start free
            </button>
          )}
          <button
            onClick={() => setOpen((o) => !o)}
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            className="flex h-11 w-11 cursor-pointer items-center justify-center rounded-[10px] border border-[#dddddd] bg-white md:hidden"
          >
            {open ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#181d26" strokeWidth="2.4" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12" /></svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#181d26" strokeWidth="2.4" strokeLinecap="round"><path d="M4 7h16M4 12h16M4 17h16" /></svg>
            )}
          </button>
        </div>
      </div>
      {open && (
        <nav className="border-t border-[#dddddd] bg-white px-5 py-3 md:hidden" aria-label="Mobile">
          {[
            { label: "Home", fn: () => go("/") },
            { label: "How it works", fn: () => goAnchor("how") },
            { label: "FAQ", fn: () => goAnchor("faq") },
            { label: "Dashboard", fn: () => go("/dashboard") },
            { label: "Log in", fn: () => go("/login") },
          ].map((l) => (
            <button
              key={l.label}
              onClick={l.fn}
              className="block w-full cursor-pointer rounded-[10px] px-3 py-3 text-left text-[15px] font-medium text-[#333840] hover:bg-[#f8fafc] active:bg-[#f8fafc]"
            >
              {l.label}
            </button>
          ))}
        </nav>
      )}
    </header>
  );
}

/* ---------- Footer ---------- */
export function Footer() {
  const { navigate } = useRouter();
  return (
    <footer className="border-t border-[#dddddd] bg-white">
      <div className="mx-auto max-w-[1280px] px-5 py-14 sm:px-8">
        <div className="grid-guarded grid gap-10 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div className="min-w-0">
            <Logo />
            <p className="mt-4 max-w-[300px] text-[14px] leading-relaxed text-[#41454d]">
              Comment-to-DM automation for Instagram creators. Turn every comment into a conversation.
            </p>
            <div className="mt-5 inline-flex items-center gap-2 rounded-full border border-[#dddddd] bg-[#f8fafc] px-3 py-1.5 text-[12px] font-medium text-[#41454d]">
              <span className="h-2 w-2 rounded-full bg-[#006400]" />
              Built for Instagram via Meta API
            </div>
          </div>
          <div>
            <p className="text-[13px] font-semibold text-[#181d26]">Product</p>
            <ul className="mt-4 space-y-2.5 text-[14px] text-[#41454d]">
              <li><button className="cursor-pointer hover:text-[#181d26]" onClick={() => navigate("/")}>Home</button></li>
              <li><button className="cursor-pointer hover:text-[#181d26]" onClick={() => navigate("/dashboard")}>Dashboard</button></li>
              <li><button className="cursor-pointer hover:text-[#181d26]" onClick={() => navigate("/login")}>Log in</button></li>
            </ul>
          </div>
          <div>
            <p className="text-[13px] font-semibold text-[#181d26]">Legal</p>
            <ul className="mt-4 space-y-2.5 text-[14px] text-[#41454d]">
              <li><button className="cursor-pointer hover:text-[#181d26]" onClick={() => navigate("/privacy")}>Privacy Policy</button></li>
              <li><button className="cursor-pointer hover:text-[#181d26]" onClick={() => navigate("/data-deletion")}>Data Deletion</button></li>
            </ul>
          </div>
          <div>
            <p className="text-[13px] font-semibold text-[#181d26]">Support</p>
            <ul className="mt-4 space-y-2.5 text-[14px] text-[#41454d]">
              <li><button className="cursor-pointer hover:text-[#181d26]" onClick={() => navigate("/")}>How it works</button></li>
              <li><button className="cursor-pointer hover:text-[#181d26]" onClick={() => navigate("/")}>FAQ</button></li>
            </ul>
          </div>
        </div>
        <div className="mt-12 flex flex-col items-start justify-between gap-3 border-t border-[#dddddd] pt-6 text-[13px] text-[#41454d] sm:flex-row sm:items-center">
          <span>© 2026 AutoDM. All rights reserved.</span>
          <span>Not affiliated with Meta or Instagram.</span>
        </div>
      </div>
    </footer>
  );
}

/* ---------- Small atoms ---------- */
export function Badge({ children, tone = "neutral" }: { children: React.ReactNode; tone?: "neutral" | "yellow" | "mint" | "white" }) {
  const tones: Record<string, string> = {
    neutral: "border-[#dddddd] bg-[#f8fafc] text-[#41454d]",
    yellow: "border-[#e5c04a] bg-[#f4d35e] text-[#181d26]",
    mint: "border-[#8fc3ad] bg-[#a8d8c4] text-[#0a2e0e]",
    white: "border-white/40 bg-white/15 text-white",
  };
  return (
    <span className={cn("inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-[13px] font-medium", tones[tone])}>
      {children}
    </span>
  );
}

export function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[13px] font-semibold tracking-wide text-[#41454d] uppercase">{children}</p>
  );
}

export function GoogleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
      <path fill="#4285F4" d="M23.5 12.3c0-.9-.1-1.5-.3-2.3H12v4.5h6.5c-.1 1.1-.8 2.7-2.4 3.8l-.1.1 3.4 2.6.2.1c2.1-1.9 3.9-4.7 3.9-8.8Z" />
      <path fill="#34A853" d="M12 24c3.2 0 5.9-1.1 7.9-2.9l-3.8-2.9c-1 .7-2.4 1.2-4.1 1.2-3.1 0-5.8-2.1-6.8-5l-.1.1-3.5 2.7v.1C3.6 21.3 7.5 24 12 24Z" />
      <path fill="#FBBC05" d="M5.2 14.4c-.2-.7-.4-1.5-.4-2.4s.1-1.7.4-2.4l-.1-.1-3.4-2.7-.1.1C.6 9 0 10.4 0 12s.6 3 1.6 4.2l3.6-1.8Z" />
      <path fill="#EA4335" d="M12 4.7c1.8 0 3 .8 3.7 1.4l3.3-3.2C17 1.1 14.8 0 12 0 7.5 0 3.6 2.7 1.6 6.9l3.6 2.7c1-2.9 3.7-4.9 6.8-4.9Z" />
    </svg>
  );
}
