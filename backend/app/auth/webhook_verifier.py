import time
import hmac
import hashlib
import base64
from typing import Dict
from app.core.config import settings
from app.core.errors import UnauthenticatedException

def verify_clerk_webhook(headers: Dict[str, str], payload_bytes: bytes) -> bool:
    """
    Verifies the Svix / Clerk webhook signature headers with timestamp replay protection.
    Headers:
      - svix-id
      - svix-timestamp
      - svix-signature
    """
    if not settings.CLERK_WEBHOOK_SECRET:
        # Keep the bypass strictly local/test. Staging must exercise the same
        # signature verification as production so a missing secret fails closed.
        if settings.APP_ENV.lower() in {"development", "dev", "local", "test"}:
            return True
        raise UnauthenticatedException("CLERK_WEBHOOK_SECRET must be configured for this environment")

    svix_id = headers.get("svix-id") or headers.get("webhook-id")
    svix_timestamp = headers.get("svix-timestamp") or headers.get("webhook-timestamp")
    svix_signature = headers.get("svix-signature") or headers.get("webhook-signature")

    if not svix_id or not svix_timestamp or not svix_signature:
        raise UnauthenticatedException("Missing required Svix webhook verification headers")

    # Anti-replay attack check: verify timestamp is within 5 minutes (300 seconds)
    try:
        ts = int(svix_timestamp)
        now = int(time.time())
        if abs(now - ts) > 300:
            raise UnauthenticatedException("Webhook timestamp drift exceeds 5 minutes (replay protection)")
    except ValueError:
        raise UnauthenticatedException("Invalid webhook timestamp format")

    # The signed content is: f"{svix_id}.{svix_timestamp}.{payload_bytes.decode('utf-8')}"
    signed_content = f"{svix_id}.{svix_timestamp}.".encode("utf-8") + payload_bytes

    secret = settings.CLERK_WEBHOOK_SECRET
    if secret.startswith("whsec_"):
        secret = secret[6:]
    
    try:
        secret_bytes = base64.b64decode(secret)
    except Exception:
        secret_bytes = secret.encode("utf-8")

    expected_sig = base64.b64encode(
        hmac.new(secret_bytes, signed_content, hashlib.sha256).digest()
    ).decode("utf-8")

    signatures = [s.replace("v1,", "") for s in svix_signature.split(" ")]
    for sig in signatures:
        if hmac.compare_digest(expected_sig, sig):
            return True

    raise UnauthenticatedException("Invalid Clerk webhook signature")
