from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List
from app import models, schemas, database

app = FastAPI(title="COARC Arbitros Service", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

INITIAL_REFEREES = [
    "ALBEIRO SUAREZ", "ALEJANDRO SIERRA", "ALEX CELESTINO", "ALJAIDYS JULIO",
    "DANIEL ALVAREZ", "DANIEL CARDENAS", "ELIANA ACOSTA", "FABIO HERAZO",
    "JAIRO GOMEZ", "JAIRO PEREZ", "JEISON CELESTINO", "JULIAN GOMEZ - BACKUP",
    "LUIS GOMEZ", "MARIA F. VELASQUEZ", "SANTIAGO PEÑA", "ARNULFO PEREZ",
    "EMANUEL VERGARA", "SAMIR ARRIETA", "KEINER MARTRINEZ", "LANDER MARTINEZ",
    "CRISTIAN BERRIO", "JHOSMANI SUAREZ", "JUAN SIMANCA", "SANTIAGO CASTELLANOS",
    "SEBASTIAN GUZMAN", "NORELIS ARGUMEDO", "MANUEL LOPEZ", "LUIS RUIZ",
    "YULIANA JIMENEZ", "PEDRO GONZALEZ", "ALFREDO GARCIA", "LUISA PARRA", "HARLEY VALVERDE"
]

@app.on_event("startup")
def seed_arbitros():
    db = database.SessionLocal()
    try:
        existing_count = db.query(models.Arbitro).count()
        if existing_count == 0:
            for name in INITIAL_REFEREES:
                ref = models.Arbitro(nombre=name, is_active=True, categoria_principal="COARC Oficial")
                db.add(ref)
            db.commit()
    finally:
        db.close()

@app.get("/api/v1/arbitros/health")
def health_check():
    return {"status": "ok", "service": "Arbitros Service COARC"}

@app.get("/api/v1/arbitros/", response_model=List[schemas.ArbitroResponse])
def get_arbitros(db: Session = Depends(database.get_db)):
    return db.query(models.Arbitro).order_by(models.Arbitro.nombre.asc()).all()

@app.post("/api/v1/arbitros/", response_model=schemas.ArbitroResponse, status_code=status.HTTP_201_CREATED)
def create_arbitro(arbitro_in: schemas.ArbitroCreate, db: Session = Depends(database.get_db)):
    existing = db.query(models.Arbitro).filter(models.Arbitro.nombre == arbitro_in.nombre.upper()).first()
    if existing:
        raise HTTPException(status_code=400, detail="Ya existe un árbitro registrado con este nombre.")
    
    new_arbitro = models.Arbitro(
        nombre=arbitro_in.nombre.upper(),
        documento=arbitro_in.documento,
        telefono=arbitro_in.telefono,
        categoria_principal=arbitro_in.categoria_principal or "General",
        is_active=arbitro_in.is_active
    )
    db.add(new_arbitro)
    db.commit()
    db.refresh(new_arbitro)
    return new_arbitro

@app.post("/api/v1/arbitros/register", response_model=schemas.ArbitroResponse)
def register_arbitro(arbitro_in: schemas.ArbitroCreate, db: Session = Depends(database.get_db)):
    """Upsert: crea el árbitro si no existe, o devuelve el existente sin error.
    Útil para auto-registrar árbitros al momento de programar designaciones."""
    nombre_clean = arbitro_in.nombre.strip().upper()
    if not nombre_clean:
        raise HTTPException(status_code=422, detail="El nombre del árbitro no puede estar vacío.")
    
    existing = db.query(models.Arbitro).filter(models.Arbitro.nombre == nombre_clean).first()
    if existing:
        # Árbitro ya registrado: actualizar datos opcionales si se proveen
        if arbitro_in.documento is not None:
            existing.documento = arbitro_in.documento
        if arbitro_in.telefono is not None:
            existing.telefono = arbitro_in.telefono
        if arbitro_in.categoria_principal:
            existing.categoria_principal = arbitro_in.categoria_principal
        # Reactivar si estaba inactivo
        existing.is_active = True
        db.commit()
        db.refresh(existing)
        return existing
    
    new_arbitro = models.Arbitro(
        nombre=nombre_clean,
        documento=arbitro_in.documento,
        telefono=arbitro_in.telefono,
        categoria_principal=arbitro_in.categoria_principal or "General",
        is_active=True
    )
    db.add(new_arbitro)
    db.commit()
    db.refresh(new_arbitro)
    return new_arbitro

@app.put("/api/v1/arbitros/{arbitro_id}", response_model=schemas.ArbitroResponse)
def update_arbitro(arbitro_id: int, arbitro_in: schemas.ArbitroUpdate, db: Session = Depends(database.get_db)):
    db_arbitro = db.query(models.Arbitro).filter(models.Arbitro.id == arbitro_id).first()
    if not db_arbitro:
        raise HTTPException(status_code=404, detail="Árbitro no encontrado.")
    
    if arbitro_in.nombre:
        db_arbitro.nombre = arbitro_in.nombre.upper()
    if arbitro_in.documento is not None:
        db_arbitro.documento = arbitro_in.documento
    if arbitro_in.telefono is not None:
        db_arbitro.telefono = arbitro_in.telefono
    if arbitro_in.categoria_principal:
        db_arbitro.categoria_principal = arbitro_in.categoria_principal
    if arbitro_in.is_active is not None:
        db_arbitro.is_active = arbitro_in.is_active

    db.commit()
    db.refresh(db_arbitro)
    return db_arbitro

@app.delete("/api/v1/arbitros/{arbitro_id}")
def delete_arbitro(arbitro_id: int, db: Session = Depends(database.get_db)):
    db_arbitro = db.query(models.Arbitro).filter(models.Arbitro.id == arbitro_id).first()
    if not db_arbitro:
        raise HTTPException(status_code=404, detail="Árbitro no encontrado.")
    db.delete(db_arbitro)
    db.commit()
    return {"message": "Árbitro eliminado exitosamente."}
