from typing import Dict, Any, List, Optional, Literal
from pydantic import BaseModel, Field
from fastapi import APIRouter, Depends, status, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import get_db
from app.auth.dependencies import require_permission
from app.auth.principal import RequestPrincipal, PermissionEnum
from app.services.import_service import (
    parse_import_file,
    validate_import_data,
    execute_import_data,
    ImportExecutionError,
    ImportValidationResult,
    ImportExecutionResult,
)

router = APIRouter(prefix="/import", tags=["Data Ingestion & Import"])

class ImportPreviewRequest(BaseModel):
    file_content: str = Field(..., max_length=10_000_000, description="Raw CSV text or JSON string, up to 10 MB")
    filename: str = Field(default="data.csv", max_length=255)
    entity_type: Literal["VEHICLES", "DRIVERS", "CUSTOMERS", "ORDERS", "TRIPS"] = Field(default="VEHICLES")
    custom_mapping: Optional[Dict[str, str]] = Field(default=None)

class ImportExecuteRequest(BaseModel):
    file_content: str = Field(..., max_length=10_000_000, description="Raw CSV text or JSON string, up to 10 MB")
    filename: str = Field(default="data.csv", max_length=255)
    entity_type: Literal["VEHICLES", "DRIVERS", "CUSTOMERS", "ORDERS", "TRIPS"] = Field(default="VEHICLES")
    column_mapping: Dict[str, str] = Field(...)

@router.post("/preview", response_model=ImportValidationResult)
async def preview_import(
    req: ImportPreviewRequest,
    principal: RequestPrincipal = Depends(require_permission(PermissionEnum.IMPORT_DATA))
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
    principal: RequestPrincipal = Depends(require_permission(PermissionEnum.IMPORT_DATA)),
    db: AsyncSession = Depends(get_db)
):
    """Commit validated import rows directly into tenant database."""
    try:
        rows = parse_import_file(req.file_content, req.filename)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to parse file: {str(e)}")

    if not rows:
        raise HTTPException(status_code=400, detail="No rows to import.")

    validation = validate_import_data(rows, req.column_mapping, req.entity_type)
    if validation.error_rows_count:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail={
                "message": "Correct the invalid rows in the preview before importing.",
                "valid_rows_count": validation.valid_rows_count,
                "error_rows_count": validation.error_rows_count,
                "errors": validation.errors,
            },
        )

    try:
        result = await execute_import_data(
            db=db,
            rows=rows,
            column_mapping=req.column_mapping,
            entity_type=req.entity_type,
            workspace_id=principal.workspace_id,
            actor_id=principal.nexus_user_id,
            actor_name=principal.display_name,
        )
    except ImportExecutionError as exc:
        raise HTTPException(status_code=409, detail=str(exc)) from exc
    return result
