/**
 * SKUP Studio mark — a terminal prompt (caret + cursor rule), unframed and
 * thin. Refined from the original rounded-square version: dropping the
 * frame and thinning the stroke reads as more precise at a glance and holds
 * up better at favicon size.
 */
export function LogoMark({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 36 36"
      fill="none"
      aria-hidden="true"
      className={className}
    >
      <path
        d="M13 13 19 18 13 23"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M22 23h5"
        stroke="var(--accent)"
        strokeWidth="1.7"
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
