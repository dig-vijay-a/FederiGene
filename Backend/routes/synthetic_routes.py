from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from fastapi.responses import FileResponse
import os
from sqlalchemy.orm import Session
from database.config import get_db
from models.platform_models import Dataset
from services.synthetic_twin_generator import synthetic_generator
from pydantic import BaseModel

router = APIRouter(prefix="/api/synthetic", tags=["Synthetic Data & Privacy"])

class GenerationRequest(BaseModel):
    dataset_id: int
    num_samples: int = 1000
    epsilon: float = 1.0

@router.post("/generate")
async def start_generation(req: GenerationRequest, db: Session = Depends(get_db)):
    """
    Starts a background job to generate synthetic twins for a given dataset.
    """
    dataset = db.query(Dataset).filter(Dataset.id == req.dataset_id).first()
    if not dataset:
        raise HTTPException(status_code=404, detail="Dataset not found")
        
    job_id = synthetic_generator.start_synthetic_generation(
        dataset_id=req.dataset_id, 
        num_samples=req.num_samples,
        epsilon=req.epsilon
    )
    
    return {"message": "Synthetic generation started", "job_id": job_id}

@router.get("/job/{job_id}")
async def get_generation_status(job_id: str):
    """
    Checks the status of an ongoing synthetic generation job.
    """
    status = synthetic_generator.get_job_status(job_id)
    if "error" in status:
        raise HTTPException(status_code=404, detail=status["error"])
    return status

@router.get("/preview")
async def get_synthetic_preview(samples: int = 5, dataset_id: int = None):
    """
    Returns a quick preview of synthetic records.
    """
    return synthetic_generator.generate_preview(samples, dataset_id)

@router.get("/download/{filename}")
async def download_synthetic_file(filename: str):
    """
    Downloads the generated synthetic dataset CSV file.
    """
    file_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "temp", "synthetic_datasets", filename)
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="File not found")
    
    return FileResponse(path=file_path, filename=filename, media_type='text/csv')

@router.get("/dp/metrics")
async def get_dp_metrics():
    """
    Returns data for the Differential Privacy Noise Calibration Dashboard.
    """
    return synthetic_generator.get_dp_calibration_metrics()
