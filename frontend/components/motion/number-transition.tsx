'use client';

import React, { useEffect, useState } from 'react';
import { motion, useSpring, useTransform } from 'motion/react';
import { useReducedMotion } from '@/hooks/use-reduced-motion';

interface NumberTransitionProps {
  value: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  className?: string;
}

export function NumberTransition({
  value,
  prefix = '',
  suffix = '',
  decimals = 0,
  className = '',
}: NumberTransitionProps) {
  const reducedMotion = useReducedMotion();
  const [displayValue, setDisplayValue] = useState(value);

  const spring = useSpring(0, {
    stiffness: 100,
    damping: 20,
    duration: 1.2,
  });

  const formatted = useTransform(spring, (current) => {
    return `${prefix}${current.toFixed(decimals)}${suffix}`;
  });

  useEffect(() => {
    if (reducedMotion) {
      setDisplayValue(value);
    } else {
      spring.set(value);
    }
  }, [value, spring, reducedMotion]);

  if (reducedMotion) {
    return (
      <span className={className}>
        {prefix}
        {value.toFixed(decimals)}
        {suffix}
      </span>
    );
  }

  return <motion.span className={className}>{formatted}</motion.span>;
}
