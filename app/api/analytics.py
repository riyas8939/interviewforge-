from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
import json
from app.core.database import get_db
from app.database.models import Interview, Analytics
from app.api.auth import get_current_user
from app.models.user import User

router = APIRouter(tags=["Analytics"])

@router.get("/analytics")
def get_user_analytics(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Fetch or calculate analytics
    analytics_record = db.query(Analytics).filter(Analytics.user_id == current_user.id).first()
    
    if not analytics_record:
        # Calculate on the fly from user's completed interviews
        completed_interviews = db.query(Interview).filter(
            Interview.user_id == current_user.id,
            Interview.status == "COMPLETED"
        ).all()
        
        total_sessions = len(completed_interviews)
        avg_score = 0.0
        if total_sessions > 0:
            avg_score = sum(i.overall_score or 0.0 for i in completed_interviews) / total_sessions
            
        weak_topics = []
        progress = []
        
        for i in completed_interviews:
            progress.append({
                "date": i.created_at.strftime("%Y-%m-%d"),
                "score": i.overall_score
            })
            if i.weaknesses:
                weak_topics.append(i.weaknesses)
                
        # Save baseline record
        analytics_record = Analytics(
            user_id=current_user.id,
            total_sessions=total_sessions,
            average_overall_score=round(avg_score, 1),
            weak_topics=json.dumps(weak_topics),
            progress_history=json.dumps(progress)
        )
        db.add(analytics_record)
        db.commit()
        db.refresh(analytics_record)
        
    try:
        weak_list = json.loads(analytics_record.weak_topics or "[]")
        hist_list = json.loads(analytics_record.progress_history or "[]")
    except Exception:
        weak_list = []
        hist_list = []
        
    return {
        "total_sessions": analytics_record.total_sessions,
        "average_overall_score": analytics_record.average_overall_score,
        "weak_topics": weak_list,
        "progress_history": hist_list
    }
