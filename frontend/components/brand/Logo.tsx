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
      className={cn("shrink-0", className)}
      aria-hidden="true"
    >
      <rect width="32" height="32" rx="8" fill="var(--brand-700, #0e5e58)" />
      <path d="M9 23V9.5" stroke="#fff" strokeWidth="2.6" strokeLinecap="round" />
      <path d="M23 22.5V9" stroke="#fff" strokeWidth="2.6" strokeLinecap="round" opacity="0.55" />
      <path d="M9 9.5L16.2 18.4L19.2 15.2L23 22.5" stroke="#fff" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="23" cy="9" r="2.6" fill="var(--accent-500, #e0652a)" />
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
