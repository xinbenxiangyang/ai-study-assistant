import os
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

load_dotenv()

from routers import auth, pdf, ai, admin, linear_algebra


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: ensure admin table exists
    yield


app = FastAPI(
    title="AI Study Assistant API",
    version="2.0.0",
    lifespan=lifespan,
)

ALLOWED_ORIGINS = os.getenv("ALLOWED_ORIGINS", "http://localhost:3000,http://127.0.0.1:3000,http://localhost:3001,http://127.0.0.1:3001")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[o.strip() for o in ALLOWED_ORIGINS.split(",") if o.strip()],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api/auth", tags=["Auth"])
app.include_router(pdf.router, prefix="/api/pdf", tags=["PDF"])
app.include_router(ai.router, prefix="/api/ai", tags=["AI"])
app.include_router(admin.router, prefix="/api/admin", tags=["Admin"])
app.include_router(linear_algebra.router, prefix="/api/linear-algebra", tags=["Linear Algebra"])


@app.get("/api/health")
def health_check():
    return {"status": "ok", "version": "2.0.0"}
