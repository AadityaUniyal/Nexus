"use client";

import * as React from "react";
import { motion, AnimatePresence } from "motion/react";
import { ChevronUp } from "lucide-react";
import { tactileAudio } from "@/lib/sound-effects";

export interface AppleHelloGreetingProps {
  onUnlock: () => void;
  className?: string;
}

const GREETINGS = [
  { text: "Hello", lang: "English", sub: "Press Enter or Click to Continue" },
  { text: "नमस्ते", lang: "Hindi", sub: "जारी रखने के लिए क्लिक करें" },
  { text: "Bonjour", lang: "French", sub: "Cliquez pour continuer" },
  { text: "Hola", lang: "Spanish", sub: "Haga clic para continuar" },
  { text: "Ciao", lang: "Italian", sub: "Fai clic per continuare" },
  { text: "こんにちは", lang: "Japanese", sub: "クリックして続ける" },
  { text: "Olá", lang: "Portuguese", sub: "Clique para continuar" },
  { text: "Hallo", lang: "German", sub: "Klicken Sie zum Fortfahren" },
  { text: "你好", lang: "Chinese", sub: "点击以继续" },
];

/**
 * AppleHelloGreeting
 * Authentic Apple iOS initial setup greeting screen.
 * Gracefully cycles through "Hello" -> "नमस्ते" -> "Bonjour" -> "Hola"
 * with Apple's iconic blur-fade typographic physics and swipe/click unlock transition.
 */
export function AppleHelloGreeting({ onUnlock, className = "" }: AppleHelloGreetingProps) {
  const [index, setIndex] = React.useState(0);

  // Auto-cycle through languages
  React.useEffect(() => {
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % GREETINGS.length);
    }, 2200);
    return () => clearInterval(timer);
  }, []);

  // Listen for keyboard unlock (Enter or Space)
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Enter" || e.key === " " || e.key === "ArrowUp") {
        e.preventDefault();
        tactileAudio.playClick();
        onUnlock();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onUnlock]);

  const current = GREETINGS[index];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, y: -40, filter: "blur(12px)" }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      onClick={() => {
        tactileAudio.playClick();
        onUnlock();
      }}
      className={`fixed inset-0 z-50 flex flex-col items-center justify-between py-16 px-6 bg-[#FAFAF7] dark:bg-[#0B0B0D] text-[#11120F] dark:text-[#F4F2EC] cursor-pointer select-none transition-colors duration-500 ${className}`}
    >
      {/* Top subtle status bar */}
      <div className="w-full max-w-sm flex items-center justify-between text-[11px] font-mono tracking-widest text-[#696762] dark:text-[#8A8680] uppercase">
        <span>NEXUS OS</span>
        <span className="flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-[#7F5200] dark:bg-[#FFC400]" />
          READY
        </span>
      </div>

      {/* Main Centered Apple iOS Greeting */}
      <div className="flex-1 flex flex-col items-center justify-center relative w-full max-w-md">
        <AnimatePresence mode="wait">
          <motion.div
            key={current.text}
            initial={{ opacity: 0, scale: 0.94, filter: "blur(10px)", y: 12 }}
            animate={{ opacity: 1, scale: 1, filter: "blur(0px)", y: 0 }}
            exit={{ opacity: 0, scale: 1.04, filter: "blur(10px)", y: -12 }}
            transition={{
              duration: 0.65,
              ease: [0.22, 1, 0.36, 1],
            }}
            className="text-center space-y-3"
          >
            <h1 className="text-6xl sm:text-7xl md:text-8xl font-normal tracking-tight font-serif sm:font-sans">
              {current.text}
            </h1>
            <p className="text-xs font-mono uppercase tracking-[0.2em] text-[#696762] dark:text-[#8A8680]">
              {current.lang}
            </p>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Bottom Apple Swipe / Click Cue */}
      <motion.div
        animate={{ y: [0, -6, 0] }}
        transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
        className="flex flex-col items-center gap-2 text-[#696762] dark:text-[#8A8680]"
      >
        <div className="p-2 rounded-full border border-black/10 dark:border-white/15 bg-black/[0.03] dark:bg-white/[0.05]">
          <ChevronUp className="h-4 w-4" />
        </div>
        <span className="text-xs font-mono uppercase tracking-[0.15em]">
          {current.sub}
        </span>
      </motion.div>
    </motion.div>
  );
}
