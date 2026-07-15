import requests

try:
    # Try register
    r = requests.post("http://localhost:8000/api/auth/register", json={
        "email": "guest@interviewforge.com",
        "password": "guestpass123",
        "full_name": "Forge Guest"
    })
    print("Register Status:", r.status_code)
    print("Register Output:", r.text)

    # Try login
    r2 = requests.post("http://localhost:8000/api/auth/login", json={
        "email": "guest@interviewforge.com",
        "password": "guestpass123"
    })
    print("Login Status:", r2.status_code)
    print("Login Output:", r2.text)
except Exception as e:
    print("Error connecting:", e)
