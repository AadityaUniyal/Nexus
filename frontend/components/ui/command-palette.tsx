"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import {
  Search,
  Truck,
  Building2,
  ShieldAlert,
  Sparkles,
  Settings,
  User,
  TrendingUp,
  Map,
  FileText,
  ArrowRight,
  X,
  Package,
  Activity,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface CommandItem {
  id: string;
  label: string;
  description?: string;
  icon: React.ComponentType<{ className?: string }>;
  action: () => void;
  keywords?: string[];
  category: "navigation" | "actions" | "search" | "vehicles" | "warehouses" | "incidents" | "orders" | "simulations";
  badge?: string;
}

export interface CommandPaletteProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export function CommandPalette({ isOpen: controlledIsOpen, onClose: controlledOnClose }: CommandPaletteProps = {}) {
  const router = useRouter();
  const [internalIsOpen, setInternalIsOpen] = React.useState(false);
  const isOpen = controlledIsOpen !== undefined ? controlledIsOpen : internalIsOpen;
  const setIsOpen = (val: boolean | ((prev: boolean) => boolean)) => {
    const nextVal = typeof val === "function" ? val(isOpen) : val;
    if (controlledIsOpen !== undefined) {
      if (!nextVal && controlledOnClose) controlledOnClose();
    } else {
      setInternalIsOpen(nextVal);
    }
  };
  const [search, setSearch] = React.useState("");
  const [selectedIndex, setSelectedIndex] = React.useState(0);
  const [dynamicResults, setDynamicResults] = React.useState<any[]>([]);
  const [isSearching, setIsSearching] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);

  // Dynamic API search querying /api/v1/search
  React.useEffect(() => {
    if (!search || search.trim().length < 1) {
      setDynamicResults([]);
      setIsSearching(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await fetch(`/api/v1/search?q=${encodeURIComponent(search.trim())}`);
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data)) {
            setDynamicResults(data);
          }
        }
      } catch (err) {
        console.error("Command palette search error:", err);
      } finally {
        setIsSearching(false);
      }
    }, 150);

    return () => clearTimeout(timer);
  }, [search]);

  // Define static commands
  const commands: CommandItem[] = [
    // Navigation
    {
      id: "nav-overview",
      label: "Overview Dashboard",
      description: "Command center and KPIs",
      icon: TrendingUp,
      category: "navigation",
      action: () => router.push("/overview"),
      keywords: ["dashboard", "home", "overview"],
    },
    {
      id: "nav-operations",
      label: "Fleet Operations",
      description: "View all fleet vehicles and assets",
      icon: Truck,
      category: "navigation",
      action: () => router.push("/operations/vehicles"),
      keywords: ["vehicles", "fleet", "trucks"],
    },
    {
      id: "nav-orders",
      label: "Orders & Shipments",
      description: "Active freight orders and dispatch deadlines",
      icon: Package,
      category: "navigation",
      action: () => router.push("/operations/orders"),
      keywords: ["orders", "shipments", "freight", "cargo"],
    },
    {
      id: "nav-warehouses",
      label: "Distribution Hubs & Warehouses",
      description: "Intermodal terminals, dock capacity, and inventory",
      icon: Building2,
      category: "navigation",
      action: () => router.push("/operations/warehouses"),
      keywords: ["warehouses", "hubs", "terminals", "storage"],
    },
    {
      id: "nav-incidents",
      label: "Active Incidents & Hazards",
      description: "View and manage active corridor disruptions",
      icon: ShieldAlert,
      category: "navigation",
      action: () => router.push("/incidents"),
      keywords: ["incidents", "alerts", "issues", "weather", "hazard"],
    },
    {
      id: "nav-simulations",
      label: "Simulation Lab",
      description: "Run Monte-Carlo what-if detour scenarios",
      icon: Sparkles,
      category: "navigation",
      action: () => router.push("/simulations"),
      keywords: ["simulations", "what-if", "scenarios", "monte-carlo"],
    },
    {
      id: "nav-world",
      label: "Live World Map",
      description: "Global GPS real-time asset tracker",
      icon: Map,
      category: "navigation",
      action: () => router.push("/live-world"),
      keywords: ["map", "world", "spatial", "gps", "live"],
    },
    {
      id: "nav-audit",
      label: "System Audit Trail",
      description: "Immutable compliance and activity ledger",
      icon: ShieldAlert,
      category: "navigation",
      action: () => router.push("/admin/audit"),
      keywords: ["audit", "logs", "compliance", "history", "security"],
    },
    {
      id: "nav-status",
      label: "SLA & System Status",
      description: "Real-time uptime metrics and service health",
      icon: Activity,
      category: "navigation",
      action: () => router.push("/status"),
      keywords: ["status", "sla", "uptime", "health", "latency"],
    },
    {
      id: "nav-analytics",
      label: "Analytics & Executive Briefing",
      description: "Reports, ESG metrics and PDF board briefing",
      icon: FileText,
      category: "navigation",
      action: () => router.push("/analytics"),
      keywords: ["analytics", "reports", "insights", "pdf", "briefing"],
    },
    {
      id: "nav-settings",
      label: "System Settings",
      description: "Operational mode and workspace configurations",
      icon: Settings,
      category: "navigation",
      action: () => router.push("/settings"),
      keywords: ["settings", "preferences", "config"],
    },
    {
      id: "nav-profile",
      label: "Operator Profile & RBAC Role",
      description: "Manage credentials and assigned permissions",
      icon: User,
      category: "navigation",
      action: () => router.push("/profile"),
      keywords: ["profile", "account", "user", "role", "rbac"],
    },
    // Quick Actions
    {
      id: "action-new-simulation",
      label: "Create New Simulation",
      description: "Run physics-based route recovery scenario",
      icon: Sparkles,
      category: "actions",
      action: () => router.push("/simulations/new"),
      keywords: ["create", "new", "simulation"],
    },
    {
      id: "action-import-data",
      label: "Import Fleet Data (CSV)",
      description: "Upload fleet vehicles or freight orders CSV",
      icon: Truck,
      category: "actions",
      action: () => router.push("/onboarding/import-data"),
      keywords: ["import", "upload", "csv", "data", "bulk"],
    },
  ];

  // Map dynamic search results to CommandItems
  const dynamicCommands: CommandItem[] = React.useMemo(() => {
    return dynamicResults.map((item, idx) => {
      let icon = Truck;
      let category: CommandItem["category"] = "vehicles";

      if (item.type === "WAREHOUSE") {
        icon = Building2;
        category = "warehouses";
      } else if (item.type === "INCIDENT") {
        icon = ShieldAlert;
        category = "incidents";
      } else if (item.type === "ORDER") {
        icon = Package;
        category = "orders";
      } else if (item.type === "SIMULATION") {
        icon = Sparkles;
        category = "simulations";
      }

      return {
        id: `dyn-${item.type}-${item.id || idx}`,
        label: item.title,
        description: item.subtitle,
        icon,
        badge: item.status,
        category,
        action: () => {
          if (item.deepLink) {
            router.push(item.deepLink);
          }
        },
      };
    });
  }, [dynamicResults, router]);

  // Combined filtered commands
  const filteredCommands = React.useMemo(() => {
    const searchLower = search.trim().toLowerCase();
    const staticMatches = !searchLower
      ? commands
      : commands.filter((cmd) => {
          const matchLabel = cmd.label.toLowerCase().includes(searchLower);
          const matchDescription = cmd.description?.toLowerCase().includes(searchLower);
          const matchKeywords = cmd.keywords?.some((kw) => kw.includes(searchLower));
          return matchLabel || matchDescription || matchKeywords;
        });

    return [...dynamicCommands, ...staticMatches];
  }, [search, commands, dynamicCommands]);

  // Keyboard shortcuts
  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      // CMD+K or CTRL+K to open
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setIsOpen((open) => !open);
      }

      // ESC to close
      if (e.key === "Escape") {
        setIsOpen(false);
      }

      // Arrow navigation
      if (isOpen) {
        if (e.key === "ArrowDown") {
          e.preventDefault();
          setSelectedIndex((i) => (i + 1) % filteredCommands.length);
        }
        if (e.key === "ArrowUp") {
          e.preventDefault();
          setSelectedIndex((i) => (i - 1 + filteredCommands.length) % filteredCommands.length);
        }
        if (e.key === "Enter") {
          e.preventDefault();
          const selected = filteredCommands[selectedIndex];
          if (selected) {
            selected.action();
            setIsOpen(false);
            setSearch("");
            setSelectedIndex(0);
          }
        }
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, [isOpen, filteredCommands, selectedIndex]);

  // Focus input when opened
  React.useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Reset selection when search changes
  React.useEffect(() => {
    setSelectedIndex(0);
  }, [search]);

  const groupedCommands = React.useMemo(() => {
    const groups: Record<string, CommandItem[]> = {};
    filteredCommands.forEach((cmd) => {
      if (!groups[cmd.category]) {
        groups[cmd.category] = [];
      }
      groups[cmd.category].push(cmd);
    });
    return groups;
  }, [filteredCommands]);

  return (
    <>
      {/* Trigger hint */}
      <button
        onClick={() => setIsOpen(true)}
        className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-nexus-surface-container border border-nexus-outline-variant text-nexus-on-surface-variant hover:border-nexus-outline hover:text-nexus-on-surface transition-all text-sm"
      >
        <Search className="h-4 w-4" />
        <span>Search...</span>
        <kbd className="ml-auto px-1.5 py-0.5 text-[10px] font-mono-data bg-nexus-surface-high rounded border border-nexus-outline-variant">
          ⌘K
        </kbd>
      </button>

      {/* Command palette modal */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
            />

            {/* Panel */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
              className="fixed top-20 left-1/2 -translate-x-1/2 w-full max-w-2xl z-50 px-4"
            >
              <div className="bg-nexus-surface-container-lowest rounded-2xl border border-nexus-outline-variant shadow-tactile-lg overflow-hidden">
                {/* Search input */}
                <div className="flex items-center gap-3 px-4 py-3 border-b border-nexus-outline-variant/30">
                  <Search className="h-5 w-5 text-nexus-on-surface-variant shrink-0" />
                  <input
                    ref={inputRef}
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search vehicles, warehouses, orders, incidents, or commands..."
                    className="flex-1 bg-transparent text-sm text-nexus-on-surface placeholder:text-nexus-on-surface-variant outline-none"
                  />
                  {isSearching && (
                    <Loader2 className="h-4 w-4 animate-spin text-nexus-primary shrink-0" />
                  )}
                  <button
                    onClick={() => setIsOpen(false)}
                    className="p-1 rounded hover:bg-nexus-surface-container text-nexus-on-surface-variant"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                {/* Results */}
                <div className="max-h-96 overflow-y-auto">
                  {filteredCommands.length === 0 ? (
                    <div className="py-12 text-center">
                      <Search className="h-8 w-8 mx-auto mb-3 text-nexus-on-surface-variant opacity-40" />
                      <p className="text-sm text-nexus-on-surface-variant">
                        No results found for &quot;{search}&quot;
                      </p>
                    </div>
                  ) : (
                    Object.entries(groupedCommands).map(([category, items]) => (
                      <div key={category} className="py-2">
                        <div className="px-4 py-2 flex items-center justify-between">
                          <span className="text-[10px] font-mono-data font-bold uppercase tracking-wider text-nexus-on-surface-variant">
                            {category === "navigation"
                              ? "Navigate"
                              : category === "actions"
                              ? "Quick Actions"
                              : category === "vehicles"
                              ? "Fleet Vehicles"
                              : category === "warehouses"
                              ? "Distribution Hubs"
                              : category === "incidents"
                              ? "Active Incidents"
                              : category === "orders"
                              ? "Freight Orders"
                              : category === "simulations"
                              ? "Simulation Scenarios"
                              : "Search Results"}
                          </span>
                          <span className="text-[10px] font-mono text-stone-500">
                            {items.length}
                          </span>
                        </div>
                        {items.map((cmd) => {
                          const globalIndex = filteredCommands.indexOf(cmd);
                          const isSelected = selectedIndex === globalIndex;
                          const Icon = cmd.icon;

                          return (
                            <button
                              key={cmd.id}
                              onClick={() => {
                                cmd.action();
                                setIsOpen(false);
                                setSearch("");
                                setSelectedIndex(0);
                              }}
                              onMouseEnter={() => setSelectedIndex(globalIndex)}
                              className={cn(
                                "w-full flex items-center gap-3 px-4 py-2.5 transition-colors",
                                isSelected
                                  ? "bg-nexus-secondary/10 text-nexus-on-surface"
                                  : "text-nexus-on-surface hover:bg-nexus-surface-container"
                              )}
                            >
                              <div
                                className={cn(
                                  "p-2 rounded-lg",
                                  isSelected
                                    ? "bg-nexus-secondary/20"
                                    : "bg-nexus-surface-container"
                                )}
                              >
                                <Icon className="h-4 w-4" />
                              </div>
                              <div className="flex-1 text-left">
                                <div className="flex items-center gap-2">
                                  <p className="text-sm font-medium">{cmd.label}</p>
                                  {cmd.badge && (
                                    <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-nexus-surface-high border border-nexus-outline-variant text-nexus-on-surface-variant">
                                      {cmd.badge}
                                    </span>
                                  )}
                                </div>
                                {cmd.description && (
                                  <p className="text-xs text-nexus-on-surface-variant">
                                    {cmd.description}
                                  </p>
                                )}
                              </div>
                              {isSelected && (
                                <ArrowRight className="h-4 w-4 text-nexus-on-surface-variant" />
                              )}
                            </button>
                          );
                        })}
                      </div>
                    ))
                  )}
                </div>

                {/* Footer hint */}
                <div className="flex items-center justify-between px-4 py-2 border-t border-nexus-outline-variant/30 bg-nexus-surface-container text-[10px] font-mono-data text-nexus-on-surface-variant">
                  <div className="flex items-center gap-4">
                    <span className="flex items-center gap-1">
                      <kbd className="px-1.5 py-0.5 bg-nexus-surface-high rounded border border-nexus-outline-variant">
                        ↑
                      </kbd>
                      <kbd className="px-1.5 py-0.5 bg-nexus-surface-high rounded border border-nexus-outline-variant">
                        ↓
                      </kbd>
                      <span className="ml-1">Navigate</span>
                    </span>
                    <span className="flex items-center gap-1">
                      <kbd className="px-1.5 py-0.5 bg-nexus-surface-high rounded border border-nexus-outline-variant">
                        ⏎
                      </kbd>
                      <span className="ml-1">Select</span>
                    </span>
                  </div>
                  <span className="flex items-center gap-1">
                    <kbd className="px-1.5 py-0.5 bg-nexus-surface-high rounded border border-nexus-outline-variant">
                      ESC
                    </kbd>
                    <span className="ml-1">Close</span>
                  </span>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

export { CommandPalette as CommandMenu };

