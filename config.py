import os
from typing import List
from dotenv import load_dotenv

load_dotenv()

class Settings:
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./cloudvault.db")
    JWT_SECRET: str = os.getenv("JWT_SECRET", "cloudvault_secure_jwt_secret_key_2026_devops")
    JWT_ALGORITHM: str = os.getenv("JWT_ALGORITHM", "HS256")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "1440"))
    
    # CORS Origins (Comma-separated string in env or default dev domains)
    ALLOWED_ORIGINS_RAW: str = os.getenv("ALLOWED_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173,http://localhost:3000")
    
    @property
    def ALLOWED_ORIGINS(self) -> List[str]:
        return [origin.strip() for origin in self.ALLOWED_ORIGINS_RAW.split(",") if origin.strip()]

    # AWS S3 Configuration
    AWS_ACCESS_KEY_ID: str = os.getenv("AWS_ACCESS_KEY_ID", "")
    AWS_SECRET_ACCESS_KEY: str = os.getenv("AWS_SECRET_ACCESS_KEY", "")
    AWS_REGION: str = os.getenv("AWS_REGION", "us-east-1")
    AWS_S3_BUCKET: str = os.getenv("AWS_S3_BUCKET", "cloudvault-storage")
    
    # Developer Account Seed Credentials
    DEV_USERNAME: str = os.getenv("DEV_USERNAME", "developer")
    DEV_EMAIL: str = os.getenv("DEV_EMAIL", "developer@cloudvault.internal")
    DEV_PASSWORD: str = os.getenv("DEV_PASSWORD", "VBAWS@2004")

    # Security Controls
    MAX_FILE_SIZE_BYTES: int = 524288000  # 500 MB max upload limit per file
    AUTH_RATE_LIMIT_REQUESTS: int = 15     # Max requests per window
    AUTH_RATE_LIMIT_WINDOW_SEC: int = 60   # 60 seconds window

settings = Settings()
