import type { ReactNode } from "react";

export function AuthCard({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={`mx-auto w-full max-w-md rounded-2xl border border-gray-200/60 bg-white p-8 shadow-elevated sm:p-10 ${className}`.trim()}
    >
      {children}
    </div>
  );
}
