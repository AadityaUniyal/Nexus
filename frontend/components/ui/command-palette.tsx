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
} from "lucide-react";
import { cn } from "@/lib/utils";

interface CommandItem {
  id: string;
  label: string;
  description?: string;
  icon: React.ComponentType<{ className?: string }>;
  action: () => void;
  keywords?: string[];
  category: "navigation" | "actions" | "search";
}

export function CommandPalette() {
  const router = useRouter();
  const [isOpen, setIsOpen] = React.useState(false);
  const [search, setSearch] = React.useState("");
  const [selectedIndex, setSelectedIndex] = React.useState(0);
  const inputRef = React.useRef<HTMLInputElement>(null);

  // Define all commands
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
      description: "View all vehicles",
      icon: Truck,
      category: "navigation",
      action: () => router.push("/operations"),
      keywords: ["vehicles", "fleet", "trucks"],
    },
    {
      id: "nav-incidents",
      label: "Active Incidents",
      description: "View and manage incidents",
      icon: ShieldAlert,
      category: "navigation",
      action: () => router.push("/incidents"),
      keywords: ["incidents", "alerts", "issues"],
    },
    {
      id: "nav-simulations",
      label: "Simulation Lab",
      description: "Run what-if scenarios",
      icon: Sparkles,
      category: "navigation",
      action: () => router.push("/simulations"),
      keywords: ["simulations", "what-if", "scenarios"],
    },
    {
      id: "nav-world",
      label: "Live World View",
      description: "3D spatial map",
      icon: Map,
      category: "navigation",
      action: () => router.push("/live-world"),
      keywords: ["map", "3d", "world", "spatial"],
    },
    {
      id: "nav-analytics",
      label: "Analytics",
      description: "Reports and insights",
      icon: FileText,
      category: "navigation",
      action: () => router.push("/analytics"),
      keywords: ["analytics", "reports", "insights"],
    },
    {
      id: "nav-settings",
      label: "Settings",
      description: "App preferences",
      icon: Settings,
      category: "navigation",
      action: () => router.push("/settings"),
      keywords: ["settings", "preferences", "config"],
    },
    {
      id: "nav-profile",
      label: "Your Profile",
      description: "Manage account",
      icon: User,
      category: "navigation",
      action: () => router.push("/profile"),
      keywords: ["profile", "account", "user"],
    },
    // Quick Actions
    {
      id: "action-new-simulation",
      label: "Create New Simulation",
      description: "Run a what-if scenario",
      icon: Sparkles,
      category: "actions",
      action: () => router.push("/simulations/new"),
      keywords: ["create", "new", "simulation"],
    },
    {
      id: "action-import-data",
      label: "Import Fleet Data",
      description: "Upload CSV or connect API",
      icon: Truck,
      category: "actions",
      action: () => router.push("/onboarding/import-data"),
      keywords: ["import", "upload", "csv", "data"],
    },
  ];

  // Filter commands based on search
  const filteredCommands = React.useMemo(() => {
    if (!search) return commands;

    const searchLower = search.toLowerCase();
    return commands.filter((cmd) => {
      const matchLabel = cmd.label.toLowerCase().includes(searchLower);
      const matchDescription = cmd.description?.toLowerCase().includes(searchLower);
      const matchKeywords = cmd.keywords?.some((kw) => kw.includes(searchLower));
      return matchLabel || matchDescription || matchKeywords;
    });
  }, [search, commands]);

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
                    placeholder="Search for vehicles, actions, pages..."
                    className="flex-1 bg-transparent text-sm text-nexus-on-surface placeholder:text-nexus-on-surface-variant outline-none"
                  />
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
                        No results found for "{search}"
                      </p>
                    </div>
                  ) : (
                    Object.entries(groupedCommands).map(([category, items]) => (
                      <div key={category} className="py-2">
                        <div className="px-4 py-2">
                          <span className="text-[10px] font-mono-data font-bold uppercase tracking-wider text-nexus-on-surface-variant">
                            {category === "navigation"
                              ? "Navigate"
                              : category === "actions"
                              ? "Actions"
                              : "Search"}
                          </span>
                        </div>
                        {items.map((cmd, index) => {
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
                                <p className="text-sm font-medium">{cmd.label}</p>
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
