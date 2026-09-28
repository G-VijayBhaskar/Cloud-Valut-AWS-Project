import os
import re
import uuid
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form, Query, Response
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.config import settings
from app.database import get_db
from app.models import User, FileItem, Folder
from app.schemas import FileOut, FileUpdate
from app.dependencies import get_current_user, create_activity_log
from app.services.s3_service import s3_service

router = APIRouter(prefix="/files", tags=["Files"])

def sanitize_filename(filename: str) -> str:
    if not filename:
        return "unnamed_file"
    # Normalize slashes and extract basename (strips lead directories like ../../../)
    normalized = filename.replace("\\", "/")
    base_name = os.path.basename(normalized)
    # Remove path traversal dots (..) and replace invalid characters
    clean_name = base_name.replace("..", "")
    clean_name = re.sub(r'[^\w\.-]', '_', clean_name)
    clean_name = clean_name.strip(" ._")
    return clean_name if clean_name else "unnamed_file"

@router.get("", response_model=List[FileOut])
def get_user_files(
    search: Optional[str] = Query(None, description="Search by filename"),
    is_deleted: bool = Query(False, description="Filter deleted files"),
    folder_id: Optional[int] = Query(None, description="Filter by folder ID"),
    sort_by: Optional[str] = Query("date", description="Sort by name, size, date"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    query = db.query(FileItem).filter(
        FileItem.user_id == current_user.id,
        FileItem.is_deleted == is_deleted
    )

    if folder_id is not None:
        query = query.filter(FileItem.folder_id == folder_id)

    if search and search.strip():
        safe_search = search.strip().replace("%", "\\%").replace("_", "\\_")
        query = query.filter(FileItem.filename.ilike(f"%{safe_search}%"))

    if sort_by == "name":
        query = query.order_by(FileItem.filename.asc())
    elif sort_by == "size":
        query = query.order_by(FileItem.size.desc())
    else:  # default 'date'
        query = query.order_by(FileItem.created_at.desc())

    return query.all()

@router.post("/upload", response_model=FileOut, status_code=status.HTTP_201_CREATED)
async def upload_file(
    file: UploadFile = File(...),
    folder_id: Optional[int] = Form(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    file_bytes = await file.read()
    file_size = len(file_bytes)

    # 1. Enforce Max Single File Upload Limit (500 MB)
    if file_size > settings.MAX_FILE_SIZE_BYTES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File exceeds maximum allowed upload size (500 MB)."
        )

    # 2. Storage Quota Check
    if current_user.storage_used + file_size > current_user.storage_quota:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Storage quota exceeded (Max 10 GB)."
        )

    # 3. Check Folder Ownership & Validity
    if folder_id is not None:
        folder = db.query(Folder).filter(Folder.id == folder_id, Folder.user_id == current_user.id).first()
        if not folder:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Specified folder not found.")

    # 4. Path Traversal Protection & Filename Sanitization
    clean_filename = sanitize_filename(file.filename)

    # 5. Generate Random Unique S3 Key (Does NOT trust raw filesystem paths)
    unique_id = str(uuid.uuid4())[:8]
    s3_key = f"users/{current_user.id}/{unique_id}_{clean_filename}"
    mime_type = file.content_type or "application/octet-stream"

    # 6. Direct S3 Upload via boto3
    success = s3_service.upload_file(file_bytes, s3_key, mime_type)
    if not success:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="File upload failed in cloud storage.")

    # 7. Index Metadata in MySQL
    file_item = FileItem(
        user_id=current_user.id,
        folder_id=folder_id,
        filename=clean_filename,
        s3_key=s3_key,
        mime_type=mime_type,
        size=file_size,
        is_deleted=False
    )
    db.add(file_item)

    # Update user active storage_used
    current_user.storage_used += file_size
    db.commit()
    db.refresh(file_item)

    # Log activity
    create_activity_log(db, current_user.id, "UPLOAD", f"Uploaded file: {clean_filename} ({file_size} bytes)")

    return file_item

@router.get("/{file_id}/download")
def download_file(
    file_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Verify file ownership (IDOR Prevention)
    file_item = db.query(FileItem).filter(FileItem.id == file_id, FileItem.user_id == current_user.id).first()
    if not file_item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="File not found")

    if file_item.is_deleted:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File is currently in Trash. Restore it to download."
        )

    try:
        content = s3_service.get_file_content(file_item.s3_key)
    except FileNotFoundError:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="File object not found in storage")
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Download failed from cloud storage.")

    create_activity_log(db, current_user.id, "DOWNLOAD", f"Downloaded file: {file_item.filename}")

    return Response(
        content=content,
        media_type=file_item.mime_type,
        headers={
            "Content-Disposition": f'attachment; filename="{file_item.filename}"'
        }
    )

@router.patch("/{file_id}", response_model=FileOut)
def update_file(
    file_id: int,
    file_update: FileUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Verify file ownership
    file_item = db.query(FileItem).filter(FileItem.id == file_id, FileItem.user_id == current_user.id).first()
    if not file_item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="File not found")

    if file_update.filename is not None:
        clean_name = sanitize_filename(file_update.filename)
        old_name = file_item.filename
        file_item.filename = clean_name
        create_activity_log(db, current_user.id, "RENAME", f"Renamed file from {old_name} to {clean_name}")

    if file_update.folder_id is not None:
        if file_update.folder_id != 0:
            folder = db.query(Folder).filter(Folder.id == file_update.folder_id, Folder.user_id == current_user.id).first()
            if not folder:
                raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Target folder not found")
            file_item.folder_id = file_update.folder_id
        else:
            file_item.folder_id = None

    db.commit()
    db.refresh(file_item)
    return file_item

@router.delete("/{file_id}")
def delete_file(
    file_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Verify ownership
    file_item = db.query(FileItem).filter(FileItem.id == file_id, FileItem.user_id == current_user.id).first()
    if not file_item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="File not found")

    # Soft delete
    file_item.is_deleted = True
    
    # Recalculate storage used
    active_size = db.query(func.coalesce(func.sum(FileItem.size), 0)).filter(
        FileItem.user_id == current_user.id,
        FileItem.is_deleted == False,
        FileItem.id != file_id
    ).scalar()
    current_user.storage_used = active_size

    db.commit()

    create_activity_log(db, current_user.id, "DELETE", f"Moved file to trash: {file_item.filename}")
    return {"message": "File moved to trash successfully", "file_id": file_id}

@router.delete("/{file_id}/permanent")
def delete_file_permanently(
    file_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Check if file exists in DB
    file_item = db.query(FileItem).filter(FileItem.id == file_id).first()
    if not file_item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="File not found")

    # Verify ownership (Return 403 Forbidden if file belongs to another user)
    if file_item.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied: You do not own this file")

    # Verify file is in soft-deleted state
    if not file_item.is_deleted:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only files currently in Trash can be permanently deleted"
        )

    # Delete object from S3
    try:
        s3_success = s3_service.delete_file(file_item.s3_key)
        if not s3_success:
            raise Exception("S3 object deletion failed")
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unable to permanently delete the file. Please try again."
        )

    filename = file_item.filename
    # Delete metadata from MySQL
    db.delete(file_item)

    # Recalculate active storage used
    active_size = db.query(func.coalesce(func.sum(FileItem.size), 0)).filter(
        FileItem.user_id == current_user.id,
        FileItem.is_deleted == False
    ).scalar()
    current_user.storage_used = active_size

    db.commit()

    # Record permanent deletion activity
    create_activity_log(db, current_user.id, "DELETE_PERMANENT", f"Permanently deleted file: {filename}")

    return {"message": "File permanently deleted", "file_id": file_id}

@router.post("/{file_id}/restore", response_model=FileOut)
def restore_file(
    file_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    file_item = db.query(FileItem).filter(FileItem.id == file_id, FileItem.user_id == current_user.id).first()
    if not file_item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="File not found")

    file_item.is_deleted = False

    # Recalculate storage used
    active_size = db.query(func.coalesce(func.sum(FileItem.size), 0)).filter(
        FileItem.user_id == current_user.id,
        FileItem.is_deleted == False
    ).scalar()
    current_user.storage_used = active_size

    db.commit()
    db.refresh(file_item)

    create_activity_log(db, current_user.id, "RESTORE", f"Restored file from trash: {file_item.filename}")
    return file_item
