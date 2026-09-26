from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.database import get_db
from app.models import User, Folder, FileItem
from app.schemas import FolderOut, FolderCreate, FolderUpdate
from app.dependencies import get_current_user, create_activity_log

router = APIRouter(prefix="/folders", tags=["Folders"])

@router.get("", response_model=List[FolderOut])
def get_folders(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    folders = db.query(Folder).filter(Folder.user_id == current_user.id).order_by(Folder.name.asc()).all()
    
    result = []
    for f in folders:
        count = db.query(func.count(FileItem.id)).filter(
            FileItem.folder_id == f.id,
            FileItem.is_deleted == False
        ).scalar()
        folder_dict = FolderOut.from_orm(f)
        folder_dict.file_count = count
        result.append(folder_dict)
        
    return result

@router.post("", response_model=FolderOut, status_code=status.HTTP_201_CREATED)
def create_folder(
    folder_in: FolderCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    existing = db.query(Folder).filter(
        Folder.user_id == current_user.id,
        Folder.name == folder_in.name
    ).first()
    if existing:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Folder with this name already exists")

    new_folder = Folder(
        user_id=current_user.id,
        name=folder_in.name
    )
    db.add(new_folder)
    db.commit()
    db.refresh(new_folder)

    create_activity_log(db, current_user.id, "FOLDER_CREATED", f"Created folder: {new_folder.name}")
    
    res = FolderOut.from_orm(new_folder)
    res.file_count = 0
    return res

@router.patch("/{folder_id}", response_model=FolderOut)
def update_folder(
    folder_id: int,
    folder_in: FolderUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    folder = db.query(Folder).filter(Folder.id == folder_id, Folder.user_id == current_user.id).first()
    if not folder:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Folder not found")

    folder.name = folder_in.name
    db.commit()
    db.refresh(folder)

    count = db.query(func.count(FileItem.id)).filter(
        FileItem.folder_id == folder.id,
        FileItem.is_deleted == False
    ).scalar()
    res = FolderOut.from_orm(folder)
    res.file_count = count
    return res

@router.delete("/{folder_id}")
def delete_folder(
    folder_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    folder = db.query(Folder).filter(Folder.id == folder_id, Folder.user_id == current_user.id).first()
    if not folder:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Folder not found")

    # Unlink files from this folder
    db.query(FileItem).filter(FileItem.folder_id == folder_id).update({"folder_id": None})
    db.delete(folder)
    db.commit()

    return {"message": "Folder deleted successfully", "folder_id": folder_id}
