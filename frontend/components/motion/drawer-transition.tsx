'use client';

import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useReducedMotion } from '@/hooks/use-reduced-motion';
import { cn } from '@/lib/utils';

interface DrawerTransitionProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  side?: 'right' | 'left' | 'bottom';
  className?: string;
}

export function DrawerTransition({
  isOpen,
  onClose,
  children,
  side = 'right',
  className = '',
}: DrawerTransitionProps) {
  const reducedMotion = useReducedMotion();

  const getOffset = () => {
    switch (side) {
      case 'right':
        return { x: '100%', y: 0 };
      case 'left':
        return { x: '-100%', y: 0 };
      case 'bottom':
        return { x: 0, y: '100%' };
      default:
        return { x: '100%', y: 0 };
    }
  };

  const initialOffset = getOffset();

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={onClose}
            className="fixed inset-0 bg-nexus-primary/30 backdrop-blur-sm"
          />

          {/* Drawer Container */}
          <div
            className={cn(
              'fixed inset-y-0 flex max-w-full pointer-events-none',
              side === 'right' ? 'right-0 pl-10' : side === 'left' ? 'left-0 pr-10' : 'bottom-0 inset-x-0'
            )}
          >
            <motion.div
              initial={reducedMotion ? { opacity: 0 } : { ...initialOffset, opacity: 0.8 }}
              animate={{ x: 0, y: 0, opacity: 1 }}
              exit={reducedMotion ? { opacity: 0 } : { ...initialOffset, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 350, damping: 32 }}
              className={cn('w-screen pointer-events-auto shadow-2xl', className)}
            >
              {children}
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
}
