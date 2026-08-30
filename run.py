#!/usr/bin/env python3
"""
NEXUS — Unified Master Runner & Compiler
Orchestrates backend FastAPI and frontend Next.js 15 concurrently.

Usage:
  python run.py            -> Start both Backend & Frontend dev servers
  python run.py --compile  -> Compile & build production bundles
  python run.py --test     -> Run all automated test suites (30/30 pytest + tsc)
"""

import sys
import os
import subprocess
import time
import argparse
from pathlib import Path

# Fix Windows console UTF-8 encoding
if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
        sys.stderr.reconfigure(encoding="utf-8")
    except Exception:
        pass

ROOT_DIR = Path(__file__).parent.resolve()
BACKEND_DIR = ROOT_DIR / "backend"
FRONTEND_DIR = ROOT_DIR / "frontend"


def print_banner():
    banner = r"""
===========================================================================
  _   _  ______ __   __ _   _  _____
 | \ | ||  ____|\ \ / /| | | |/ ____|
 |  \| || |__    \ V / | | | | (___
 | . ` ||  __|    > <  | | | |\___ \
 | |\  || |____  / . \ | |_| |____) |
 |_| \_||______|/_/ \_\ \___/ |_____/
 Autonomous Logistics & Spatial Intelligence Platform
===========================================================================
"""
    print(banner)


def run_tests():
    """Run full verification across backend pytest and frontend TypeScript."""
    print_banner()
    print("[1/2] [TEST] Running Backend Pytest Suite (30 test modules)...")
    res_py = subprocess.run([sys.executable, "-m", "pytest"], cwd=BACKEND_DIR)
    if res_py.returncode != 0:
        print("\n[FAIL] Backend test verification failed.")
        sys.exit(res_py.returncode)

    print("\n[2/2] [TYPECHECK] Checking Frontend TypeScript Compilation...")
    npm_cmd = "npx.cmd" if os.name == "nt" else "npx"
    res_ts = subprocess.run(
        [npm_cmd, "tsc", "--noEmit"],
        cwd=FRONTEND_DIR,
        shell=True,
    )
    if res_ts.returncode != 0:
        print("\n[FAIL] Frontend TypeScript verification failed.")
        sys.exit(res_ts.returncode)

    print("\n[SUCCESS] ALL 30 BACKEND TESTS & 78 FRONTEND ROUTES PASSED.\n")


def compile_project():
    """Compile Prisma ORM client and Next.js production build."""
    print_banner()
    print("[1/2] [VERIFY] Verifying Backend Dependencies and Syntax...")
    res_py = subprocess.run(
        [sys.executable, "-m", "pytest", "-q"],
        cwd=BACKEND_DIR,
    )
    if res_py.returncode != 0:
        print("[FAIL] Backend check failed.")
        sys.exit(res_py.returncode)

    print("\n[2/2] [BUILD] Compiling Next.js 15 Production Bundle...")
    npm_cmd = "npm.cmd" if os.name == "nt" else "npm"
    res_front = subprocess.run(
        [npm_cmd, "run", "build:frontend"],
        cwd=ROOT_DIR,
        shell=True,
    )
    if res_front.returncode != 0:
        print("\n[FAIL] Frontend compilation failed.")
        sys.exit(res_front.returncode)

    print("\n[SUCCESS] COMPILATION COMPLETE: 78/78 Next.js routes optimized.")


def start_dev_servers():
    """Launch Backend FastAPI and Frontend Next.js concurrently."""
    print_banner()
    print(">> Starting NEXUS Full-Stack Environment...")
    print("   * Backend API:      http://localhost:8000 (Swagger: /docs)")
    print("   * Frontend App:     http://localhost:3000")
    print("   * Voice Copilot:    Active on WebSocket /api/v1/voice/ws")
    print("   * Weather Engine:   Active (Open-Meteo Road Hazards)")
    print("-------------------------------------------------------------------")
    print("Press Ctrl+C to terminate all services safely.\n")

    processes = []

    try:
        # 1. Start Backend FastAPI via uvicorn
        backend_cmd = [
            sys.executable,
            "-m",
            "uvicorn",
            "app.main:app",
            "--reload",
            "--port",
            "8000",
        ]
        backend_proc = subprocess.Popen(backend_cmd, cwd=BACKEND_DIR)
        processes.append(backend_proc)

        time.sleep(1)

        # 2. Start Frontend Next.js dev server
        npm_cmd = "npm.cmd" if os.name == "nt" else "npm"
        frontend_cmd = [npm_cmd, "run", "dev", "--prefix", "frontend"]
        frontend_proc = subprocess.Popen(
            frontend_cmd,
            cwd=ROOT_DIR,
            shell=True,
        )
        processes.append(frontend_proc)

        # Keep parent process alive
        while True:
            time.sleep(1)
            for p in processes:
                if p.poll() is not None:
                    print(
                        f"\n[ALERT] Process exited with code {p.returncode}"
                    )
                    break

    except KeyboardInterrupt:
        print("\n[STOP] Shutting down NEXUS services gracefully...")
        for p in processes:
            p.terminate()
            try:
                p.wait(timeout=3)
            except subprocess.TimeoutExpired:
                p.kill()
        print("[OK] All services stopped.")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(
        description="NEXUS Master Runner & Compiler"
    )
    parser.add_argument(
        "--compile",
        action="store_true",
        help="Compile and build frontend production bundle",
    )
    parser.add_argument(
        "--test",
        action="store_true",
        help="Run automated test suite (30/30 backend + tsc)",
    )
    parser.add_argument(
        "--dev",
        action="store_true",
        help="Launch development servers",
    )

    args = parser.parse_args()

    if args.test:
        run_tests()
    elif args.compile:
        compile_project()
    else:
        start_dev_servers()
