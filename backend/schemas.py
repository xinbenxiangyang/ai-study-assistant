from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime


# ── AI Generation ───────────────────────────────────────────────

class GenerateRequest(BaseModel):
    text: str
    type: str  # "mind_map", "quiz", "summary", "flashcards"


class MCQOption(BaseModel):
    A: str
    B: str
    C: str
    D: str


class MCQQuestion(BaseModel):
    id: int
    question: str
    options: MCQOption
    correct: str
    explanation: str


class ShortAnswerQuestion(BaseModel):
    id: int
    question: str
    answer: str


class QuizResponse(BaseModel):
    multiple_choice: list[MCQQuestion]
    short_answer: list[ShortAnswerQuestion]


class FlashCard(BaseModel):
    id: int
    front: str  # concept / question
    back: str   # definition / answer


# ── User & Auth ─────────────────────────────────────────────────

class UserProfile(BaseModel):
    id: str
    email: str
    role: str = "user"
    subscription: str = "free"  # free / student / unlimited
    daily_usage: int = 0
    total_usage: int = 0
    created_at: Optional[datetime] = None


# ── Admin ───────────────────────────────────────────────────────

class AdminStats(BaseModel):
    total_users: int
    active_today: int
    total_api_calls: int
    total_tokens_used: int
    estimated_cost: float
    subscriptions: dict  # {"free": N, "student": N, "unlimited": N}


class UserListItem(BaseModel):
    id: str
    email: str
    subscription: str
    daily_usage: int
    total_usage: int
    is_active: bool
    created_at: datetime


class UsageRecord(BaseModel):
    id: str
    user_id: str
    type: str
    tokens_used: int
    cost: float
    created_at: datetime
