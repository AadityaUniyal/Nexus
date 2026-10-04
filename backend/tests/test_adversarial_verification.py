"""
Adversarial Verification Suite for Milestone 1 De-Azure
-------------------------------------------------------
Verifies:
1. Serverless database connection pooling (NullPool under VERCEL=1)
2. High-volume telemetry logging facade stress (1000+ events/metrics)
3. Local storage facade operations (upload, download, list, batches, edge cases)
4. Repository clean state (zero Azure artifacts in root and .github/workflows)
"""

import os
import sys
import time
import asyncio
import threading
import importlib
from pathlib import Path
import pytest
from sqlalchemy import text, event
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.pool import NullPool

# Integration clients
from app.integrations.azure_monitor import AzureMonitorClient
from app.integrations.azure_blob_storage import AzureBlobStorageClient


# =====================================================================
# 1. Serverless Database Connection Pooling Tests
# =====================================================================

def test_nullpool_instantiation_with_vercel_flag():
    """Verify NullPool is instantiated when VERCEL=1 is set."""
    prev_vercel = os.environ.get("VERCEL")
    prev_db_url = os.environ.get("DATABASE_URL")
    try:
        os.environ["VERCEL"] = "1"
        os.environ["DATABASE_URL"] = "postgresql+asyncpg://user:pass@ep-nexus-123.us-east-2.aws.neon.tech/neondb?sslmode=require"

        import app.db.session as session_module
        importlib.reload(session_module)

        engine = session_module.engine
        engine_kwargs = session_module.engine_kwargs

        assert isinstance(engine.pool, NullPool), f"Engine pool is {type(engine.pool)}, expected NullPool"
        assert engine_kwargs.get("poolclass") == NullPool, "engine_kwargs missing poolclass NullPool"
        assert engine_kwargs.get("connect_args") == {"ssl": "require"}, f"Unexpected connect_args: {engine_kwargs.get('connect_args')}"
    finally:
        if prev_vercel is not None:
            os.environ["VERCEL"] = prev_vercel
        else:
            os.environ.pop("VERCEL", None)
        if prev_db_url is not None:
            os.environ["DATABASE_URL"] = prev_db_url
        else:
            os.environ.pop("DATABASE_URL", None)
        import app.db.session as session_module
        importlib.reload(session_module)


@pytest.mark.asyncio
async def test_nullpool_concurrent_sessions_no_leak(tmp_path):
    """Stress test NullPool under concurrent async operations with real database."""
    db_file = tmp_path / "test_nullpool.db"
    db_url = f"sqlite+aiosqlite:///{db_file}"

    test_engine = create_async_engine(
        db_url,
        poolclass=NullPool,
        echo=False
    )
    test_sessionmaker = async_sessionmaker(
        bind=test_engine,
        class_=AsyncSession,
        expire_on_commit=False,
    )

    checkouts = 0
    checkins = 0

    @event.listens_for(test_engine.sync_engine, "checkout")
    def on_checkout(*args):
        nonlocal checkouts
        checkouts += 1

    @event.listens_for(test_engine.sync_engine, "checkin")
    def on_checkin(*args):
        nonlocal checkins
        checkins += 1

    # Initialize schema
    async with test_sessionmaker() as session:
        await session.execute(text("CREATE TABLE items (id INTEGER PRIMARY KEY, val TEXT)"))
        await session.commit()

    # Run 50 concurrent transactions
    async def worker(idx: int):
        async with test_sessionmaker() as session:
            await session.execute(text("INSERT INTO items (val) VALUES (:val)"), {"val": f"item_{idx}"})
            await session.commit()
        # Verify read in separate session
        async with test_sessionmaker() as session:
            res = await session.execute(text("SELECT val FROM items WHERE val = :val"), {"val": f"item_{idx}"})
            row = res.scalar_one_or_none()
            assert row == f"item_{idx}"

    tasks = [worker(i) for i in range(50)]
    await asyncio.gather(*tasks)

    # In NullPool, every connection checked out must be returned and checked in
    assert checkouts > 0
    assert checkouts == checkins, f"Connection leak detected! Checkouts: {checkouts}, Checkins: {checkins}"
    assert test_engine.pool.status() == "NullPool"

    # Verify total count
    async with test_sessionmaker() as session:
        res = await session.execute(text("SELECT COUNT(*) FROM items"))
        count = res.scalar()
        assert count == 50

    await test_engine.dispose()


@pytest.mark.asyncio
async def test_session_module_actual_engine_under_vercel_concurrent_stress(tmp_path):
    """Verify app.db.session's actual engine and session factory under VERCEL=1 with 50 concurrent queries."""
    prev_vercel = os.environ.get("VERCEL")
    prev_db_url = os.environ.get("DATABASE_URL")
    db_file = tmp_path / "actual_session.db"
    try:
        os.environ["VERCEL"] = "1"
        os.environ["DATABASE_URL"] = f"sqlite+aiosqlite:///{db_file}"

        import app.db.session as session_module
        importlib.reload(session_module)

        engine = session_module.engine
        assert isinstance(engine.pool, NullPool), "Actual app.db.session engine must use NullPool under VERCEL=1"

        checkouts = 0
        checkins = 0

        @event.listens_for(engine.sync_engine, "checkout")
        def on_checkout(*args):
            nonlocal checkouts
            checkouts += 1

        @event.listens_for(engine.sync_engine, "checkin")
        def on_checkin(*args):
            nonlocal checkins
            checkins += 1

        async with session_module.AsyncSessionLocal() as session:
            await session.execute(text("DROP TABLE IF EXISTS test_vercel"))
            await session.execute(text("CREATE TABLE test_vercel (id SERIAL PRIMARY KEY, status TEXT)"))
            await session.commit()

        # Execute 50 concurrent transactions
        async def insert_task(idx: int):
            async with session_module.AsyncSessionLocal() as session:
                await session.execute(text("INSERT INTO test_vercel (status) VALUES (:s)"), {"s": f"active_{idx}"})
                await session.commit()

        await asyncio.gather(*[insert_task(i) for i in range(50)])

        # Verify zero connection leak
        assert checkouts > 0
        assert checkouts == checkins, f"Leaked connections! Checkouts={checkouts}, Checkins={checkins}"

    finally:
        if prev_vercel is not None:
            os.environ["VERCEL"] = prev_vercel
        else:
            os.environ.pop("VERCEL", None)
        if prev_db_url is not None:
            os.environ["DATABASE_URL"] = prev_db_url
        else:
            os.environ.pop("DATABASE_URL", None)
        import app.db.session as session_module
        importlib.reload(session_module)


@pytest.mark.asyncio
async def test_get_db_lifecycle_and_exception_handling():
    """Verify get_db() lifecycle commits on success and rolls back on exception."""
    from app.db.session import get_db

    # Success case generator test
    gen = get_db()
    session = await gen.asend(None)
    assert session is not None
    try:
        await gen.asend(None)
    except StopAsyncIteration:
        pass

    # Exception case generator test
    gen_err = get_db()
    session_err = await gen_err.asend(None)
    assert session_err is not None
    with pytest.raises(RuntimeError, match="Simulated request failure"):
        await gen_err.athrow(RuntimeError("Simulated request failure"))


# =====================================================================
# 2. Telemetry Logging Facade High-Volume Stress Tests
# =====================================================================

def test_azure_monitor_high_volume_stress():
    """Stress test telemetry facade with 1600+ calls to ensure zero bottlenecks and zero exceptions."""
    client = AzureMonitorClient()

    start_time = time.perf_counter()

    for i in range(500):
        client.track_event(f"event_{i}", {"iteration": i, "tag": "stress_test"})
        client.track_metric(f"metric_{i}", float(i * 1.5), {"dim": "test"})
        client.track_dependency(f"dep_{i}", duration_ms=i * 0.1, success=(i % 2 == 0), properties={"call": i})

    for i in range(100):
        try:
            raise ValueError(f"Synthetic stress error {i}")
        except Exception as ex:
            client.track_exception(ex, {"error_index": i})

    client.flush()
    client.shutdown()

    elapsed = time.perf_counter() - start_time
    total_calls = 500 * 3 + 100 + 2
    assert elapsed < 2.0, f"Telemetry logging too slow: {elapsed:.2f}s for {total_calls} calls"


def test_azure_monitor_multithreaded_high_volume_stress():
    """Stress test telemetry facade under multithreaded high volume (5000+ calls across 10 threads)."""
    client = AzureMonitorClient()
    exceptions = []

    def thread_worker(thread_id: int):
        try:
            for i in range(100):
                client.track_event(f"th_{thread_id}_event_{i}", {"t": thread_id, "i": i})
                client.track_metric(f"th_{thread_id}_metric", float(i), {"t": thread_id})
                client.track_dependency(f"th_{thread_id}_dep", duration_ms=5.0, success=True)
                client.track_exception(RuntimeError(f"th_{thread_id}_err"), {"t": thread_id})
                client.flush()
        except Exception as e:
            exceptions.append(e)

    threads = [threading.Thread(target=thread_worker, args=(t,)) for t in range(10)]
    start_time = time.perf_counter()
    for t in threads:
        t.start()
    for t in threads:
        t.join()
    elapsed = time.perf_counter() - start_time

    assert len(exceptions) == 0, f"Exceptions occurred during multithreaded logging: {exceptions}"
    assert elapsed < 3.0, f"Multithreaded logging took too long: {elapsed:.2f}s for 5000 calls"


def test_azure_monitor_edge_case_inputs():
    """Test telemetry facade resilience against extreme/unusual parameters."""
    client = AzureMonitorClient()

    # None properties
    client.track_event("test_none", None)
    client.track_metric("test_none_metric", 0.0, None)
    client.track_dependency("test_none_dep", 0.0, True, None)
    client.track_exception(ValueError("sample"), None)

    # None exception handling
    client.track_exception(None, {"note": "passing None as exception"})

    # Extreme metric values
    client.track_metric("inf_metric", float("inf"))
    client.track_metric("neg_inf_metric", float("-inf"))
    client.track_metric("large_metric", 1e30)
    client.track_metric("zero_metric", 0.0)

    # Negative duration dependency
    client.track_dependency("neg_duration", -10.5, False, {"retry": True})

    # Complex nested and large property payloads
    nested_props = {
        "nested": {"level1": {"level2": [1, 2, 3]}},
        "unicode": "Operational telemetry 🚚 📦 ⚡",
        "huge_list": list(range(100)),
        "boolean": True,
        "empty_str": ""
    }
    client.track_event("complex_payload", nested_props)

    # Multiple flushes / shutdowns should be safe no-ops
    for _ in range(5):
        client.flush()
        client.shutdown()


# =====================================================================
# 3. Local Storage Facade CRUD & Edge Case Tests
# =====================================================================

def test_local_storage_crud_and_edge_cases(tmp_path):
    """Test upload, download, list, batches and edge cases on AzureBlobStorageClient."""
    client = AzureBlobStorageClient()
    client.local_fallback_dir = tmp_path / "local_storage"
    client._ensure_local_dirs()

    # Verify directory creation
    for tier in ["telemetry-bronze", "telemetry-silver", "analytics-gold"]:
        assert (client.local_fallback_dir / tier).is_dir()

    # Test 1: Upload and download bytes
    data_bytes = b"Hello Nexus Telemetry Stream 2026"
    assert client.upload_file("telemetry-bronze", "stream_01.dat", data_bytes) is True
    read_bytes = client.download_file("telemetry-bronze", "stream_01.dat")
    assert read_bytes == data_bytes

    # Test 2: Upload and download string (auto-encoded to utf-8)
    data_str = "Operational Log Entry with Unicode: 🚚 Fleet Active"
    assert client.upload_file("telemetry-silver", "log_01.txt", data_str) is True
    read_str_bytes = client.download_file("telemetry-silver", "log_01.txt")
    assert read_str_bytes.decode("utf-8") == data_str

    # Test 3: Upload nested blob path
    assert client.upload_file("analytics-gold", "2026/10/04/metrics_daily.json", '{"score": 98.5}') is True
    gold_bytes = client.download_file("analytics-gold", "2026/10/04/metrics_daily.json")
    assert gold_bytes == b'{"score": 98.5}'

    # Test 4: Download non-existent file returns None without raising
    assert client.download_file("telemetry-bronze", "non_existent_file.json") is None
    assert client.download_file("unknown_container", "file.json") is None

    # Test 5: List blobs with and without prefix
    client.upload_file("telemetry-bronze", "prefix_a_1.txt", "a1")
    client.upload_file("telemetry-bronze", "prefix_a_2.txt", "a2")
    client.upload_file("telemetry-bronze", "prefix_b_1.txt", "b1")

    all_bronze = client.list_blobs("telemetry-bronze")
    assert "stream_01.dat" in all_bronze
    assert "prefix_a_1.txt" in all_bronze
    assert "prefix_a_2.txt" in all_bronze
    assert "prefix_b_1.txt" in all_bronze

    prefix_a = client.list_blobs("telemetry-bronze", prefix="prefix_a")
    assert len(prefix_a) == 2
    assert "prefix_a_1.txt" in prefix_a
    assert "prefix_a_2.txt" in prefix_a
    assert "prefix_b_1.txt" not in prefix_a

    # Test 6: List blobs on non-existent container returns empty list
    assert client.list_blobs("phantom_container") == []

    # Test 7: Batch telemetry upload
    batch_records = [
        {"vehicle_id": "v-101", "speed": 62.4, "status": "en_route"},
        {"vehicle_id": "v-102", "speed": 0.0, "status": "docked"},
    ]
    assert client.upload_telemetry_batch(batch_records, tier="bronze") is True
    bronze_files = client.list_blobs("telemetry-bronze")
    batch_files = [f for f in bronze_files if "batch_" in f]
    assert len(batch_files) >= 1

    # Verify telemetry archive URL
    archive_url = client.get_telemetry_archive_url("2026-10-04", tier="bronze")
    assert archive_url == "local://telemetry-bronze/2026/10/04"


def test_local_storage_large_binary_and_concurrency(tmp_path):
    """Stress test local storage facade with 500KB binary payload and concurrent uploads."""
    client = AzureBlobStorageClient()
    client.local_fallback_dir = tmp_path / "local_storage"
    client._ensure_local_dirs()

    # 500KB binary payload with null bytes and random byte patterns
    large_payload = b"\x00\xff\xfe\x01\x42" * 100_000
    assert client.upload_file("telemetry-silver", "large_blob.bin", large_payload) is True
    downloaded = client.download_file("telemetry-silver", "large_blob.bin")
    assert len(downloaded) == len(large_payload)
    assert downloaded == large_payload

    # Overwrite test
    updated_payload = b"OVERWRITTEN_DATA"
    assert client.upload_file("telemetry-silver", "large_blob.bin", updated_payload) is True
    assert client.download_file("telemetry-silver", "large_blob.bin") == updated_payload

    # Concurrency test: 30 parallel file uploads
    exceptions = []

    def upload_worker(idx: int):
        try:
            success = client.upload_file("telemetry-bronze", f"concurrent_{idx}.json", f'{{"worker": {idx}}}')
            if not success:
                exceptions.append(f"Upload failed for worker {idx}")
        except Exception as e:
            exceptions.append(e)

    threads = [threading.Thread(target=upload_worker, args=(i,)) for i in range(30)]
    for t in threads:
        t.start()
    for t in threads:
        t.join()

    assert len(exceptions) == 0, f"Concurrent upload errors: {exceptions}"
    blobs = client.list_blobs("telemetry-bronze", prefix="concurrent_")
    assert len(blobs) == 30


# =====================================================================
# 4. Repository Clean State Tests (Zero Azure Artifacts)
# =====================================================================

def test_no_azure_deployment_artifacts_in_root():
    """Verify deleted Azure artifacts do not exist anywhere in project root."""
    root_dir = Path(__file__).resolve().parents[2]

    forbidden_artifacts = [
        ".deployment",
        "startup.sh",
        ".azure_token_cache.json",
        ".env.azure",
        "AZURE_FREE_QUICKSTART.md",
        "infra",
        ".github/workflows/main_nexus-api-prod.yml",
    ]

    for item in forbidden_artifacts:
        target = root_dir / item
        assert not target.exists(), f"Forbidden Azure artifact still exists: {target}"


def test_requirements_and_pyproject_have_no_azure_dependencies():
    """Verify zero azure-* packages in requirements and pyproject."""
    root_dir = Path(__file__).resolve().parents[2]

    manifests = [
        root_dir / "requirements.txt",
        root_dir / "backend" / "requirements.txt",
        root_dir / "backend" / "pyproject.toml",
    ]

    for manifest in manifests:
        assert manifest.exists(), f"Manifest not found: {manifest}"
        content = manifest.read_text(encoding="utf-8")
        lines = content.splitlines()
        for line in lines:
            stripped = line.strip()
            if stripped.startswith("#"):
                continue
            assert "azure-" not in stripped.lower(), f"Azure package reference found in {manifest}: {stripped}"
            assert "pipecat" not in stripped.lower(), f"Pipecat package reference found in {manifest}: {stripped}"


def test_github_workflows_contain_no_azure_actions():
    """Verify .github/workflows contains no Azure deployment actions or steps."""
    root_dir = Path(__file__).resolve().parents[2]
    workflows_dir = root_dir / ".github" / "workflows"

    if workflows_dir.exists():
        for yml_file in workflows_dir.glob("*.y*ml"):
            content = yml_file.read_text(encoding="utf-8")
            # Ensure no azure action usages like azure/webapps-deploy, azure/login, etc.
            assert "azure/webapps-deploy" not in content.lower(), f"Azure action found in {yml_file}"
            assert "azure/login" not in content.lower(), f"Azure action found in {yml_file}"
            assert "azure/arm-deploy" not in content.lower(), f"Azure action found in {yml_file}"


def test_no_active_azure_imports_in_backend():
    """Verify zero active Azure SDK imports across backend python source files."""
    backend_dir = Path(__file__).resolve().parents[1]

    for py_file in backend_dir.rglob("*.py"):
        if "test_adversarial_verification.py" in py_file.name:
            continue
        content = py_file.read_text(encoding="utf-8")
        for line_num, line in enumerate(content.splitlines(), start=1):
            clean_line = line.strip()
            if clean_line.startswith("#"):
                continue
            assert not (clean_line.startswith("import azure") or clean_line.startswith("from azure")), (
                f"Active Azure import found in {py_file}:{line_num} -> {clean_line}"
            )
