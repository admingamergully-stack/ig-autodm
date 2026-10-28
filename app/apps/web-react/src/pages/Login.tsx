import { useState } from "react";
import { Logo, Badge, GoogleIcon } from "../components/ui";
import { useRouter, useQuery } from "../lib/router";
import { supabase } from "../lib/supabase";
import { hasSupabaseEnv } from "../lib/config";

export default function Login() {
  const { navigate } = useRouter();
  const query = useQuery();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>(query.get("error") || "");

  async function handleGoogle() {
    setError("");
    if (!hasSupabaseEnv) {
      setError("Sign-in isn't configured yet (missing Supabase keys). Showing you the dashboard demo instead.");
      setTimeout(() => navigate("/dashboard"), 1200);
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (error) throw error;
      // OAuth redirects away; nothing else to do.
    } catch (e: any) {
      setError(e?.message || "Couldn't start Google sign-in. Please try again.");
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-[#f8fafc]">
      <header className="border-b border-[#dddddd] bg-white">
        <div className="mx-auto flex h-[68px] max-w-[1280px] items-center justify-between px-5 sm:px-8">
          <button onClick={() => navigate("/")} className="cursor-pointer" aria-label="AutoDM home">
            <Logo />
          </button>
          <button onClick={() => navigate("/")} className="cursor-pointer text-[14px] font-medium text-[#41454d] hover:text-[#181d26]">
            ← Back to home
          </button>
        </div>
      </header>

      <main className="flex flex-1 items-center justify-center px-5 py-14">
        <div className="w-full max-w-[440px]">
          <div className="rounded-[20px] border border-[#dddddd] bg-white p-8 shadow-sm sm:p-10">
            <div className="flex flex-wrap gap-2">
              <Badge tone="yellow">Free to start</Badge>
              <Badge tone="mint">No credit card</Badge>
            </div>
            <h1 className="mt-5 text-[28px] leading-tight font-normal tracking-tight text-[#181d26]">
              Log in to AutoDM
            </h1>
            <p className="mt-2 text-[15px] text-[#41454d]">
              Connect in seconds with Google, then link your Instagram.
            </p>

            <button
              onClick={handleGoogle}
              disabled={loading}
              className="mt-7 flex h-[52px] w-full cursor-pointer items-center justify-center gap-3 rounded-[12px] border border-[#dddddd] bg-white text-[15px] font-medium text-[#181d26] transition-all duration-200 hover:border-[#181d26] hover:shadow-md active:scale-[0.99] disabled:cursor-wait disabled:opacity-70"
            >
              {loading ? (
                <>
                  <svg className="animate-spin" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#181d26" strokeWidth="2.5" strokeLinecap="round">
                    <path d="M21 12a9 9 0 1 1-6.2-8.56" />
                  </svg>
                  Connecting to Google…
                </>
              ) : (
                <>
                  <GoogleIcon />
                  Continue with Google
                </>
              )}
            </button>

            {error && (
              <div className="mt-4 rounded-[10px] border border-[#aa2d00]/30 bg-[#aa2d00]/5 px-4 py-3 text-[13px] leading-relaxed text-[#aa2d00]" role="alert">
                {error}
              </div>
            )}

            <div className="mt-6 space-y-2.5 border-t border-[#dddddd] pt-6 text-[13px] leading-relaxed text-[#41454d]">
              <p className="flex items-start gap-2">
                <svg className="mt-0.5 shrink-0" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#006400" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" /></svg>
                We only use your Google account to keep you signed in.
              </p>
              <p className="flex items-start gap-2">
                <svg className="mt-0.5 shrink-0" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#006400" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>
                Instagram access happens later, through Meta's official login.
              </p>
              <p className="flex items-start gap-2">
                <svg className="mt-0.5 shrink-0" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#006400" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="10" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
                Disconnect any time — your data can be fully deleted.
              </p>
            </div>
          </div>
          <p className="mt-5 text-center text-[13px] text-[#41454d]">
            By continuing you agree to our{" "}
            <button onClick={() => navigate("/privacy")} className="cursor-pointer font-medium text-[#1b61c9] hover:underline">Privacy Policy</button>.
          </p>
        </div>
      </main>
    </div>
  );
}
