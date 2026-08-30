import time
import httpx
from typing import Dict, Any, Optional
from app.core.config import settings

class JWKSCache:
    def __init__(self, ttl_seconds: int = 3600):
        self.ttl = ttl_seconds
        self._keys: Dict[str, Any] = {}
        self._last_fetched: float = 0

    async def get_key(self, kid: str) -> Optional[Dict[str, Any]]:
        now = time.time()
        if not self._keys or (now - self._last_fetched > self.ttl) or (kid not in self._keys):
            await self._refresh()
        return self._keys.get(kid)

    async def _refresh(self):
        if not settings.CLERK_JWKS_URL:
            return
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                res = await client.get(settings.CLERK_JWKS_URL)
                if res.status_code == 200:
                    data = res.json()
                    self._keys = {k["kid"]: k for k in data.get("keys", [])}
                    self._last_fetched = time.time()
        except Exception:
            pass

jwks_cache = JWKSCache()
