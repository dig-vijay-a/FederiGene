import hashlib
import time
import random
import uuid
import json
from typing import Dict, List, Any

from database.config import SessionLocal
from models.platform_models import TrustLedgerBlock, TrustLedgerTransaction

class BlockchainManager:
    """
    Interacts with the persisted Trust Ledger in the database.
    This replaces the previous in-memory simulation with actual persistence,
    acting as a bridge to future Web3.py smart contract integration.
    """
    def __init__(self):
        self.chain_id = "0x89" # Simulated Polygon/Sidechain
        self.gas_price = 35 # gwei
        self._ensure_genesis_block()
        
    def _ensure_genesis_block(self):
        """Ensures block 0 exists on startup."""
        db = SessionLocal()
        try:
            genesis = db.query(TrustLedgerBlock).filter(TrustLedgerBlock.block_number == 0).first()
            if not genesis:
                gen_block = TrustLedgerBlock(
                    block_number=0,
                    hash="0x0000000000000000000000000000000000000000",
                    parent_hash=None,
                    timestamp=int(time.time() - 86400 * 30)
                )
                db.add(gen_block)
                db.flush()
                
                gen_txn = TrustLedgerTransaction(
                    block_id=gen_block.id,
                    txn_id="0x_genesis_txn",
                    txn_type="network_init",
                    payload_json=json.dumps({"message": "FederiGene Trust Network Genesis"})
                )
                db.add(gen_txn)
                db.commit()
        finally:
            db.close()

    def _mine_block(self, transactions: List[Dict]) -> str:
        """Writes a block and its transactions to the database ledger."""
        db = SessionLocal()
        try:
            last_block = db.query(TrustLedgerBlock).order_by(TrustLedgerBlock.block_number.desc()).first()
            block_num = last_block.block_number + 1
            
            # Simulated Proof-of-Authority (PoA) mining delay
            time.sleep(0.5) 
            
            # Create block hash
            content = str(block_num) + str(last_block.hash) + str(transactions)
            block_hash = "0x" + hashlib.sha256(content.encode()).hexdigest()
            
            new_block = TrustLedgerBlock(
                block_number=block_num,
                hash=block_hash,
                parent_hash=last_block.hash,
                timestamp=int(time.time())
            )
            db.add(new_block)
            db.flush()
            
            for txn in transactions:
                new_txn = TrustLedgerTransaction(
                    block_id=new_block.id,
                    txn_id=txn.get("txn_id"),
                    txn_type=txn.get("type"),
                    payload_json=json.dumps(txn)
                )
                db.add(new_txn)
                
            db.commit()
            return block_hash
        finally:
            db.close()

    def anchor_round_hash(self, job_id: int, round_num: int, model_hash: str, org_dids: List[str]) -> Dict[str, Any]:
        """
        Records the aggregated model weight hash on the persistent ledger.
        """
        txn_id = "0x" + hashlib.sha256(str(uuid.uuid4()).encode()).hexdigest()
        
        txn = {
            "txn_id": txn_id,
            "type": "round_anchor",
            "job_id": job_id,
            "round": round_num,
            "model_hash": model_hash,
            "participants": org_dids,
            "signature": f"0x_sim_sig_{uuid.uuid4().hex[:16]}"
        }
        
        block_hash = self._mine_block([txn])
        
        return {
            "status": "mined",
            "txn_hash": txn_id,
            "block_hash": block_hash,
            "gas_used": random.randint(45000, 80000)
        }

    def register_dua(self, dataset_id: int, consumer_org_did: str, provider_org_did: str, terms: str) -> Dict[str, str]:
        """
        Creates a Smart Contract-based Data Usage Agreement (DUA) on the ledger.
        """
        contract_address = "0x" + hashlib.sha1(str(uuid.uuid4()).encode()).hexdigest() + "a1"
        
        txn = {
            "txn_id": "0x" + hashlib.sha256(str(uuid.uuid4()).encode()).hexdigest(),
            "type": "smart_contract_deploy",
            "contract_type": "DUA",
            "dataset_id": dataset_id,
            "consumer": consumer_org_did,
            "provider": provider_org_did,
            "terms_hash": hashlib.sha256(terms.encode()).hexdigest(),
            "deployed_address": contract_address
        }
        
        self._mine_block([txn])
        
        return {
            "status": "deployed",
            "contract_address": contract_address
        }

    def get_recent_blocks(self, limit: int = 10) -> List[Dict]:
        """Retrieves recent blocks directly from the database for the Trust Explorer UI."""
        db = SessionLocal()
        try:
            blocks = db.query(TrustLedgerBlock).order_by(TrustLedgerBlock.block_number.desc()).limit(limit).all()
            result = []
            for b in blocks:
                txns = []
                for t in b.transactions:
                    txns.append(json.loads(t.payload_json))
                result.append({
                    "block_number": b.block_number,
                    "hash": b.hash,
                    "parent_hash": b.parent_hash,
                    "timestamp": b.timestamp,
                    "transactions": txns
                })
            return result
        finally:
            db.close()
        
    def verify_transaction(self, txn_hash: str) -> Dict[str, Any]:
        """Verifies a blockchain transaction directly against the database."""
        db = SessionLocal()
        try:
            txn = db.query(TrustLedgerTransaction).filter(TrustLedgerTransaction.txn_id == txn_hash).first()
            if txn:
                block = txn.block
                latest_block = db.query(TrustLedgerBlock).order_by(TrustLedgerBlock.block_number.desc()).first()
                return {
                    "verified": True,
                    "block_number": block.block_number,
                    "timestamp": block.timestamp,
                    "confidence": "100%",
                    "confirmations": latest_block.block_number - block.block_number + 1
                }
            return {"verified": False, "error": "Transaction not found on ledger"}
        finally:
            db.close()

# Singleton Instance
blockchain = BlockchainManager()
