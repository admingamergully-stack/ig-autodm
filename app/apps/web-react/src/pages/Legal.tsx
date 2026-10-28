import { Header, Footer } from "../components/ui";

function Shell({ title, updated, children }: { title: string; updated: string; children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-white">
      <Header />
      <main className="mx-auto max-w-[800px] px-5 py-16 sm:px-8">
        <p className="text-[13px] font-semibold tracking-wide text-[#41454d] uppercase">Legal</p>
        <h1 className="mt-2 text-[36px] leading-tight font-normal tracking-tight text-[#181d26]">{title}</h1>
        <p className="mt-2 text-[14px] text-[#41454d]">Last updated: {updated}</p>
        <div className="mt-8 space-y-6 text-[15px] leading-relaxed text-[#333840]">{children}</div>
      </main>
      <Footer />
    </div>
  );
}

export function Privacy() {
  return (
    <Shell title="Privacy Policy" updated="September 1, 2026">
      <p>
        AutoDM ("we", "us") provides Instagram comment-to-DM automation for creators and businesses.
        This policy explains what data we collect, why, and your rights. In plain words: we only
        collect what's needed to reply to comments and send DMs you write.
      </p>
      <section>
        <h2 className="text-[20px] font-semibold text-[#181d26]">1. Data we collect</h2>
        <ul className="mt-2 list-disc space-y-1.5 pl-5">
          <li><strong>Account info:</strong> your email address from Google sign-in (via Supabase Auth).</li>
          <li><strong>Instagram connection:</strong> your Instagram user ID, username, and access token (via Meta's official OAuth). We never see your Instagram password.</li>
          <li><strong>Your content:</strong> trigger words, public replies, and DM texts you write, plus per-post settings.</li>
          <li><strong>Usage data:</strong> counts of replies and DMs sent, and basic error logs to keep the service running.</li>
        </ul>
      </section>
      <section>
        <h2 className="text-[20px] font-semibold text-[#181d26]">2. How we use it</h2>
        <ul className="mt-2 list-disc space-y-1.5 pl-5">
          <li>To detect comments containing your trigger words and send your replies and DMs.</li>
          <li>To show you per-post stats and keep your dashboard up to date.</li>
          <li>To keep your account secure and fix bugs.</li>
        </ul>
        <p className="mt-2">We do not sell your data. We do not use your content for advertising. We do not send messages you didn't write.</p>
      </section>
      <section>
        <h2 className="text-[20px] font-semibold text-[#181d26]">3. Meta & Instagram data</h2>
        <p className="mt-2">
          When you connect Instagram, Meta shares limited data under the permissions you approve
          (such as reading comments on your media and sending replies). We only request the minimum
          scopes needed for comment-to-DM automation, and we only act on media you configure.
        </p>
      </section>
      <section>
        <h2 className="text-[20px] font-semibold text-[#181d26]">4. Storage & security</h2>
        <p className="mt-2">
          Data is stored as follows: sign-in identity via Supabase Auth, app data (connections,
          settings, logs) in Turso (libSQL), processed on Cloudflare Workers. Instagram tokens
          are encrypted at rest and transmitted over HTTPS. Access is limited to what's needed
          to operate the service.
        </p>
      </section>
      <section>
        <h2 className="text-[20px] font-semibold text-[#181d26]">5. Your rights</h2>
        <p className="mt-2">
          You can disconnect Instagram any time from your dashboard to stop all automation
          immediately. You can request a copy or full deletion of your data at any time — see our{" "}
          <a href="/data-deletion" className="font-medium text-[#1b61c9] hover:underline">Data Deletion page</a>.
          We complete deletions within 30 days.
        </p>
      </section>
      <section>
        <h2 className="text-[20px] font-semibold text-[#181d26]">6. Contact</h2>
          <p className="mt-2">Questions about privacy? Email <span className="font-medium text-[#181d26]">igautodm.connect@gmail.com</span> and we'll reply within 5 business days.</p>
      </section>
    </Shell>
  );
}

export function DataDeletion() {
  return (
    <Shell title="Data Deletion" updated="September 1, 2026">
      <p>
        You can delete your AutoDM data at any time. Deleting stops all automation immediately and
        removes your messages, settings, and connection tokens.
      </p>
      <section className="rounded-[16px] bg-[#f5e9d4] p-6">
        <h2 className="text-[18px] font-semibold text-[#181d26]">How to request deletion</h2>
        <ol className="mt-3 list-decimal space-y-2 pl-5 text-[#333840]">
            <li>Email <span className="font-semibold text-[#181d26]">igautodm.connect@gmail.com</span> from the address you signed up with.</li>
          <li>Use the subject line: <span className="font-semibold text-[#181d26]">Delete my AutoDM data</span>.</li>
          <li>Include your Instagram username so we can find the right connection.</li>
        </ol>
        <p className="mt-3 text-[14px]">Prefer self-serve? Disconnect Instagram in your dashboard first — that pauses everything instantly while your request is processed.</p>
      </section>
      <section>
        <h2 className="text-[20px] font-semibold text-[#181d26]">What gets deleted</h2>
        <ul className="mt-2 list-disc space-y-1.5 pl-5">
          <li>Your account record and sign-in identity.</li>
          <li>Instagram connection tokens and account links.</li>
          <li>All trigger words, replies, DMs, and per-post settings.</li>
          <li>Reply and DM history/counts tied to your account.</li>
        </ul>
      </section>
      <section>
        <h2 className="text-[20px] font-semibold text-[#181d26]">Timeline</h2>
        <p className="mt-2">
          We confirm receipt within 5 business days and complete deletion within 30 days.
          Basic security logs may be kept for up to 90 days to prevent abuse, then removed.
        </p>
      </section>
      <section>
        <h2 className="text-[20px] font-semibold text-[#181d26]">Meta users</h2>
        <p className="mt-2">
          If you connected via Facebook/Instagram login, you can also remove AutoDM from your{" "}
          <span className="font-medium">Facebook Settings → Apps and Websites</span>. Removal there
          revokes our access tokens automatically.
        </p>
      </section>
    </Shell>
  );
}
