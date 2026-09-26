# CloudVault ☁️

**CloudVault** is a clean, modern, and production-ready personal cloud file storage web application built as a portfolio and interview project for AWS / Cloud / DevOps engineering roles.

It provides JWT authentication, direct object storage integration with **Amazon S3**, relational metadata indexing in **MySQL**, folder organization, storage quota management, soft-delete recovery, and developer system diagnostics.

---

## 🔒 Implemented Security Controls

CloudVault implements robust, real-world security practices across the application stack:

1. **Password Hashing**: Passwords are hashed using `bcrypt` with unique salts. Raw passwords and password hashes are never stored in plain text or returned in API responses.
2. **Stateless JWT Authentication**: Private endpoints are protected with Bearer JWT tokens. Signature and expiration (`exp`) claims are validated on every request, returning `HTTP 401 Unauthorized` for invalid or expired tokens.
3. **IDOR & Ownership Enforcement**: All file operations (list, upload, download, rename, soft-delete, restore, permanent delete) strictly enforce user ownership based on the authenticated JWT subject (`current_user.id`). User A cannot access or manipulate User B's files by changing file IDs in API requests.
4. **AWS S3 Security & Credential Isolation**: AWS credentials are kept strictly in backend server environment variables (`.env`) or assigned via EC2 IAM Roles. React frontend source code contains zero AWS keys, database passwords, or JWT secrets.
5. **Path Traversal & Filename Sanitization**: Original filenames are sanitized using `os.path.basename` and regex cleaning to prevent path traversal attacks (`../../`). Files are stored in S3 using generated UUID keys (`users/{user_id}/{uuid}_{clean_filename}`).
6. **Download Security**: File downloads require JWT authentication, verify active file ownership, and stream content directly from FastAPI without exposing public bucket URLs.
7. **Two-Stage Deletion (Soft & Permanent)**:
   - **Soft Delete**: `DELETE /api/v1/files/{id}` sets `is_deleted = True`.
   - **Permanent Delete**: `DELETE /api/v1/files/{id}/permanent` verifies ownership, requires `is_deleted == True`, deletes the object from Amazon S3, and deletes the metadata row from MySQL.
8. **CORS Control**: Restricts cross-origin requests to configured domains (`http://localhost:5173`, `http://127.0.0.1:5173`) via `.env` settings rather than wildcards (`*`).
9. **Authentication Rate Limiting**: Auth endpoints (`/api/v1/auth/login`, `/api/v1/auth/register`) implement IP-based rate limiting to mitigate password brute-force attacks.
10. **Clean Error Handling**: Global exception handlers catch unhandled server errors to prevent stack traces, internal filesystem paths, or credentials from leaking to clients.
11. **HTTP Security Headers**: Response middleware automatically injects security headers:
    - `X-Content-Type-Options: nosniff`
    - `X-Frame-Options: DENY`
    - `Referrer-Policy: strict-origin-when-cross-origin`
    - `X-XSS-Protection: 1; mode=block`
12. **Role-Based Authorization (RBAC)**: Restricts the `/api/v1/developer/status` endpoint strictly to authenticated `developer` role accounts (returns `HTTP 403 Forbidden` for standard users).

---

## 🏗️ System Architecture

```text
+------------------------+
|     React Frontend     | (Vite, TypeScript, Lucide Icons)
+------------------------+
            │
            ▼ REST API (HTTP / JSON / Bearer JWT)
+------------------------+
|    FastAPI Backend     | (Python, Pydantic, SQLAlchemy ORM)
+------------------------+
       │          │
       │          ▼ S3 Object Operations (boto3)
       │    +------------------------+
       │    |      Amazon S3         | (Binary File Storage)
       │    +------------------------+
       │
       ▼ Metadata Queries (PyMySQL)
+------------------------+
|     MySQL Database     | (Users, Files, Folders, Logs)
+------------------------+
```

---

## ⚙️ Environment Configuration

### Backend Environment (`backend/.env`)
```env
# Database Configuration
DATABASE_URL=sqlite:///./cloudvault.db
# For MySQL: mysql+pymysql://root:password@localhost:3306/cloudvault

# JWT Configuration
JWT_SECRET=cloudvault_secure_jwt_secret_key_2026_devops
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=1440

# CORS Allowed Origins
ALLOWED_ORIGINS=http://localhost:5173,http://127.0.0.1:5173,http://localhost:3000

# AWS S3 Configuration (Optional for local testing; uses local emulator if empty)
AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_key
AWS_REGION=us-east-1
AWS_S3_BUCKET=cloudvault-user-uploads

# Developer Seed Account Credentials
DEV_USERNAME=developer
DEV_EMAIL=developer@cloudvault.internal
DEV_PASSWORD=VBAWS@2004
```

### Frontend Environment (`frontend/.env`)
```env
VITE_API_BASE_URL=http://localhost:8000/api/v1
```

---

## 🛠️ Local Setup & Development

### 1. Start FastAPI Backend
```bash
cd backend
python -m venv venv

# Windows PowerShell:
.\venv\Scripts\activate

pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```
- API Documentation: [http://localhost:8000/docs](http://localhost:8000/docs)
- Health Endpoint: [http://localhost:8000/health](http://localhost:8000/health)

### 2. Start React Frontend
```bash
cd frontend
npm install
npm run dev
```
- Application: [http://localhost:5173](http://localhost:5173)

### 3. Run Security & Integration Test Suites
```bash
cd backend
python test_backend.py
python test_security.py
```

---

## ☁️ Production Nginx HTTPS Configuration Example

```nginx
server {
    listen 80;
    server_name cloudvault.yourdomain.com;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name cloudvault.yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/cloudvault.yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/cloudvault.yourdomain.com/privkey.pem;

    # React Frontend static assets
    location / {
        root /var/www/cloudvault/frontend/dist;
        try_files $uri $uri/ /index.html;
    }

    # FastAPI Backend reverse proxy
    location /api/ {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```
