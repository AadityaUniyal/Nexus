import zoneinfo
from datetime import datetime, timezone
from typing import Optional, Tuple


def parse_and_validate_local_time(
    local_time_str: str,
    tz_name: str,
    fold: Optional[int] = None
) -> datetime:
    """
    Parses a local ISO / formatted time string in an IANA timezone into UTC datetime.
    Strictly validates DST:
    - If inside a spring-forward gap, raises ValueError("LOCAL_TIME_NONEXISTENT")
    - If inside a fall-back overlap without explicit disambiguation (fold), raises ValueError("LOCAL_TIME_AMBIGUOUS")
    - If fold is provided (0 or 1), accepts and stores unambiguous UTC datetime.
    """
    try:
        zi = zoneinfo.ZoneInfo(tz_name)
    except Exception as exc:
        raise ValueError(f"Invalid IANA timezone identifier: {tz_name}") from exc

    # Parse ISO format or standard space format
    clean_str = local_time_str.strip().replace("T", " ")
    if len(clean_str) == 16:
        clean_str += ":00"

    try:
        naive = datetime.strptime(clean_str, "%Y-%m-%d %H:%M:%S")
    except ValueError as exc:
        raise ValueError(f"Invalid local time format (expected YYYY-MM-DD HH:MM:SS): {local_time_str}") from exc

    dt0 = naive.replace(tzinfo=zi, fold=0)
    dt1 = naive.replace(tzinfo=zi, fold=1)

    # Check for spring-forward nonexistent gap first
    utc_dt0 = dt0.astimezone(timezone.utc)
    round_trip_0 = utc_dt0.astimezone(zi).replace(tzinfo=None)
    utc_dt1 = dt1.astimezone(timezone.utc)
    round_trip_1 = utc_dt1.astimezone(zi).replace(tzinfo=None)

    if round_trip_0 != naive and round_trip_1 != naive:
        raise ValueError("LOCAL_TIME_NONEXISTENT")

    # Check for fall-back overlap
    if dt0.utcoffset() != dt1.utcoffset():
        if fold is None:
            raise ValueError("LOCAL_TIME_AMBIGUOUS")
        chosen = dt1 if fold == 1 else dt0
        return chosen.astimezone(timezone.utc)

    return utc_dt0


def utc_to_local_display(utc_dt: datetime, tz_name: str) -> str:
    """Converts UTC datetime back to local wall-clock string in IANA timezone."""
    zi = zoneinfo.ZoneInfo(tz_name)
    local_dt = utc_dt.astimezone(zi)
    return local_dt.strftime("%Y-%m-%d %H:%M:%S")
