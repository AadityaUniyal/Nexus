from typing import List, Optional
from app.core.errors import InvalidStateTransitionException

ALLOWED_TRANSITIONS = {
    "DETECTED": ["ACKNOWLEDGED", "INVESTIGATING", "RESOLVED"],
    "ACKNOWLEDGED": ["INVESTIGATING", "SIMULATING", "RESOLVED"],
    "INVESTIGATING": ["SIMULATING", "ACTION_PENDING", "RESOLVED"],
    "SIMULATING": ["ACTION_PENDING", "ACTION_APPLIED", "INVESTIGATING", "RESOLVED"],
    "ACTION_PENDING": ["ACTION_APPLIED", "SIMULATING", "RESOLVED"],
    "ACTION_APPLIED": ["RESOLVED", "MONITORING"],
    "MONITORING": ["RESOLVED"],
    "RESOLVED": ["ARCHIVED", "DETECTED"],  # Reopen if needed
    "ARCHIVED": [],
}

def validate_state_transition(current_state: str, next_state: str) -> None:
    """Validate that state transition is legal in the incident state machine."""
    allowed = ALLOWED_TRANSITIONS.get(current_state, [])
    if next_state not in allowed:
        raise InvalidStateTransitionException(
            from_state=current_state,
            to_state=next_state,
            allowed_states=allowed,
        )
