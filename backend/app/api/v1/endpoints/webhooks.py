import json
from fastapi import APIRouter, Request, Header, HTTPException, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.db.session import get_db
from app.auth.webhook_verifier import verify_clerk_webhook
from app.models.system import ClerkWebhookEvent
from app.models.user import User, Workspace, WorkspaceMembership
from app.models.organization import OrganizationMembership
from app.services.audit_service import log_audit_action

router = APIRouter()

@router.post("/clerk")
async def handle_clerk_webhook(
    request: Request,
    db: AsyncSession = Depends(get_db)
):
    """
    Receives and processes Clerk webhook events for identity lifecycle synchronization.
    """
    body_bytes = await request.body()
    headers = dict(request.headers)

    # 1. Verify Svix signature
    verify_clerk_webhook(headers, body_bytes)

    payload = json.loads(body_bytes.decode("utf-8"))
    event_id = request.headers.get("svix-id") or request.headers.get("webhook-id")
    if not event_id:
        raise HTTPException(status_code=400, detail="Missing webhook delivery ID")
    event_type = payload.get("type", "unknown")

    # 2. Check Idempotency Table
    stmt = select(ClerkWebhookEvent).where(ClerkWebhookEvent.clerk_event_id == event_id)
    res = await db.execute(stmt)
    if res.scalars().first():
        return {"status": "already_processed", "eventId": event_id}

    webhook_record = ClerkWebhookEvent(
        clerk_event_id=event_id,
        event_type=event_type,
        status="PROCESSED"
    )
    db.add(webhook_record)

    # 3. Process event data
    data = payload.get("data", {})
    clerk_user_id = data.get("id")
    email_addresses = data.get("email_addresses", [])
    primary_email = email_addresses[0].get("email_address") if email_addresses else None
    first_name = data.get("first_name") or ""
    last_name = data.get("last_name") or ""
    display_name = f"{first_name} {last_name}".strip() or "NEXUS Operator"

    if event_type == "user.created" and primary_email:
        # Identity events must carry an explicit, pre-provisioned workspace mapping.
        workspace_id = (data.get("public_metadata") or {}).get("workspace_id")
        if not workspace_id:
            raise HTTPException(status_code=422, detail="Clerk user event has no provisioned workspace mapping.")
        ws_stmt = select(Workspace).where(Workspace.id == workspace_id)
        ws = (await db.execute(ws_stmt)).scalar_one_or_none()
        if not ws:
            raise HTTPException(status_code=422, detail="Clerk user event references an unknown workspace.")
        ws_id = ws.id

        user = User(
            id=f"usr-{clerk_user_id[:8]}",
            clerk_user_id=clerk_user_id,
            email=primary_email,
            name=display_name,
            role="OPERATOR",
            workspace_id=ws_id,
            organization_id=ws.organization_id,
            onboarding_status="NOT_STARTED",
            is_active=True
        )
        db.add(user)
        db.add(WorkspaceMembership(
            workspace_id=ws_id,
            user_id=user.id,
            role="OPERATOR",
        ))
        if ws.organization_id:
            db.add(OrganizationMembership(
                organization_id=ws.organization_id,
                user_id=user.id,
                role="OPERATOR",
                is_default=True,
            ))
        await log_audit_action(
            db=db,
            workspace_id=ws_id,
            actor_id=user.id,
            actor_name=display_name,
            action="USER_CREATED_VIA_CLERK",
            entity_type="USER",
            entity_id=user.id,
            details=f"Clerk identity {clerk_user_id} synchronized"
        )

    elif event_type == "user.updated" and clerk_user_id:
        u_stmt = select(User).where(User.clerk_user_id == clerk_user_id)
        u_res = await db.execute(u_stmt)
        user = u_res.scalars().first()
        if user:
            if display_name:
                user.name = display_name
            if primary_email:
                user.email = primary_email

    elif event_type == "user.deleted" and clerk_user_id:
        u_stmt = select(User).where(User.clerk_user_id == clerk_user_id)
        u_res = await db.execute(u_stmt)
        user = u_res.scalars().first()
        if user:
            # Soft deactivation rather than destroying audit/history references
            user.is_active = False

    await db.commit()
    return {"status": "success", "eventType": event_type, "eventId": event_id}
