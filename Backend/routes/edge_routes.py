from fastapi import APIRouter, HTTPException, Depends
from services.edge_optimizer import edge_optimizer
from pydantic import BaseModel

router = APIRouter(prefix="/api/edge", tags=["Edge AI & Optimization"])

class CompressionRequest(BaseModel):
    model_id: str
    target_device: str = "cpu_standard"
    quantization: str = "INT8"
    pruning_ratio: float = 0.3

class FedAsyncConfig(BaseModel):
    node_id: str
    staleness_tolerance: int = 5

@router.post("/compress")
async def start_model_compression(req: CompressionRequest):
    """
    Submits a large global model to be compressed for edge deployment.
    """
    job_id = edge_optimizer.compress_model(
        model_id=req.model_id,
        target_device=req.target_device,
        quantization_level=req.quantization,
        pruning_ratio=req.pruning_ratio
    )
    return {"message": "Compression job started", "job_id": job_id}

@router.get("/compress/{job_id}")
async def get_compression_status(job_id: str):
    """
    Retrieves the progress of an ongoing edge compression job.
    """
    status = edge_optimizer.get_optimization_status(job_id)
    if "error" in status:
        raise HTTPException(status_code=404, detail=status["error"])
    return status

@router.post("/fedasync/configure")
async def configure_async_node(req: FedAsyncConfig):
    """
    Allows an edge node to register as an asynchronous participant.
    """
    result = edge_optimizer.configure_fedasync(req.node_id, req.staleness_tolerance)
    return result
