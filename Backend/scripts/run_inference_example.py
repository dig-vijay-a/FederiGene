import sys
import torch
import torch.nn as nn
import csv
import os

# Ensure safe printing on Windows terminal
if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding='utf-8', errors='replace')
    except Exception:
        pass

# 1. Define the exact same architecture as the FederiGene Federated Model
# (In this example, our baseline model is a 10-feature linear classifier)
class DiseasePredictor(nn.Module):
    def __init__(self):
        super(DiseasePredictor, self).__init__()
        self.fc = nn.Linear(10, 2) # 10 genomic input features, 2 outputs (Healthy vs Disease)

    def forward(self, x):
        return self.fc(x)

def run_inference(weights_path=None):
    # 2. Instantiate the model
    model = DiseasePredictor()
    
    # Check if a custom weights path was provided or find one
    if not weights_path:
        if len(sys.argv) > 1:
            weights_path = sys.argv[1]
        else:
            # Check temp_weights directory
            temp_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'temp_weights')
            if os.path.exists(temp_dir):
                pts = [f for f in os.listdir(temp_dir) if f.endswith('.pt')]
                if pts:
                    weights_path = os.path.join(temp_dir, sorted(pts)[-1])

    if not weights_path or not os.path.exists(weights_path):
        weights_path = os.path.join(os.path.dirname(__file__), 'downloaded_model_weights.pth')
        # Generate baseline weights simulating the downloaded model
        torch.save(model.state_dict(), weights_path)
    
    # 3. Load the model weights
    print(f"[Model Loader] Loading model weights from: {weights_path}")
    state = torch.load(weights_path, map_location=torch.device("cpu"), weights_only=True)  # nosemgrep: pickles-in-pytorch # nosec CWE-502
    if "weight" in state and "fc.weight" not in state:
        state = {"fc.weight": state["weight"], "fc.bias": state["bias"]}
    model.load_state_dict(state)
    model.eval() # Set to evaluation mode

    # 4. Load a patient's genomic data from our local dataset
    dataset_path = os.path.join(os.path.dirname(__file__), 'sample_genetic_data.csv')
    if not os.path.exists(dataset_path):
        from generate_sample_dataset import generate_sample_data
        generate_sample_data(dataset_path)

    print("[Genomic Silo] Loading patient genetic profile...")
    with open(dataset_path, 'r') as file:
        reader = csv.reader(file)
        headers = next(reader)
        patient_row = next(reader) # Grab patient from the CSV
        
        patient_id = patient_row[0]
        # Extract the 10 gene expression floats
        genomic_features = [float(x) for x in patient_row[1:11]] 
        actual_phenotype = patient_row[11]
        
    print(f"   Patient ID: {patient_id}")
    print(f"   Biomarkers: {headers[1:11]}")
    print(f"   Gene Expression Profile: {genomic_features}")
    
    # 5. Convert the genetic data into a PyTorch Tensor
    input_tensor = torch.tensor(genomic_features, dtype=torch.float32).unsqueeze(0)
    
    # 6. Run the Prediction!
    print("\n[AI Inference] Running AI Inference with PyTorch...")
    with torch.no_grad():
        output = model(input_tensor)
        probabilities = torch.nn.functional.softmax(output[0], dim=0)
        healthy_prob = probabilities[0].item() * 100
        disease_prob = probabilities[1].item() * 100
        predicted_class = torch.argmax(output, dim=1).item()

    print("========================================")
    print(f"[PREDICTION RESULTS] Patient: {patient_id}")
    print(f"   Healthy Probability:      {healthy_prob:.2f}%")
    print(f"   Disease Risk Probability: {disease_prob:.2f}%")
    print("========================================")
    
    if predicted_class == 1:
        print(">>> [HIGH RISK ALERT] The AI detected genomic patterns indicative of the disease phenotype.")
    else:
        print(">>> [LOW RISK CONFIRMED] The AI did not detect high-risk genomic patterns.")
        
    print(f"(Actual phenotype in database: {actual_phenotype})")

if __name__ == "__main__":
    run_inference()

