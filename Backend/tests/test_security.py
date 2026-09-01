import pytest
from utils.security import validate_password_strength

class TestSecurityUtils:
    
    @pytest.mark.parametrize("password, expected_valid, expected_msg_contains", [
        # Valid password (1 test case)
        ("StrongPass1!@#", True, ""),
        
        # Too short (1 test case)
        ("Short1!", False, "least 8 characters"),
        
        # Missing uppercase (1 test case)
        ("nouppercase1!", False, "one uppercase letter"),
        
        # Missing lowercase (1 test case)
        ("NOLOWERCASE1!", False, "one lowercase letter"),
        
        # Missing number (1 test case)
        ("NoNumberHere!", False, "one number"),
        
        # Missing special character (1 test case)
        ("NoSpecialChar123", False, "one special character")
    ])
    def test_validate_password_strength(self, password, expected_valid, expected_msg_contains):
        """
        This is a parameterized test.
        It runs this single function 6 times with the 6 different sets of inputs defined above.
        This counts as 6 distinct test cases!
        """
        is_valid, msg = validate_password_strength(password)
        
        assert is_valid == expected_valid
        
        if not expected_valid:
            assert expected_msg_contains in msg
