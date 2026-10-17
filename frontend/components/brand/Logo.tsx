import * as React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

/**
 * Nexus logomark: an "N" whose diagonal is a rising trend line ending in a
 * data point, inside a rounded tile. Reads as both the initial and a chart.
 */
export function LogoMark({ size = 32, className }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("shrink-0 drop-shadow-sm", className)}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="nexus-logo-bg" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#0F172A" />
          <stop offset="50%" stopColor="#0D4B46" />
          <stop offset="100%" stopColor="#072B28" />
        </linearGradient>
        <linearGradient id="nexus-logo-corridor" x1="9" y1="23" x2="23" y2="9" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#14B8A6" />
          <stop offset="50%" stopColor="#38BDF8" />
          <stop offset="100%" stopColor="#F97316" />
        </linearGradient>
      </defs>

      {/* Apple Squircle Base */}
      <rect x="1" y="1" width="30" height="30" rx="7.5" fill="url(#nexus-logo-bg)" stroke="#FFFFFF" strokeOpacity="0.25" strokeWidth="0.8" />

      {/* Fleet Origin Pillar */}
      <path d="M9 23V10" stroke="#FFFFFF" strokeWidth="2.6" strokeLinecap="round" />

      {/* Fleet Return / Destination Guide */}
      <path d="M23 22V12" stroke="#FFFFFF" strokeWidth="2.6" strokeLinecap="round" opacity="0.45" />

      {/* Nexus Intermodal Corridor Vector */}
      <path d="M9 10L15 18L18 15L23 9" stroke="url(#nexus-logo-corridor)" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />

      {/* Verified Delivery Checkpoint Beacon */}
      <circle cx="23" cy="9" r="2.4" fill="#F97316" stroke="#FFFFFF" strokeWidth="1.2" />
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

export function Logo({ href = "/", size = 32, tagline, className, hideWordmarkOnMobile }: LogoProps) {
  const content = (
    <>
      <LogoMark size={size} className="transition-transform duration-200 group-hover:scale-[1.04]" />
      <span className={cn("flex items-baseline gap-2", hideWordmarkOnMobile && "hidden sm:flex")}>
        <span className="text-[1.0625rem] font-semibold tracking-[-0.02em] text-nexus-on-surface">Nexus</span>
        {tagline && (
          <span className="hidden md:inline text-xs font-medium text-nexus-on-surface-variant">{tagline}</span>
        )}
      </span>
    </>
  );
  if (!href) return <span className={cn("inline-flex items-center gap-2.5", className)}>{content}</span>;
  return (
    <Link href={href} aria-label="Nexus home" className={cn("group inline-flex items-center gap-2.5 rounded-md", className)}>
      {content}
    </Link>
  );
}
