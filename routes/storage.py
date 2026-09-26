from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.database import get_db
from app.models import User, FileItem
from app.schemas import StorageOut
from app.dependencies import get_current_user

router = APIRouter(prefix="/storage", tags=["Storage"])

@router.get("", response_model=StorageOut)
def get_storage_stats(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    used = db.query(func.coalesce(func.sum(FileItem.size), 0)).filter(
        FileItem.user_id == current_user.id,
        FileItem.is_deleted == False
    ).scalar()

    count = db.query(func.count(FileItem.id)).filter(
        FileItem.user_id == current_user.id,
        FileItem.is_deleted == False
    ).scalar()

    total = current_user.storage_quota
    remaining = max(0, total - used)

    return StorageOut(
        total_storage=total,
        used_storage=used,
        remaining_storage=remaining,
        file_count=count
    )
