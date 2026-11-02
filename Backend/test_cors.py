from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.testclient import TestClient

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://example.com"],
    allow_origin_regex=r"https://.*\.vercel\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/test")
def test():
    return {"status": "ok"}

client = TestClient(app)

# Test 1: Vercel origin with random headers
response = client.options("/test", headers={
    "Origin": "https://my-app.vercel.app",
    "Access-Control-Request-Method": "GET",
    "Access-Control-Request-Headers": "authorization, content-type, sentry-trace, x-custom-id"
})
print("Test 1 (Vercel, custom headers):", response.status_code)

# Test 2: Vercel origin with trailing slash
response = client.options("/test", headers={
    "Origin": "https://my-app.vercel.app/",
    "Access-Control-Request-Method": "GET",
    "Access-Control-Request-Headers": "authorization"
})
print("Test 2 (Trailing slash):", response.status_code)
