import * as React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

/**
 * VOYAGE brand glyph:
 * An Apple-style geometric squircle encapsulating a forward-converging highway corridor
 * with a dynamic precision destination horizon marker.
 */
export function LogoMark({ size = 32, className }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("shrink-0", className)}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="voyage-bg" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#1C1C1E" />
          <stop offset="100%" stopColor="#000000" />
        </linearGradient>
        <linearGradient id="voyage-accent" x1="8" y1="24" x2="24" y2="8" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#0071E3" />
          <stop offset="100%" stopColor="#2997FF" />
        </linearGradient>
      </defs>

      {/* Apple-style Precision Squircle Base */}
      <rect
        x="1"
        y="1"
        width="30"
        height="30"
        rx="8"
        fill="url(#voyage-bg)"
        stroke="rgba(255, 255, 255, 0.15)"
        strokeWidth="1"
      />

      {/* Converging Highway Corridor Lines */}
      <path
        d="M9 23L14.5 11"
        stroke="#FFFFFF"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
      <path
        d="M23 23L17.5 11"
        stroke="#FFFFFF"
        strokeWidth="2.2"
        strokeLinecap="round"
      />

      {/* Horizon Vector Chevron */}
      <path
        d="M11 16L16 10L21 16"
        stroke="url(#voyage-accent)"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Forward Waypoint Pulse */}
      <circle cx="16" cy="9.5" r="2" fill="#2997FF" />
    </svg>
  );
}

export interface LogoProps {
  href?: string;
  size?: number;
  tagline?: string;
  className?: string;
  hideWordmarkOnMobile?: boolean;
}

export function Logo({
  href = "/",
  size = 32,
  tagline = "The Freight Operating System",
  className,
  hideWordmarkOnMobile,
}: LogoProps) {
  const content = (
    <span className={cn("inline-flex items-center gap-2.5 select-none group", className)}>
      <LogoMark size={size} />
      <span className={cn("flex flex-col text-left", hideWordmarkOnMobile && "hidden sm:flex")}>
        <span className="font-semibold tracking-[-0.03em] text-[15px] leading-tight text-neutral-900 dark:text-white group-hover:text-neutral-700 dark:group-hover:text-neutral-200 transition-colors font-sans">
          VOYAGE
        </span>
        {tagline && (
          <span className="text-[10px] uppercase tracking-[0.06em] text-neutral-500 dark:text-neutral-400 font-mono">
            {tagline}
          </span>
        )}
      </span>
    </span>
  );

  if (href) {
    return (
      <Link href={href} className="inline-flex items-center focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded-lg">
        {content}
      </Link>
    );
  }

  return content;
}
