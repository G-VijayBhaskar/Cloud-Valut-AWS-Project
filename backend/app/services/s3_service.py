import os
import boto3
import logging
from botocore.exceptions import BotoCoreError, ClientError
from app.config import settings

logger = logging.getLogger(__name__)

class S3Service:
    def __init__(self):
        self.bucket = settings.AWS_S3_BUCKET
        self.region = settings.AWS_REGION
        self.local_storage_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), ".s3_local_storage")
        os.makedirs(self.local_storage_dir, exist_ok=True)
        
        self.use_real_s3 = bool(settings.AWS_ACCESS_KEY_ID and settings.AWS_SECRET_ACCESS_KEY)
        
        if self.use_real_s3:
            try:
                self.s3_client = boto3.client(
                    's3',
                    aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
                    aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
                    region_name=self.region
                )
            except Exception as e:
                logger.warning(f"Failed to initialize boto3 S3 client: {e}. Falling back to local S3 storage emulator.")
                self.use_real_s3 = False
        else:
            self.s3_client = None

    def upload_file(self, file_bytes: bytes, s3_key: str, content_type: str) -> bool:
        if self.use_real_s3 and self.s3_client:
            try:
                self.s3_client.put_object(
                    Bucket=self.bucket,
                    Key=s3_key,
                    Body=file_bytes,
                    ContentType=content_type
                )
                return True
            except (BotoCoreError, ClientError) as e:
                logger.error(f"S3 upload error for {s3_key}: {e}")
                # Fallback to local storage if AWS S3 call fails
                return self._upload_local(file_bytes, s3_key)
        else:
            return self._upload_local(file_bytes, s3_key)

    def _upload_local(self, file_bytes: bytes, s3_key: str) -> bool:
        local_path = os.path.join(self.local_storage_dir, s3_key)
        os.makedirs(os.path.dirname(local_path), exist_ok=True)
        with open(local_path, "wb") as f:
            f.write(file_bytes)
        return True

    def get_file_content(self, s3_key: str) -> bytes:
        if self.use_real_s3 and self.s3_client:
            try:
                response = self.s3_client.get_object(Bucket=self.bucket, Key=s3_key)
                return response['Body'].read()
            except (BotoCoreError, ClientError) as e:
                logger.error(f"S3 download error for {s3_key}: {e}")
                return self._get_local_content(s3_key)
        else:
            return self._get_local_content(s3_key)

    def _get_local_content(self, s3_key: str) -> bytes:
        local_path = os.path.join(self.local_storage_dir, s3_key)
        if os.path.exists(local_path):
            with open(local_path, "rb") as f:
                return f.read()
        raise FileNotFoundError(f"File key {s3_key} not found in storage.")

    def delete_file(self, s3_key: str) -> bool:
        if self.use_real_s3 and self.s3_client:
            try:
                self.s3_client.delete_object(Bucket=self.bucket, Key=s3_key)
            except (BotoCoreError, ClientError) as e:
                logger.error(f"S3 delete error for {s3_key}: {e}")
        local_path = os.path.join(self.local_storage_dir, s3_key)
        if os.path.exists(local_path):
            try:
                os.remove(local_path)
            except Exception:
                pass
        return True

s3_service = S3Service()
