"use client";

import * as React from "react";
import { AppShell } from "@/components/layout/AppShell";
import { AppleSettingsView } from "@/components/settings/AppleSettingsView";
import { FadeIn } from "@/components/ui/motion-animations";

export default function SettingsPage() {
  return (
    <AppShell>
      <FadeIn>
        <AppleSettingsView />
      </FadeIn>
    </AppShell>
  );
}
