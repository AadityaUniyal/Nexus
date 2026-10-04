'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Avatar3D } from '@/components/avatar/Avatar3D';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { LocationPicker } from '@/components/location/LocationPicker';
import { ResolvedLocation } from '@/lib/api/endpoints/location';
import { ArrowRight } from 'lucide-react';
import { FadeIn } from '@/components/motion';
import { tactileAudio } from '@/lib/sound-effects';
import { useToast } from '@/hooks/use-toast';
import { authFetch } from '@/lib/api/auth-fetch';

export default function OnboardingWorkspacePage() {
  const router = useRouter();
  const { toast } = useToast();
  const [workspaceName, setWorkspaceName] = React.useState('Continental Logistics Global');
  const [industry, setIndustry] = React.useState('FREIGHT_FORWARDING');
  const [hubCount, setHubCount] = React.useState('4');
  const [operatingLocation, setOperatingLocation] = React.useState<ResolvedLocation | null>({
    id: "loc-chi-default",
    display_name: "Chicago Central Hub, IL, United States",
    latitude: 41.8781,
    longitude: -87.6298,
    type: "city",
    confidence: 1.0,
    provider: "geoapify",
  });

  const handleNext = async (e: React.FormEvent) => {
    e.preventDefault();
    tactileAudio.playClick();

    if (typeof window !== 'undefined') {
      localStorage.setItem('nexus_workspace_name', workspaceName);
      localStorage.setItem('nexus_industry', industry);
      localStorage.setItem('nexus_hub_count', hubCount);
      if (operatingLocation) {
        localStorage.setItem('nexus_workspace_location', JSON.stringify(operatingLocation));
      }
    }

    try {
      const orgData = await authFetch<any>('/api/v1/organizations', {
        method: 'POST',
        body: JSON.stringify({
          name: workspaceName,
          slug: workspaceName.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 30),
        }),
      });
      const orgId = orgData?.data?.id || orgData?.id;
      if (orgId && typeof window !== 'undefined') {
        localStorage.setItem('nexus_active_org_id', orgId);
      }
    } catch {
      // Graceful fallback to client session state
    }

    toast({
      title: 'Workspace Scope Saved',
      message: `Primary operational base established at ${operatingLocation?.display_name || 'Central Hub'}`,
      type: 'info',
    });

    router.push('/environment');
  };

  return (
    <div className="min-h-screen bg-nexus-surface flex flex-col items-center justify-center p-6 select-none">
      <FadeIn className="w-full max-w-xl space-y-6">
        <div className="flex items-center justify-between text-xs font-mono text-nexus-on-surface-variant px-2">
          <span>ONBOARDING · STEP 2 OF 5</span>
          <span>WORKSPACE CONFIGURATION</span>
        </div>

        <div className="flex justify-center -mb-2">
          <Avatar3D mood="WELCOME" size="lg" />
        </div>

        <Card className="shadow-tactile-lg">
          <CardHeader>
            <CardTitle>Workspace Identity & Scope</CardTitle>
            <CardDescription>
              Define the physical operational boundaries and primary hub infrastructure for your organization.
            </CardDescription>
          </CardHeader>

          <form onSubmit={handleNext}>
            <CardContent className="space-y-4">
              <Input
                label="Workspace Title"
                required
                value={workspaceName}
                onChange={(e) => setWorkspaceName(e.target.value)}
              />

              {/* Geo Location Search Picker & Quick Presets */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-mono font-medium text-nexus-on-surface-variant uppercase">
                    Primary Operational Location
                  </label>
                  <div className="flex items-center gap-1 text-[11px] text-stone-500">
                    <span>Quick presets:</span>
                    <button
                      type="button"
                      onClick={() =>
                        setOperatingLocation({
                          id: "loc-ded",
                          display_name: "Dehradun Central Hub, Uttarakhand, India",
                          latitude: 30.3165,
                          longitude: 78.0322,
                          type: "city",
                          confidence: 1.0,
                          provider: "geoapify",
                        })
                      }
                      className="text-emerald-600 dark:text-emerald-400 font-bold hover:underline"
                    >
                      Dehradun
                    </button>
                    <span>·</span>
                    <button
                      type="button"
                      onClick={() =>
                        setOperatingLocation({
                          id: "loc-del",
                          display_name: "Delhi NCR Superhub, India",
                          latitude: 28.6139,
                          longitude: 77.2090,
                          type: "city",
                          confidence: 1.0,
                          provider: "geoapify",
                        })
                      }
                      className="text-emerald-600 dark:text-emerald-400 font-bold hover:underline"
                    >
                      Delhi
                    </button>
                    <span>·</span>
                    <button
                      type="button"
                      onClick={() =>
                        setOperatingLocation({
                          id: "loc-lon",
                          display_name: "London Gateway, UK",
                          latitude: 51.5074,
                          longitude: -0.1278,
                          type: "city",
                          confidence: 1.0,
                          provider: "geoapify",
                        })
                      }
                      className="text-emerald-600 dark:text-emerald-400 font-bold hover:underline"
                    >
                      London
                    </button>
                  </div>
                </div>

                <LocationPicker
                  initialLocation={operatingLocation || undefined}
                  onLocationChange={(loc) => setOperatingLocation(loc)}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-mono font-medium text-nexus-on-surface-variant uppercase">
                  Industry & Freight Modality
                </label>
                <select
                  value={industry}
                  onChange={(e) => setIndustry(e.target.value)}
                  className="w-full h-10 px-3 rounded-lg border border-nexus-outline-variant bg-nexus-surface text-sm focus:outline-none focus:ring-2 focus:ring-nexus-secondary/30"
                >
                  <option value="FREIGHT_FORWARDING">Multimodal Freight & Intermodal</option>
                  <option value="COLD_CHAIN">Cold Chain & Pharmaceutical Logistics</option>
                  <option value="LAST_MILE">Last-Mile Urban Courier Grid</option>
                  <option value="BULK_INDUSTRIAL">Bulk Industrial & Hazardous Materials</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-mono font-medium text-nexus-on-surface-variant uppercase">
                  Primary Distribution Hubs
                </label>
                <select
                  value={hubCount}
                  onChange={(e) => setHubCount(e.target.value)}
                  className="w-full h-10 px-3 rounded-lg border border-nexus-outline-variant bg-nexus-surface text-sm focus:outline-none focus:ring-2 focus:ring-nexus-secondary/30"
                >
                  <option value="1">1 Central Regional Hub</option>
                  <option value="4">4 Distributed Warehouses (Standard Grid)</option>
                  <option value="12">12+ Multi-Zone Logistics Terminals</option>
                </select>
              </div>
            </CardContent>

            <CardFooter className="flex justify-between items-center pt-2">
              <Link href="/welcome" className="text-xs text-nexus-on-surface-variant hover:text-nexus-primary">
                Back
              </Link>
              <Button type="submit" variant="primary" className="font-mono text-xs gap-1">
                Continue to Environment <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </CardFooter>
          </form>
        </Card>
      </FadeIn>
    </div>
  );
}
