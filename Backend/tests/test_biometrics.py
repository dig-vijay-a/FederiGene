import pytest
import numpy as np
from utils.biometrics import _cosine_distance

@pytest.mark.parametrize("vec_a, vec_b, expected_distance", [
    # 1. Identical face embeddings (Should be exactly 0 distance)
    (np.array([1, 0, 0]), np.array([1, 0, 0]), 0.0),
    
    # 2. Completely unrelated embeddings (Orthogonal, Distance = 1.0)
    (np.array([1, 0, 0]), np.array([0, 1, 0]), 1.0),
    
    # 3. Polar opposite embeddings (Distance = 2.0)
    (np.array([1, 0, 0]), np.array([-1, 0, 0]), 2.0),
    
    # 4. Invalid/Corrupted embeddings (Zero vector should return None)
    (np.array([0, 0, 0]), np.array([1, 0, 0]), None),
])
def test_cosine_distance_edge_cases(vec_a, vec_b, expected_distance):
    """
    Tests the core mathematical comparison logic used for Face ID verification.
    This parameterization block creates 4 distinct test cases automatically!
    """
    result = _cosine_distance(vec_a, vec_b)
    
    if expected_distance is None:
        assert result is None
    else:
        # np.isclose is used for floating point math comparisons
        assert np.isclose(result, expected_distance)
