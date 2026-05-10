import re
import json
import os
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException
from supabase import create_client
import anthropic

from routers.auth import get_current_user, DEV_MODE
from schemas import GenerateRequest

router = APIRouter()

SUPABASE_URL = os.getenv("SUPABASE_URL", "")
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")


def _get_supabase():
    return create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)


def get_client():
    api_key = os.getenv("ANTHROPIC_API_KEY") or os.getenv("DEEPSEEK_API_KEY", "")
    return anthropic.Anthropic(
        api_key=api_key,
        base_url="https://api.deepseek.com/anthropic",
    )


def _truncate(text: str, max_chars: int = 15000) -> str:
    if len(text) > max_chars:
        return text[:max_chars] + "\n\n[内容过长，已截断]"
    return text


def _check_quota(user: dict) -> None:
    """Check if user has remaining daily quota. Raises HTTPException if exceeded."""
    if DEV_MODE:
        return
    email = user.get("email", "")
    if email in os.getenv("ADMIN_EMAILS", "").split(","):
        return
    try:
        supabase = _get_supabase()
        profile = supabase.table("profiles").select("subscription,daily_usage,is_active") \
            .eq("id", user["sub"]).single().execute()
        if not profile.data:
            return
        p = profile.data
        if not p.get("is_active", True):
            raise HTTPException(status_code=403, detail="账号已被禁用")
        limits = {"free": 3, "student": 50, "unlimited": 999999}
        limit = limits.get(p.get("subscription", "free"), 3)
        if p.get("daily_usage", 0) >= limit:
            raise HTTPException(status_code=429, detail="今日生成次数已用完，请明天再来或升级套餐")
    except HTTPException:
        raise
    except Exception:
        pass  # Graceful degradation if Supabase is unreachable


def _record_usage(user: dict, gen_type: str, tokens_used: int = 0):
    if DEV_MODE:
        return
    try:
        supabase = _get_supabase()
        supabase.table("usage").insert({
            "user_id": user["sub"],
            "type": gen_type,
            "tokens_used": tokens_used,
            "cost": round(tokens_used / 1000 * 0.001, 4),
        }).execute()
        # Increment daily_usage counter
        profile = supabase.table("profiles").select("daily_usage").eq("id", user["sub"]).single().execute()
        if profile.data:
            current = profile.data.get("daily_usage", 0)
            supabase.table("profiles").update({
                "daily_usage": current + 1,
                "total_usage": (profile.data.get("total_usage", 0) or 0) + 1,
                "last_active": datetime.now(timezone.utc).isoformat(),
            }).eq("id", user["sub"]).execute()
    except Exception:
        pass


# ── Mind Map ────────────────────────────────────────────────────

MIND_MAP_SYSTEM = "你是一个专业的学习辅导助手，擅长将复杂知识梳理成清晰的结构。"

MIND_MAP_PROMPT = """请根据以下课件内容，生成一份结构化的思维导图。

要求：
1. 使用 Markdown 格式的层级标题（#、##、###、####）
2. 顶层 # 是课程主题，## 是主要章节，### 是核心知识点，#### 是关键细节
3. 每个知识点用一句话概括，标注重要概念的定义
4. 使用 - 列表补充说明和例子
5. 重要概念用 **加粗**

课件内容：
{text}"""


@router.post("/mind-map")
def generate_mind_map(req: GenerateRequest, user: dict = Depends(get_current_user)):
    _check_quota(user)
    response = get_client().messages.create(
        model="deepseek-chat",
        max_tokens=4096,
        temperature=0.3,
        system=MIND_MAP_SYSTEM,
        messages=[{"role": "user", "content": MIND_MAP_PROMPT.format(text=_truncate(req.text))}],
    )
    _record_usage(user, "mind_map")
    return {"content": response.content[0].text}


# ── Quiz ────────────────────────────────────────────────────────

QUIZ_SYSTEM = "你是一个专业考试出题人。严格按照JSON格式输出，不要有其他内容。"

QUIZ_PROMPT = """请根据以下课件内容，生成10道考试题目。

内容：
{text}

严格按照以下JSON格式输出（不要输出其他内容）：

{{
  "multiple_choice": [
    {{
      "id": 1,
      "question": "题目",
      "options": {{"A": "选项A", "B": "选项B", "C": "选项C", "D": "选项D"}},
      "correct": "A",
      "explanation": "解析说明"
    }}
  ],
  "short_answer": [
    {{
      "id": 6,
      "question": "简答题题目",
      "answer": "参考答案要点"
    }}
  ]
}}

出题要求：
- 5道单选题（multiple_choice，id 1-5），每题4个选项
- 5道简答题（short_answer，id 6-10）
- 题目覆盖课件中不同章节的核心知识点，不能重复
- 选择题的干扰项要有迷惑性但必须是错误的
- 简答题的答案要列出核心得分点"""


@router.post("/quiz")
def generate_quiz(req: GenerateRequest, user: dict = Depends(get_current_user)):
    _check_quota(user)
    response = get_client().messages.create(
        model="deepseek-chat",
        max_tokens=4096,
        temperature=0.7,
        system=QUIZ_SYSTEM,
        messages=[{"role": "user", "content": QUIZ_PROMPT.format(text=_truncate(req.text))}],
    )
    raw = response.content[0].text
    try:
        json_match = re.search(r'```(?:json)?\s*([\s\S]*?)\s*```', raw)
        json_str = json_match.group(1) if json_match else raw.strip()
        _record_usage(user, "quiz")
        return {"quiz": json.loads(json_str)}
    except json.JSONDecodeError:
        return {"quiz": {"multiple_choice": [], "short_answer": [], "parse_error": True, "raw": raw}}


# ── Summary ─────────────────────────────────────────────────────

SUMMARY_SYSTEM = "你擅长将复杂内容提炼成精简易懂的复习笔记。"

SUMMARY_PROMPT = """请根据以下课件内容，生成一份精简的复习大纲。

要求：
1. 使用 Markdown 格式
2. ## 章节名，### 核心知识点
3. 每个知识点 1-2 句话概括，不超过3行
4. 配合 emoji 标记重点类型：📌 必考 | 💡 理解 | 📖 了解
5. 末尾附上"关键词一览"列表
6. 整体长度控制在 500-800 字

课件内容：
{text}"""


@router.post("/summary")
def generate_summary(req: GenerateRequest, user: dict = Depends(get_current_user)):
    _check_quota(user)
    response = get_client().messages.create(
        model="deepseek-chat",
        max_tokens=2048,
        temperature=0.3,
        system=SUMMARY_SYSTEM,
        messages=[{"role": "user", "content": SUMMARY_PROMPT.format(text=_truncate(req.text))}],
    )
    _record_usage(user, "summary")
    return {"content": response.content[0].text}


# ── Flashcards ──────────────────────────────────────────────────

FLASHCARD_SYSTEM = "你是一个记忆法专家。严格按照JSON格式输出卡片内容。"

FLASHCARD_PROMPT = """请根据以下课件内容，生成15张知识卡片，帮助用户通过"主动回忆法"高效记忆。

内容：
{text}

严格按照以下JSON格式输出：

{{
  "cards": [
    {{
      "id": 1,
      "front": "概念名称 / 问题（正面）",
      "back": "定义 / 答案（背面，包含关键细节）"
    }}
  ]
}}

要求：
- 共15张卡片
- 正面：简短的问题或概念名称（10字以内）
- 背面：核心答案（30-50字，包含1-2个关键细节）
- 覆盖课程中最重要的15个核心概念
- 适合手机屏幕阅读"""


@router.post("/flashcards")
def generate_flashcards(req: GenerateRequest, user: dict = Depends(get_current_user)):
    _check_quota(user)
    response = get_client().messages.create(
        model="deepseek-chat",
        max_tokens=3072,
        temperature=0.5,
        system=FLASHCARD_SYSTEM,
        messages=[{"role": "user", "content": FLASHCARD_PROMPT.format(text=_truncate(req.text))}],
    )
    raw = response.content[0].text
    try:
        json_match = re.search(r'```(?:json)?\s*([\s\S]*?)\s*```', raw)
        json_str = json_match.group(1) if json_match else raw.strip()
        _record_usage(user, "flashcards")
        return {"flashcards": json.loads(json_str)}
    except json.JSONDecodeError:
        return {"flashcards": {"cards": [], "parse_error": True, "raw": raw}}
