from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, EmailStr, Field

# User Schemas
class UserRegister(BaseModel):
    username: str = Field(..., min_length=3, max_length=50)
    email: EmailStr
    password: str = Field(..., min_length=6)

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserUpdate(BaseModel):
    username: Optional[str] = Field(None, min_length=3, max_length=50)
    email: Optional[EmailStr] = None

class UserOut(BaseModel):
    id: int
    username: str
    email: str
    role: str
    storage_quota: int
    storage_used: int
    created_at: datetime

    class Config:
        from_attributes = True

class TokenOut(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut

# Folder Schemas
class FolderCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)

class FolderUpdate(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)

class FolderOut(BaseModel):
    id: int
    user_id: int
    name: str
    created_at: datetime
    updated_at: datetime
    file_count: Optional[int] = 0

    class Config:
        from_attributes = True

# File Schemas
class FileUpdate(BaseModel):
    filename: Optional[str] = Field(None, min_length=1, max_length=255)
    folder_id: Optional[int] = None

class FileOut(BaseModel):
    id: int
    user_id: int
    folder_id: Optional[int]
    filename: str
    s3_key: str
    mime_type: str
    size: int
    is_deleted: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

# Storage Schema
class StorageOut(BaseModel):
    total_storage: int
    used_storage: int
    remaining_storage: int
    file_count: int

# Activity Log Schema
class ActivityLogOut(BaseModel):
    id: int
    user_id: int
    action: str
    details: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True

# Developer Status Schema
class DeveloperStatusOut(BaseModel):
    api_status: str = "Online"
    database_status: str = "Connected"
    storage_provider: str = "S3"
    api_version: str = "v1"
    total_users: int
    total_files: int
    total_storage_used: int
