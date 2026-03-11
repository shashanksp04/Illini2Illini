import type { ReactNode } from "react";

export function PageContainer({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={`mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 md:py-10 lg:px-8 ${className}`.trim()}>
      {children}
    </div>
  );
}
