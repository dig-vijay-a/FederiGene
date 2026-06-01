import requests
import time
import base64
import json
import io
import torch
import hmac
import hashlib
import getpass
import random

def create_dummy_weights():
    """Generates a dummy PyTorch state_dict for testing."""
    # Simulating a simple neural network layer
    model = torch.nn.Linear(10, 2)
    # Add some random noise to simulate actual training updates
    with torch.no_grad():
        model.weight += torch.randn_like(model.weight) * 0.01
        model.bias += torch.randn_like(model.bias) * 0.01
        
    buffer = io.BytesIO()
    torch.save(model.state_dict(), buffer)
    return base64.b64encode(buffer.getvalue()).decode('utf-8')

def generate_signature(api_key, weights_b64):
    """Generates an HMAC signature for the weights using the API key."""
    return hmac.new(
        api_key.encode('utf-8'),
        weights_b64.encode('utf-8'),
        hashlib.sha256
    ).hexdigest()

def main():
    print("==================================================")
    print("🏥 FederiGene - Local Hospital Node Client Simulator")
    print("==================================================")
    print("This script simulates a hospital node participating")
    print("in a federated learning training job.")
    print("==================================================\n")
    
    coordinator_url = input("Enter Coordinator URL (e.g. http://192.168.1.100:8000): ").strip()
    if not coordinator_url.startswith("http"):
        coordinator_url = "http://" + coordinator_url
    
    # Trim trailing slash
    if coordinator_url.endswith("/"):
        coordinator_url = coordinator_url[:-1]
        
    api_key = input("Enter your Node API Key (fg_...): ").strip()
    job_id_str = input("Enter the Training Job ID you are assigned to: ").strip()
    
    try:
        job_id = int(job_id_str)
    except ValueError:
        print("❌ Job ID must be an integer.")
        return

    print("\n[1] Verifying and checking in with Coordinator...")
    verify_url = f"{coordinator_url}/api/platform/node/verify"
    submit_url = f"{coordinator_url}/api/platform/training/{job_id}/submit"
    
    try:
        res = requests.post(verify_url, json={
            "api_key": api_key,
            "job_id": job_id
        })
    except requests.exceptions.ConnectionError:
        print(f"❌ Failed to connect to {coordinator_url}. Is the coordinator server running?")
        return
        
    if res.status_code != 200:
        print(f"❌ Verification failed: {res.text}")
        return
        
    job_info = res.json()
    org_name = job_info.get("org_name")
    print(f"✅ Verified successfully as: {org_name}")
    print(f"   Job: {job_info.get('job_name')} (Architecture: {job_info.get('model_architecture')})")
    
    last_submitted_round = 0
    
    print("\n🚀 Starting active listener loop. Standing by for training rounds...")
    
    try:
        while True:
            # Poll current job round state
            res = requests.post(verify_url, json={
                "api_key": api_key,
                "job_id": job_id
            })
            
            if res.status_code != 200:
                print(f"⚠️ Lost connection/Auth failed: {res.text}")
                time.sleep(5)
                continue
                
            state = res.json()
            current_round = state.get("current_round")
            job_status = state.get("job_status")
            
            if job_status == "completed":
                print("\n🎉 [Node] Training Job has been successfully completed by the Coordinator! Exiting.")
                break
            
            # If the coordinator advances rounds or we haven't submitted for this round yet
            if current_round > last_submitted_round:
                print(f"\n🔄 [Round {current_round}] Starting Local Training Phase...")
                
                # Simulate training with some delay
                print("   [Node] Loading dummy patient DNA dataset...")
                time.sleep(1)
                print("   [Node] Training local model using PyTorch and DP-SGD...")
                time.sleep(random.randint(2, 4))
                
                loss = round(random.uniform(0.1, 0.8), 4)
                print(f"   [Node] Training complete. Local Loss: {loss}")
                
                # Generate weights and sign
                weights_b64 = create_dummy_weights()
                signature = generate_signature(api_key, weights_b64)
                
                print("   [Node] Encrypting model weights and computing HMAC signature...")
                
                # Submit
                submit_payload = {
                    "job_id": job_id,
                    "api_key": api_key,
                    "weights_b64": weights_b64,
                    "signature": signature,
                    "loss": loss
                }
                
                print("   [Node] Sending local weight updates to Coordinator...")
                sub_res = requests.post(submit_url, json=submit_payload)
                
                if sub_res.status_code == 200:
                    print(f"   ✅ [Round {current_round}] Update accepted by Coordinator!")
                    last_submitted_round = current_round
                else:
                    print(f"   ❌ [Round {current_round}] Failed to submit: {sub_res.text}")
            else:
                # We already submitted for this round, wait for coordinator to aggregate and advance round
                print(f"⏳ Waiting for other nodes to submit for Round {current_round}... (checking in 5s)", end="\r")
                
            time.sleep(5)
            
    except KeyboardInterrupt:
        print("\n👋 Client simulator stopped by user.")
if __name__ == "__main__":
    main()
