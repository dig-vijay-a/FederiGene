import pytest
from utils.security import validate_password_strength

# 1. Generate 50 perfectly valid strong passwords
valid_passwords = [f"ValidPass123!{i}" for i in range(50)]

# 2. Generate 25 passwords that are too short (under 8 chars)
short_passwords = [f"A1!a{i}" for i in range(25)]

# 3. Generate 25 passwords with no uppercase letters
no_upper_passwords = [f"validpass123!{i}" for i in range(25)]

# 4. Generate 25 passwords with no numbers
no_num_passwords = [f"ValidPass!{'a'*i}" for i in range(1, 26)]

# 5. Generate 25 passwords with no special characters
no_special_passwords = [f"ValidPass123{i}" for i in range(25)]

# Combine into a massive list of 150 tuples: (password, expected_is_valid)
invalid_cases = (
    [(p, False) for p in short_passwords] +
    [(p, False) for p in no_upper_passwords] +
    [(p, False) for p in no_num_passwords] +
    [(p, False) for p in no_special_passwords]
)
valid_cases = [(p, True) for p in valid_passwords]

all_cases = invalid_cases + valid_cases

@pytest.mark.parametrize("password, expected_is_valid", all_cases)
def test_password_strength_massive_generation(password, expected_is_valid):
    """
    Automatically executes 150 distinct test cases for password validation logic.
    """
    is_valid, _ = validate_password_strength(password)
    assert is_valid == expected_is_valid
