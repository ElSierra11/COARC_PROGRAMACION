import os
import sys

# Agregar las rutas de los microservicios al PATH de Python
base_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(base_dir, "services", "auth-service"))
sys.path.insert(0, os.path.join(base_dir, "services", "arbitros-service"))
sys.path.insert(0, os.path.join(base_dir, "services", "designaciones-service"))

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Importar las 3 aplicaciones FastAPI de los servicios
from app import main as auth_module
from app import main as arbitros_module
from app import main as designaciones_module

app = FastAPI(
    title="COARC Backend API Oficial",
    description="API Unificada para Gestión de Designaciones Arbitrales - Corporación Arbitral de Córdoba",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Montar las aplicaciones bajo sus respectivas rutas o incluir sus endpoints
app.mount("/api/v1/auth", auth_module.app)
app.mount("/api/v1/arbitros", arbitros_module.app)
app.mount("/api/v1/designaciones", designaciones_module.app)

@app.get("/")
def root():
    return {
        "status": "online",
        "system": "COARC - Corporación Arbitral de Córdoba",
        "documentation": "/docs"
    }

@app.get("/health")
def health_check():
    return {"status": "ok", "service": "COARC Unified Backend"}
