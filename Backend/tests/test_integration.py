from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def test_health_check_integration():
    """
    Integration Test: 
    Checks if the API router is correctly hooked up to the app instance 
    and handles actual HTTP requests over the internal test network.
    """
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "healthy"}
