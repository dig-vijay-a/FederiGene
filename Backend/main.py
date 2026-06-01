import logging
import os
from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.responses import JSONResponse

# Load environment variables
load_dotenv()
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import firebase_admin
from firebase_admin import credentials
from models import auth_models, platform_models
from database.config import engine, get_db, Base

# Initialize Firebase Admin SDK
try:
    cred = credentials.Certificate("firebase-adminsdk.json")
    firebase_admin.initialize_app(cred)
    print("Firebase Admin SDK initialized successfully.")
except Exception as e:
    print(f"Warning: Failed to initialize Firebase Admin SDK: {e}")

# Create all tables on startup
auth_models.Base.metadata.create_all(bind=engine)
platform_models.Base.metadata.create_all(bind=engine)

from routes import auth_routes, user_routes, platform_routes, settings_routes, ws_routes, explainability_routes, zkp_routes, consent_routes, compliance_routes, marketplace_routes, observability_routes, license_routes, synthetic_routes, trust_routes, edge_routes, multimodal_routes, sovereignty_routes, agent_routes, quantum_routes, population_routes, web3_routes, singularity_routes, interplanetary_routes, synthesis_routes, neural_routes, immunity_routes, omega_routes, evo_routes, bios_routes, collective_routes, atomic_routes, guardian_routes, chat_routes, patient_routes

# Set up logging for EB
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="FederiGene Auth API")

# Serve uploaded avatars
import os
uploads_dir = os.path.join(os.path.dirname(__file__), "uploads")
os.makedirs(uploads_dir, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=uploads_dir), name="uploads")

@app.get("/")
def read_root():
    return {"status": "ok", "service": "FederiGene API"}

@app.get("/health")
def health_check():
    return {"status": "healthy"}

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Standard Security Questions (Normally seeded in DB)
DEFAULT_QUESTIONS = [
    "What is your mother's maiden name?",
    "What was the name of your first pet?",
    "What city were you born in?",
    "What is your favorite book?",
    "What high school did you attend?",
    "What was your childhood nickname?",
    "What is the name of the road you grew up on?"
]

def ensure_security_questions(db):
    if db.query(auth_models.SecurityQuestion).count() == 0:
        for q in DEFAULT_QUESTIONS:
            db.add(auth_models.SecurityQuestion(question_text=q))
        db.commit()

@app.on_event("startup")
def startup_event():
    # Create ALL database tables (auth + platform)
    logger.info("Initializing database...")
    try:
        from database.config import SQLALCHEMY_DATABASE_URL
        from sqlalchemy import create_engine, text
        
        # 1. Ensure the database 'federigene' actually exists in RDS!
        if 'mysql' in SQLALCHEMY_DATABASE_URL:
            # Connect to default 'mysql' database to issue the CREATE DATABASE command
            base_url = SQLALCHEMY_DATABASE_URL.rsplit('/', 1)[0] + '/mysql'
            temp_engine = create_engine(base_url)
            with temp_engine.connect() as conn:
                conn.execute(text("CREATE DATABASE IF NOT EXISTS federigene"))
                conn.commit()
            logger.info("Verified/Created 'federigene' database in RDS.")

        # 2. Proceed to create tables in 'federigene'
        auth_models.Base.metadata.create_all(bind=engine)
        platform_models.OrgSettings.__table__.create(bind=engine, checkfirst=True)
        platform_models.DatasetPolicy.__table__.create(bind=engine, checkfirst=True)
        platform_models.CryptoKey.__table__.create(bind=engine, checkfirst=True)
        platform_models.ConsentLedger.__table__.create(bind=engine, checkfirst=True)
        platform_models.ModelEvaluation.__table__.create(bind=engine, checkfirst=True)
        platform_models.SalesLead.__table__.create(bind=engine, checkfirst=True)
        platform_models.PatientPassportNFT.__table__.create(bind=engine, checkfirst=True)
        
        db = next(get_db())
        ensure_security_questions(db)
        logger.info("Database initialized successfully.")
    except Exception as e:
        logger.error(f"DATABASE INITIALIZATION ERROR: {e}")

# Include all routers
app.include_router(auth_routes.router, prefix="/api")
app.include_router(user_routes.router, prefix="/api")
app.include_router(platform_routes.router, prefix="/api")
app.include_router(settings_routes.router)
app.include_router(explainability_routes.router)
app.include_router(zkp_routes.router)
app.include_router(consent_routes.router)
app.include_router(ws_routes.router)  # WebSocket (no /api prefix — WS protocol)
app.include_router(compliance_routes.router)
app.include_router(marketplace_routes.router)
app.include_router(observability_routes.router)
app.include_router(license_routes.router)
app.include_router(synthetic_routes.router)
app.include_router(trust_routes.router)
app.include_router(edge_routes.router)
app.include_router(multimodal_routes.router)
app.include_router(marketplace_routes.router)
app.include_router(sovereignty_routes.router)
app.include_router(agent_routes.router)
app.include_router(quantum_routes.router)
app.include_router(population_routes.router)
app.include_router(web3_routes.router)
app.include_router(singularity_routes.router)
app.include_router(interplanetary_routes.router)
app.include_router(synthesis_routes.router)
app.include_router(neural_routes.router)
app.include_router(immunity_routes.router)
app.include_router(omega_routes.router)
app.include_router(evo_routes.router)
app.include_router(bios_routes.router)
app.include_router(collective_routes.router)
app.include_router(atomic_routes.router)
app.include_router(guardian_routes.router)
app.include_router(chat_routes.router, prefix="/api")
app.include_router(patient_routes.router, prefix="/api")

# --- STATIC SPA SERVING ---
from fastapi.responses import FileResponse
import os
import sys

# PyInstaller compatibility for static files
if getattr(sys, 'frozen', False):
    # Running in a PyInstaller bundle
    base_dir = sys._MEIPASS
    frontend_dist = os.path.join(base_dir, "Frontend", "dist")
else:
    # Running in normal Python environment
    base_dir = os.path.dirname(os.path.dirname(__file__))
    frontend_dist = os.path.join(base_dir, "Frontend", "dist")
if os.path.exists(frontend_dist):
    # Mount assets folder
    assets_dir = os.path.join(frontend_dist, "assets")
    if os.path.exists(assets_dir):
        app.mount("/assets", StaticFiles(directory=assets_dir), name="assets")
        
    # Route for downloading the Setup Executable
    @app.get("/download-windows-app")
    async def download_app():
        # Specifically serve the 1.0.5 installer
        electron_dist = os.path.join(base_dir, "Electron", "dist")
        exe_path = os.path.join(electron_dist, "FederiGene Setup 1.0.5.exe")
        
        if os.path.exists(exe_path):
            return FileResponse(exe_path, media_type="application/octet-stream", filename="FederiGene Setup 1.0.5.exe")
                    
        return {"error": "Installer not found. Please compile the Electron app first."}
        
    # Catch-all for SPA routing (must be the very last route registered)
    # Critically: first check if the path is a real static file in dist
    # (e.g. logo.png, FluentEmoji.css, coin_3d.png etc. from the public folder)
    # Only serve index.html if the file doesn't exist — this prevents MIME type errors.
    @app.get("/{path_name:path}")
    async def catch_all(path_name: str):
        # For /api/* routes with no matching handler, return a clean JSON 404
        # (never serve index.html for API paths — it causes MIME type crashes)
        if path_name.startswith("api/") or path_name == "api":
            return JSONResponse(
                status_code=404,
                content={"error": f"API endpoint '/{path_name}' not found."}
            )
        # Try to serve as a real file first
        file_path = os.path.join(frontend_dist, path_name)
        if os.path.isfile(file_path):
            return FileResponse(file_path)
        # Fall back to index.html for React Router client-side routes
        index_path = os.path.join(frontend_dist, "index.html")
        if os.path.exists(index_path):
            return FileResponse(index_path)
        return {"error": "Frontend build not found."}
