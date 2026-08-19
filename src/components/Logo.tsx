/**
 * SKUP Studio mark — a terminal prompt (caret + cursor rule) inside a soft
 * square. Reads as "developer studio" without leaning on a literal code glyph.
 */
export function LogoMark({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 36 36"
      fill="none"
      aria-hidden="true"
      className={className}
    >
      <rect
        x="0.9"
        y="0.9"
        width="34.2"
        height="34.2"
        rx="10.5"
        stroke="currentColor"
        strokeOpacity="0.28"
        strokeWidth="1.2"
      />
      <path
        d="M12 13.5 16.8 18 12 22.5"
        stroke="currentColor"
        strokeWidth="2.1"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M19.6 22.6h5.2"
        stroke="var(--accent)"
        strokeWidth="2.1"
        strokeLinecap="round"
      />
    </svg>
  );
}

export default function Logo({ className = "" }: { className?: string }) {
  return (
    <span className={`flex items-center gap-2.5 ${className}`}>
      <LogoMark className="h-8 w-8 shrink-0 text-fg" />
      <span className="flex flex-col leading-none">
        <span className="font-display text-[15px] font-semibold tracking-tight text-fg">
          SKUP
        </span>
        <span className="mt-[3px] text-[9px] font-medium uppercase tracking-[0.32em] text-subtle">
          Studio
        </span>
      </span>
    </span>
  );
}
