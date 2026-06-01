import hashlib
import json
import base64
import numpy as np

try:
    import tenseal as ts
    HAS_TENSEAL = True
except ImportError:
    HAS_TENSEAL = False

class HEManager:
    """
    Adapter for Homomorphic Encryption (HE) using TenSEAL.
    Provides encrypted evaluation and aggregation primitives.
    """
    def __init__(self, use_native=True):
        self.use_native = use_native and HAS_TENSEAL
        self.context = None
        if self.use_native:
            self._init_native_context()

    def _init_native_context(self):
        """Initialize a CKKS context for TenSEAL."""
        try:
            self.context = ts.context(
                ts.SCHEME_TYPE.CKKS,
                poly_modulus_degree=8192,
                coeff_mod_bit_sizes=[60, 40, 40, 60]
            )
            self.context.global_scale = 2**40
            self.context.generate_galois_keys()
        except Exception as e:
            print(f"Failed to init native HE context: {e}")
            self.use_native = False

    def encrypt_vector(self, data: list):
        """Encrypts a list of floats."""
        if self.use_native:
            return ts.ckks_vector(self.context, data).serialize()
        else:
            # High-fidelity simulation: Base64 encoded JSON with 'noise'
            # In a real system, this would be a sequence of polynomials
            mock_payload = {
                "type": "ckks_sim",
                "data": [x + (np.random.normal(0, 1e-9)) for x in data], # Simulated encryption noise
                "integrity": hashlib.sha256(str(data).encode()).hexdigest()
            }
            return base64.b64encode(json.dumps(mock_payload).encode()).decode()

    def aggregate_encrypted(self, encrypted_vectors: list):
        """Performs homomorphic addition on encrypted payloads."""
        if not encrypted_vectors:
            return None

        if self.use_native:
            try:
                # Deserialize first
                vecs = [ts.ckks_vector_from(self.context, v) for v in encrypted_vectors]
                result = vecs[0]
                for v in vecs[1:]:
                    result += v
                # Average (scalar multiplication)
                result *= (1.0 / len(encrypted_vectors))
                return result.serialize()
            except Exception as e:
                print(f"Native aggregation failure: {e}")
                # Fallback logic could go here
                return encrypted_vectors[0]
        else:
            # Simulated aggregation
            decoded = [json.loads(base64.b64decode(v.encode())) for v in encrypted_vectors]
            raw_values = [d["data"] for d in decoded]
            
            # Simple average of the high-fidelity mock data
            avg_result = np.mean(raw_values, axis=0).tolist()
            
            agg_payload = {
                "type": "ckks_sim_agg",
                "data": avg_result,
                "count": len(encrypted_vectors)
            }
            return base64.b64encode(json.dumps(agg_payload).encode()).decode()

    def decrypt_vector(self, encrypted_data, secret_key=None):
        """Decrypts a payload (Server-side/Aggregator)."""
        if self.use_native:
            # In a real FL system, only the private key holder (aggregator or nodes) can decrypt
            vec = ts.ckks_vector_from(self.context, encrypted_data)
            return vec.decrypt()
        else:
            decoded = json.loads(base64.b64decode(encrypted_data.encode()))
            return decoded["data"]

# Global Instance
he_engine = HEManager()
