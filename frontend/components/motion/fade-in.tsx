'use client';

import React from 'react';
import { motion, HTMLMotionProps } from 'motion/react';
import { useReducedMotion } from '@/hooks/use-reduced-motion';

interface FadeInProps extends HTMLMotionProps<'div'> {
  children: React.ReactNode;
  delay?: number;
  duration?: number;
  direction?: 'up' | 'down' | 'left' | 'right' | 'none';
  distance?: number;
  className?: string;
  viewportOnce?: boolean;
}

export function FadeIn({
  children,
  delay = 0,
  duration = 0.45,
  direction = 'up',
  distance = 18,
  className = '',
  viewportOnce = true,
  ...props
}: FadeInProps) {
  const reducedMotion = useReducedMotion();

  const getOffset = () => {
    if (reducedMotion || direction === 'none') return { x: 0, y: 0 };
    switch (direction) {
      case 'up':
        return { x: 0, y: distance };
      case 'down':
        return { x: 0, y: -distance };
      case 'left':
        return { x: distance, y: 0 };
      case 'right':
        return { x: -distance, y: 0 };
      default:
        return { x: 0, y: 0 };
    }
  };

  const offset = getOffset();

  return (
    <motion.div
      initial={{ opacity: 0, x: offset.x, y: offset.y }}
      whileInView={{ opacity: 1, x: 0, y: 0 }}
      viewport={{ once: viewportOnce, margin: '-40px' }}
      transition={{
        duration: reducedMotion ? 0.15 : duration,
        delay,
        ease: [0.21, 0.47, 0.32, 0.98],
      }}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  );
}
