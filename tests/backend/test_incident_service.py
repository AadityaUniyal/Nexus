import pytest
from app.services.incident_service import validate_state_transition
from app.core.errors import InvalidStateTransitionException

def test_valid_incident_transitions():
    """Verify legal state transitions in incident lifecycle."""
    validate_state_transition("DETECTED", "ACKNOWLEDGED")
    validate_state_transition("ACKNOWLEDGED", "INVESTIGATING")
    validate_state_transition("INVESTIGATING", "SIMULATING")
    validate_state_transition("SIMULATING", "ACTION_PENDING")
    validate_state_transition("ACTION_PENDING", "ACTION_APPLIED")
    validate_state_transition("ACTION_APPLIED", "RESOLVED")

def test_invalid_incident_transition_raises():
    """Verify illegal state transitions throw InvalidStateTransitionException."""
    with pytest.raises(InvalidStateTransitionException):
        validate_state_transition("DETECTED", "ACTION_APPLIED")
