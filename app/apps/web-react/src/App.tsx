import { RouterProvider, useRouter } from "./lib/router";
import { AuthProvider } from "./lib/auth";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import AuthCallback from "./pages/AuthCallback";
import Dashboard from "./pages/Dashboard";
import ConnectGuide from "./pages/ConnectGuide";
import Onboarding from "./pages/Onboarding";
import { Privacy, DataDeletion } from "./pages/Legal";
import { Header, Footer, DarkButton } from "./components/ui";

function NotFound() {
  const { navigate } = useRouter();
  return (
    <div className="min-h-screen bg-white">
      <Header />
      <main className="mx-auto max-w-[640px] px-5 py-24 text-center sm:px-8">
        <p className="text-[13px] font-semibold tracking-wide text-[#41454d] uppercase">404</p>
        <h1 className="mt-3 text-[36px] font-normal tracking-tight text-[#181d26]">This page wandered off</h1>
        <p className="mt-3 text-[16px] text-[#41454d]">The link you followed doesn't exist. Let's get you back on track.</p>
        <div className="mt-7 flex justify-center gap-3">
          <DarkButton onClick={() => navigate("/")}>Go home</DarkButton>
        </div>
      </main>
      <Footer />
    </div>
  );
}

function Routes() {
  const { path } = useRouter();
  if (path === "/") return <Landing />;
  if (path === "/login") return <Login />;
  if (path === "/auth/callback") return <AuthCallback />;
  if (path === "/dashboard") return <Dashboard />;
  if (path === "/onboarding") return <Onboarding />;
  if (path === "/connect-guide") return <ConnectGuide />;
  if (path === "/privacy") return <Privacy />;
  if (path === "/data-deletion") return <DataDeletion />;
  return <NotFound />;
}

export default function App() {
  return (
    <RouterProvider>
      <AuthProvider>
        <Routes />
      </AuthProvider>
    </RouterProvider>
  );
}
