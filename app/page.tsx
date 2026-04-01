import { PageContainer } from "@/components/layout/PageContainer";
import { LandingCtas } from "@/components/auth/LandingCtas";

export default function Home() {
  return (
    <PageContainer>
      <div className="flex flex-col items-center pt-4 text-center md:pt-8">
        {/* Hero */}
        <div className="relative w-full max-w-2xl overflow-hidden rounded-3xl border border-gray-200/60 bg-white px-6 py-14 shadow-card sm:px-14 md:py-20">
          {/* Subtle gradient glow behind hero */}
          <div className="pointer-events-none absolute -top-24 left-1/2 h-56 w-[32rem] -translate-x-1/2 rounded-full bg-accent/5 blur-3xl" aria-hidden="true" />

          <div className="relative">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-accent/15 bg-accent-light px-3.5 py-1 text-xs font-semibold tracking-wide text-accent">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-accent" aria-hidden="true" />
              UIUC Students Only
            </span>

            <h1 className="mt-7 text-4xl font-extrabold leading-[1.1] tracking-tight text-brand sm:text-5xl md:text-6xl">
              Find Student Housing
              <br />
              at UIUC
            </h1>

            <p className="mx-auto mt-5 max-w-md text-base leading-relaxed text-gray-500 sm:text-lg">
              Find subleases, lease takeovers, and full-year housing from verified UIUC students. Browse, filter, and connect directly.
            </p>

            <div className="mt-9">
              <LandingCtas />
            </div>
          </div>
        </div>

        {/* How it works */}
        <div className="mt-12 grid w-full max-w-3xl gap-4 sm:grid-cols-3">
          <FeatureCard
            icon={<path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />}
            title="Browse & filter"
            desc="Search by price, dates, room type, and more to find the perfect fit."
          />
          <FeatureCard
            icon={<path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" />}
            title="Verified students"
            desc="Every account is verified with an @illinois.edu email. No spam, no scams."
          />
          <FeatureCard
            icon={<path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />}
            title="Connect directly"
            desc="Get the seller's email and work out the details, Illini to Illini."
          />
        </div>
      </div>
    </PageContainer>
  );
}

function FeatureCard({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <div className="group rounded-2xl border border-gray-200/60 bg-white p-6 shadow-card transition-all duration-300 hover:shadow-card-hover hover:-translate-y-0.5">
      <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-accent-light text-accent transition-colors group-hover:bg-accent group-hover:text-white">
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden="true">
          {icon}
        </svg>
      </div>
      <p className="text-sm font-semibold text-gray-900">{title}</p>
      <p className="mt-1.5 text-sm leading-relaxed text-gray-500">{desc}</p>
    </div>
  );
}
