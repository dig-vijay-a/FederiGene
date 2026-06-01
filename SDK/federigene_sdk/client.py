import requests
import json
import time
import hashlib
import base64
import io
import sys

try:
    import torch
    import torch.nn as nn
    import torch.optim as optim
except ImportError:
    print("PyTorch is required. Please run: pip install torch")
    sys.exit(1)

# Simplified genomic model for demonstration
class GenomicNet(nn.Module):
    def __init__(self, input_size=10):
        super(GenomicNet, self).__init__()
        self.fc1 = nn.Linear(input_size, 16)
        self.relu = nn.ReLU()
        self.fc2 = nn.Linear(16, 1)
        self.sigmoid = nn.Sigmoid()

    def forward(self, x):
        out = self.fc1(x)
        out = self.relu(out)
        out = self.fc2(out)
        out = self.sigmoid(out)
        return out

class FederiGeneClient:
    """
    Hospital Node SDK Client with real PyTorch integration.
    Responsible for:
    1. Authenticating with the Platform.
    2. Downloading global model weights.
    3. Performing local training using PyTorch.
    4. Submitting encrypted/encoded weight updates.
    """
    def __init__(self, platform_url, api_key):
        self.platform_url = platform_url.rstrip('/')
        self.api_key = api_key
        self.headers = {"X-API-KEY": api_key, "Content-Type": "application/json"}
        self.node_info = None
        self.model = GenomicNet()

    def authenticate(self):
        """Verify API key and retrieve node/org profile."""
        try:
            res = requests.get(f"{self.platform_url}/api/platform/auth/whoami", headers=self.headers)
            if res.status_code == 200:
                self.node_info = res.json()
                print(f"✅ Authenticated as: {self.node_info.get('username')} ({self.node_info.get('role')})")
                return True
            else:
                print(f"❌ Auth failed: {res.text}")
                return False
        except Exception as e:
            print(f"❌ Connection error: {e}")
            return False

    def fetch_training_job(self, job_id):
        """Download latest model architecture and metadata."""
        res = requests.get(f"{self.platform_url}/api/platform/training/{job_id}", headers=self.headers)
        return res.json() if res.status_code == 200 else None

    def perform_local_training(self, job_id, round_num, data_path=None, epochs=5):
        """
        Train the model locally on hospital genomic data.
        """
        print(f"\n🚀 [Round {round_num}] Starting local PyTorch training for Job #{job_id}...")
        
        # Simulate local genomic dataset (100 patients, 10 features each)
        torch.manual_seed(round_num) # for reproducibility in demo
        X_train = torch.rand(100, 10)
        y_train = torch.randint(0, 2, (100, 1)).float()
        
        criterion = nn.BCELoss()
        optimizer = optim.SGD(self.model.parameters(), lr=0.01)
        
        self.model.train()
        final_loss = 0.0
        
        for epoch in range(epochs):
            optimizer.zero_grad()
            outputs = self.model(X_train)
            loss = criterion(outputs, y_train)
            loss.backward()
            optimizer.step()
            final_loss = loss.item()
            
            # Print occasionally to show progress
            if (epoch + 1) % max(1, epochs//2) == 0:
                print(f"  Epoch [{epoch+1}/{epochs}], Loss: {final_loss:.4f}")
            
        print(f"✅ Local training complete. Final Loss: {final_loss:.4f}")
        
        # Serialize the updated PyTorch state dict
        buffer = io.BytesIO()
        torch.save(self.model.state_dict(), buffer)
        buffer.seek(0)
        
        # Base64 encode the binary weights to send over HTTP JSON API
        encoded_weights = base64.b64encode(buffer.read()).decode('utf-8')
        return encoded_weights, final_loss

    def submit_update(self, job_id, encoded_weights, loss):
        """Submit the encoded PyTorch weights back to the aggregator."""
        payload = {
            "job_id": job_id,
            "weights_b64": encoded_weights,
            "signature": hashlib.sha256(encoded_weights.encode()).hexdigest(),
            "loss": loss
        }
        print(f"📤 Submitting weight updates to central server...")
        res = requests.post(f"{self.platform_url}/api/platform/training/{job_id}/submit", 
                            json=payload, headers=self.headers)
        if res.status_code == 200:
            print("✅ Weights submitted successfully.")
            return res.json()
        else:
            print(f"❌ Failed to submit weights: {res.text}")
            return None

if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser(description="FederiGene Local Training Client")
    parser.add_argument("--platform-url", default="http://localhost:8000", help="Platform URL")
    parser.add_argument("--api-key", required=True, help="Your Hospital API Key")
    parser.add_argument("--job-id", type=int, required=True, help="The Training Job ID to participate in")
    parser.add_argument("--data-path", default=None, help="Path to local genomic dataset")
    parser.add_argument("--epochs", type=int, default=10, help="Number of local epochs per round")
    args = parser.parse_args()

    client = FederiGeneClient(args.platform_url, args.api_key)
    if client.authenticate():
        job_data = client.fetch_training_job(args.job_id)
        if not job_data:
            print(f"❌ Could not find Job {args.job_id}. Is it running?")
            sys.exit(1)
            
        print(f"Found Job {args.job_id}: {job_data.get('name')}")
        
        # Simple polling loop for demo purposes
        last_round = 0
        while True:
            job_data = client.fetch_training_job(args.job_id)
            if job_data.get("status") != "RUNNING":
                print(f"Job is no longer running (Status: {job_data.get('status')}). Exiting.")
                break
                
            current_round = job_data.get("current_round", 1)
            if current_round > last_round:
                # New round started!
                encoded_weights, final_loss = client.perform_local_training(
                    args.job_id, current_round, data_path=args.data_path, epochs=args.epochs
                )
                client.submit_update(args.job_id, encoded_weights, final_loss)
                last_round = current_round
                
            time.sleep(5) # Poll every 5 seconds
