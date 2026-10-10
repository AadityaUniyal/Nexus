from typing import Dict, Any, List
from fastapi import APIRouter, Depends, Query, HTTPException
from app.auth.dependencies import get_current_principal
from app.auth.principal import RequestPrincipal
from app.integrations.azure_maps import azure_maps_client, AzureMapsException

router = APIRouter(tags=["Maps & Geocoding"])


@router.get("/maps/token")
async def get_maps_token(
    principal: RequestPrincipal = Depends(get_current_principal),
) -> Dict[str, Any]:
    """
    Issues short-lived Entra ID bearer token and client ID for MapLibre Azure Maps rendering.
    Never returns an account key (AC-5, AC-32).
    """
    try:
        token_info = await azure_maps_client.get_frontend_token()
        return token_info
    except AzureMapsException as exc:
        raise HTTPException(status_code=exc.status_code, detail=str(exc))


@router.get("/geo/search")
async def search_address(
    query: str = Query(..., min_length=3),
    limit: int = Query(default=5, ge=1, le=10),
    principal: RequestPrincipal = Depends(get_current_principal),
) -> List[Dict[str, Any]]:
    """
    Autocomplete and address search endpoint for global map camera navigation.
    """
    try:
        results = await azure_maps_client.search_address(query=query, limit=limit)
        return results
    except AzureMapsException as exc:
        raise HTTPException(status_code=exc.status_code, detail=str(exc))
