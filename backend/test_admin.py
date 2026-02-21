import requests

base_url = "http://localhost:5000/api/auth"

def test_admin_login():
    print("Testing Admin Login...")
    data = {
        "identifier": "admin",
        "password": "admin123"
    }
    try:
        r = requests.post(f"{base_url}/login", json=data)
        print(f"Status: {r.status_code}")
        print(f"Response: {r.text}")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    test_admin_login()
