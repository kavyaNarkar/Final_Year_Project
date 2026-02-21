import requests

base_url = "http://localhost:5000/api/auth"

def test_admin_signup():
    print("Testing Admin Signup...")
    data = {
        "fullName": "New Admin",
        "username": "newadmin",
        "email": "newadmin@test.com",
        "password": "admin123"
    }
    try:
        r = requests.post(f"{base_url}/register-admin", json=data)
        print(f"Status: {r.status_code}")
        print(f"Response: {r.text}")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    test_admin_signup()
