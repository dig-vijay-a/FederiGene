from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import List
import os
import json
from dotenv import load_dotenv
load_dotenv(override=True)
from google import genai
from google.genai import types

from routes.user_routes import get_current_user
from models.auth_models import User

router = APIRouter(prefix="/chat", tags=["Intelligent Chat"])

class ChatMessage(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    messages: List[ChatMessage]
    context: str = None

# Initialize Gemini Client
# Attempt to initialize; it will throw an error later if used without an API key,
# but we shouldn't block app startup if the key is temporarily missing.
try:
    gemini_client = genai.Client(api_key=os.environ.get("GEMINI_API_KEY", ""))
except Exception as e:
    gemini_client = None
    print(f"Warning: Failed to initialize Gemini Client: {e}")

SYSTEM_PROMPT = """
You are the FederiGene Intelligent Support Agent, an expert AI assistant designed for the FederiGene "Omega" platform. 

You are a futuristic, highly professional, and deeply technical assistant for researchers, hospital administrators, and data scientists using this global federated genomic network.

### 1. YOUR CAPABILITIES
- **Page Awareness**: You have access to the user's current screen context. You can see the data, analysis results, and configuration settings the user is currently viewing. Use this to provide real-time help, analyze specific data points, and explain the current page's functionality.
- **Deep Technical Support**: Explain complex concepts like TEEs (Intel SGX), Homomorphic Encryption, Post-Quantum Cryptography, and Federated Learning (FedAvg).
- **Workflow Guidance**: Help users navigate through Population Health analysis, Multi-modal IQ distillation, and Evolutionary Genomic steering.

### 2. CORE ARCHITECTURE (The Omega Engine)
- **Model-to-Data Workflow**: Reverses traditional research logic. Instead of centralizing data, models travel to local nodes. Raw VCF/BAM files never leave the security of the institutional firewall.
- **Trusted Execution Environments (TEEs)**: Hardware-level isolation using Intel SGX and NVIDIA H100 Confidential Computing via memory enclaves.
- **Differential Privacy (DP)**: Mathematical noise injection into model gradients to prevent reverse-engineering of individual genomic signatures. ε (epsilon) budgets are configurable.
- **Blockchain Ledger**: Ethereum sidechain for immutable records of Data Usage Agreements (DUAs), model versions, and audit logs.

### 3. PLATFORM MODULES
- **Federated Analytics Suite**: The Singularity, Privacy Sandbox (Synthetic Twins), Evolutionary Steering.
- **Clinical Engine**: Autonomous Clinical Agents, Biogenetic Synthesis, Synthetic Biological OS (BIOS).
- **Security**: Quantum Shield (PQC), Atomic Privacy.
- **Organization**: Patient Data Sovereignty (Web3 NFTs), Federated Marketplace.

### 4. OPERATIONAL RULES
- Always refer to the provided "USER CURRENT PAGE CONTEXT" if available to give specific answers.
- If the user asks "what am I looking at?" or "help me with this result", analyze the context text provided.
- Be precise, futuristic, and highly technical. 
- Keep responses concise but information-dense.
"""

@router.post("/ask")
def ask_agent(req: ChatRequest, current_user: User = Depends(get_current_user)):
    """
    Intelligent Chat endpoint that uses Gemini to respond to user queries.
    Restricted to authenticated users.
    """
    if not gemini_client:
        raise HTTPException(status_code=500, detail="Chat agent is currently offline (API Key missing).")
        
    try:
        # Construct the conversation history for Gemini
        gemini_messages = []
        
        # Add context if provided
        context_instruction = ""
        if req.context:
            context_instruction = f"\n\nUSER CURRENT PAGE CONTEXT:\n{req.context}\n\nUse the above context to answer accurately if relevant."

        for msg in req.messages:
            role = "user" if msg.role == "user" else "model"
            content = msg.content
            
            # Inject context into the very first user message for initial grounding
            if role == "user" and len(gemini_messages) == 0:
                content = content + context_instruction
                
            gemini_messages.append(
                types.Content(role=role, parts=[types.Part.from_text(text=content)])
            )
            
        # Call Gemini model
        response = gemini_client.models.generate_content(
            model='gemini-2.0-flash',
            contents=gemini_messages,
            config=types.GenerateContentConfig(
                system_instruction=SYSTEM_PROMPT,
                temperature=0.7,
            ),
        )
        
        return {"response": response.text}
        
    except Exception as e:
        print(f"Chat Error: {e}")
        raise HTTPException(status_code=500, detail="The intelligent agent encountered an error processing your request.")


class ContactMessage(BaseModel):
    subject: str
    description: str

@router.post("/contact")
def submit_contact_form(contact: ContactMessage, current_user: User = Depends(get_current_user)):
    """
    Submits a contact form for the user to the FederiGene support email.
    """
    from utils.mail_utils import send_support_email
    
    success = send_support_email(
        user_email=current_user.email,
        user_name=current_user.username,
        subject=contact.subject,
        description=contact.description
    )
    
    if not success:
        raise HTTPException(status_code=500, detail="Failed to send support email. Please try again later.")
        
    return {"status": "success", "message": "Your message has been sent to our support team."}
