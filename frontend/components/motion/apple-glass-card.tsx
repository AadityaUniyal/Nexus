'use client';

import * as React from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'motion/react';
import { cn } from '@/lib/utils';

interface AppleGlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  enableTilt?: boolean;
  enableSpecularGlow?: boolean;
  hoverScale?: number;
}

/**
 * Apple-grade Glass Card component with interactive specular sheen,
 * squircle geometry (rounded-[28px]), and spring physics via motion.dev.
 */
export function AppleGlassCard({
  children,
  className,
  enableTilt = true,
  enableSpecularGlow = true,
  hoverScale = 1.015,
  ...props
}: AppleGlassCardProps) {
  const cardRef = React.useRef<HTMLDivElement>(null);

  // Mouse coordinate values normalized between -0.5 and 0.5
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  // Smooth springs for fluid Apple feel
  const springX = useSpring(mouseX, { stiffness: 350, damping: 30 });
  const springY = useSpring(mouseY, { stiffness: 350, damping: 30 });

  // 3D tilt transforms
  const rotateX = useTransform(springY, [-0.5, 0.5], [4, -4]);
  const rotateY = useTransform(springX, [-0.5, 0.5], [-4, 4]);

  // Spotlight glare radial coordinates
  const glareX = useTransform(springX, [-0.5, 0.5], ['0%', '100%']);
  const glareY = useTransform(springY, [-0.5, 0.5], ['0%', '100%']);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    mouseX.set(x);
    mouseY.set(y);
  };

  const handleMouseLeave = () => {
    mouseX.set(0);
    mouseY.set(0);
  };

  return (
    <motion.div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      whileHover={{ scale: hoverScale }}
      whileTap={{ scale: 0.985 }}
      style={{
        rotateX: enableTilt ? rotateX : 0,
        rotateY: enableTilt ? rotateY : 0,
        transformStyle: 'preserve-3d',
      }}
      transition={{
        type: 'spring',
        stiffness: 380,
        damping: 30,
        mass: 0.8,
      }}
      className={cn(
        'group relative overflow-hidden rounded-[28px]',
        'bg-[#161617]/70 dark:bg-[#161617]/80',
        'backdrop-blur-2xl',
        'border border-white/[0.08] dark:border-white/[0.08]',
        'shadow-[0_10px_30px_-10px_rgba(0,0,0,0.5)]',
        'transition-colors duration-300',
        'hover:border-white/[0.18]',
        className
      )}
      {...(props as any)}
    >
      {/* Dynamic specular highlight glare that follows cursor */}
      {enableSpecularGlow && (
        <motion.div
          aria-hidden="true"
          className="pointer-events-none absolute -inset-px opacity-0 transition-opacity duration-300 group-hover:opacity-100 rounded-[28px]"
          style={{
            background: useTransform(
              [glareX, glareY],
              ([gx, gy]) =>
                `radial-gradient(550px circle at ${gx} ${gy}, rgba(255,255,255,0.08), transparent 70%)`
            ),
          }}
        />
      )}

      {/* Internal squircle rim illumination */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 rounded-[28px] ring-1 ring-inset ring-white/[0.05]"
      />

      <div className="relative z-10 p-6 md:p-8">
        {children}
      </div>
    </motion.div>
  );
}
