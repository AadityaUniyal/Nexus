'use client';

import React, { useRef } from 'react';
import { motion, useScroll, useTransform } from 'motion/react';
import { useReducedMotion } from '@/hooks/use-reduced-motion';
import { cn } from '@/lib/utils';

interface ScrollStorySectionProps {
  step: string;
  title: string;
  subtitle: string;
  description: string;
  badge?: string;
  badgeVariant?: 'default' | 'simulation' | 'operational' | 'alert';
  children?: React.ReactNode;
  align?: 'left' | 'right';
  className?: string;
}

export function ScrollStorySection({
  step,
  title,
  subtitle,
  description,
  badge,
  badgeVariant = 'operational',
  children,
  align = 'left',
  className = '',
}: ScrollStorySectionProps) {
  const sectionRef = useRef<HTMLDivElement>(null);
  const reducedMotion = useReducedMotion();

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start end', 'end start'],
  });

  const opacity = useTransform(scrollYProgress, [0.1, 0.3, 0.7, 0.9], [0, 1, 1, 0.4]);
  const y = useTransform(scrollYProgress, [0.1, 0.3, 0.7, 0.9], [40, 0, 0, -20]);

  const badgeStyles = {
    operational: 'bg-nexus-secondary-container/40 text-nexus-secondary border-nexus-secondary/30',
    simulation: 'bg-nexus-lavender/20 text-nexus-lavender-dark border-nexus-lavender/40',
    alert: 'bg-nexus-critical/10 text-nexus-critical border-nexus-critical/30',
    default: 'bg-nexus-surface-container text-nexus-primary border-nexus-outline/20',
  }[badgeVariant];

  return (
    <div ref={sectionRef} className={cn('min-h-[85vh] flex items-center py-16', className)}>
      <motion.div
        style={reducedMotion ? undefined : { opacity, y }}
        className="w-full max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center"
      >
        <div
          className={cn(
            'lg:col-span-5 space-y-6',
            align === 'right' ? 'lg:order-2 lg:col-start-8' : 'lg:order-1'
          )}
        >
          <div className="flex items-center gap-3">
            <span className="font-mono text-xs font-semibold px-2.5 py-1 rounded bg-nexus-surface-container text-nexus-on-surface-variant border border-nexus-surface-container-high">
              {step}
            </span>
            {badge && (
              <span
                className={cn(
                  'font-mono text-xs font-medium px-2.5 py-1 rounded-full border',
                  badgeStyles
                )}
              >
                {badge}
              </span>
            )}
          </div>

          <div className="space-y-2">
            <h3 className="text-sm font-mono uppercase tracking-wider text-nexus-secondary font-semibold">
              {subtitle}
            </h3>
            <h2 className="text-3xl lg:text-4xl font-bold tracking-tight text-nexus-on-surface font-display">
              {title}
            </h2>
          </div>

          <p className="text-nexus-on-surface-variant text-base leading-relaxed">
            {description}
          </p>
        </div>

        <div
          className={cn(
            'lg:col-span-7',
            align === 'right' ? 'lg:order-1 lg:col-start-1' : 'lg:order-2'
          )}
        >
          {children}
        </div>
      </motion.div>
    </div>
  );
}
