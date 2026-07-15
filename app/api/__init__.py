from app.api.auth import router as auth
from app.api.interview import router as interview
from app.api.coding import router as coding
from app.api.reports import router as reports
from app.api.analytics import router as analytics
from app.api.health import router as health
from app.api.training import router as training

__all__ = [
    "auth",
    "interview",
    "coding",
    "reports",
    "analytics",
    "health",
    "training"
]
