import Link from "next/link";

export default function NotFound() {
  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-6"
      style={{ backgroundColor: "#F8F9FB" }}
    >
      <h1 className="text-2xl font-semibold" style={{ color: "#111827" }}>
        Page not found
      </h1>
      <p className="text-base mt-2" style={{ color: "#6B7280" }}>
        The listing or page you’re looking for doesn’t exist or was removed.
      </p>
      <Link
        href="/listings"
        className="mt-4 rounded-lg px-4 py-2 text-sm font-medium text-white"
        style={{ backgroundColor: "#13294B" }}
      >
        Browse listings
      </Link>
    </div>
  );
}
