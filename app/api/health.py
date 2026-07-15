from fastapi import APIRouter

router = APIRouter(tags=["Health"])

@router.get("/health")
@router.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "api": "online",
        "service": "InterviewForge - AI Training Platform"
    }
