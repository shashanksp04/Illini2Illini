import type { ReactNode } from "react";

/**
 * Centered auth card: max-w-md, rounded-xl border shadow-md.
 * Reusable for Login, Signup, Profile Setup (and Email Verification if content fits).
 */
export function AuthCard({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={`mx-auto w-full max-w-md rounded-xl border border-gray-200 bg-white px-6 py-8 shadow-sm ${className}`.trim()}
    >
      {children}
    </div>
  );
}
