import { LandingCtas } from "@/components/auth/LandingCtas";

export default function Home() {
  return (
    <main
      className="min-h-screen flex flex-col items-center justify-center px-6"
      style={{ backgroundColor: "#F8F9FB" }}
    >
      <div className="max-w-xl w-full text-center space-y-6 rounded-xl bg-white border border-[#E5E7EB] shadow-sm px-6 py-8">
        <h1 className="text-3xl font-semibold" style={{ color: "#111827" }}>
          Illini2Illini
        </h1>
        <p className="text-base" style={{ color: "#6B7280" }}>
          UIUC short-term housing marketplace. Find subleases and lease takeovers from verified students.
        </p>
        <LandingCtas />
      </div>
    </main>
  );
}
