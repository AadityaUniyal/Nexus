"""
Adversarial Verification Suite for Milestone 1:
Apple HIG & Fluid Tab-to-Tab Motion Ecosystem
"""

import os
import re
import pytest

FRONTEND_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "frontend"))

def read_frontend_file(rel_path: str) -> str:
    path = os.path.join(FRONTEND_DIR, rel_path)
    assert os.path.isfile(path), f"File not found: {path}"
    with open(path, "r", encoding="utf-8") as f:
        return f.read()

def test_primary_navigation_routes_and_apple_hig():
    """Verify primary navigation in Sidebar.tsx contains all 6 required tabs and Apple spring pill."""
    content = read_frontend_file("components/layout/Sidebar.tsx")
    
    # 6 primary routes
    required_routes = [
        "/overview",
        "/live-world",
        "/operations",
        "/intelligence",
        "/analytics",
        "/settings"
    ]
    for route in required_routes:
        assert f'href: "{route}"' in content or f"href: '{route}'" in content, (
            f"Missing required route in Sidebar.tsx: {route}"
        )
    
    # layoutId for continuous morphing pill
    assert 'layoutId="sidebarActivePill"' in content or "layoutId='sidebarActivePill'" in content, (
        "Sidebar.tsx must use layoutId='sidebarActivePill' for active tab indicator"
    )
    
    # Apple spring physics
    assert "stiffness: 260" in content, "Sidebar active pill must use spring stiffness: 260"
    assert "damping: 28" in content, "Sidebar active pill must use spring damping: 28"

def test_appshell_fluid_transitions():
    """Verify AppShell wraps views with AnimatePresence mode='wait' and spring continuous transition."""
    content = read_frontend_file("components/layout/AppShell.tsx")
    
    assert '<AnimatePresence mode="wait"' in content, (
        "AppShell.tsx must wrap page transitions with <AnimatePresence mode=\"wait\">"
    )
    assert "key={pathname}" in content, (
        "AppShell.tsx must key motion.div by pathname for route transitions"
    )
    assert "stiffness: 260" in content, "AppShell transition must use spring stiffness: 260"
    assert "damping: 28" in content, "AppShell transition must use spring damping: 28"
    assert "useReducedMotion" in content, "AppShell must respect user reduced motion preferences"

def test_dedicated_intelligence_page_and_components():
    """Verify /intelligence page mounts TransporterIntelligenceCard, 4 KPI squircles, risk radar, and ledger."""
    content = read_frontend_file("app/(app)/intelligence/page.tsx")
    
    # Must NOT contain redirect stub
    assert "redirect('/incidents')" not in content and 'redirect("/incidents")' not in content, (
        "/intelligence/page.tsx must not be a redirect stub"
    )
    
    # Central TransporterIntelligenceCard mount
    assert "TransporterIntelligenceCard" in content, (
        "/intelligence/page.tsx must mount TransporterIntelligenceCard"
    )
    
    # 4 KPI Squircle Tiles
    assert "Monitored Facilities" in content, "Missing 'Monitored Facilities' KPI tile"
    assert "Network Avg Dwell" in content, "Missing 'Network Avg Dwell' KPI tile"
    assert "Active Detention Clocks" in content, "Missing 'Active Detention Clocks' KPI tile"
    assert "Projected Demurrage" in content, "Missing 'Projected Demurrage' KPI tile"
    
    # Squircle and glass styling
    assert "rounded-[24px]" in content, "KPI tiles must use rounded-[24px] Apple squircle"
    assert "backdrop-blur-3xl" in content, "Page must use backdrop-blur-3xl glassmorphism"
    
    # Active Facility Detention Risk Radar Table
    assert "Active Facility Detention Risk Radar" in content, (
        "Missing Active Facility Detention Risk Radar table"
    )
    
    # Carrier Detention Settlement Ledger Table
    assert "Carrier Detention Settlement Ledger" in content, (
        "Missing Carrier Detention Settlement Ledger table"
    )
    assert "handleExportLedgerCSV" in content, "Missing CSV export functionality for carrier ledger"

def test_analytics_subtabs_uniqueness_and_views():
    """Verify /analytics page mounts all 5 sub-tabs with zero duplicate IDs and animated transitions."""
    content = read_frontend_file("app/(app)/analytics/page.tsx")
    
    # Locate tabs definition
    tabs_match = re.search(r"tabs=\{([\[\s\S]*?\])\}", content)
    assert tabs_match is not None, "Could not find tabs array prop in /analytics/page.tsx"
    tabs_raw = tabs_match.group(1)
    
    # Extract IDs
    ids = re.findall(r'id:\s*["\']([^"\']+)["\']', tabs_raw)
    assert len(ids) == 5, f"Expected 5 sub-tabs in /analytics/page.tsx, found: {ids}"
    
    # Check for duplicate keys
    unique_ids = set(ids)
    assert len(unique_ids) == len(ids), f"Duplicate sub-tab IDs detected: {ids}"
    
    # Verify expected IDs
    expected = {"overview", "forecast", "anomalies", "risk", "medallion"}
    assert unique_ids == expected, f"Sub-tab IDs mismatch: expected {expected}, got {unique_ids}"
    
    # Verify each sub-tab view condition is rendered
    for sub_id in expected:
        pattern = f'activeTab === "{sub_id}"'
        assert pattern in content, f"Sub-tab view condition not found for {sub_id}"

def test_apple_hig_design_tokens():
    """Verify authentic Apple SF Pro font cascade, hairline borders, and squircle radiuses."""
    tailwind_cfg = read_frontend_file("tailwind.config.ts")
    tokens_css = read_frontend_file("styles/tokens.css")
    globals_css = read_frontend_file("styles/globals.css")
    
    # Font cascade in Tailwind
    assert "SF Pro Display" in tailwind_cfg, "Tailwind config missing SF Pro Display in fontFamily.sans"
    assert "SF Pro" in tailwind_cfg, "Tailwind config missing SF Pro in fontFamily.sans"
    assert "SF Mono" in tailwind_cfg, "Tailwind config missing SF Mono in fontFamily.mono"
    
    # Squircle radiuses in Tailwind
    assert 'squircle: "24px"' in tailwind_cfg or "squircle: '24px'" in tailwind_cfg, (
        "Tailwind config missing squircle: 24px"
    )
    assert '"squircle-lg": "28px"' in tailwind_cfg or "'squircle-lg': '28px'" in tailwind_cfg, (
        "Tailwind config missing squircle-lg: 28px"
    )
    
    # Tabular numbers in globals.css
    assert "tabular-nums" in globals_css, "globals.css missing tabular-nums"
    assert "tnum" in globals_css, "globals.css missing tnum feature setting"
    
    # Hairline borders and squircle tokens in tokens.css
    assert "--border-subtle: rgba(0, 0, 0, 0.08);" in tokens_css, (
        "tokens.css missing light mode hairline border"
    )
    assert "--border-subtle: rgba(255, 255, 255, 0.12);" in tokens_css, (
        "tokens.css missing dark mode hairline border"
    )
    assert "--radius-squircle: 24px;" in tokens_css, "tokens.css missing --radius-squircle: 24px"

def test_all_six_pages_exist_and_render_appshell():
    """Verify all 6 primary pages exist, export a default function, and integrate with AppShell."""
    pages = [
        "app/(app)/overview/page.tsx",
        "app/(app)/live-world/page.tsx",
        "app/(app)/operations/page.tsx",
        "app/(app)/intelligence/page.tsx",
        "app/(app)/analytics/page.tsx",
        "app/(app)/settings/page.tsx",
    ]
    for p in pages:
        content = read_frontend_file(p)
        assert "export default function" in content, f"{p} must export default function component"
        assert "<AppShell" in content or "AppShell" in content, f"{p} must mount inside AppShell"
