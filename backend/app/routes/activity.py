from typing import List
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import User, ActivityLog
from app.schemas import ActivityLogOut
from app.dependencies import get_current_user

router = APIRouter(prefix="/activity", tags=["Activity"])

@router.get("", response_model=List[ActivityLogOut])
def get_user_activity(
    limit: int = Query(20, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    activities = db.query(ActivityLog).filter(
        ActivityLog.user_id == current_user.id
    ).order_by(ActivityLog.created_at.desc()).limit(limit).all()
    
    return activities
