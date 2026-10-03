#!/usr/bin/env python3
"""
Nexus Logistics Platform - Standalone E2E Test Runner
Executes the 4-tier opaque-box test suite against FastAPI ASGI application.

Usage:
    python tests/e2e/runner.py             # Run all 4 tiers
    python tests/e2e/runner.py --tier 1    # Run Tier 1 (Feature Coverage)
    python tests/e2e/runner.py --tier 2    # Run Tier 2 (Boundary & Corner Cases)
    python tests/e2e/runner.py --tier 3    # Run Tier 3 (Cross-Feature Interactions)
    python tests/e2e/runner.py --tier 4    # Run Tier 4 (Real-World Scenarios)
"""

import sys
import os
import argparse
from pathlib import Path
import pytest

# Configure paths
PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent
BACKEND_DIR = PROJECT_ROOT / "backend"
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

# Safe environment settings
os.environ["AZURE_MONITOR_ENABLED"] = "false"
os.environ["APPLICATIONINSIGHTS_CONNECTION_STRING"] = ""
os.environ["TESTING"] = "true"
os.environ["APP_ENV"] = "test"
os.environ["LOCATION_PROVIDER"] = "mock"

TIER_FILES = {
    1: "tests/e2e/test_tier1_features.py",
    2: "tests/e2e/test_tier2_boundaries.py",
    3: "tests/e2e/test_tier3_interactions.py",
    4: "tests/e2e/test_tier4_scenarios.py",
}

def main():
    parser = argparse.ArgumentParser(description="Nexus E2E Test Suite Runner")
    parser.add_argument(
        "--tier",
        type=int,
        choices=[1, 2, 3, 4],
        help="Specify an individual test tier to execute (1-4)",
    )
    parser.add_argument(
        "-v", "--verbose",
        action="store_true",
        help="Enable verbose pytest output",
    )
    args = parser.parse_args()

    pytest_args = ["-q"]
    if args.verbose:
        pytest_args = ["-v"]

    if args.tier:
        target = TIER_FILES[args.tier]
        pytest_args.append(str(PROJECT_ROOT / target))
        print(f"=== Running Nexus E2E Tier {args.tier} ({target}) ===")
    else:
        pytest_args.append(str(PROJECT_ROOT / "tests/e2e"))
        print("=== Running Complete Nexus 4-Tier Opaque-Box E2E Suite ===")

    exit_code = pytest.main(pytest_args)
    if exit_code == 0:
        print("\nAll E2E tests PASSED successfully.")
    else:
        print(f"\nE2E tests failed with exit code: {exit_code}")
    sys.exit(exit_code)

if __name__ == "__main__":
    main()
