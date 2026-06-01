# Simple in-memory cache for WebAuthn challenges
# In a production environment, this should be replaced with Redis.
import time

_cache = {}

def set_challenge(key: str, challenge: str, ttl: int = 300):
    """Store a challenge with a 5-minute expiration."""
    _cache[key] = {
        "challenge": challenge,
        "expires_at": time.time() + ttl
    }

def get_challenge(key: str) -> str:
    """Retrieve and immediately delete the challenge (one-time use)."""
    data = _cache.get(key)
    if not data:
        return None
    
    if time.time() > data["expires_at"]:
        del _cache[key]
        return None
    
    challenge = data["challenge"]
    del _cache[key]
    return challenge
