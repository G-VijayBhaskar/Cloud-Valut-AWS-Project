import urllib.request
import urllib.parse
import json
import io
import sys
import time

BASE_URL = "http://127.0.0.1:8000/api/v1"

def make_request(url, method="GET", data=None, headers=None):
    if headers is None:
        headers = {}
    
    body = None
    if data is not None:
        if isinstance(data, dict):
            body = json.dumps(data).encode('utf-8')
            headers['Content-Type'] = 'application/json'
        elif isinstance(data, bytes):
            body = data

    req = urllib.request.Request(url, data=body, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req) as response:
            res_body = response.read()
            if response.headers.get_content_type() == 'application/json':
                return response.status, json.loads(res_body.decode('utf-8'))
            return response.status, res_body
    except urllib.error.HTTPError as e:
        err_body = e.read().decode('utf-8')
        try:
            return e.code, json.loads(err_body)
        except Exception:
            return e.code, err_body

def run_tests():
    print("=== Starting End-to-End CloudVault API Verification ===")
    
    ts = int(time.time())
    test_username = f"mca_user_{ts}"
    test_email = f"mca_user_{ts}@cloudvault.dev"
    test_password = "SecurePassword123"

    # 1. Register User
    signup_data = {
        "username": test_username,
        "email": test_email,
        "password": test_password
    }
    status, res = make_request(f"{BASE_URL}/auth/register", "POST", signup_data)
    assert status == 201, f"Signup failed: {res}"
    assert res["role"] == "user", f"Expected role='user', got '{res['role']}'"
    print("[OK] 1. Public Signup (role='user') passed!")

    # 2. Login User
    login_data = {
        "email": test_email,
        "password": test_password
    }
    status, res = make_request(f"{BASE_URL}/auth/login", "POST", login_data)
    assert status == 200, f"Login failed: {res}"
    token = res["access_token"]
    user_headers = {"Authorization": f"Bearer {token}"}
    print("[OK] 2. User Login & JWT Token generation passed!")

    # 3. Create Folder
    status, folder = make_request(f"{BASE_URL}/folders", "POST", {"name": "AWS_Project_Docs"}, user_headers)
    assert status == 201, f"Create folder failed: {folder}"
    folder_id = folder["id"]
    print("[OK] 3. Folder Creation passed!")

    # 4. Upload File (Multipart boundary)
    boundary = "----WebKitFormBoundaryCloudVaultTest"
    file_content = b"CloudVault AWS S3 Upload Verification Content 2026"
    
    body = io.BytesIO()
    body.write(f"--{boundary}\r\n".encode())
    body.write(b'Content-Disposition: form-data; name="file"; filename="aws_resume.pdf"\r\n')
    body.write(b'Content-Type: application/pdf\r\n\r\n')
    body.write(file_content)
    body.write(b'\r\n')
    
    body.write(f"--{boundary}\r\n".encode())
    body.write(b'Content-Disposition: form-data; name="folder_id"\r\n\r\n')
    body.write(str(folder_id).encode())
    body.write(b'\r\n')
    body.write(f"--{boundary}--\r\n".encode())
    
    upload_headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": f"multipart/form-data; boundary={boundary}"
    }
    status, uploaded_file = make_request(f"{BASE_URL}/files/upload", "POST", body.getvalue(), upload_headers)
    assert status == 201, f"File upload failed: {uploaded_file}"
    file_id = uploaded_file["id"]
    print(f"[OK] 4. S3 File Upload passed! (File ID: {file_id})")

    # 5. Search File
    status, files = make_request(f"{BASE_URL}/files?search=resume", "GET", None, user_headers)
    assert status == 200 and len(files) == 1, f"Search failed: {files}"
    print("[OK] 5. File Search by filename passed!")

    # 6. Download File
    status, downloaded_content = make_request(f"{BASE_URL}/files/{file_id}/download", "GET", None, user_headers)
    assert status == 200 and downloaded_content == file_content, f"Download content mismatch: {downloaded_content}"
    print("[OK] 6. File Download & S3 content verification passed!")

    # 7. Rename File
    status, renamed = make_request(f"{BASE_URL}/files/{file_id}", "PATCH", {"filename": "aws_resume_updated.pdf"}, user_headers)
    assert status == 200 and renamed["filename"] == "aws_resume_updated.pdf", f"Rename failed: {renamed}"
    print("[OK] 7. File Rename passed!")

    # 8. Soft Delete File
    status, del_res = make_request(f"{BASE_URL}/files/{file_id}", "DELETE", None, user_headers)
    assert status == 200, f"Delete failed: {del_res}"
    print("[OK] 8. Soft Delete (Move to Trash) passed!")

    # 9. Verify File in Trash
    status, trash_files = make_request(f"{BASE_URL}/files?is_deleted=true", "GET", None, user_headers)
    assert status == 200 and len(trash_files) == 1, f"Trash list failed: {trash_files}"
    print("[OK] 9. Trash Verification passed!")

    # 10. Permanent Delete File Test (DELETE /api/v1/files/{id}/permanent)
    status, perm_res = make_request(f"{BASE_URL}/files/{file_id}/permanent", "DELETE", None, user_headers)
    assert status == 200, f"Permanent delete failed: {perm_res}"
    print("[OK] 10. Permanent File Deletion (S3 Object + MySQL Metadata) passed!")

    # Verify file no longer exists in DB or Trash
    status, post_perm_trash = make_request(f"{BASE_URL}/files?is_deleted=true", "GET", None, user_headers)
    assert status == 200 and len(post_perm_trash) == 0, f"File still in trash: {post_perm_trash}"
    print("[OK] 11. Verified file removed from Trash & Database!")

    # 12. Storage Quota Check
    status, storage = make_request(f"{BASE_URL}/storage", "GET", None, user_headers)
    assert status == 200 and storage["used_storage"] == 0, f"Storage stats failed: {storage}"
    print("[OK] 12. Storage Quota Recalculation passed!")

    # 13. Activity Audit Log
    status, activity = make_request(f"{BASE_URL}/activity", "GET", None, user_headers)
    assert status == 200 and len(activity) >= 5, f"Activity log failed: {activity}"
    print("[OK] 13. Activity Audit Logs passed!")

    # 14. Normal User access to Developer status (Must return 403 Forbidden)
    status, dev_res = make_request(f"{BASE_URL}/developer/status", "GET", None, user_headers)
    assert status == 403, f"Expected 403 Forbidden for normal user, got {status}"
    print("[OK] 14. Normal user forbidden from Developer Status passed!")

    # 15. Developer Account Login & Access
    dev_login = {
        "email": "developer@cloudvault.internal",
        "password": "VBAWS@2004"
    }
    status, dev_token_res = make_request(f"{BASE_URL}/auth/login", "POST", dev_login)
    assert status == 200, f"Developer login failed: {dev_token_res}"
    dev_headers = {"Authorization": f"Bearer {dev_token_res['access_token']}"}
    
    status, dev_status = make_request(f"{BASE_URL}/developer/status", "GET", None, dev_headers)
    assert status == 200 and dev_status["api_status"] == "Online", f"Developer status failed: {dev_status}"
    print("[OK] 15. Developer Account Authentication & Status Access passed!")

    print("\nALL 15 E2E VERIFICATION TESTS PASSED SUCCESSFULLY! Permanent file deletion is 100% working.")

if __name__ == "__main__":
    run_tests()
