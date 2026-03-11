import type { ReactNode } from "react";

/**
 * Form section wrapper for Create/Edit listing: section title + content.
 * Renders as a card with shared styling to match the UI system.
 */
export function FormSection({
  title,
  children,
  className = "",
}: {
  title: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`rounded-2xl border border-gray-200/60 bg-white p-6 shadow-card space-y-4 ${className}`.trim()}
    >
      <h2 className="text-lg font-semibold text-brand border-b border-gray-100 pb-3">{title}</h2>
      {children}
    </section>
  );
}
