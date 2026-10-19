from datetime import datetime, timezone, timedelta
from app.services.detention_service import DetentionService, haversine_distance_meters


def test_haversine_distance():
    # Distance between Mumbai (19.0760, 72.8777) and Pune (18.5204, 73.8567) is ~120 km
    dist_m = haversine_distance_meters(19.0760, 72.8777, 18.5204, 73.8567)
    dist_km = dist_m / 1000.0
    assert 115.0 < dist_km < 125.0


def test_geofence_detection():
    # Warehouse dock at (19.0760, 72.8777)
    dock_lat, dock_lng = 19.0760, 72.8777
    # Truck at 100 meters away (19.0765, 72.8777)
    inside, dist = DetentionService.check_geofence(19.0765, 72.8777, dock_lat, dock_lng, threshold_meters=500.0)
    assert inside is True
    assert dist < 100.0

    # Truck 5 km away (19.1200, 72.8777)
    outside, dist_far = DetentionService.check_geofence(19.1200, 72.8777, dock_lat, dock_lng, threshold_meters=500.0)
    assert outside is False
    assert dist_far > 4000.0


def test_detention_clock_within_free_window():
    arrival = datetime(2026, 10, 20, 10, 0, 0, tzinfo=timezone.utc)
    # 60 minutes elapsed (less than 120 free minutes)
    now = datetime(2026, 10, 20, 11, 0, 0, tzinfo=timezone.utc)
    res = DetentionService.compute_detention_charges(
        dock_arrival_dt=arrival,
        now_dt=now,
        free_minutes=120,
        hourly_rate_inr=500.0,
    )
    assert res["entered_geofence"] is True
    assert res["total_dock_wait_minutes"] == 60
    assert res["billable_detention_minutes"] == 0
    assert res["total_detention_charge_inr"] == 0.0
    assert res["detention_status"] == "FREE_WINDOW"


def test_detention_clock_over_free_window_accruing():
    arrival = datetime(2026, 10, 20, 8, 0, 0, tzinfo=timezone.utc)
    # 5 hours (300 minutes) elapsed -> 180 billable minutes (3.0 hours)
    now = datetime(2026, 10, 20, 13, 0, 0, tzinfo=timezone.utc)
    res = DetentionService.compute_detention_charges(
        dock_arrival_dt=arrival,
        now_dt=now,
        free_minutes=120,
        hourly_rate_inr=500.0,
    )
    assert res["entered_geofence"] is True
    assert res["total_dock_wait_minutes"] == 300
    assert res["billable_detention_minutes"] == 180
    assert res["billable_detention_hours"] == 3.0
    assert res["total_detention_charge_inr"] == 1500.0  # 3 hrs * ₹500
    assert res["detention_status"] == "DETENTION_ACCRUING"


def test_detention_clock_with_pod_submitted():
    arrival = datetime(2026, 10, 20, 8, 0, 0, tzinfo=timezone.utc)
    # POD uploaded after 4 hours (240 minutes) -> 120 billable minutes (2.0 hours)
    pod_time = datetime(2026, 10, 20, 12, 0, 0, tzinfo=timezone.utc)
    res = DetentionService.compute_detention_charges(
        dock_arrival_dt=arrival,
        pod_submission_dt=pod_time,
        free_minutes=120,
        hourly_rate_inr=500.0,
    )
    assert res["pod_submission_time"] == pod_time.isoformat()
    assert res["billable_detention_minutes"] == 120
    assert res["billable_detention_hours"] == 2.0
    assert res["total_detention_charge_inr"] == 1000.0
    assert res["detention_status"] == "POD_SUBMITTED_CHARGEABLE"
