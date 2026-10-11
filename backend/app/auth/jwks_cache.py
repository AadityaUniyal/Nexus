import asyncio
import logging
import time
import httpx
from typing import Dict, Any, Optional
from app.core.config import settings

logger = logging.getLogger("nexus.auth.jwks")

class JWKSCache:
    def __init__(self, ttl_seconds: int = 3600):
        self.ttl = ttl_seconds
        self._url_keys: Dict[str, Dict[str, Any]] = {}
        self._url_last_fetched: Dict[str, float] = {}
        self._lock = asyncio.Lock()

    async def get_key(self, kid: str, jwks_url: Optional[str] = None) -> Optional[Dict[str, Any]]:
        target_url = jwks_url or settings.CLERK_JWKS_URL
        if not target_url:
            return None

        now = time.time()
        keys_for_url = self._url_keys.get(target_url, {})
        last_fetched = self._url_last_fetched.get(target_url, 0)

        if not keys_for_url or (now - last_fetched > self.ttl) or (kid not in keys_for_url):
            await self._refresh(target_url)
            keys_for_url = self._url_keys.get(target_url, {})

        return keys_for_url.get(kid)

    async def _refresh(self, jwks_url: str):
        if not jwks_url:
            return
        async with self._lock:
            # Double check inside lock
            now = time.time()
            if self._url_keys.get(jwks_url) and (now - self._url_last_fetched.get(jwks_url, 0) < 60):
                return
            try:
                async with httpx.AsyncClient(timeout=10.0) as client:
                    res = await client.get(jwks_url)
                    if res.status_code == 200:
                        data = res.json()
                        self._url_keys[jwks_url] = {k["kid"]: k for k in data.get("keys", [])}
                        self._url_last_fetched[jwks_url] = time.time()
                        logger.info(f"[JWKS] Cached {len(self._url_keys[jwks_url])} public keys from {jwks_url}")
                    else:
                        logger.warning(f"[JWKS] Failed to fetch JWKS from {jwks_url}: HTTP {res.status_code}")
            except Exception as e:
                logger.error(f"[JWKS] Error fetching public keys from {jwks_url}: {e}")

jwks_cache = JWKSCache()
