import os
from datetime import datetime, timedelta, timezone
from fastapi import APIRouter, HTTPException, Depends, Query
from supabase import create_client

from routers.auth import get_current_user, DEV_MODE

router = APIRouter()

SUPABASE_URL = os.getenv("SUPABASE_URL", "")
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")
ADMIN_EMAILS = os.getenv("ADMIN_EMAILS", "admin@study-assistant.local").split(",")


def _get_supabase():
    return create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)


def require_admin(user: dict = Depends(get_current_user)) -> dict:
    email = user.get("email", "")
    if email not in ADMIN_EMAILS:
        raise HTTPException(status_code=403, detail="Admin access required")
    return user


def _now_iso():
    return datetime.now(timezone.utc).isoformat()


# ── Stats ───────────────────────────────────────────────────────

@router.get("/stats")
def get_stats(admin: dict = Depends(require_admin)):
    supabase = _get_supabase()

    profiles = supabase.table("profiles").select("*").execute()
    total_users = len(profiles.data) if profiles.data else 0

    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    active_today = 0
    subs = {"free": 0, "student": 0, "unlimited": 0}
    if profiles.data:
        for p in profiles.data:
            if (p.get("last_active") or "").startswith(today):
                active_today += 1
            tier = p.get("subscription", "free")
            subs[tier] = subs.get(tier, 0) + 1

    usage = supabase.table("usage").select("*").execute()
    total_calls = len(usage.data) if usage.data else 0
    total_tokens = sum(u.get("tokens_used", 0) for u in usage.data) if usage.data else 0
    estimated_cost = round(total_tokens / 1000 * 0.001, 2)

    return {
        "total_users": total_users,
        "active_today": active_today,
        "total_api_calls": total_calls,
        "total_tokens_used": total_tokens,
        "estimated_cost": estimated_cost,
        "subscriptions": subs,
    }


# ── Users ───────────────────────────────────────────────────────

@router.get("/users")
def list_users(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    search: str = Query(""),
    admin: dict = Depends(require_admin),
):
    supabase = _get_supabase()
    query = supabase.table("profiles").select("*").order("created_at", desc=True)
    if search:
        query = query.ilike("email", f"%{search}%")
    query = query.range((page - 1) * page_size, page * page_size - 1)
    result = query.execute()

    users = []
    if result.data:
        for u in result.data:
            users.append({
                "id": u.get("id", ""),
                "email": u.get("email", ""),
                "subscription": u.get("subscription", "free"),
                "daily_usage": u.get("daily_usage", 0),
                "total_usage": u.get("total_usage", 0),
                "is_active": u.get("is_active", True),
                "created_at": u.get("created_at", ""),
            })
    return {"users": users, "page": page, "page_size": page_size}


@router.get("/users/{user_id}")
def get_user_detail(user_id: str, admin: dict = Depends(require_admin)):
    supabase = _get_supabase()
    profile = supabase.table("profiles").select("*").eq("id", user_id).single().execute()
    if not profile.data:
        raise HTTPException(status_code=404, detail="User not found")
    usage = supabase.table("usage").select("*").eq("user_id", user_id)\
        .order("created_at", desc=True).limit(50).execute()
    return {"profile": profile.data, "recent_usage": usage.data if usage.data else []}


@router.put("/users/{user_id}/status")
def toggle_user_status(user_id: str, body: dict, admin: dict = Depends(require_admin)):
    is_active = body.get("is_active", True)
    supabase = _get_supabase()
    supabase.table("profiles").update({"is_active": is_active}).eq("id", user_id).execute()
    return {"message": "User status updated", "is_active": is_active}


@router.put("/users/{user_id}/subscription")
def update_subscription(user_id: str, body: dict, admin: dict = Depends(require_admin)):
    tier = body.get("subscription", "free")
    if tier not in ("free", "student", "unlimited"):
        raise HTTPException(status_code=400, detail="Invalid subscription tier")
    supabase = _get_supabase()
    supabase.table("profiles").update({"subscription": tier}).eq("id", user_id).execute()
    return {"message": "Subscription updated", "subscription": tier}


# ── Usage ───────────────────────────────────────────────────────

@router.get("/usage")
def get_usage_stats(
    days: int = Query(7, ge=1, le=90),
    admin: dict = Depends(require_admin),
):
    supabase = _get_supabase()
    since = (datetime.now(timezone.utc) - timedelta(days=days)).isoformat()
    usage = supabase.table("usage").select("*").gte("created_at", since)\
        .order("created_at", desc=True).execute()

    daily_counts: dict[str, int] = {}
    if usage.data:
        for u in usage.data:
            date = u.get("created_at", "")[:10]
            daily_counts[date] = daily_counts.get(date, 0) + 1

    return {
        "days": days,
        "total_calls": len(usage.data) if usage.data else 0,
        "daily_breakdown": [{"date": k, "calls": v} for k, v in sorted(daily_counts.items())],
    }
