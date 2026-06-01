import os
import sys

# Add parent dir to path so we can import the SDK
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from federigene_sdk.client import FederiGeneClient
import hashlib
import json
import base64

def run_simulation():
    print("=== FederiGene Hospital External Node Simulation ===")
    
    # 1. Config
    PLATFORM_URL = "http://localhost:8000"
    API_KEY = "hospital_demo_key_123" # In production, this is rotated via the dashboard
    
    client = FederiGeneClient(PLATFORM_URL, API_KEY)
    
    # 2. Authentication
    print("\n[1/4] Authenticating with platform...")
    # client.authenticate() # Skipped for mock run
    
    # 3. Join / Fetch Job
    job_id = 1
    print(f"\n[2/4] Fetching pending rounds for Training Job #{job_id}...")
    # job = client.fetch_training_job(job_id)
    
    # 4. Local Training (on-premise data)
    print("\n[3/4] Accessing local genomic silo (dataset_v1_chr22.parquet)...")
    weights = client.perform_local_training(job_id, "local_data.csv")
    
    # 5. Encrypt with simulated TenSEAL (High-Fidelity)
    print("\n[4/4] Encrypting weights via Homomorphic Encryption (HE)...")
    # Simulation:
    mock_payload = {
        "type": "ckks_sim",
        "data": weights,
        "integrity": hashlib.sha256(str(weights).encode()).hexdigest()
    }
    encrypted_weights = base64.b64encode(json.dumps(mock_payload).encode()).decode()
    
    # 6. Submit
    print(f"📤 Submitting encrypted update to aggregator...")
    # res = client.submit_update(job_id, encrypted_weights)
    print("\n✅ Success: Model update accepted by FederiGene platform.")
    print("Action Logged: training_update_submitted")

if __name__ == "__main__":
    run_simulation()
