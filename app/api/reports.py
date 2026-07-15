from fastapi import APIRouter, Depends, HTTPException, Response
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.database.models import Interview
from app.services import pdf_generator
from app.api.auth import get_current_user
from app.models.user import User

router = APIRouter(tags=["Reports"])

@router.get("/report/{id}")
@router.get("/api/report/{id}")
def get_pdf_report(
    id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    interview = db.query(Interview).filter(Interview.id == id).first()
    if not interview:
        raise HTTPException(status_code=404, detail="Interview not found")
        
    # Check if report belongs to user
    if interview.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to access this report")
        
    pdf_bytes = pdf_generator.generate_pdf_report(interview)
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename=InterviewForge_Report_{id}.pdf"}
    )
