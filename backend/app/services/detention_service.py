import math
from datetime import datetime, timezone
from typing import Optional, Dict, Any, Tuple


def haversine_distance_meters(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculates great-circle distance between two GPS coordinates in meters."""
    R = 6371000.0  # Earth's radius in meters
    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    delta_phi = math.radians(lat2 - lat1)
    delta_lambda = math.radians(lon2 - lon1)

    a = (
        math.sin(delta_phi / 2.0) ** 2
        + math.cos(phi1) * math.cos(phi2) * (math.sin(delta_lambda / 2.0) ** 2)
    )
    c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))
    return R * c


class DetentionService:
    """
    Automated Geofence Detention Clock Service.
    Monitors when a vehicle enters the destination warehouse's unloading geofence
    and calculates detention time until signed Proof-of-Delivery is submitted.
    """

    DEFAULT_GEOFENCE_METERS = 500.0  # Standard dock radius
    DEFAULT_FREE_MINUTES = 120       # 2 hours free time window
    DEFAULT_HOURLY_RATE_INR = 500.0  # ₹500/hr detention billing standard

    @classmethod
    def check_geofence(
        cls,
        vehicle_lat: float,
        vehicle_lng: float,
        dock_lat: float,
        dock_lng: float,
        threshold_meters: float = DEFAULT_GEOFENCE_METERS,
    ) -> Tuple[bool, float]:
        """Returns (is_inside_geofence, distance_in_meters)."""
        dist = haversine_distance_meters(vehicle_lat, vehicle_lng, dock_lat, dock_lng)
        return (dist <= threshold_meters, round(dist, 1))

    @classmethod
    def compute_detention_charges(
        cls,
        dock_arrival_dt: Optional[datetime],
        pod_submission_dt: Optional[datetime] = None,
        now_dt: Optional[datetime] = None,
        free_minutes: int = DEFAULT_FREE_MINUTES,
        hourly_rate_inr: float = DEFAULT_HOURLY_RATE_INR,
    ) -> Dict[str, Any]:
        """Computes live or final dock detention breakdown."""
        if not dock_arrival_dt:
            return {
                "entered_geofence": False,
                "dock_arrival_time": None,
                "pod_submission_time": None,
                "total_dock_wait_minutes": 0,
                "free_dock_minutes": free_minutes,
                "billable_detention_minutes": 0,
                "billable_detention_hours": 0.0,
                "hourly_detention_rate_inr": hourly_rate_inr,
                "total_detention_charge_inr": 0.0,
                "detention_status": "EN_ROUTE",
            }

        ref_time = pod_submission_dt or now_dt or datetime.now(timezone.utc)
        
        # Ensure timezone compatibility
        if dock_arrival_dt.tzinfo is None:
            dock_arrival_dt = dock_arrival_dt.replace(tzinfo=timezone.utc)
        if ref_time.tzinfo is None:
            ref_time = ref_time.replace(tzinfo=timezone.utc)

        elapsed_seconds = max(0.0, (ref_time - dock_arrival_dt).total_seconds())
        total_wait_minutes = int(elapsed_seconds // 60)
        billable_minutes = max(0, total_wait_minutes - free_minutes)
        billable_hours = round(billable_minutes / 60.0, 2)
        total_charge = round(billable_hours * hourly_rate_inr, 2)

        if pod_submission_dt:
            status = "POD_SUBMITTED_CHARGEABLE" if billable_minutes > 0 else "DISCHARGED_ON_TIME"
        else:
            status = "DETENTION_ACCRUING" if billable_minutes > 0 else "FREE_WINDOW"

        return {
            "entered_geofence": True,
            "dock_arrival_time": dock_arrival_dt.isoformat(),
            "pod_submission_time": pod_submission_dt.isoformat() if pod_submission_dt else None,
            "total_dock_wait_minutes": total_wait_minutes,
            "free_dock_minutes": free_minutes,
            "billable_detention_minutes": billable_minutes,
            "billable_detention_hours": billable_hours,
            "hourly_detention_rate_inr": hourly_rate_inr,
            "total_detention_charge_inr": total_charge,
            "detention_status": status,
        }
