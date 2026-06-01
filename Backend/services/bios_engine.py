import time
import random
import uuid
from typing import Dict, Any, List

class BioOSService:
    """
    Simulates the Synthetic Biological OS for FederiGene.
    Provides a low-level API interface for Bio-foundries and Organ-on-a-chip labs,
    enables real-time debugging of synthetic biological logic gates (circuits),
    and maintains a molecular-level audit trail for all protein synthesis operations.
    """
    def __init__(self):
        self.connected_foundries = [
            {"id": "foundry_01_zurich", "name": "Swiss Bio-Foundry", "status": "online", "active_circuits": 12},
            {"id": "foundry_04_boston", "name": "Boston Organ-Lab", "status": "online", "active_circuits": 8}
        ]
        self.active_circuits = [
            {"id": "circ_log_402", "target": "Insulin-Trigger-Gate", "logic": "IF Glucose > 120 THEN SECRETE Insulin", "status": "running", "error_rate": "0.0001%"},
            {"id": "circ_log_405", "target": "T-Cell-Kill-Switch", "logic": "IF Antigen-X PRESENT THEN ACTIVATE-T", "status": "debugging", "error_rate": "0.042%"}
        ]
        self.synthesis_audit_log = []

    def get_os_status(self) -> Dict[str, Any]:
        """Returns the current state of the Synthetic Bio-OS."""
        return {
            "bios_version": "v3.0-Cosmos",
            "foundries_online": len(self.connected_foundries),
            "circuits_active": len(self.active_circuits),
            "sys_latency_us": 420, # Microseconds
            "foundries": self.connected_foundries
        }

    def debug_circuit(self, circuit_id: str) -> Dict[str, Any]:
        """
        Simulates a real-time debugging trace of a synthetic biological circuit.
        """
        trace_id = f"trace_{uuid.uuid4().hex[:8]}"
        return {
            "trace_id": trace_id,
            "circuit_id": circuit_id,
            "execution_log": [
                {"step": "Input-Sensing", "signal": "Promoter-Active", "timestamp": time.time() - 0.05},
                {"step": "Logic-Gate-Process", "gate": "AND", "output": "High", "timestamp": time.time() - 0.02},
                {"step": "Protein-Output", "status": "Initiated", "error": "None", "timestamp": time.time()}
            ],
            "conclusion": "Circuit performing within nominal specifications."
        }

    def start_protein_synthesis(self, foundry_id: str, protein_blueprint: str) -> Dict[str, Any]:
        """
        Initiates a protein synthesis run in a connected foundry.
        Creates a molecular audit trail.
        """
        audit_id = f"audit_mol_{uuid.uuid4().hex[:12]}"
        entry = {
            "id": audit_id,
            "foundry": foundry_id,
            "blueprint": protein_blueprint,
            "hash": uuid.uuid4().hex,
            "timestamp": time.time(),
            "status": "In-Synthesis"
        }
        self.synthesis_audit_log.insert(0, entry)
        return {"message": "Molecular synthesis sequence transmitted to foundry.", "audit_entry": entry}

    def get_audit_trail(self) -> List[Dict]:
        """Retrieves the molecular audit trail for protein induction."""
        return self.synthesis_audit_log

    def get_active_circuits(self) -> List[Dict]:
        """Retrieves list of active biological circuits."""
        # Randomly jitter error rates for debugging feel
        for circ in self.active_circuits:
            if circ["status"] == "debugging":
                jitter = random.uniform(-0.005, 0.005)
                current = float(circ["error_rate"].replace('%', ''))
                circ["error_rate"] = f"{max(0, round(current + jitter, 4))}%"
        return self.active_circuits

# Singleton instance
bios_service = BioOSService()
