import csv
import random
import os

def generate_sample_data(filename="sample_genetic_data.csv", num_samples=1000):
    # Use real gene symbols commonly associated with oncology/disease prediction
    # These represent normalized gene expression levels (TPM or RPKM)
    genomic_markers = [
        "BRCA1_exp", "TP53_exp", "EGFR_exp", "PTEN_exp", 
        "MYC_exp", "KRAS_exp", "PIK3CA_exp", "RB1_exp", 
        "CDKN2A_exp", "ATM_exp"
    ]
    
    headers = ["patient_id"] + genomic_markers + ["disease_phenotype"]
    
    filepath = os.path.join(os.path.dirname(__file__), filename)
    
    with open(filepath, mode='w', newline='') as file:
        writer = csv.writer(file)
        writer.writerow(headers)
        
        for i in range(num_samples):
            patient_id = f"PT-{str(i+1000).zfill(5)}"
            
            # Generate realistic-looking normalized gene expression values (0.0 to 10.0 scale)
            features = [round(random.uniform(0.1, 9.9), 3) for _ in range(10)]
            
            # Synthetic correlation: If BRCA1 (index 0) is low and TP53 (index 1) is mutated/dysregulated (high),
            # the probability of the disease phenotype increases.
            brca1 = features[0]
            tp53 = features[1]
            
            if brca1 < 3.0 and tp53 > 7.0:
                phenotype = 1 if random.random() > 0.15 else 0
            else:
                phenotype = 1 if random.random() > 0.85 else 0
                
            row = [patient_id] + features + [phenotype]
            writer.writerow(row)
            
    print("Dataset generated successfully.")

if __name__ == "__main__":
    generate_sample_data()
