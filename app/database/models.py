from app.models import (
    Base,
    User,
    Interview,
    Question,
    CandidateAnswer as Answer,
    CodingSolution as CodingSubmission,
    Resume,
    JobDescription,
    Analytics,
    InterviewReport
)

# Export all for backwards compatibility
__all__ = [
    "Base",
    "User",
    "Interview",
    "Question",
    "Answer",
    "CodingSubmission",
    "Resume",
    "JobDescription",
    "Analytics",
    "InterviewReport"
]
