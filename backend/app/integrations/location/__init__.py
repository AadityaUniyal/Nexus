from app.core.config import settings
from app.integrations.location.base import LocationProvider
from app.integrations.location.geoapify import GeoapifyLocationProvider
from app.integrations.location.mock import MockLocationProvider

_provider_instance: LocationProvider = None

def get_location_provider() -> LocationProvider:
    global _provider_instance
    if _provider_instance is not None:
        return _provider_instance

    mode = settings.LOCATION_PROVIDER.lower()
    if mode == "mock":
        _provider_instance = MockLocationProvider()
    elif mode == "geoapify":
        _provider_instance = GeoapifyLocationProvider()
    else:  # 'auto'
        if settings.GEOAPIFY_API_KEY and settings.GEOAPIFY_API_KEY.strip() != "":
            _provider_instance = GeoapifyLocationProvider()
        else:
            _provider_instance = MockLocationProvider()

    return _provider_instance
