from typing import Dict, Any, List, Optional
from pydantic import BaseModel, Field
from fastapi import APIRouter, Depends, status, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import get_db
from app.auth.dependencies import require_authenticated, require_workspace, require_permission
from app.auth.principal import RequestPrincipal, PermissionEnum
from app.services.import_service import (
    parse_import_file,
    validate_import_data,
    execute_import_data,
    ImportValidationResult,
    ImportExecutionResult,
)

router = APIRouter(prefix="/import", tags=["Data Ingestion & Import"])

class ImportPreviewRequest(BaseModel):
    file_content: str = Field(..., description="Raw CSV text or JSON string")
    filename: str = Field(default="data.csv")
    entity_type: str = Field(default="VEHICLES", description="VEHICLES, DRIVERS, CUSTOMERS, ORDERS, TRIPS")
    custom_mapping: Optional[Dict[str, str]] = Field(default=None)

class ImportExecuteRequest(BaseModel):
    file_content: str = Field(..., description="Raw CSV text or JSON string")
    filename: str = Field(default="data.csv")
    entity_type: str = Field(default="VEHICLES")
    column_mapping: Dict[str, str] = Field(...)

@router.post("/preview", response_model=ImportValidationResult)
async def preview_import(
    req: ImportPreviewRequest,
    principal: RequestPrincipal = Depends(require_workspace)
):
    """Parse and validate imported CSV/JSON file before committing to database."""
    try:
        rows = parse_import_file(req.file_content, req.filename)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to parse file: {str(e)}")

    if not rows:
        raise HTTPException(status_code=400, detail="The provided file contains no data rows.")

    mapping = req.custom_mapping
    if not mapping:
        from app.services.import_service import suggest_mapping
        cols = list(rows[0].keys())
        mapping = suggest_mapping(cols, req.entity_type)

    return validate_import_data(rows, mapping, req.entity_type)

@router.post("/execute", response_model=ImportExecutionResult, status_code=status.HTTP_201_CREATED)
async def execute_import(
    req: ImportExecuteRequest,
    principal: RequestPrincipal = Depends(require_workspace),
    db: AsyncSession = Depends(get_db)
):
    """Commit validated import rows directly into tenant database."""
    try:
        rows = parse_import_file(req.file_content, req.filename)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to parse file: {str(e)}")

    if not rows:
        raise HTTPException(status_code=400, detail="No rows to import.")

    result = await execute_import_data(
        db=db,
        rows=rows,
        column_mapping=req.column_mapping,
        entity_type=req.entity_type,
        workspace_id=principal.workspace_id,
        actor_id=principal.nexus_user_id,
        actor_name=principal.display_name,
    )
    return result
