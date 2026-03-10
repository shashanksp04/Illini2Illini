import { PageContainer } from "@/components/layout/PageContainer";
import { LandingCtas } from "@/components/auth/LandingCtas";

export default function Home() {
  return (
    <PageContainer>
      <section className="mx-auto max-w-3xl pt-20 pb-24">
        <div className="rounded-2xl border border-gray-200 bg-white px-8 py-10 text-center shadow-sm">
          <h1 className="text-4xl font-semibold text-illini-blue md:text-5xl">
            Find Short-Term Housing at UIUC
          </h1>
          <p className="mt-6 text-lg text-gray-600">
            UIUC short-term housing marketplace. Find subleases and lease takeovers from verified students.
          </p>
          <div className="mt-6">
            <LandingCtas />
          </div>
        </div>
      </section>
    </PageContainer>
  );
}
