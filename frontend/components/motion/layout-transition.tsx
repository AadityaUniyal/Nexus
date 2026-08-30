'use client';

import React from 'react';
import { motion, LayoutGroup } from 'motion/react';
import { cn } from '@/lib/utils';

interface LayoutTransitionProps {
  children: React.ReactNode;
  id?: string;
  className?: string;
}

export function LayoutTransition({ children, id, className }: LayoutTransitionProps) {
  return (
    <motion.div layout layoutId={id} className={cn(className)} transition={{ type: 'spring', stiffness: 350, damping: 30 }}>
      {children}
    </motion.div>
  );
}

export { LayoutGroup };
