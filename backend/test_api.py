import requests
import json

base_url = "http://localhost:5000/api/auth"

def test_signup():
    print("Testing Signup...")
    data = {
        "firstName": "Test",
        "lastName": "User",
        "email": "test@test.com",
        "password": "test1234",
        "phoneNumber": "1234567890",
        "vehicleNumber": "MH12XY0001"
    }
    try:
        r = requests.post(f"{base_url}/register-user", json=data)
        print(f"Status: {r.status_code}")
        print(f"Response: {r.text}")
    except Exception as e:
        print(f"Error: {e}")

def test_login():
    print("\nTesting Login...")
    data = {
        "identifier": "test@test.com",
        "password": "test1234"
    }
    try:
        r = requests.post(f"{base_url}/login", json=data)
        print(f"Status: {r.status_code}")
        print(f"Response: {r.text}")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    test_signup()
    test_login()
