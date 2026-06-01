import asyncio
import json
import os
import torch
import copy
from datetime import datetime
from typing import Dict, List
from sqlalchemy.orm import Session
from models.auth_models import User
from models.platform_models import TrainingJob, TrainingJobStatus, TrainingParticipant, ModelVersion, AuditLog, ModelEvaluation
from services import crypto_utils
from utils.websocket_manager import ws_manager
from database.config import SessionLocal

async def orchestrate_training_job_async(job_id: int):
    """
    Initializes a new training job and broadcasts the round 1 start event.
    Actual aggregation is now driven by `check_and_aggregate` when clients submit weights.
    """
    db = SessionLocal()
    try:
        job = db.query(TrainingJob).filter(TrainingJob.id == job_id).first()
        if not job:
            return

        job.status = TrainingJobStatus.RUNNING
        job.started_at = datetime.utcnow()
        job.current_round = 1
        
        # Reset participant statuses
        participants = db.query(TrainingParticipant).filter(TrainingParticipant.job_id == job_id).all()
        for p in participants:
            p.status = "waiting"
            
        db.commit()

        print(f"[FL Engine] Starting Job {job_id}: {job.name} ({job.total_rounds} rounds)")

        # Notify watchers the job has officially started
        await ws_manager.broadcast_to_job(str(job_id), {
            "event": "job_started",
            "job_id": job_id,
            "name": job.name,
            "total_rounds": job.total_rounds,
            "timestamp": datetime.utcnow().isoformat()
        })
        
        await ws_manager.broadcast_to_job(str(job_id), {
            "event": "round_started",
            "round": 1,
            "total_rounds": job.total_rounds,
            "timestamp": datetime.utcnow().isoformat()
        })
    finally:
        db.close()

async def check_and_aggregate(job_id: int, round_num: int):
    """
    Called when a participant submits weights. Checks if all participants have submitted for the current round.
    If so, it runs FedAvg and advances the round.
    """
    db = SessionLocal()
    try:
        job = db.query(TrainingJob).filter(TrainingJob.id == job_id).first()
        if not job or job.current_round != round_num or job.status != TrainingJobStatus.RUNNING:
            return
            
        participants = db.query(TrainingParticipant).filter(TrainingParticipant.job_id == job_id).all()
        
        all_submitted = all(p.status == "submitted" for p in participants)
        if not all_submitted:
            print(f"[FL Engine] Waiting for other participants for Job {job_id} Round {round_num}...")
            return 
            
        print(f"[FL Engine] All participants submitted for Job {job_id} Round {round_num}. Aggregating with PyTorch...")
        
        # Load local PyTorch weights
        state_dicts = []
        for p in participants:
            weight_path = os.path.join("temp_weights", f"job_{job_id}_org_{p.org_id}_round_{round_num}.pt")
            if os.path.exists(weight_path):
                state_dict = torch.load(weight_path)
                state_dicts.append(state_dict)
            else:
                print(f"[FL Engine] Missing weight file for org {p.org_id}. Skipping.")
                
        if not state_dicts:
            print("[FL Engine] No valid weights found to aggregate!")
            job.status = TrainingJobStatus.FAILED
            db.commit()
            return
            
        # Perform Federated Averaging (FedAvg) using PyTorch
        global_state_dict = copy.deepcopy(state_dicts[0])
        for key in global_state_dict.keys():
            for i in range(1, len(state_dicts)):
                global_state_dict[key] += state_dicts[i][key]
            global_state_dict[key] = torch.div(global_state_dict[key], len(state_dicts))
            
        # Compute average loss across participants
        avg_loss = sum((p.local_loss or 0.0) for p in participants) / max(len(participants), 1)
            
        # Save global model locally (acting as Model Registry)
        global_model_path = os.path.join("temp_weights", f"global_job_{job_id}_round_{round_num}.pt")
        torch.save(global_state_dict, global_model_path)
        
        # Save ModelVersion in DB
        version_str = f"v{job.id}.{round_num}"
        # For demo purposes, we simulate accuracy metrics improving as loss goes down
        global_model_acc = max(0.5, 1.0 - avg_loss)
        global_model_auc = min(0.99, global_model_acc + 0.02)
        global_model_f1 = min(0.99, global_model_acc - 0.01)
        
        new_model = ModelVersion(
            job_id=job.id,
            version=version_str,
            accuracy=global_model_acc,
            auc=global_model_auc,
            f1_score=global_model_f1,
            loss=avg_loss,
            round_number=round_num,
            hmac_signature="FEDAVG_AGGREGATED_SIGNATURE"
        )
        db.add(new_model)
        
        # Reset participants for next round
        for p in participants:
            p.status = "waiting"
            
        job.current_round += 1
        is_finished = job.current_round > job.total_rounds
        if is_finished:
            job.status = TrainingJobStatus.COMPLETED
            job.completed_at = datetime.utcnow()
            
        db.add(AuditLog(
            user_id=job.created_by,
            action="fl_round_completed",
            resource_type="training_job",
            resource_id=job.id,
            details=json.dumps({"round": round_num, "participants": len(participants), "aggregation": "FedAvg_PyTorch"})
        ))
        db.commit()
        
        print(f"[FL Engine] Job {job_id} completed Round {round_num}. Loss: {avg_loss:.4f}")
        
        # Broadcasts
        await ws_manager.broadcast_to_job(str(job_id), {
            "event": "round_completed",
            "round": round_num,
            "total_rounds": job.total_rounds,
            "accuracy": round(global_model_acc, 4),
            "loss": round(avg_loss, 4),
            "aggregation": "FedAvg_PyTorch",
            "status": job.status.value,
            "timestamp": datetime.utcnow().isoformat()
        })
        
        if is_finished:
            await ws_manager.broadcast_to_job(str(job_id), {
                "event": "job_finished",
                "job_id": job_id,
                "status": job.status.value,
                "final_round": round_num,
                "timestamp": datetime.utcnow().isoformat()
            })
        else:
            await ws_manager.broadcast_to_job(str(job_id), {
                "event": "round_started",
                "round": job.current_round,
                "total_rounds": job.total_rounds,
                "timestamp": datetime.utcnow().isoformat()
            })

    except Exception as e:
        print(f"[FL Engine] Error in check_and_aggregate: {e}")
        db.rollback()
    finally:
        db.close()


async def run_federated_evaluation(model_version_id: int):
    """
    Simulates a federated evaluation.
    """
    db = SessionLocal()
    try:
        model = db.query(ModelVersion).filter(ModelVersion.id == model_version_id).first()
        if not model:
            return
            
        import time
        time.sleep(2)  # Simulate some async work
        
        # Determine evaluation metrics based on model accuracy
        eval_acc = min(0.99, model.accuracy + 0.01)
        eval_auc = min(0.99, model.auc + 0.01)
        
        evaluation = ModelEvaluation(
            model_version_id=model.id,
            eval_accuracy=eval_acc,
            eval_auc=eval_auc,
            eval_type="CROSS_SILO_VALIDATION",
            participating_nodes=3
        )
        
        db.add(evaluation)
        
        db.add(AuditLog(
            user_id=1,  # System
            action="model_evaluation_completed",
            resource_type="model",
            resource_id=model.id,
            details=json.dumps({"eval_accuracy": eval_acc})
        ))
        
        db.commit()
    except Exception as e:
        print(f"Error in run_federated_evaluation: {e}")
        db.rollback()
    finally:
        db.close()
