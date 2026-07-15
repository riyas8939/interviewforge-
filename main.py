import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.database import engine, Base
from app.api import (
    auth, 
    interview, 
    coding, 
    training,
    analytics,
    health,
    reports
)

# Create database tables (Optional, if using Alembic, we can remove this, but for now we keep it)
# In a true production environment, we should rely on Alembic migrations.
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="InterviewForge API",
    description="Multi-Agent AI Interview Simulator Backend",
    version="2.0.0"
)

# CORS Policy configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount routing groups
app.include_router(auth)
app.include_router(interview)
app.include_router(coding)
app.include_router(training)
app.include_router(analytics)
app.include_router(health)
app.include_router(reports)

@app.get("/")
def read_root():
    return {
        "status": "online",
        "app": "InterviewForge - AI Interview Simulator Platform",
        "docs_url": "/docs"
    }

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
