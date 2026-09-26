from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.database import get_db, engine
from app.models import User, FileItem
from app.schemas import DeveloperStatusOut
from app.dependencies import get_developer_user

router = APIRouter(prefix="/developer", tags=["Developer"])

@router.get("/status", response_model=DeveloperStatusOut)
def get_developer_status(
    developer_user: User = Depends(get_developer_user),
    db: Session = Depends(get_db)
):
    # Check DB connection
    db_status = "Connected"
    try:
        with engine.connect() as conn:
            pass
    except Exception:
        db_status = "Error"

    total_users = db.query(func.count(User.id)).scalar()
    total_files = db.query(func.count(FileItem.id)).filter(FileItem.is_deleted == False).scalar()
    total_storage = db.query(func.coalesce(func.sum(FileItem.size), 0)).filter(FileItem.is_deleted == False).scalar()

    return DeveloperStatusOut(
        api_status="Online",
        database_status=db_status,
        storage_provider="S3",
        api_version="v1",
        total_users=total_users or 0,
        total_files=total_files or 0,
        total_storage_used=total_storage or 0
    )
