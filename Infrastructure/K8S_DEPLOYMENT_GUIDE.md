# FederiGene: Kubernetes Production Deployment Guide
## "Consulting Mode" Strategic Overview

This document provides the necessary guidance and operational steps to deploy FederiGene into a production-grade Kubernetes cluster.

### 1. Prerequisites
- A functional K8s cluster (EKS, GKE, AKS, or bare-metal).
- `kubectl` configured with cluster access.
- Helm v3 (optional, for ingress controller installation).
- Docker images for `federigene-backend` and `federigene-frontend` pushed to a private registry.

### 2. Configuration & Secrets Management
Before applying the manifests, you must create a Kubernetes Secret to store sensitive credentials.

```bash
# Create the production secrets
kubectl create secret generic federigene-secrets \
  --from-literal=db-root-password="REPLACE_WITH_SECURE_PASSWORD" \
  --from-literal=SECRET_KEY="REPLACE_WITH_FASTAPI_SECRET" \
  --from-literal=DB_USER="federi_user" \
  --from-literal=DB_PASSWORD="REPLACE_WITH_DB_PASSWORD"
```

### 3. Deployment Sequence
Apply the manifests in the following order to ensure dependencies (like the database) are ready.

```bash
# 1. Deploy the Database
kubectl apply -f Infrastructure/k8s/db-deployment.yaml

# 2. Deploy the Backend Services
kubectl apply -f Infrastructure/k8s/federigene-backend.yaml

# 3. Deploy the Frontend (Nginx-based)
kubectl apply -f Infrastructure/k8s/federigene-frontend.yaml

# 4. Configure External Access (Ingress)
kubectl apply -f Infrastructure/k8s/ingress.yaml
```

### 4. Networking & External Access
The provided `ingress.yaml` assumes you have an **Nginx Ingress Controller** installed. If you are using a Cloud Load Balancer (e.g., AWS ALB), you may need to adjust the annotations.

To install the Nginx Ingress Controller via Helm:
```bash
helm upgrade --install ingress-nginx ingress-nginx \
  --repo https://kubernetes.github.io/ingress-nginx \
  --namespace ingress-nginx --create-namespace
```

### 5. High Availability & Scaling
- **Horizontal Pod Autoscaling (HPA)**: You can enable HPA for the backend to handle spikes in genomic training requests.
  ```bash
  kubectl autoscale deployment federigene-backend --cpu-percent=70 --min=3 --max=10
  ```
- **Readiness Probes**: The manifests include health checks. Kubernetes will automatically remove unhealthy pods from the load balancer until they recover.

### 6. Monitoring & Logs
To view live logs from the backend orchestrator:
```bash
kubectl logs -f deployment/federigene-backend
```

---
**Consultation Note**: For large-scale hospital partnerships, it is recommended to use **GPU-enabled node groups** for nodes participating in heavy model training (if the simulation engine is replaced with real pytorch/tensorflow training).
