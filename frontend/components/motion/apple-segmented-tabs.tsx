'use client';

import * as React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/lib/utils';

export interface AppleTabItem {
  id: string;
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
  badge?: string | number;
  badgeVariant?: 'default' | 'accent' | 'warning';
}

interface AppleSegmentedTabsProps {
  tabs: AppleTabItem[];
  activeId: string;
  onChange: (id: string) => void;
  className?: string;
  pillClassName?: string;
  layoutId?: string;
  size?: 'sm' | 'md' | 'lg';
}

/**
 * Apple-grade Segmented Tabs with fluid spring physics via motion.dev.
 * Replicates the macOS / iOS floating pill segmented control with continuous layout morphing.
 */
export function AppleSegmentedTabs({
  tabs,
  activeId,
  onChange,
  className,
  pillClassName,
  layoutId = 'apple-segmented-active-pill',
  size = 'md',
}: AppleSegmentedTabsProps) {
  const sizeStyles = {
    sm: 'p-1 gap-1 text-xs',
    md: 'p-1.5 gap-1.5 text-sm',
    lg: 'p-2 gap-2 text-base',
  };

  const buttonPadding = {
    sm: 'px-2.5 py-1',
    md: 'px-3.5 py-1.5',
    lg: 'px-4.5 py-2',
  };

  return (
    <div
      role="tablist"
      aria-orientation="horizontal"
      className={cn(
        'relative inline-flex items-center rounded-full',
        'bg-[#1d1d1f]/80 dark:bg-[#1d1d1f]/90 light:bg-black/[0.05]',
        'backdrop-blur-xl border border-white/[0.08] dark:border-white/[0.08] shadow-[0_4px_20px_-4px_rgba(0,0,0,0.3)]',
        'transition-colors duration-200 select-none',
        sizeStyles[size],
        className
      )}
    >
      {tabs.map((tab) => {
        const isActive = tab.id === activeId;
        const Icon = tab.icon;

        return (
          <button
            key={tab.id}
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(tab.id)}
            className={cn(
              'relative z-10 flex items-center justify-center font-medium rounded-full cursor-pointer outline-none transition-colors duration-200',
              buttonPadding[size],
              isActive
                ? 'text-white dark:text-white font-semibold'
                : 'text-[#86868b] hover:text-[#d2d2d7] active:text-white'
            )}
            style={{ WebkitTapHighlightColor: 'transparent' }}
          >
            {/* Active morphing pill background powered by motion.dev layoutId */}
            {isActive && (
              <motion.div
                layoutId={layoutId}
                transition={{
                  type: 'spring',
                  stiffness: 420,
                  damping: 32,
                  mass: 0.6,
                }}
                className={cn(
                  'absolute inset-0 rounded-full',
                  'bg-white/15 dark:bg-white/20 shadow-[0_2px_8px_rgba(0,0,0,0.25)]',
                  'border border-white/20 backdrop-blur-md',
                  pillClassName
                )}
              />
            )}

            <span className="relative z-20 flex items-center gap-1.5 tracking-tight">
              {Icon && <Icon className="w-4 h-4 shrink-0 transition-transform duration-200" />}
              <span>{tab.label}</span>
              {tab.badge !== undefined && (
                <span
                  className={cn(
                    'ml-1 text-[10px] font-mono font-semibold px-1.5 py-0.2 rounded-full uppercase tracking-wider',
                    isActive
                      ? 'bg-white/25 text-white'
                      : 'bg-white/10 text-[#86868b]'
                  )}
                >
                  {tab.badge}
                </span>
              )}
            </span>
          </button>
        );
      })}
    </div>
  );
}
