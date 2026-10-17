"use client";

import * as React from "react";
import Link from "next/link";
import { motion, useScroll, useTransform, AnimatePresence } from "motion/react";
import {
  ArrowRight,
  Sparkles,
  QrCode,
  ShieldCheck,
  Radio,
  ExternalLink,
  ChevronDown,
  Volume2,
  VolumeX,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { tactileAudio } from "@/lib/sound-effects";

const CHAPTERS = [
  {
    id: "01",
    tag: "A NEW BEGINNING",
    headline: "We didn't just build fleet software.",
    subline: "We reimagined how the physical world moves.",
    range: [0.0, 0.18] as [number, number],
  },
  {
    id: "02",
    tag: "THE PHYSICAL REALITY",
    headline: "Every highway. Every intermodal port. Every watt of energy.",
    subline: "Global freight isn't abstract data. It is millions of tons of kinetic mass in constant motion.",
    range: [0.22, 0.38] as [number, number],
  },
  {
    id: "03",
    tag: "THE HISTORIC FLAW",
    headline: "For decades, logistics operated in the dark.",
    subline: "Fragmented spreadsheets. Reactive panic. Second-guessing every storm, every depot, every delay.",
    range: [0.42, 0.58] as [number, number],
  },
  {
    id: "04",
    tag: "THE LIVING NERVOUS SYSTEM",
    headline: "What if your entire fleet thought as one?",
    subline: "Anticipating mountain snowbanks, battery thermal decay, and dock bottlenecks with sub-18ms precision.",
    range: [0.62, 0.78] as [number, number],
  },
  {
    id: "05",
    tag: "THE ARRIVAL",
    headline: "Engineered for absolute certainty.",
    subline: "Designed for human intuition. Built for zero fleet downtime. This is NEXUS.",
    range: [0.82, 1.0] as [number, number],
  },
];

export function AppleScrollytellingStory() {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const videoRef = React.useRef<HTMLVideoElement>(null);
  const [isMuted, setIsMuted] = React.useState(true);
  const [activeChapterIndex, setActiveChapterIndex] = React.useState(0);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });

  // Calculate active chapter dynamically based on scroll
  React.useEffect(() => {
    const unsubscribe = scrollYProgress.on("change", (latest) => {
      let idx = 0;
      if (latest < 0.2) idx = 0;
      else if (latest < 0.4) idx = 1;
      else if (latest < 0.6) idx = 2;
      else if (latest < 0.8) idx = 3;
      else idx = 4;
      setActiveChapterIndex(idx);
    });
    return () => unsubscribe();
  }, [scrollYProgress]);

  // Video brightness & scale parallax transforms
  const videoScale = useTransform(scrollYProgress, [0, 1], [1.05, 1.18]);
  const videoOpacity = useTransform(scrollYProgress, [0, 0.1, 0.85, 1], [0.4, 0.55, 0.55, 0.25]);

  return (
    <div
      ref={containerRef}
      className="relative w-full bg-[#050507] text-white selection:bg-orange-500/30 selection:text-orange-200"
      style={{ height: "500vh" }}
    >
      {/* Sticky Full-Viewport Stage */}
      <div className="sticky top-0 h-screen w-full overflow-hidden flex flex-col justify-between z-10">
        {/* Background Cinematic Video Layer */}
        <motion.div
          style={{ scale: videoScale, opacity: videoOpacity }}
          className="absolute inset-0 w-full h-full pointer-events-none z-0"
        >
          <video
            ref={videoRef}
            autoPlay
            loop
            muted={isMuted}
            playsInline
            preload="auto"
            className="w-full h-full object-cover filter brightness-[0.45] contrast-[1.25] saturate-[1.1]"
          >
            <source
              src="https://upload.wikimedia.org/wikipedia/commons/7/78/Alaskan_Way_Viaduct_timelapse.webm"
              type="video/webm"
            />
            <source
              src="https://upload.wikimedia.org/wikipedia/commons/6/68/Avtocesta.webm"
              type="video/webm"
            />
            <source
              src="https://upload.wikimedia.org/wikipedia/commons/8/82/Cars_driving_at_night.webm"
              type="video/webm"
            />
          </video>
        </motion.div>

        {/* Cinematic Vignette Overlays & Studio Lighting */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#050507] via-[#050507]/40 to-[#050507]/90 pointer-events-none z-[1]" />
        <div className="absolute inset-0 bg-radial-vignette pointer-events-none z-[1] opacity-70" />
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-tr from-orange-600/10 to-amber-500/10 rounded-full blur-[140px] pointer-events-none z-[1]" />

        {/* Minimalist Floating Apple Navigation Header */}
        <header className="relative z-30 w-full px-6 sm:px-12 py-6 flex items-center justify-between max-w-7xl mx-auto">
          <Link
            href="/"
            className="group flex items-center gap-3 select-none"
            onClick={() => tactileAudio.playClick()}
          >
            <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-orange-500/20 to-amber-500/30 border border-orange-500/40 flex items-center justify-center text-amber-400 font-black tracking-tighter text-sm shadow-xl shadow-orange-950/40 group-hover:scale-105 transition-transform">
              NX
            </div>
            <div>
              <span className="text-base font-extrabold tracking-tight block leading-none text-white">NEXUS</span>
              <span className="text-[10px] font-mono text-stone-400 uppercase tracking-widest">
                Operating System
              </span>
            </div>
          </Link>

          {/* Center Apple-Style Progress Pill */}
          <div className="hidden md:flex items-center gap-2 bg-stone-900/70 backdrop-blur-xl border border-white/10 px-4 py-1.5 rounded-full text-xs font-mono text-stone-300 shadow-2xl">
            <span className="text-orange-400 font-bold">{CHAPTERS[activeChapterIndex].id}</span>
            <span className="text-stone-600">/</span>
            <span className="text-stone-400 tracking-wider uppercase text-[11px]">
              {CHAPTERS[activeChapterIndex].tag}
            </span>
          </div>

          {/* Quick CTAs */}
          <div className="flex items-center gap-3">
            <Link href="/overview">
              <Button
                variant="primary"
                size="sm"
                onClick={() => tactileAudio.playSuccess()}
                className="font-mono text-xs px-4 py-2 rounded-full bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white font-bold shadow-xl shadow-orange-950/50 gap-1.5"
              >
                <span>Enter Cockpit</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </Link>
          </div>
        </header>

        {/* Centered Story Theater (Pure Apple Scrollytelling) */}
        <main className="relative z-20 w-full max-w-5xl mx-auto px-6 sm:px-12 flex-1 flex flex-col justify-center items-center text-center">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeChapterIndex}
              initial={{ opacity: 0, y: 30, filter: "blur(8px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              exit={{ opacity: 0, y: -30, filter: "blur(8px)" }}
              transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
              className="space-y-6 max-w-4xl"
            >
              {/* Chapter Tag */}
              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white/5 border border-white/10 text-orange-400 text-xs font-mono uppercase tracking-widest backdrop-blur-md">
                <span className="w-1.5 h-1.5 rounded-full bg-orange-400 animate-pulse" />
                <span>{CHAPTERS[activeChapterIndex].tag}</span>
              </div>

              {/* Giant Apple Typography */}
              <h1 className="text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-black tracking-tight leading-[1.04] text-white">
                {activeChapterIndex === 4 ? (
                  <>
                    Engineered for <br />
                    <span className="bg-gradient-to-r from-orange-400 via-amber-300 to-yellow-400 bg-clip-text text-transparent">
                      Absolute Certainty.
                    </span>
                  </>
                ) : (
                  CHAPTERS[activeChapterIndex].headline
                )}
              </h1>

              {/* Subtitle / Philosophy */}
              <p className="text-base sm:text-xl md:text-2xl text-stone-300 font-light leading-relaxed max-w-2xl mx-auto tracking-normal">
                {CHAPTERS[activeChapterIndex].subline}
              </p>

              {/* Final Chapter Interactive Action Group */}
              {activeChapterIndex === 4 && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.2, duration: 0.5 }}
                  className="flex flex-wrap items-center justify-center gap-4 pt-6"
                >
                  <Link href="/overview">
                    <Button
                      variant="primary"
                      size="lg"
                      onClick={() => tactileAudio.playSuccess()}
                      className="font-mono text-sm font-bold px-8 py-7 rounded-2xl bg-gradient-to-r from-orange-600 via-amber-600 to-yellow-500 hover:from-orange-500 hover:to-amber-500 text-white shadow-2xl shadow-orange-950/80 gap-2 hover:scale-[1.02] transition-transform"
                    >
                      <span>Launch Operating System</span>
                      <ArrowRight className="w-4 h-4" />
                    </Button>
                  </Link>
                  <Link href="/driver-pass">
                    <Button
                      variant="outline"
                      size="lg"
                      onClick={() => tactileAudio.playClick()}
                      className="font-mono text-sm font-semibold px-6 py-7 rounded-2xl border-stone-800 hover:border-orange-500 text-stone-200 hover:text-white bg-stone-900/60 backdrop-blur-xl gap-2"
                    >
                      <QrCode className="w-4 h-4 text-orange-400" />
                      <span>Zero-Install Driver Pass</span>
                    </Button>
                  </Link>
                </motion.div>
              )}
            </motion.div>
          </AnimatePresence>
        </main>

        {/* Bottom Status & Chapter Navigation Bar */}
        <footer className="relative z-30 w-full px-6 sm:px-12 py-6 max-w-7xl mx-auto flex items-center justify-between">
          {/* Scroll Down Cue */}
          <div className="flex items-center gap-2 text-[11px] font-mono text-stone-500">
            {activeChapterIndex < 4 ? (
              <>
                <ChevronDown className="w-3.5 h-3.5 text-stone-400 animate-bounce" />
                <span className="uppercase tracking-wider">Scroll to reveal story</span>
              </>
            ) : (
              <span className="text-orange-400 font-bold uppercase tracking-wider">
                ● Complete Manifesto
              </span>
            )}
          </div>

          {/* Chapter Timeline Indicator Dots */}
          <div className="flex items-center gap-2">
            {CHAPTERS.map((ch, idx) => (
              <div
                key={ch.id}
                className={`h-1.5 rounded-full transition-all duration-500 ${
                  activeChapterIndex === idx
                    ? "w-8 bg-gradient-to-r from-orange-500 to-amber-400 shadow-sm shadow-orange-500"
                    : "w-2 bg-stone-800"
                }`}
              />
            ))}
          </div>

          {/* Live Operational Status */}
          <Link
            href="/status"
            className="flex items-center gap-2 text-[11px] font-mono text-stone-400 hover:text-white transition-colors"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="hidden sm:inline">SLA 99.98% Operational</span>
          </Link>
        </footer>

        {/* Global Progress Line across the bottom */}
        <motion.div
          style={{ scaleX: scrollYProgress }}
          className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-orange-500 via-amber-400 to-yellow-400 origin-left z-40"
        />
      </div>
    </div>
  );
}
