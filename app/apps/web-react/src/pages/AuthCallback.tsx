import { useEffect, useState } from "react";
import { Logo } from "../components/ui";
import { useRouter } from "../lib/router";
import { supabase } from "../lib/supabase";
import { hasSupabaseEnv } from "../lib/config";

export default function AuthCallback() {
  const { navigate } = useRouter();
  const [msg, setMsg] = useState("Finishing sign-in…");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!hasSupabaseEnv) {
        setMsg("Sign-in isn't configured — taking you to the demo dashboard…");
        setTimeout(() => { if (!cancelled) navigate("/dashboard"); }, 1200);
        return;
      }
      try {
        // supabase-js auto-detects the code in the URL (detectSessionInUrl),
        // but we also explicitly exchange it for robustness (PKCE).
        const params = new URLSearchParams(window.location.search);
        const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ""));
        const code = params.get("code");
        const errDesc = params.get("error_description") || hashParams.get("error_description");

        if (errDesc) throw new Error(errDesc);

        if (code) {
          setMsg("Verifying with Google…");
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) throw error;
        } else {
          // Implicit flow / already detected — just read the session with retries
          let session = null;
          for (let i = 0; i < 6; i++) {
            const { data } = await supabase.auth.getSession();
            if (data.session) { session = data.session; break; }
            await new Promise((r) => setTimeout(r, 400));
          }
          if (!session) throw new Error("No session found. Please try signing in again.");
        }

        setMsg("You're in! Opening your dashboard…");
        // Clean the URL so the code isn't left behind
        window.history.replaceState({}, "", "/auth/callback");
        setTimeout(() => { if (!cancelled) navigate("/dashboard"); }, 500);
      } catch (e: any) {
        if (cancelled) return;
        setMsg(e?.message || "Sign-in failed.");
        setTimeout(() => {
          if (!cancelled) navigate(`/login?error=${encodeURIComponent(e?.message || "Sign-in failed. Please try again.")}`);
        }, 1400);
      }
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-white px-5">
      <Logo />
      <div className="mt-8 flex h-14 w-14 items-center justify-center rounded-full bg-[#f8fafc]">
        <svg className="animate-spin" width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#181d26" strokeWidth="2.5" strokeLinecap="round">
          <path d="M21 12a9 9 0 1 1-6.2-8.56" />
        </svg>
      </div>
      <p className="mt-5 max-w-[320px] text-center text-[15px] text-[#41454d]">{msg}</p>
    </div>
  );
}
