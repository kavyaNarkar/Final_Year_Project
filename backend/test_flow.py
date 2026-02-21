import requests
import sqlite3

def test_full_flow():
    base_url = "http://localhost:5000/api/auth"
    mobile = "1234567890"
    role = "user"
    new_password = "new_secure_password123"

    print("--- 1. Request OTP ---")
    res1 = requests.post(f"{base_url}/forgot-password", json={"mobile_number": mobile, "role": role})
    print(res1.status_code, res1.json())
    otp = res1.json().get("demo_otp")
    if not otp:
        print("FAIL: No OTP returned in demo_otp field")
        return

    print("\n--- 2. Verify Database Storage ---")
    conn = sqlite3.connect("instance/echallan.db")
    cursor = conn.execute("SELECT otp, expires_at FROM otp_store WHERE mobile_number=? AND role=? ORDER BY created_at DESC LIMIT 1", (mobile, role))
    row = cursor.fetchone()
    if row and row[0] == otp:
        print(f"SUCCESS: OTP {otp} stored correctly. Expires at: {row[1]}")
    else:
        print("FAIL: OTP not found in DB.")
        return

    print("\n--- 3. Verify OTP Endpoint ---")
    res2 = requests.post(f"{base_url}/verify-otp", json={"mobile_number": mobile, "role": role, "otp": otp})
    print(res2.status_code, res2.json())
    if not res2.json().get("message") == "OTP verified successfully":
        print("FAIL: Verification failed.")
        return
        
    print("\n--- 4. Reset Password ---")
    res3 = requests.post(f"{base_url}/reset-password", json={"mobile_number": mobile, "role": role, "otp": otp, "password": new_password})
    print(res3.status_code, res3.json())
    if not res3.json().get("message") == "Password reset successfully":
        print("FAIL: Reset failed.")
        return

    print("\n--- 5. Login with New Password ---")
    res4 = requests.post(f"{base_url}/login", json={"identifier": "testuser@example.com", "password": new_password})
    print(res4.status_code, res4.json())
    if res4.status_code == 200:
        print("SUCCESS! Full flow passed.")
    else:
        print("FAIL: Login with new password failed.")
        
if __name__ == "__main__":
    test_full_flow()
