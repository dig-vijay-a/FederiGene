import pytest
from pytest_bdd import scenarios, given, when, then
from fastapi.testclient import TestClient
from main import app

# This links the steps to the feature file
scenarios('features/health.feature')

@pytest.fixture
def api_client():
    return TestClient(app)

@given('the API is running')
def api_is_running(api_client):
    # If we can create a client, it's considered "running" for this local test context
    pass

@when('I request the health status', target_fixture='health_response')
def request_health_status(api_client):
    return api_client.get("/health")

@then('I should receive a healthy response')
def check_healthy_response(health_response):
    assert health_response.status_code == 200
    assert health_response.json() == {"status": "healthy"}
