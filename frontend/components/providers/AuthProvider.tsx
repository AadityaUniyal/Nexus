'use client';

import React from 'react';
import { ClerkProvider } from '@clerk/nextjs';

const clerkPublishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

export function AuthProvider({ children }: { children: React.ReactNode }) {
  if (clerkPublishableKey) {
    return (
      <ClerkProvider publishableKey={clerkPublishableKey}>
        {children}
      </ClerkProvider>
    );
  }

  // Fallback for local execution when Clerk API key is not yet configured
  return <>{children}</>;
}
