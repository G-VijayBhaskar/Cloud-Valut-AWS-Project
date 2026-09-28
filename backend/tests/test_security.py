import urllib.request
import urllib.parse
import json
import io
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

def run_security_tests():
    print("=== Starting CloudVault Security Verification Suite ===")
    ts = int(time.time())
    
    # 1. Register User A and User B
    user_a_data = {"username": f"user_a_{ts}", "email": f"user_a_{ts}@cloudvault.dev", "password": "PasswordUserA123"}
    user_b_data = {"username": f"user_b_{ts}", "email": f"user_b_{ts}@cloudvault.dev", "password": "PasswordUserB123"}

    status, res_a = make_request(f"{BASE_URL}/auth/register", "POST", user_a_data)
    assert status == 201 and "password_hash" not in res_a, "Password hash must NOT be returned in user model"
    print("[OK] 1. Password security & hash exclusion verified!")

    status, res_b = make_request(f"{BASE_URL}/auth/register", "POST", user_b_data)
    assert status == 201

    # Login User A & User B
    _, token_a_res = make_request(f"{BASE_URL}/auth/login", "POST", {"email": user_a_data["email"], "password": user_a_data["password"]})
    _, token_b_res = make_request(f"{BASE_URL}/auth/login", "POST", {"email": user_b_data["email"], "password": user_b_data["password"]})

    headers_a = {"Authorization": f"Bearer {token_a_res['access_token']}"}
    headers_b = {"Authorization": f"Bearer {token_b_res['access_token']}"}

    # 2. User A Uploads a File with Path Traversal in Filename
    boundary = "----SecurityTestBoundary"
    raw_filename = "../../../etc/passwd"
    file_bytes = b"Confidential User A Data"

    body = io.BytesIO()
    body.write(f"--{boundary}\r\n".encode())
    body.write(f'Content-Disposition: form-data; name="file"; filename="{raw_filename}"\r\n'.encode())
    body.write(b'Content-Type: text/plain\r\n\r\n')
    body.write(file_bytes)
    body.write(b'\r\n')
    body.write(f"--{boundary}--\r\n".encode())

    upload_headers_a = {
        "Authorization": f"Bearer {token_a_res['access_token']}",
        "Content-Type": f"multipart/form-data; boundary={boundary}"
    }

    status, file_a = make_request(f"{BASE_URL}/files/upload", "POST", body.getvalue(), upload_headers_a)
    assert status == 201, f"Upload failed: {file_a}"
    assert ".." not in file_a["filename"] and "/" not in file_a["filename"], "Path traversal must be sanitized"
    file_a_id = file_a["id"]
    print(f"[OK] 2. Path Traversal Protection verified (Sanitized name: '{file_a['filename']}')")

    # 3. IDOR Attack Tests: User B attempts to access User A's file
    # 3a. User B attempts to download User A's file
    status, _ = make_request(f"{BASE_URL}/files/{file_a_id}/download", "GET", None, headers_b)
    assert status in (403, 404), f"IDOR vulnerability on download! Status: {status}"

    # 3b. User B attempts to rename User A's file
    status, _ = make_request(f"{BASE_URL}/files/{file_a_id}", "PATCH", {"filename": "hacked.txt"}, headers_b)
    assert status in (403, 404), f"IDOR vulnerability on rename! Status: {status}"

    # 3c. User B attempts to soft delete User A's file
    status, _ = make_request(f"{BASE_URL}/files/{file_a_id}", "DELETE", None, headers_b)
    assert status in (403, 404), f"IDOR vulnerability on delete! Status: {status}"

    # 3d. User B attempts to permanently delete User A's file
    status, _ = make_request(f"{BASE_URL}/files/{file_a_id}/permanent", "DELETE", None, headers_b)
    assert status in (403, 404), f"IDOR vulnerability on permanent delete! Status: {status}"

    print("[OK] 3. User Ownership & IDOR Protection verified across all endpoints!")

    # 4. Invalid / Expired JWT Security
    invalid_headers = {"Authorization": "Bearer invalid_junk_jwt_token_123"}
    status, _ = make_request(f"{BASE_URL}/users/me", "GET", None, invalid_headers)
    assert status == 401, f"Expected 401 for invalid JWT, got {status}"
    print("[OK] 4. Invalid JWT Token rejection verified!")

    # 5. Role Authorization (Normal user accessing developer endpoint)
    status, _ = make_request(f"{BASE_URL}/developer/status", "GET", None, headers_a)
    assert status == 403, f"Expected 403 for normal user accessing developer status, got {status}"
    print("[OK] 5. Role-based Access Control (RBAC) verified!")

    print("\nALL SECURITY VERIFICATION TESTS PASSED SUCCESSFULLY!")

if __name__ == "__main__":
    run_security_tests()
