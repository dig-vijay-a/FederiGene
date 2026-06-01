from typing import List, Dict
import hashlib
import json
from Backend.utils.tenseal_adapter import he_engine
from Backend.services.fl_orchestrator import DPManager

class FederatedAnalyticsEngine:
    """
    Federated SQL Analytics Engine.
    Executes distributed queries across hospital nodes and aggregates results
    using Privacy-Enhancing Technologies (PETs).
    """
    
    def __init__(self):
        self.registered_nodes = []

    def execute_global_aggregate(self, query_type: str, local_results: List[Dict]):
        """
        Aggregates results from multiple nodes for a specific query.
        query_type: e.g., "patient_count", "average_age", "variant_frequency"
        local_results: List of dicts containing node-local encrypted or raw results.
        """
        if not local_results:
            return {"error": "No data received from nodes"}

        if query_type == "patient_count":
            # Direct sum of counts (Privacy risk: low, but we often add DP)
            raw_sum = sum(node.get('count', 0) for node in local_results)
            # Apply DP to protect small-count membership disclosure
            dp_result = DPManager.apply_gaussian_noise([float(raw_sum)], epsilon=1.0)[0]
            return {"global_count": round(dp_result), "status": "Aggregated with DP"}

        elif query_type == "average_metric":
            # For averages, we use Homomorphic Encryption to sum then divide
            # In simulation, we'll demonstrate the HE sum flow
            encrypted_sums = [node.get('encrypted_sum') for node in local_results if 'encrypted_sum' in node]
            total_count = sum(node.get('count', 0) for node in local_results)
            
            if encrypted_sums:
                aggregated_he = he_engine.aggregate_encrypted(encrypted_sums)
                decrypted_sum = he_engine.decrypt_vector(aggregated_he)[0]
                global_avg = decrypted_sum / max(total_count, 1)
                return {"global_average": round(global_avg, 4), "total_n": total_count}
                
            # If HE isn't used, perform raw aggregation (not recommended for production)
            raw_avg = sum(node.get('sum', 0) for node in local_results) / max(total_count, 1)
            return {"global_average": round(raw_avg, 4), "status": "Unencrypted Aggregation"}

        return {"error": "Query type not supported"}

    def generate_local_node_response(self, node_id: str, query: str, local_data: List[float]):
        """
        Simulates a hospital node calculating local stats for a global query.
        """
        local_count = len(local_data)
        local_sum = sum(local_data)
        
        # Encrypt the sum to protect local privacy during transit
        encrypted_sum = he_engine.encrypt_vector([local_sum])
        
        return {
            "node_id": node_id,
            "count": local_count,
            "encrypted_sum": encrypted_sum,
            "sum": local_sum # Included for non-HE debug mode
        }

# Global Instance
analytics_engine = FederatedAnalyticsEngine()
