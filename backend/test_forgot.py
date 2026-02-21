import requests

url = "http://localhost:5000/api/auth/forgot-password"
payload = {
    "mobile": "1234567890",  # Will try a dummy number first
    "role": "user"
}
res = requests.post(url, json=payload)
print("Response:", res.status_code, res.json())
