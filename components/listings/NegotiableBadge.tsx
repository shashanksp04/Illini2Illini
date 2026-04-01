export function NegotiableBadge({
  size = "default",
  className = "",
}: {
  size?: "default" | "compact";
  className?: string;
}) {
  const sizeClasses =
    size === "compact"
      ? "px-2 py-0.5 text-[11px] leading-tight"
      : "px-3 py-1 text-xs";

  return (
    <span
      className={`inline-flex max-w-full items-center rounded-full bg-emerald-600 font-bold text-white shadow-md ring-2 ring-emerald-400/60 ${sizeClasses} ${className}`.trim()}
    >
      Open to negotiation
    </span>
  );
}
