from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database.config import get_db
from models.platform_models import Organization, TrainingJob
import time
import random

router = APIRouter(prefix="/api/observability", tags=["Observability"])

@router.get("/metrics")
async def get_system_metrics(db: Session = Depends(get_db)):
    """
    Exposes high-level system metrics for dashboard and Prometheus monitoring.
    """
    total_jobs = db.query(TrainingJob).count()
    active_jobs = db.query(TrainingJob).filter(TrainingJob.status == "in_progress").count()
    org_count = db.query(Organization).count()
    
    # Simulate infrastructure metrics (Real values would come from K8s/Prometheus API)
    return {
        "status": "Healthy",
        "uptime_seconds": 3600 * 24 * 7, # 7 days
        "load_avg": [0.45, 0.52, 0.48],
        "active_training_jobs": active_jobs,
        "total_jobs_processed": total_jobs,
        "registered_organizations": org_count,
        "encryption_throughput_mb_s": round(random.uniform(45.0, 85.0), 2),
        "security_events_last_24h": random.randint(0, 5)
    }

@router.get("/nodes/health")
async def get_node_health_status():
    """
    Simulates monitoring of distributed hospital nodes.
    """
    sample_nodes = [
        {"id": "NODE-MGM-01", "name": "Mass General Hospital", "status": "Online", "latency_ms": 12, "last_synced": "2026-02-28T02:45:00Z"},
        {"id": "NODE-MAY-02", "name": "Mayo Clinic", "status": "Online", "latency_ms": 24, "last_synced": "2026-02-28T02:48:00Z"},
        {"id": "NODE-UCSF-03", "name": "UC San Francisco", "status": "Maintenance", "latency_ms": 0, "last_synced": "2026-02-27T18:00:00Z"},
        {"id": "NODE-CLE-04", "name": "Cleveland Clinic", "status": "Offline", "latency_ms": 0, "last_synced": "2026-02-28T00:12:00Z"}
    ]
    return sample_nodes

@router.get("/metrics/history")
async def get_metrics_history():
    """
    Returns time-series history for compute load and throughput.
    Used for frontend observability charts.
    """
    history = []
    base_time = int(time.time()) - (3600 * 5) # 5 hours ago
    for i in range(6):
        t = time.strftime('%H:%M', time.localtime(base_time + (i * 3600)))
        history.append({
            "time": t,
            "load": round(random.uniform(0.3, 0.9), 2),
            "throughput": random.randint(50, 120)
        })
    return history

@router.get("/audit/quotas/{org_id}")
async def get_org_quota_usage(org_id: int, db: Session = Depends(get_db)):
    """
    Checks resource utilization against institutional quotas.
    """
    org = db.query(Organization).filter(Organization.id == org_id).first()
    if not org:
        raise HTTPException(status_code=404, detail="Organization not found")
        
    current_active = db.query(TrainingJob).filter(TrainingJob.owner_id == org_id, TrainingJob.status == "in_progress").count()
    
    return {
        "organization": org.name,
        "tier": org.subscription_tier,
        "quotas": {
            "concurrent_jobs": {"limit": org.max_concurrent_jobs, "used": current_active},
            "storage_gb": {"limit": org.storage_quota_gb, "used": round(random.uniform(5.0, 40.0), 1)},
            "api_requests_per_min": {"limit": 1000, "used": random.randint(5, 50)}
        }
    }
