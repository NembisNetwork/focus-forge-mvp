import { cn } from "@/lib/utils";

export function PlandooLogo({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "grid size-9 shrink-0 place-items-center rounded-lg bg-primary text-primary-foreground shadow-sm",
        className,
      )}
      aria-hidden
    >
      <svg viewBox="0 0 32 32" className="size-6" fill="none">
        <circle cx="16" cy="16" r="10.5" stroke="currentColor" strokeWidth="2.5" />
        <circle cx="16" cy="16" r="4" stroke="currentColor" strokeWidth="2" />
        <path
          d="M16 5.5v6.5M16 20v6.5M5.5 16H12M20 16h6.5M8.6 8.6l4.6 4.6M18.8 18.8l4.6 4.6M23.4 8.6l-4.6 4.6M13.2 18.8l-4.6 4.6"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
    </span>
  );
}