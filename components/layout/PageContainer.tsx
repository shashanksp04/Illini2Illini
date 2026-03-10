import type { ReactNode } from "react";

/**
 * App Shell page content container. Use on every page.
 * UI_SPEC: mx-auto max-w-6xl px-4 sm:px-6 lg:px-8, space-y-6 (mobile) / space-y-8 (desktop).
 */
export function PageContainer({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={`mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8 space-y-6 md:space-y-8 ${className}`.trim()}
    >
      {children}
    </div>
  );
}
