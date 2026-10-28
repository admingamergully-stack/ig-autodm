import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

type RouterCtx = {
  path: string;
  search: string;
  navigate: (to: string) => void;
};

const Ctx = createContext<RouterCtx>({ path: "/", search: "", navigate: () => {} });

function currentLocation(): { path: string; search: string } {
  // Support both Browser-style paths and hash fallback (#/dashboard?x=1)
  if (typeof window === "undefined") return { path: "/", search: "" };
  const h = window.location.hash;
  if (h && h.startsWith("#/")) {
    const without = h.slice(1); // /dashboard?x=1
    const q = without.indexOf("?");
    if (q === -1) return { path: without || "/", search: "" };
    return { path: without.slice(0, q) || "/", search: without.slice(q) };
  }
  let p = window.location.pathname || "/";
  // normalize trailing slash (keep root)
  if (p.length > 1 && p.endsWith("/")) p = p.slice(0, -1);
  return { path: p, search: window.location.search || "" };
}

export function RouterProvider({ children }: { children: React.ReactNode }) {
  const [loc, setLoc] = useState(currentLocation);

  useEffect(() => {
    const onPop = () => setLoc(currentLocation());
    window.addEventListener("popstate", onPop);
    window.addEventListener("hashchange", onPop);
    return () => {
      window.removeEventListener("popstate", onPop);
      window.removeEventListener("hashchange", onPop);
    };
  }, []);

  const navigate = useCallback((to: string) => {
    try {
      window.history.pushState({}, "", to);
    } catch {
      window.location.hash = `#${to}`;
    }
    setLoc(currentLocation());
    window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
  }, []);

  const value = useMemo(() => ({ ...loc, navigate }), [loc, navigate]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useRouter() {
  return useContext(Ctx);
}

export function useQuery(): URLSearchParams {
  const { search } = useRouter();
  return useMemo(() => new URLSearchParams(search), [search]);
}
