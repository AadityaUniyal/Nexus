from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from typing import Optional

router = APIRouter()

class ProfileUpdate(BaseModel):
    name: Optional[str] = None
    department: Optional[str] = None
    avatar_seed: Optional[str] = None

@router.get("/")
async def get_profile():
    return {"name": "User", "department": "Ops", "avatar_seed": "123"}

@router.patch("/")
async def update_profile(profile: ProfileUpdate):
    return {"status": "success"}
