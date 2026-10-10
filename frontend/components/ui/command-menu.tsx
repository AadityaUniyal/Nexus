"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Dialog } from "./dialog";
import { Search, Compass, Users, BarChart3, Settings } from "lucide-react";

export interface CommandMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CommandMenu({ isOpen, onClose }: CommandMenuProps) {
  const router = useRouter();
  const [query, setQuery] = React.useState("");

  const navItems = [
    { label: "Dispatcher Cockpit", path: "/app", icon: <Compass className="h-4 w-4 text-primary" /> },
    { label: "Fleet Drivers", path: "/drivers", icon: <Users className="h-4 w-4 text-emerald-500" /> },
    { label: "Outcome Analytics", path: "/analytics", icon: <BarChart3 className="h-4 w-4 text-blue-500" /> },
    { label: "Workspace Settings", path: "/settings", icon: <Settings className="h-4 w-4 text-muted-foreground" /> },
  ];

  const filteredItems = navItems.filter((i) =>
    i.label.toLowerCase().includes(query.toLowerCase())
  );

  const navigateTo = (path: string) => {
    onClose();
    router.push(path);
  };

  return (
    <Dialog isOpen={isOpen} onClose={onClose} maxWidth="md">
      <div className="space-y-4">
        <div className="relative flex items-center">
          <Search className="absolute left-3.5 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type a command or navigate..."
            className="w-full pl-10 pr-4 py-2 text-sm bg-muted/40 border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
            autoFocus
          />
        </div>

        <div className="space-y-1">
          {filteredItems.map((item) => (
            <button
              key={item.path}
              onClick={() => navigateTo(item.path)}
              className="w-full flex items-center gap-3 px-3 py-2 text-sm text-foreground hover:bg-muted/60 rounded-md text-left transition-colors"
            >
              {item.icon}
              <span>{item.label}</span>
            </button>
          ))}
          {filteredItems.length === 0 && (
            <div className="py-6 text-center text-xs text-muted-foreground">
              No matching commands found.
            </div>
          )}
        </div>
      </div>
    </Dialog>
  );
}
