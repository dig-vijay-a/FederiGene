import random
import uuid
import time
import os
import csv
from typing import Dict, List, Any

class SyntheticTwinGenerator:
    """
    Simulates a Federated GAN (Generative Adversarial Network) orchestrator.
    In a real-world scenario, this would coordinate local generator/discriminator
    training across hospital nodes to learn the underlying distribution of genomic
    and clinical data without ever moving the real data.
    """
    
    def __init__(self):
        # Simulated global generator weights
        self.global_generator_weights = "latent_space_v1.0.4_optim"
        self.active_generation_jobs = {}

    def start_synthetic_generation(self, dataset_id: int, num_samples: int, epsilon: float) -> str:
        """
        Starts an asynchronous job to generate synthetic twins based on the 
        global generator model adapted to a specific dataset's distribution.
        """
        job_id = str(uuid.uuid4())
        
        self.active_generation_jobs[job_id] = {
            "dataset_id": dataset_id,
            "status": "initializing",
            "progress": 0,
            "num_samples": num_samples,
            "epsilon": epsilon,  # Differential Privacy budget used
            "start_time": time.time(),
            "download_url": None
        }
        
        return job_id
        
    def get_job_status(self, job_id: str) -> Dict[str, Any]:
        """
        Retrieves the status of a synthetic generation job.
        Simulates the time it takes to sample from a complex GAN.
        """
        if job_id not in self.active_generation_jobs:
            return {"error": "Job not found"}
            
        job = self.active_generation_jobs[job_id]
        
        if job["status"] == "completed":
            return job
            
        # Simulate progress
        elapsed = time.time() - job["start_time"]
        
        if elapsed < 2:
            job["status"] = "loading_weights"
            job["progress"] = 15
        elif elapsed < 5:
            job["status"] = "sampling_latent_space"
            job["progress"] = 45
        elif elapsed < 8:
            job["status"] = "applying_dp_noise"
            job["progress"] = 75
        else:
            job["status"] = "completed"
            job["progress"] = 100
            
            # Generate the actual CSV file if it doesn't exist yet
            if not job["download_url"]:
                # Generate full data
                full_data = self.generate_preview(num_samples=job["num_samples"], dataset_id=job["dataset_id"])
                
                if full_data:
                    # Write to CSV
                    output_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), "temp", "synthetic_datasets")
                    os.makedirs(output_dir, exist_ok=True)
                    file_path = os.path.join(output_dir, f"{job_id}.csv")
                    
                    keys = full_data[0].keys()
                    with open(file_path, 'w', newline='', encoding='utf-8') as output_file:
                        dict_writer = csv.DictWriter(output_file, fieldnames=keys)
                        dict_writer.writeheader()
                        dict_writer.writerows(full_data)
                
                # Assign download link
                job["download_url"] = f"/api/synthetic/download/{job_id}.csv"
            
        return job

    def generate_preview(self, num_samples: int = 5, dataset_id: int = None) -> List[Dict[str, Any]]:
        """
        Generates a quick, synchronous preview of what a synthetic dataset looks like,
        using the actual schema defined in the database.
        """
        preview_data = []
        
        # Default mock schema if no dataset provided or found
        schema = {
            "features": [
                {"name": "age", "type": "int", "min": 30, "max": 85},
                {"name": "gender", "type": "categorical", "values": ["M", "F"]},
                {"name": "biomarker_TP53", "type": "float", "min": 0.1, "max": 5.0},
                {"name": "clinical_outcome", "type": "categorical", "values": ["Responsive", "Stable", "Non-Responsive"]}
            ]
        }
        
        if dataset_id:
            try:
                from database.config import SessionLocal
                from models.platform_models import Dataset
                import json
                
                db = SessionLocal()
                ds = db.query(Dataset).filter(Dataset.id == dataset_id).first()
                if ds and ds.schema_json:
                    schema = json.loads(ds.schema_json)
                db.close()
            except Exception as e:
                print(f"Error loading schema for synthetic preview: {e}")
        
        for i in range(num_samples):
            patient = {"synthetic_id": f"SYN-{uuid.uuid4().hex[:8].upper()}"}
            for feature in schema.get("features", []):
                fname = feature.get("name")
                ftype = feature.get("type")
                
                if ftype == "int":
                    patient[fname] = random.randint(feature.get("min", 0), feature.get("max", 100))
                elif ftype == "float":
                    patient[fname] = round(random.uniform(feature.get("min", 0.0), feature.get("max", 1.0)), 3)
                elif ftype == "categorical":
                    patient[fname] = random.choice(feature.get("values", ["Unknown"]))
                else:
                    patient[fname] = "N/A"
                    
            preview_data.append(patient)
            
        return preview_data
        
    def get_dp_calibration_metrics(self) -> Dict[str, Any]:
        """
        Returns metrics for the DP Noise Calibration Dashboard to show the trade-off
        between privacy (epsilon) and data utility (fidelity).
        """
        return {
            "current_epsilon": 1.5,
            "fidelity_score": 0.92,  # How closely synthetic data matches real distribution
            "privacy_guarantee": "High",
            "historical_tradeoffs": [
                {"epsilon": 0.5, "fidelity": 0.78, "vulnerability_score": 0.05},
                {"epsilon": 1.0, "fidelity": 0.86, "vulnerability_score": 0.12},
                {"epsilon": 1.5, "fidelity": 0.92, "vulnerability_score": 0.25},
                {"epsilon": 5.0, "fidelity": 0.98, "vulnerability_score": 0.75}
            ]
        }

# Singleton instance
synthetic_generator = SyntheticTwinGenerator()
