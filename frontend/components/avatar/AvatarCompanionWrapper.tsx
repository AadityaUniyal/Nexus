'use client';

import dynamic from 'next/dynamic';

const SlidingAvatarCompanion = dynamic(
  () => import('@/components/avatar/SlidingAvatarCompanion').then((mod) => mod.SlidingAvatarCompanion),
  { ssr: false }
);

export function AvatarCompanionWrapper() {
  return <SlidingAvatarCompanion />;
}
