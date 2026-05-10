import os
import httpx
from fastapi import APIRouter, HTTPException, Depends, Header
from pydantic import BaseModel
from supabase import create_client

router = APIRouter()

SUPABASE_URL = os.getenv("SUPABASE_URL", "")
SUPABASE_ANON_KEY = os.getenv("SUPABASE_ANON_KEY", "")
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")
DEV_MODE = os.getenv("DEV_MODE", "false").lower() == "true"
ADMIN_EMAILS = os.getenv("ADMIN_EMAILS", "admin@study-assistant.local").split(",")

DEV_USER = {
    "sub": "dev-admin-00000000-0000-0000-0000-000000000000",
    "email": "admin@study-assistant.local",
    "nickname": "管理员",
    "role": "authenticated",
}


def _get_supabase_admin():
    return create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)


# ── Auth dependency ─────────────────────────────────────────────

def get_current_user(authorization: str = Header(None)) -> dict:
    if DEV_MODE and not authorization:
        return DEV_USER

    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="请先登录")

    token = authorization.split(" ")[1]

    try:
        resp = httpx.get(
            f"{SUPABASE_URL}/auth/v1/user",
            headers={"Authorization": f"Bearer {token}", "apikey": SUPABASE_ANON_KEY},
        )
    except httpx.RequestError:
        if DEV_MODE:
            return DEV_USER
        raise HTTPException(status_code=503, detail="认证服务不可用")

    if resp.status_code != 200:
        raise HTTPException(status_code=401, detail="登录已过期，请重新登录")

    user = resp.json()
    return {
        "sub": user["id"],
        "email": user["email"],
        "role": user.get("role", "authenticated"),
    }


# ── Schemas ─────────────────────────────────────────────────────

class RegisterRequest(BaseModel):
    email: str
    password: str
    nickname: str = ""


class LoginRequest(BaseModel):
    email: str
    password: str


class UpdateProfileRequest(BaseModel):
    nickname: str = ""


# ── Register ────────────────────────────────────────────────────

@router.post("/register")
def register(req: RegisterRequest):
    email = req.email.strip().lower()
    nickname = req.nickname.strip() or email.split("@")[0]

    if len(req.password) < 6:
        raise HTTPException(status_code=400, detail="密码至少 6 个字符")

    if DEV_MODE:
        supabase = _get_supabase_admin()
        try:
            supabase.auth.admin.create_user({
                "email": email,
                "password": req.password,
                "email_confirm": True,
                "user_metadata": {"nickname": nickname},
            })
        except Exception:
            pass
        return {
            "message": "注册成功（开发模式）",
            "email": email,
        }

    # Production: create user via Supabase Auth Admin API
    try:
        resp = httpx.post(
            f"{SUPABASE_URL}/auth/v1/admin/users",
            headers={
                "Authorization": f"Bearer {SUPABASE_SERVICE_ROLE_KEY}",
                "apikey": SUPABASE_SERVICE_ROLE_KEY,
                "Content-Type": "application/json",
            },
            json={
                "email": email,
                "password": req.password,
                "email_confirm": True,
                "user_metadata": {"nickname": nickname},
            },
        )
    except httpx.RequestError:
        raise HTTPException(status_code=503, detail="注册服务不可用")

    if resp.status_code == 422 or resp.status_code == 400:
        detail = resp.json()
        error_msg = str(detail.get("msg", detail)).lower()
        if "already" in error_msg or "exists" in error_msg or "taken" in error_msg:
            raise HTTPException(status_code=400, detail="该邮箱已注册")
        raise HTTPException(status_code=400, detail=str(detail.get("msg", "注册失败")))

    if resp.status_code not in (200, 201):
        raise HTTPException(status_code=500, detail=f"注册失败: {resp.text}")

    user_data = resp.json()
    # Manually create profile (in case handle_new_user trigger is not set up)
    try:
        supabase = _get_supabase_admin()
        supabase.table("profiles").upsert({
            "id": user_data["id"],
            "email": email,
            "role": "user",
            "subscription": "free",
            "daily_usage": 0,
            "total_usage": 0,
            "is_active": True,
        }).execute()
    except Exception:
        pass

    return {"message": "注册成功，请登录", "email": email}


# ── Login ───────────────────────────────────────────────────────

@router.post("/login")
def login(req: LoginRequest):
    email = req.email.strip().lower()

    if DEV_MODE:
        # Try Supabase login first, fall back to dev behavior
        pass

    try:
        resp = httpx.post(
            f"{SUPABASE_URL}/auth/v1/token?grant_type=password",
            headers={"apikey": SUPABASE_ANON_KEY, "Content-Type": "application/json"},
            json={"email": email, "password": req.password},
        )
    except httpx.RequestError:
        raise HTTPException(status_code=503, detail="登录服务不可用")

    if resp.status_code != 200:
        detail = resp.json()
        error_name = detail.get("error", "").lower()
        if "invalid" in error_name or "credentials" in error_name:
            raise HTTPException(status_code=400, detail="邮箱或密码错误")
        raise HTTPException(status_code=400, detail=detail.get("error_description", "登录失败"))

    token_data = resp.json()
    access_token = token_data["access_token"]
    user_id = token_data["user"]["id"]

    # Fetch profile from database, create if missing
    try:
        supabase = _get_supabase_admin()
        profile = supabase.table("profiles").select("*").eq("id", user_id).single().execute()
        if not profile.data:
            supabase.table("profiles").upsert({
                "id": user_id,
                "email": email,
                "role": "user",
                "subscription": "free",
                "daily_usage": 0,
                "total_usage": 0,
                "is_active": True,
            }).execute()
            profile_data = {"subscription": "free", "daily_usage": 0, "total_usage": 0, "is_active": True}
        else:
            profile_data = profile.data
    except Exception:
        profile_data = {}

    return {
        "message": "登录成功",
        "token": access_token,
        "refresh_token": token_data.get("refresh_token"),
        "user": {
            "email": email,
            "nickname": profile_data.get("nickname", email.split("@")[0]),
            "role": profile_data.get("role", "user"),
            "subscription": profile_data.get("subscription", "free"),
            "daily_usage": profile_data.get("daily_usage", 0),
            "total_usage": profile_data.get("total_usage", 0),
            "is_active": profile_data.get("is_active", True),
        },
    }


# ── Get profile ─────────────────────────────────────────────────

@router.get("/me")
def me(user: dict = Depends(get_current_user)):
    if DEV_MODE and user.get("sub") == DEV_USER["sub"]:
        return {
            "email": DEV_USER["email"],
            "nickname": DEV_USER["nickname"],
            "role": "user",
            "subscription": "unlimited",
            "daily_usage": 0,
            "total_usage": 0,
            "uid": DEV_USER["sub"],
        }

    try:
        supabase = _get_supabase_admin()
        profile = supabase.table("profiles").select("*").eq("id", user["sub"]).single().execute()
        if profile.data:
            p = profile.data
            return {
                "email": p.get("email", user.get("email", "")),
                "nickname": p.get("nickname", ""),
                "role": p.get("role", "user"),
                "subscription": p.get("subscription", "free"),
                "daily_usage": p.get("daily_usage", 0),
                "total_usage": p.get("total_usage", 0),
                "is_active": p.get("is_active", True),
                "uid": p.get("id", ""),
            }
    except Exception:
        pass

    return {
        "email": user.get("email", ""),
        "nickname": "",
        "role": "user",
        "subscription": "free",
        "daily_usage": 0,
        "total_usage": 0,
        "uid": user.get("sub", ""),
    }


# ── Update profile ──────────────────────────────────────────────

@router.put("/profile")
def update_profile(req: UpdateProfileRequest, user: dict = Depends(get_current_user)):
    if DEV_MODE and user.get("sub") == DEV_USER["sub"]:
        return {"message": "管理员账号无需修改"}

    if not req.nickname.strip():
        return {"message": "无变更"}

    try:
        supabase = _get_supabase_admin()
        supabase.table("profiles").update({"nickname": req.nickname.strip()}).eq("id", user["sub"]).execute()
    except Exception:
        raise HTTPException(status_code=500, detail="更新失败")

    return {"message": "更新成功", "nickname": req.nickname.strip()}
