'use client';

import React from 'react';
import { motion } from 'motion/react';
import { useReducedMotion } from '@/hooks/use-reduced-motion';
import { cn } from '@/lib/utils';

interface RevealProps {
  children: React.ReactNode;
  delay?: number;
  direction?: 'up' | 'down' | 'left' | 'right';
  className?: string;
  width?: 'fit-content' | '100%';
}

export function Reveal({
  children,
  delay = 0.1,
  direction = 'up',
  className = '',
  width = '100%',
}: RevealProps) {
  const reducedMotion = useReducedMotion();

  const getTransform = () => {
    if (reducedMotion) return { x: 0, y: 0 };
    switch (direction) {
      case 'up':
        return { x: 0, y: 24 };
      case 'down':
        return { x: 0, y: -24 };
      case 'left':
        return { x: 24, y: 0 };
      case 'right':
        return { x: -24, y: 0 };
      default:
        return { x: 0, y: 24 };
    }
  };

  const initial = getTransform();

  return (
    <div style={{ width, overflow: 'hidden' }} className={cn('relative', className)}>
      <motion.div
        variants={{
          hidden: { opacity: 0, x: initial.x, y: initial.y },
          visible: { opacity: 1, x: 0, y: 0 },
        }}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        transition={{
          duration: 0.5,
          delay,
          ease: [0.25, 0.1, 0.25, 1],
        }}
      >
        {children}
      </motion.div>
    </div>
  );
}
