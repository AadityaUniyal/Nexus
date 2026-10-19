"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { FadeIn } from "@/components/motion";
import { authFetch } from "@/lib/api/auth-fetch";

const regions = [
  { id: "US_CENTRAL", name: "United States Central", timezone: "America/Chicago" },
  { id: "EU_WEST", name: "Europe West", timezone: "Europe/London" },
  { id: "AP_SOUTHEAST", name: "Asia Pacific Southeast", timezone: "Asia/Singapore" },
  { id: "IN_SOUTH", name: "India", timezone: "Asia/Kolkata" },
];

export default function OnboardingWorkspacePage() {
  const router = useRouter();
  const [workspaceName, setWorkspaceName] = React.useState("");
  const [region, setRegion] = React.useState(regions[0].id);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);
    try {
      const selectedRegion = regions.find((item) => item.id === region)!;
      await authFetch("/api/v1/onboarding/workspace", {
        method: "PATCH",
        body: JSON.stringify({
          name: workspaceName.trim(),
          region: selectedRegion.id,
          timezone: selectedRegion.timezone,
          isDemo: false,
        }),
      });
      router.push("/import-data");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Workspace setup could not be saved. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-nexus-surface p-6">
      <FadeIn className="w-full max-w-xl space-y-6">
        <div className="flex items-center justify-between px-2 text-xs text-nexus-on-surface-variant">
          <span>WORKSPACE SETUP</span><span>STEP 2 OF 5</span>
        </div>
        <Card className="shadow-tactile-lg">
          <CardHeader>
            <div className="mb-2 flex h-11 w-11 items-center justify-center rounded-2xl bg-nexus-surface-container text-nexus-primary"><Building2 className="h-5 w-5" /></div>
            <CardTitle>Create your workspace</CardTitle>
            <CardDescription>This creates a production workspace for your organization. You can add operational records after setup.</CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-5">
              <Input label="Workspace name" required minLength={2} maxLength={120} value={workspaceName} onChange={(event) => setWorkspaceName(event.target.value)} autoComplete="organization" />
              <div className="space-y-1.5">
                <label htmlFor="workspace-region" className="text-sm font-medium text-nexus-on-surface">Primary region</label>
                <select id="workspace-region" value={region} onChange={(event) => setRegion(event.target.value)} className="h-10 w-full rounded-lg border border-nexus-outline-variant bg-nexus-surface px-3 text-sm text-nexus-on-surface focus:outline-none focus:ring-2 focus:ring-nexus-primary/30">
                  {regions.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
                </select>
              </div>
              {error && <p role="alert" className="rounded-lg border border-rose-300 bg-rose-50 px-3 py-2 text-sm text-rose-800 dark:border-rose-900 dark:bg-rose-950/30 dark:text-rose-200">{error}</p>}
            </CardContent>
            <CardFooter className="flex items-center justify-between pt-2">
              <Link href="/welcome" className="text-sm text-nexus-on-surface-variant hover:text-nexus-primary">Back</Link>
              <Button type="submit" variant="primary" disabled={isSubmitting || workspaceName.trim().length < 2} className="gap-2">
                {isSubmitting ? "Creating…" : "Create workspace"}<ArrowRight className="h-4 w-4" />
              </Button>
            </CardFooter>
          </form>
        </Card>
      </FadeIn>
    </main>
  );
}
