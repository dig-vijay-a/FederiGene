from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from services.multimodal_iq import multimodal_iq

router = APIRouter(prefix="/api/multimodal", tags=["Multi-Modal IQ"])

class DistillRequest(BaseModel):
    teacher_model: str
    student_node: str
    modalities: list

@router.post("/distill")
async def start_distillation(req: DistillRequest):
    """
    Submits a job to perform Cross-Silo Knowledge Distillation between a heavy teacher
    and a lightweight edge student model using soft labels.
    """
    job_id = multimodal_iq.start_knowledge_distillation(
        teacher_model=req.teacher_model,
        student_node=req.student_node,
        modalities=req.modalities
    )
    return {"message": "Knowledge Distillation job started", "job_id": job_id}

@router.get("/distill/{job_id}")
async def get_distillation_status(job_id: str):
    """
    Polls the status and KL-Divergence metrics of an ongoing distillation job.
    """
    status = multimodal_iq.get_distillation_status(job_id)
    if "error" in status:
        raise HTTPException(status_code=404, detail=status["error"])
    return status

@router.get("/gnn/map/{dataset_id}")
async def get_gnn_map(dataset_id: int):
    """
    Retrieves the Graph Neural Network mapping showing attention weights
    between dataset features.
    """
    gnn_data = multimodal_iq.generate_gnn_map(dataset_id=dataset_id)
    return gnn_data
