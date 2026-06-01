import time
import random
import uuid
from typing import Dict, Any, List

class InterplanetaryLedgerService:
    """
    Simulates the Interplanetary Medical Ledger for FederiGene.
    Handles high-latency Starlink-optimized weight synchronization for deep space 
    (e.g., Mars colonies) and disconnected-mode federated learning for sub-orbital 
    and extra-terrestrial nodes.
    """
    def __init__(self):
        # Simulated Deep Space Nodes
        self.nodes = {
            "node_mars_base_1": {"location": "Mars - Jezero Crater", "latency_ms": 1200000, "status": "active"}, # 20 mins latency
            "node_lunar_gate": {"location": "Lunar Orbit", "latency_ms": 1280, "status": "active"},
            "node_iss_1": {"location": "Low Earth Orbit", "latency_ms": 25, "status": "active"}
        }
        
        # Simulated Interplanetary Bio-IDs
        self.bio_ids = {
            "bio_id_9901": {"traveler_name": "Cmdr. Elena Vance", "home_world": "Earth", "current_location": "En-route to Mars", "health_status": "nominal"}
        }
        
        self.sync_jobs = []

    def get_space_nodes_status(self) -> List[Dict]:
        return [{"id": k, **v} for k, v in self.nodes.items()]

    def sync_weights_to_mars(self, model_id: str) -> Dict[str, Any]:
        """
        Simulates the Starlink-optimized high-latency weight synchronization.
        Uses advanced compression and FEC (Forward Error Correction) for deep space.
        """
        job_id = f"sync_{uuid.uuid4().hex[:6]}"
        job = {
            "id": job_id,
            "model_id": model_id,
            "target": "node_mars_base_1",
            "eta_seconds": 1200, # 20 mins
            "compression_ratio": "120:1",
            "protocol": "Starlink-DSN (Deep Space Network)",
            "status": "in_transit"
        }
        self.sync_jobs.append(job)
        return {"message": "Weight packet successfully beamed to Mars relay.", "job": job}

    def register_interplanetary_bio_id(self, name: str, home_world: str) -> Dict[str, Any]:
        """
        Generates a universal Bio-ID that persists across planetary boundaries.
        """
        bio_id = f"bio_id_{random.randint(1000, 9999)}"
        new_id = {
            "traveler_name": name,
            "home_world": home_world,
            "current_location": "In-Transit",
            "health_status": "Pending_Sync"
        }
        self.bio_ids[bio_id] = new_id
        return {"bio_id": bio_id, "data": new_id}

# Singleton instance
interplanetary_ledger = InterplanetaryLedgerService()
