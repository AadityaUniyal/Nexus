from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from typing import Optional

router = APIRouter()

class SettingsUpdate(BaseModel):
    theme: Optional[str] = None
    notifications: Optional[bool] = None

@router.get("/")
async def get_settings():
    return {"theme": "dark", "notifications": True}

@router.patch("/")
async def update_settings(settings: SettingsUpdate):
    return {"status": "success"}
