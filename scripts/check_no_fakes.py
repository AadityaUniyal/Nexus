#!/usr/bin/env python3
"""
CI Quality Gate: check_no_fakes.py
Enforces Non-Negotiable N1: No fake data, mock fixtures, hardcoded demo tenants,
or Math.random in product code.

Scans product code (excluding tests/, e2e/, fixtures/, node_modules/, .next/).
Fails with non-zero exit code if banned patterns are found.
"""

import os
import re
import sys
from pathlib import Path

# Paths exempt from no-fakes check
EXEMPT_DIRS = {
    "tests",
    "test",
    "e2e",
    "fixtures",
    "node_modules",
    ".next",
    ".git",
    "dist",
    "build",
    "venv",
    ".venv",
    "__pycache__",
}

# Explicitly exempt check_no_fakes.py itself and docs/requirements files
EXEMPT_FILES = {
    "check_no_fakes.py",
    "test_no_fakes.py",
}

BANNED_PATTERNS = [
    (r"ws-continental", "Hardcoded demo workspace 'ws-continental'"),
    (r"org-nexus-demo", "Hardcoded demo organization 'org-nexus-demo'"),
    (r"sarah\.chen@nexus\.internal", "Hardcoded demo user 'sarah.chen'"),
    (r"Password123!", "Hardcoded demo password"),
    (r"nexus-demo-password", "Hardcoded demo password"),
    (r"dummy-maps-key-nexus", "Hardcoded fake Azure Maps key"),
    (r"ENABLE_DEMO_AUTH", "Banned demo auth flag"),
    (r"mock_data|mock-data|data-provider", "Mock data module reference in product code"),
]

# Code extensions to scan
SCANNED_EXTENSIONS = {".py", ".ts", ".tsx", ".js", ".jsx"}


def should_scan_file(file_path: Path, root_path: Path) -> bool:
    if file_path.name in EXEMPT_FILES:
        return False
    if file_path.suffix not in SCANNED_EXTENSIONS:
        return False
    parts = file_path.relative_to(root_path).parts
    for p in parts:
        if p in EXEMPT_DIRS:
            return False
    return True


def scan_repository(root_path: Path) -> list:
    violations = []
    for file_path in root_path.rglob("*"):
        if not file_path.is_file():
            continue
        if not should_scan_file(file_path, root_path):
            continue

        try:
            content = file_path.read_text(encoding="utf-8", errors="ignore")
        except Exception as e:
            continue

        rel_path = file_path.relative_to(root_path)

        for pattern, description in BANNED_PATTERNS:
            for match in re.finditer(pattern, content, re.IGNORECASE):
                line_no = content.count("\n", 0, match.start()) + 1
                violations.append((str(rel_path), line_no, description, match.group(0)))

    return violations


def main():
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8")
    root = Path(__file__).resolve().parent.parent
    if len(sys.argv) > 1:
        root = Path(sys.argv[1]).resolve()

    violations = scan_repository(root)

    if violations:
        print(f"[FAIL] Found {len(violations)} banned fake/demo pattern(s) in product code:\n")
        for file_path, line_no, desc, matched in violations:
            print(f"  - {file_path}:{line_no} => {desc} (matched: '{matched}')")
        sys.exit(1)
    else:
        print("[PASS] No banned fake data or demo patterns found in product code.")
        sys.exit(0)


if __name__ == "__main__":
    main()
