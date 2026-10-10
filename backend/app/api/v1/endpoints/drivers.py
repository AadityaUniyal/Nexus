import uuid
import secrets
from datetime import datetime, timezone, timedelta
from typing import Dict, Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from app.db.session import get_db
from app.auth.dependencies import (
    get_current_principal,
    require_dispatcher,
)
from app.auth.principal import RequestPrincipal
from app.auth.driver_auth import hash_token
from app.models.driver import Driver, DriverLink, DriverSession
from app.services.audit_service import append_audit_entry

router = APIRouter(prefix="/drivers", tags=["Drivers"])


class DriverCreateRequest(BaseModel):
    name: str = Field(..., min_length=2, max_length=128)
    phone: Optional[str] = Field(None, max_length=32)


class DriverUpdateRequest(BaseModel):
    name: Optional[str] = Field(None, min_length=2, max_length=128)
    phone: Optional[str] = Field(None, max_length=32)
    status: Optional[str] = None


@router.get("")
async def list_drivers(
    principal: RequestPrincipal = Depends(get_current_principal),
    db: AsyncSession = Depends(get_db)
) -> List[Dict[str, Any]]:
    stmt = (
        select(Driver)
        .where(Driver.workspace_id == principal.workspace_id)
        .order_by(Driver.created_at)
    )
    res = await db.execute(stmt)
    drivers = res.scalars().all()
    return [
        {
            "id": d.id,
            "workspace_id": d.workspace_id,
            "name": d.name,
            "phone": d.phone,
            "status": d.status,
            "current_lat": d.current_lat,
            "current_lon": d.current_lon,
            "current_heading": d.current_heading,
            "last_ping_at": d.last_ping_at.isoformat() if d.last_ping_at else None,
            "created_at": d.created_at.isoformat(),
        }
        for d in drivers
    ]


@router.post("")
async def create_driver(
    payload: DriverCreateRequest,
    principal: RequestPrincipal = Depends(require_dispatcher),
    db: AsyncSession = Depends(get_db)
) -> Dict[str, Any]:
    now_utc = datetime.now(timezone.utc)
    driver = Driver(
        id=str(uuid.uuid4()),
        workspace_id=principal.workspace_id,
        name=payload.name.strip(),
        phone=payload.phone.strip() if payload.phone else None,
        status="off_duty",
        created_at=now_utc,
        updated_at=now_utc,
    )
    db.add(driver)

    await append_audit_entry(
        db=db,
        workspace_id=principal.workspace_id,
        actor_id=principal.user_id,
        action="create_driver",
        entity_type="driver",
        entity_id=driver.id,
        payload={"name": driver.name, "phone": driver.phone}
    )
    await db.commit()

    return {
        "id": driver.id,
        "workspace_id": driver.workspace_id,
        "name": driver.name,
        "phone": driver.phone,
        "status": driver.status,
        "created_at": driver.created_at.isoformat(),
    }


@router.get("/{driver_id}")
async def get_driver(
    driver_id: str,
    principal: RequestPrincipal = Depends(get_current_principal),
    db: AsyncSession = Depends(get_db)
) -> Dict[str, Any]:
    stmt = select(Driver).where(
        and_(Driver.id == driver_id, Driver.workspace_id == principal.workspace_id)
    )
    res = await db.execute(stmt)
    driver = res.scalar_one_or_none()
    if not driver:
        raise HTTPException(status_code=404, detail="Driver not found")

    return {
        "id": driver.id,
        "workspace_id": driver.workspace_id,
        "name": driver.name,
        "phone": driver.phone,
        "status": driver.status,
        "current_lat": driver.current_lat,
        "current_lon": driver.current_lon,
        "current_heading": driver.current_heading,
        "last_ping_at": driver.last_ping_at.isoformat() if driver.last_ping_at else None,
        "created_at": driver.created_at.isoformat(),
    }


@router.patch("/{driver_id}")
async def update_driver(
    driver_id: str,
    payload: DriverUpdateRequest,
    principal: RequestPrincipal = Depends(require_dispatcher),
    db: AsyncSession = Depends(get_db)
) -> Dict[str, Any]:
    stmt = select(Driver).where(
        and_(Driver.id == driver_id, Driver.workspace_id == principal.workspace_id)
    ).with_for_update()
    res = await db.execute(stmt)
    driver = res.scalar_one_or_none()
    if not driver:
        raise HTTPException(status_code=404, detail="Driver not found")

    updates = {}
    if payload.name is not None:
        driver.name = payload.name.strip()
        updates["name"] = driver.name
    if payload.phone is not None:
        driver.phone = payload.phone.strip()
        updates["phone"] = driver.phone
    if payload.status is not None:
        driver.status = payload.status
        updates["status"] = driver.status

    await append_audit_entry(
        db=db,
        workspace_id=principal.workspace_id,
        actor_id=principal.user_id,
        action="update_driver",
        entity_type="driver",
        entity_id=driver.id,
        payload=updates
    )
    await db.commit()

    return {
        "id": driver.id,
        "workspace_id": driver.workspace_id,
        "name": driver.name,
        "phone": driver.phone,
        "status": driver.status,
    }


@router.delete("/{driver_id}")
async def delete_driver(
    driver_id: str,
    principal: RequestPrincipal = Depends(require_dispatcher),
    db: AsyncSession = Depends(get_db)
) -> Dict[str, Any]:
    stmt = select(Driver).where(
        and_(Driver.id == driver_id, Driver.workspace_id == principal.workspace_id)
    ).with_for_update()
    res = await db.execute(stmt)
    driver = res.scalar_one_or_none()
    if not driver:
        raise HTTPException(status_code=404, detail="Driver not found")

    await append_audit_entry(
        db=db,
        workspace_id=principal.workspace_id,
        actor_id=principal.user_id,
        action="delete_driver",
        entity_type="driver",
        entity_id=driver.id,
        payload={"name": driver.name}
    )
    await db.delete(driver)
    await db.commit()

    return {"status": "deleted", "driver_id": driver_id}


@router.post("/{driver_id}/link")
async def generate_driver_link(
    driver_id: str,
    principal: RequestPrincipal = Depends(require_dispatcher),
    db: AsyncSession = Depends(get_db)
) -> Dict[str, Any]:
    """Generates a signed single-use invitation link for a driver."""
    stmt = select(Driver).where(
        and_(Driver.id == driver_id, Driver.workspace_id == principal.workspace_id)
    )
    res = await db.execute(stmt)
    driver = res.scalar_one_or_none()
    if not driver:
        raise HTTPException(status_code=404, detail="Driver not found")

    raw_token = secrets.token_urlsafe(32)
    token_h = hash_token(raw_token)
    now_utc = datetime.now(timezone.utc)
    expires_at = now_utc + timedelta(hours=24)

    link = DriverLink(
        id=str(uuid.uuid4()),
        driver_id=driver.id,
        workspace_id=principal.workspace_id,
        token_hash=token_h,
        expires_at=expires_at,
        created_at=now_utc,
    )
    db.add(link)

    await append_audit_entry(
        db=db,
        workspace_id=principal.workspace_id,
        actor_id=principal.user_id,
        action="generate_driver_link",
        entity_type="driver",
        entity_id=driver.id,
        payload={"expires_at": expires_at.isoformat()}
    )
    await db.commit()

    return {
        "driver_id": driver.id,
        "link_token": raw_token,
        "expires_at": expires_at.isoformat(),
    }


@router.post("/{driver_id}/revoke-session")
async def revoke_driver_sessions(
    driver_id: str,
    principal: RequestPrincipal = Depends(require_dispatcher),
    db: AsyncSession = Depends(get_db)
) -> Dict[str, Any]:
    """Revokes active sessions for a driver (AC-54)."""
    stmt = select(Driver).where(
        and_(Driver.id == driver_id, Driver.workspace_id == principal.workspace_id)
    )
    res = await db.execute(stmt)
    driver = res.scalar_one_or_none()
    if not driver:
        raise HTTPException(status_code=404, detail="Driver not found")

    now_utc = datetime.now(timezone.utc)
    sess_stmt = (
        select(DriverSession)
        .where(
            and_(
                DriverSession.driver_id == driver.id,
                DriverSession.revoked_at.is_(None)
            )
        )
        .with_for_update()
    )
    sess_res = await db.execute(sess_stmt)
    active_sessions = sess_res.scalars().all()

    for s in active_sessions:
        s.revoked_at = now_utc

    driver.status = "off_duty"

    await append_audit_entry(
        db=db,
        workspace_id=principal.workspace_id,
        actor_id=principal.user_id,
        action="revoke_driver_session",
        entity_type="driver",
        entity_id=driver.id,
        payload={"revoked_count": len(active_sessions)}
    )
    await db.commit()

    return {"status": "revoked", "revoked_count": len(active_sessions)}
