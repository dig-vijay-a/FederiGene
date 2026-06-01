import time
import uuid
import random
import os
import threading
from typing import Dict, Any

try:
    import torch
    import torch.nn as nn
    import torch.nn.utils.prune as prune
    TORCH_AVAILABLE = True
except ImportError:
    TORCH_AVAILABLE = False

if TORCH_AVAILABLE:
    class DummyModel(nn.Module):
        def __init__(self):
            super().__init__()
            # Create a model large enough to see noticeable file size differences (~33MB)
            self.fc1 = nn.Linear(4096, 2048)
            self.fc2 = nn.Linear(2048, 1024)
            self.fc3 = nn.Linear(1024, 512)
            self.fc4 = nn.Linear(512, 10)
            
        def forward(self, x):
            x = torch.relu(self.fc1(x))
            x = torch.relu(self.fc2(x))
            x = torch.relu(self.fc3(x))
            return self.fc4(x)


class EdgeOptimizer:
    """
    Handles Edge AI resource optimization for hospital nodes running FL jobs.
    Implements real PyTorch model pruning and quantization if PyTorch is installed.
    Otherwise, gracefully falls back to simulation mode.
    """
    def __init__(self):
        self.active_optimizations = {}

    def _run_real_compression(self, job_id: str, model_id: str, quantization_level: str, pruning_ratio: float):
        job = self.active_optimizations[job_id]
        try:
            os.makedirs("temp_weights", exist_ok=True)
            model_path = f"temp_weights/{model_id}.pt"
            optimized_path = f"temp_weights/{model_id}_optimized.pt"

            job["status"] = "analyzing_weights"
            job["progress"] = 10
            
            # 1. Generate Global Model if it doesn't exist
            if not os.path.exists(model_path):
                model = DummyModel()
                torch.save(model.state_dict(), model_path)
                
            original_size_mb = os.path.getsize(model_path) / (1024 * 1024)
            job["original_size"] = f"{original_size_mb:.2f} MB"
            time.sleep(1) # UX Delay

            # Load the model back for processing
            model = DummyModel()
            model.load_state_dict(torch.load(model_path))

            # 2. Apply Pruning
            job["status"] = f"pruning_{(pruning_ratio*100):.0f}pct_sparcity"
            job["progress"] = 40
            if pruning_ratio > 0:
                for name, module in model.named_modules():
                    if isinstance(module, nn.Linear):
                        prune.l1_unstructured(module, name='weight', amount=pruning_ratio)
                        prune.remove(module, 'weight') # Make the pruning permanent
            time.sleep(1) # UX Delay
            
            # 3. Apply Quantization
            job["status"] = f"applying_{quantization_level}_quantization"
            job["progress"] = 70
            
            # We use dynamic INT8 quantization for both INT8 and INT4 selections 
            # as INT4 is highly hardware-specific in PyTorch natively.
            if quantization_level in ["INT8", "INT4"]:
                model = torch.quantization.quantize_dynamic(
                    model, {nn.Linear}, dtype=torch.qint8
                )
            time.sleep(1) # UX Delay
            
            # 4. Save and Measure
            torch.save(model.state_dict(), optimized_path)
            optimized_size_mb = os.path.getsize(optimized_path) / (1024 * 1024)
            job["optimized_size"] = f"{optimized_size_mb:.2f} MB"
            
            savings = ((original_size_mb - optimized_size_mb) / original_size_mb) * 100
            job["resource_savings"] = f"{savings:.1f}%"
            
            accuracy_drop = (pruning_ratio * 0.1) + (0.02 if quantization_level == "INT8" else 0.05)
            job["estimated_accuracy_drop"] = f"-{accuracy_drop:.2f}%"
            
            job["progress"] = 100
            job["status"] = "completed"
            job["download_url"] = f"/api/edge/download/{job_id}.tflite"
            
        except Exception as e:
            job["status"] = "error"
            job["progress"] = 0
            # For debugging, but normally shouldn't leak full stack traces to frontend
            print(f"Edge Optimizer Error: {e}")

    def compress_model(self, model_id: str, target_device: str, quantization_level: str = "INT8", pruning_ratio: float = 0.3) -> str:
        job_id = f"opt_{uuid.uuid4().hex[:8]}"
        
        self.active_optimizations[job_id] = {
            "model_id": model_id,
            "target_device": target_device,
            "status": "processing",
            "progress": 0,
            "start_time": time.time(),
            "quantization": quantization_level,
            "pruning_ratio": pruning_ratio,
            "is_real": TORCH_AVAILABLE
        }
        
        if TORCH_AVAILABLE:
            # Run real PyTorch logic in background thread
            thread = threading.Thread(
                target=self._run_real_compression, 
                args=(job_id, model_id, quantization_level, pruning_ratio)
            )
            thread.daemon = True
            thread.start()
        else:
            # Fall back to simulation calculations
            original_size_mb = random.uniform(250.0, 800.0)
            compression_factor = 4.0 if quantization_level == "INT8" else (8.0 if quantization_level == "INT4" else 2.0)
            final_size_mb = (original_size_mb / compression_factor) * (1.0 - pruning_ratio)
            accuracy_drop = (pruning_ratio * 0.1) + (0.02 if quantization_level == "INT8" else 0.05)
            
            self.active_optimizations[job_id].update({
                "original_size": f"{original_size_mb:.1f} MB (Simulated)",
                "optimized_size": f"{final_size_mb:.1f} MB (Simulated)",
                "resource_savings": f"{((original_size_mb - final_size_mb) / original_size_mb) * 100:.1f}%",
                "estimated_accuracy_drop": f"-{accuracy_drop:.2f}%",
            })
            
        return job_id

    def get_optimization_status(self, job_id: str) -> Dict[str, Any]:
        """Returns the status of an ongoing model compression job."""
        if job_id not in self.active_optimizations:
            return {"error": "Optimization job not found"}
            
        job = self.active_optimizations[job_id]
        
        # If PyTorch is handling it, the background thread manages the status
        if job.get("is_real"):
            return job
            
        # If simulation mode, fake the progress based on time
        if job["status"] == "completed":
            return job
            
        elapsed = time.time() - job["start_time"]
        if elapsed < 1:
            job["progress"] = 25
            job["status"] = "analyzing_weights"
        elif elapsed < 2:
            job["progress"] = 55
            job["status"] = f"applying_{job['quantization']}_quantization"
        elif elapsed < 3:
            job["progress"] = 85
            job["status"] = f"pruning_{(job['pruning_ratio']*100):.0f}pct_sparcity"
        else:
            job["progress"] = 100
            job["status"] = "completed"
            job["download_url"] = f"/api/edge/download/{job_id}.tflite"
            
        return job
        
    def configure_fedasync(self, node_id: str, staleness_tolerance: int) -> Dict[str, Any]:
        return {
            "node": node_id,
            "protocol": "FedAsync",
            "staleness_tolerance": staleness_tolerance,
            "aggregation_weight_decay": 0.5,
            "status": "configured",
            "message": "Node will now submit gradients asynchronously. TEE aggregator will apply staleness penalty."
        }

# Singleton instance
edge_optimizer = EdgeOptimizer()
