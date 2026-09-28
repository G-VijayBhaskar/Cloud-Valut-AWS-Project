from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import User
from app.schemas import UserRegister, UserLogin, TokenOut, UserOut
from app.services.auth_service import hash_password, verify_password, create_access_token
from app.services.rate_limiter import auth_rate_limiter
from app.dependencies import create_activity_log

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/register", response_model=UserOut, status_code=status.HTTP_201_CREATED)
def register_user(request: Request, user_in: UserRegister, db: Session = Depends(get_db)):
    # Apply rate limiting on register attempts
    auth_rate_limiter.check_rate_limit(request)

    # Check if username or email already exists
    existing_username = db.query(User).filter(User.username == user_in.username).first()
    if existing_username:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already registered"
        )
    
    existing_email = db.query(User).filter(User.email == user_in.email.lower()).first()
    if existing_email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )

    # Public registration ALWAYS sets role = 'user'
    hashed_pwd = hash_password(user_in.password)
    new_user = User(
        username=user_in.username,
        email=user_in.email.lower(),
        password_hash=hashed_pwd,
        role="user",
        storage_quota=10737418240,  # 10 GB
        storage_used=0
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    return new_user

@router.post("/login", response_model=TokenOut)
def login_user(request: Request, credentials: UserLogin, db: Session = Depends(get_db)):
    # Apply rate limiting on login attempts
    auth_rate_limiter.check_rate_limit(request)

    user = db.query(User).filter(User.email == credentials.email.lower()).first()
    if not user:
        # Fallback check username
        user = db.query(User).filter(User.username == credentials.email).first()
        
    if not user or not verify_password(credentials.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    access_token = create_access_token(data={"sub": str(user.id), "role": user.role})
    
    # Log login activity
    create_activity_log(db, user.id, "LOGIN", f"User logged in ({user.username})")
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": user
    }
