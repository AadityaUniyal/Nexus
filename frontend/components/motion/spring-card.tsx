'use client';

import React from 'react';
import { motion, HTMLMotionProps } from 'motion/react';
import { useReducedMotion } from '@/hooks/use-reduced-motion';
import { cn } from '@/lib/utils';

interface SpringCardProps extends HTMLMotionProps<'div'> {
  children: React.ReactNode;
  className?: string;
  hoverLift?: boolean;
  tapScale?: boolean;
  borderVariant?: 'default' | 'simulation' | 'active' | 'subtle';
}

export function SpringCard({
  children,
  className = '',
  hoverLift = true,
  tapScale = true,
  borderVariant = 'default',
  ...props
}: SpringCardProps) {
  const reducedMotion = useReducedMotion();

  const borderClasses = {
    default: 'border border-nexus-surface-container-high bg-white/90 shadow-tactile',
    simulation: 'border-2 border-dashed border-nexus-lavender/50 bg-nexus-lavender/5 shadow-tactile',
    active: 'border border-nexus-secondary/40 bg-nexus-secondary/5 shadow-tactile-hover',
    subtle: 'border border-nexus-surface-container-high/60 bg-nexus-surface/50 shadow-sm',
  }[borderVariant];

  return (
    <motion.div
      whileHover={
        !reducedMotion && hoverLift
          ? { y: -2, transition: { type: 'spring', stiffness: 400, damping: 25 } }
          : undefined
      }
      whileTap={
        !reducedMotion && tapScale
          ? { scale: 0.985, transition: { type: 'spring', stiffness: 500, damping: 30 } }
          : undefined
      }
      className={cn('rounded-xl transition-colors duration-200', borderClasses, className)}
      {...props}
    >
      {children}
    </motion.div>
  );
}
