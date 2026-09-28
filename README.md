# ☁️ CloudVault

CloudVault is a cloud-based file storage web application built as a portfolio project to demonstrate practical experience in **AWS Cloud, Linux, Python, full-stack development, and DevOps practices**.

The application provides secure user authentication, file and folder management, Amazon S3 object storage, MySQL metadata management, storage quota tracking, soft-delete recovery, activity logging, and developer diagnostics.

---

## 🚀 Project Highlights

- User registration and JWT-based authentication
- Secure file upload and download
- Folder creation and organization
- File search and rename functionality
- Soft-delete and restore functionality
- Permanent file deletion
- Storage quota tracking
- Activity/audit logging
- Developer role-based access
- Amazon S3 integration for object storage
- MySQL database for application metadata
- AWS EC2 deployment
- Private Amazon RDS MySQL database
- IAM-based AWS access
- Nginx reverse proxy
- Route 53 DNS configuration
- HTTPS using Let's Encrypt / Certbot
- Linux/Ubuntu server administration

---

# 🏗️ Architecture

```text
                         Internet
                            │
                            ▼
                    Route 53 / DNS
                            │
                            ▼
                    HTTPS / Certbot
                            │
                            ▼
                     Nginx Reverse Proxy
                            │
                            ▼
                    ┌─────────────────┐
                    │   AWS EC2       │
                    │   Ubuntu Linux  │
                    │                 │
                    │ React Frontend  │
                    │       +         │
                    │ FastAPI Backend │
                    └────────┬────────┘
                             │
                  ┌──────────┴──────────┐
                  │                     │
                  ▼                     ▼
          Private Amazon RDS          Amazon S3
             MySQL Database         File Storage
                  │                     │
                  │                     │
                  └──────────┬──────────┘
                             │
                       AWS IAM Role
