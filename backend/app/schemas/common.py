from typing import Generic, TypeVar, Optional, Any, Dict, List
from pydantic import BaseModel, Field

T = TypeVar("T")

class StandardErrorDetail(BaseModel):
    code: str
    message: str
    details: Optional[Dict[str, Any]] = None
    requestId: Optional[str] = None

class StandardErrorResponse(BaseModel):
    error: StandardErrorDetail

class PaginatedResponse(BaseModel, Generic[T]):
    items: List[T]
    total: int
    page: int = 1
    pageSize: int = 50
