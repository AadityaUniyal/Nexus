"use client";

import * as React from "react";
import { AppleScrollytellingStory } from "@/components/brand/AppleScrollytellingStory";

/**
 * NEXUS - Flagship Apple-Style Cinematic Scrollytelling Experience
 * Pure story, cinematic background video, dynamic scroll choreography.
 * Zero feature demo clutter, zero noise. Pure Apple design philosophy.
 */
export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#050507] text-white selection:bg-orange-500/30 selection:text-orange-200 font-sans antialiased overflow-x-hidden">
      <AppleScrollytellingStory />
    </div>
  );
}
