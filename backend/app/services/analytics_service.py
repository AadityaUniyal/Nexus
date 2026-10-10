import statistics
from typing import Dict, Any, List, Optional
from datetime import datetime
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from app.models.job import JobStop, Prediction


def compute_metrics_from_data(
    outcomes: List[Dict[str, Any]],
    lead_predictions: List[Dict[str, Any]]
) -> Dict[str, Any]:
    """
    Pure metrics computation function.
    outcomes: list of dicts with:
      - 'stop_id': str
      - 'window_end': datetime
      - 'actual_arrival_at': datetime
    lead_predictions: list of dicts with:
      - 'stop_id': str
      - 'lead_minutes': float
      - 'predicted_eta': datetime
      - 'actual_arrival_at': datetime
      - 'predicted_status': str
      - 'window_end': datetime
    """
    total_stops = len(outcomes)
    if total_stops < 5:
        return {
            "has_enough_data": False,
            "sample_size": total_stops,
            "threshold": 5,
            "message": f"Not enough data yet ({total_stops} of 5)",
        }

    # On-time rate
    on_time_count = sum(1 for o in outcomes if o["actual_arrival_at"] <= o["window_end"])
    on_time_rate = round(on_time_count / total_stops, 3)

    # Median absolute error at lead times: 15, 30, 60 min
    def calc_median_abs_error(target_lead_min: int, tolerance_min: int = 10) -> Optional[float]:
        errors = [
            abs((p["predicted_eta"] - p["actual_arrival_at"]).total_seconds()) / 60.0
            for p in lead_predictions
            if abs(p["lead_minutes"] - target_lead_min) <= tolerance_min
        ]
        return round(statistics.median(errors), 1) if errors else None

    # Bias at 30 min (positive = predicted later than actual, negative = predicted earlier)
    p30 = [
        (p["predicted_eta"] - p["actual_arrival_at"]).total_seconds() / 60.0
        for p in lead_predictions
        if abs(p["lead_minutes"] - 30) <= 10
    ]
    bias_30m = round(statistics.mean(p30), 1) if p30 else None

    # Precision & Recall at lead 30 min
    tp = fp = fn = 0
    for p in lead_predictions:
        if abs(p["lead_minutes"] - 30) <= 10:
            actually_late = p["actual_arrival_at"] > p["window_end"]
            predicted_late = p["predicted_status"] in ("late", "at_risk")
            if actually_late and predicted_late:
                tp += 1
            elif not actually_late and predicted_late:
                fp += 1
            elif actually_late and not predicted_late:
                fn += 1

    precision = round(tp / (tp + fp), 3) if (tp + fp) > 0 else None
    recall = round(tp / (tp + fn), 3) if (tp + fn) > 0 else None

    return {
        "has_enough_data": True,
        "sample_size": total_stops,
        "on_time_rate": on_time_rate,
        "median_abs_error_15m": calc_median_abs_error(15),
        "median_abs_error_30m": calc_median_abs_error(30),
        "median_abs_error_60m": calc_median_abs_error(60),
        "bias_30m": bias_30m,
        "flag_precision_30m": precision,
        "flag_recall_30m": recall,
    }


async def get_workspace_analytics(
    db: AsyncSession,
    workspace_id: str
) -> Dict[str, Any]:
    """
    Computes analytics for a workspace based solely on completed stops and real predictions.
    """
    # Query completed stops
    stmt = select(JobStop).where(
        and_(
            JobStop.workspace_id == workspace_id,
            JobStop.status == "completed",
            JobStop.actual_arrival_at.is_not(None)
        )
    )
    res = await db.execute(stmt)
    stops = res.scalars().all()

    if not stops:
        return {
            "has_enough_data": False,
            "sample_size": 0,
            "threshold": 5,
            "message": "Complete jobs to see accuracy",
        }

    outcomes = [
        {
            "stop_id": s.id,
            "window_end": s.window_end,
            "actual_arrival_at": s.actual_arrival_at,
        }
        for s in stops
    ]

    stop_ids = [s.id for s in stops]
    pred_stmt = select(Prediction).where(
        and_(
            Prediction.workspace_id == workspace_id,
            Prediction.stop_id.in_(stop_ids),
            Prediction.eta_at.is_not(None)
        )
    )
    pred_res = await db.execute(pred_stmt)
    predictions = pred_res.scalars().all()

    stop_map = {s.id: s for s in stops}
    lead_preds = []
    for p in predictions:
        s = stop_map.get(p.stop_id)
        if s and s.actual_arrival_at:
            lead_sec = (s.actual_arrival_at - p.created_at).total_seconds()
            if lead_sec > 0:
                lead_preds.append({
                    "stop_id": p.stop_id,
                    "lead_minutes": lead_sec / 60.0,
                    "predicted_eta": p.eta_at,
                    "actual_arrival_at": s.actual_arrival_at,
                    "predicted_status": p.status,
                    "window_end": s.window_end,
                })

    return compute_metrics_from_data(outcomes, lead_preds)
