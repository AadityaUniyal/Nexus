'use client';

import React from 'react';
import { motion } from 'motion/react';

interface AudioWaveformVisualizerProps {
  isActive: boolean;
  isSpeaking?: boolean;
  barCount?: number;
  className?: string;
}

export function AudioWaveformVisualizer({
  isActive,
  isSpeaking = false,
  barCount = 14,
  className = '',
}: AudioWaveformVisualizerProps) {
  return (
    <div className={`flex items-center gap-1 h-6 ${className}`}>
      {Array.from({ length: barCount }).map((_, i) => (
        <motion.span
          key={i}
          className={`w-1 rounded-full ${
            isSpeaking
              ? 'bg-purple-600 dark:bg-purple-400'
              : isActive
              ? 'bg-emerald-500 dark:bg-emerald-400'
              : 'bg-stone-300 dark:bg-stone-700'
          }`}
          animate={{
            height: isActive
              ? [4, isSpeaking ? (i % 3 === 0 ? 22 : 14) : (i % 2 === 0 ? 16 : 8), 4]
              : 4,
          }}
          transition={{
            duration: isSpeaking ? 0.45 : 0.8,
            repeat: Infinity,
            delay: i * 0.05,
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>
  );
}
