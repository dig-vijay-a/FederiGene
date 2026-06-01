import json
import uuid
from datetime import datetime

class FHIRAdapter:
    """
    Adapter for HL7 FHIR (Fast Healthcare Interoperability Resources).
    Maps clinical EHR data to FederiGene standardized genomic dataset formats.
    """
    
    @staticmethod
    def map_patient_resource(proto_patient_json: str):
        """
        Maps a FHIR Patient resource to an internal anonymized profile.
        """
        try:
            data = json.loads(proto_patient_json)
            # In a real implementation, we would extract FHIR-specific fields
            # resourceType: "Patient", identifier, gender, birthDate, etc.
            
            anonymized_id = hashlib.sha256(data.get('id', str(uuid.uuid4())).encode()).hexdigest()[:12]
            
            return {
                "subject_id": anonymized_id,
                "anonymization_timestamp": datetime.utcnow().isoformat(),
                "fhir_version": "R4",
                "extracted_fields": ["gender", "birthDate", "address_postalCode"]
            }
        except Exception as e:
            return {"error": f"FHIR Mapping Failed: {str(e)}"}

    @staticmethod
    def extract_genomic_observations(bundle_json: str):
        """
        Extracts genomic data from a FHIR Observation Bundle.
        Specifically looks for loinc codes related to genetic variants.
        """
        try:
            bundle = json.loads(bundle_json)
            entries = bundle.get('entry', [])
            extracted_variants = []
            
            for entry in entries:
                resource = entry.get('resource', {})
                if resource.get('resourceType') == 'Observation':
                    # Look for LOINC code 69548-6 (Genetic variant assessment)
                    coding = resource.get('code', {}).get('coding', [])
                    for code in coding:
                        if code.get('code') == '69548-6':
                            extracted_variants.append({
                                "variant_id": resource.get('id'),
                                "value": resource.get('valueCodeableConcept', {}).get('text', 'Unknown'),
                                "timestamp": resource.get('effectiveDateTime')
                            })
            
            return {
                "count": len(extracted_variants),
                "variants": extracted_variants,
                "status": "Ready for Federated Learning"
            }
        except Exception as e:
            return {"error": f"FHIR Extraction Failed: {str(e)}"}

    @staticmethod
    def generate_mock_fhir_bundle():
        """
        Generates a sample FHIR Bundle for testing purposes.
        """
        return json.dumps({
            "resourceType": "Bundle",
            "type": "collection",
            "entry": [
                {
                    "resource": {
                        "resourceType": "Observation",
                        "id": "obs-gen-101",
                        "status": "final",
                        "code": {
                            "coding": [{"system": "http://loinc.org", "code": "69548-6", "display": "Genetic variant assessment"}]
                        },
                        "valueCodeableConcept": {"text": "BRCA1 Mutation Positive"}
                    }
                },
                {
                    "resource": {
                        "resourceType": "Patient",
                        "id": "pat-001",
                        "gender": "female",
                        "birthDate": "1985-05-12"
                    }
                }
            ]
        })

# Global Instance
fhir_connector = FHIRAdapter()
