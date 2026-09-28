import logging
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from app.config import settings
from app.database import engine, Base, SessionLocal
from app.models import User
from app.services.auth_service import hash_password
from app.routes import auth, users, files, folders, storage, activity, developer

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Create Database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="CloudVault API",
    description="Simple and secure personal cloud file storage service API",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS middleware configuration using configured ALLOWED_ORIGINS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

# Security Headers Middleware
@app.middleware("http")
async def add_security_headers(request: Request, call_next):
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    return response

# Global Exception Handler to prevent stack traces from leaking to clients
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled exception on {request.url.path}: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"detail": "An internal server error occurred. Please try again later."}
    )

# Seed Developer Account on Startup if missing
def seed_developer_account():
    db = SessionLocal()
    try:
        dev_user = db.query(User).filter(User.username == settings.DEV_USERNAME).first()
        if not dev_user:
            logger.info(f"Seeding internal developer account: {settings.DEV_USERNAME}")
            hashed_pwd = hash_password(settings.DEV_PASSWORD)
            new_dev = User(
                username=settings.DEV_USERNAME,
                email=settings.DEV_EMAIL,
                password_hash=hashed_pwd,
                role="developer",
                storage_quota=107374182400,  # 100 GB for dev
                storage_used=0
            )
            db.add(new_dev)
            db.commit()
            logger.info("Developer account seeded successfully.")
    except Exception as e:
        logger.error(f"Failed to seed developer account: {e}")
        db.rollback()
    finally:
        db.close()

@app.on_event("startup")
def startup_event():
    seed_developer_account()

# Register API routers under /api/v1
app.include_router(auth.router, prefix="/api/v1")
app.include_router(users.router, prefix="/api/v1")
app.include_router(files.router, prefix="/api/v1")
app.include_router(folders.router, prefix="/api/v1")
app.include_router(storage.router, prefix="/api/v1")
app.include_router(activity.router, prefix="/api/v1")
app.include_router(developer.router, prefix="/api/v1")

@app.get("/health", tags=["Health"])
def health_check():
    return {
        "status": "healthy",
        "service": "CloudVault API",
        "version": "v1"
    }

@app.get("/", tags=["Root"])
def root():
    return {
        "message": "Welcome to CloudVault API",
        "docs": "/docs",
        "health": "/health"
    }
