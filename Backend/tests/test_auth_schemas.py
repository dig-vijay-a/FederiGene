import pytest
from pydantic import ValidationError
from schemas.auth_schemas import UserCreate, LoginRequest, VerifyEmailRequest

def get_base_user_create():
    return {
        "username": "johndoe",
        "last_name": "Doe",
        "email": "john@example.com",
        "password": "ValidPassword123!",
        "confirm_password": "ValidPassword123!",
        "security_answers": [{"question_id": 1, "answer": "foo"}] * 3
    }

# 1. Generate 100 invalid Registration payloads
user_create_invalid_cases = []
# 20 cases with bad emails
for i in range(20):
    d = get_base_user_create()
    d["email"] = f"invalid-email-format-{i}" 
    user_create_invalid_cases.append(d)

# 20 cases with usernames that are too short (min 3)
for i in range(20):
    d = get_base_user_create()
    d["username"] = "ab" 
    user_create_invalid_cases.append(d)

# 20 cases completely missing the required last_name field
for i in range(20):
    d = get_base_user_create()
    d.pop("last_name") 
    user_create_invalid_cases.append(d)

# 40 cases with too few security answers (min 3 required)
for i in range(40):
    d = get_base_user_create()
    d["security_answers"] = [{"question_id": 1, "answer": "foo"}] * 2 
    user_create_invalid_cases.append(d)


# 2. Generate 25 invalid Login Request payloads (Missing password)
login_invalid_cases = []
for i in range(25):
    login_invalid_cases.append({"username_or_email": f"user{i}"}) 


# 3. Generate 25 invalid Email Verification payloads (Missing token)
verify_invalid_cases = []
for i in range(25):
    verify_invalid_cases.append({}) 


@pytest.mark.parametrize("payload", user_create_invalid_cases)
def test_user_create_schema_invalid(payload):
    """ Executes 100 distinct registration failure edge cases. """
    with pytest.raises(ValidationError):
        UserCreate(**payload)

@pytest.mark.parametrize("payload", login_invalid_cases)
def test_login_request_schema_invalid(payload):
    """ Executes 25 distinct login failure edge cases. """
    with pytest.raises(ValidationError):
        LoginRequest(**payload)

@pytest.mark.parametrize("payload", verify_invalid_cases)
def test_verify_email_schema_invalid(payload):
    """ Executes 25 distinct email verification failure edge cases. """
    with pytest.raises(ValidationError):
        VerifyEmailRequest(**payload)
