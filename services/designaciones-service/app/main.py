from fastapi import FastAPI, Depends, HTTPException, status, Query
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import text
from typing import List, Optional
from app import models, schemas, database

app = FastAPI(title="COARC Designaciones Service", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

INITIAL_DESIGNACIONES = [
    # SABADO 01 AGOSTO 2026
    {"item": 1, "fecha": "SABADO 01 AGOSTO", "fecha_iso": "2026-08-01", "hora": "8:00 a. m.", "cancha": "VALLEGRANDE", "torneo": "TORNEO VALORES", "partido": "FECHA 1", "categoria": "2018", "arbitro_principal": "ALBEIRO SUAREZ", "es_cuadra": False, "municipio": "MONTERÍA"},
    {"item": 2, "fecha": "SABADO 01 AGOSTO", "fecha_iso": "2026-08-01", "hora": "9:00 a. m.", "cancha": "VALLEGRANDE", "torneo": "TORNEO VALORES", "partido": "FECHA 1", "categoria": "2016", "arbitro_principal": "ALBEIRO SUAREZ", "es_cuadra": False, "municipio": "MONTERÍA"},
    {"item": 3, "fecha": "SABADO 01 AGOSTO", "fecha_iso": "2026-08-01", "hora": "10:00 a. m.", "cancha": "VALLEGRANDE", "torneo": "TORNEO VALORES", "partido": "FECHA 1", "categoria": "2012", "arbitro_principal": "ALBEIRO SUAREZ", "es_cuadra": False, "municipio": "MONTERÍA"},
    {"item": 4, "fecha": "SABADO 01 AGOSTO", "fecha_iso": "2026-08-01", "hora": "11:00 a. m.", "cancha": "VALLEGRANDE", "torneo": "TORNEO VALORES", "partido": "FECHA 1", "categoria": "2011", "arbitro_principal": "ALBEIRO SUAREZ", "es_cuadra": False, "municipio": "MONTERÍA"},
    {"item": 5, "fecha": "SABADO 01 AGOSTO", "fecha_iso": "2026-08-01", "hora": "7:00 a. m.", "cancha": "AREA CHICA F6 #2", "torneo": "TORNEO VALORES", "partido": "FECHA 1", "categoria": "2018", "arbitro_principal": "ALEJANDRO SIERRA", "es_cuadra": False, "municipio": "MONTERÍA"},
    {"item": 7, "fecha": "SABADO 01 AGOSTO", "fecha_iso": "2026-08-01", "hora": "8:10 a. m.", "cancha": "AREA CHICA F6 #2", "torneo": "TORNEO VALORES", "partido": "FECHA 1", "categoria": "2019", "arbitro_principal": "ALEJANDRO SIERRA", "es_cuadra": False, "municipio": "MONTERÍA"},
    {"item": 8, "fecha": "SABADO 01 AGOSTO", "fecha_iso": "2026-08-01", "hora": "7:00 a. m.", "cancha": "AREA CHICA F6 #1", "torneo": "TORNEO VALORES", "partido": "FECHA 1", "categoria": "2019", "arbitro_principal": "ALEX CELESTINO", "es_cuadra": False, "municipio": "MONTERÍA"},
    {"item": 9, "fecha": "SABADO 01 AGOSTO", "fecha_iso": "2026-08-01", "hora": "8:10 a. m.", "cancha": "AREA CHICA F6 #1", "torneo": "TORNEO VALORES", "partido": "FECHA 1", "categoria": "2018", "arbitro_principal": "ALEX CELESTINO", "es_cuadra": False, "municipio": "MONTERÍA"},
    {"item": 10, "fecha": "SABADO 01 AGOSTO", "fecha_iso": "2026-08-01", "hora": "9:10 a. m.", "cancha": "AREA CHICA F6 #1", "torneo": "TORNEO VALORES", "partido": "FECHA 1", "categoria": "2018", "arbitro_principal": "ALEX CELESTINO", "es_cuadra": False, "municipio": "MONTERÍA"},
    {"item": 14, "fecha": "SABADO 01 AGOSTO", "fecha_iso": "2026-08-01", "hora": "7:00 a. m.", "cancha": "AREA CHICA F9", "torneo": "TORNEO VALORES", "partido": "FECHA 1", "categoria": "2016", "arbitro_principal": "ALJAIDYS JULIO", "es_cuadra": False, "municipio": "MONTERÍA"},
    {"item": 15, "fecha": "SABADO 01 AGOSTO", "fecha_iso": "2026-08-01", "hora": "8:10 a. m.", "cancha": "AREA CHICA F9", "torneo": "TORNEO VALORES", "partido": "FECHA 1", "categoria": "2016", "arbitro_principal": "ALJAIDYS JULIO", "es_cuadra": False, "municipio": "MONTERÍA"},
    {"item": 16, "fecha": "SABADO 01 AGOSTO", "fecha_iso": "2026-08-01", "hora": "10:30 a. m.", "cancha": "AREA CHICA F9", "torneo": "TORNEO VALORES", "partido": "FECHA 1", "categoria": "2016", "arbitro_principal": "ALJAIDYS JULIO", "es_cuadra": False, "municipio": "MONTERÍA"},
    {"item": 17, "fecha": "SABADO 01 AGOSTO", "fecha_iso": "2026-08-01", "hora": "11:30 a. m.", "cancha": "AREA CHICA F9", "torneo": "TORNEO VALORES", "partido": "FECHA 1", "categoria": "2014", "arbitro_principal": "ALJAIDYS JULIO", "es_cuadra": False, "municipio": "MONTERÍA"},

    # SABADO 25 DE JULIO 2026 - TERNAS ARBITRALES (CUADRA)
    {
        "item": 101, "fecha": "SABADO 25 JULIO", "fecha_iso": "2026-07-25", "hora": "7:30 a. m.",
        "cancha": "ILUSION NORANJA", "torneo": "BABY FUTBOL", "partido": "LEICY SANTOS VS AREA CHICA",
        "categoria": "SEMIFINAL", "es_cuadra": True, "municipio": "CERETÉ",
        "arbitro_principal": "JAIRO GOMEZ", "asistente_1": "ARNULFO PEREZ", "asistente_2": "EMANUEL VERGARA", "emergente": "SAMIR ARRIETA"
    },
    {
        "item": 102, "fecha": "SABADO 25 JULIO", "fecha_iso": "2026-07-25", "hora": "9:00 a. m.",
        "cancha": "ILUSION NORANJA", "torneo": "BABY FUTBOL", "partido": "REY PELE VS SAMARIA",
        "categoria": "SEMIFINAL", "es_cuadra": True, "municipio": "CERETÉ",
        "arbitro_principal": "SAMIR ARRIETA", "asistente_1": "EMANUEL VERGARA", "asistente_2": "ARNULFO PEREZ", "emergente": "JAIRO GOMEZ"
    },
    {
        "item": 103, "fecha": "SABADO 25 JULIO", "fecha_iso": "2026-07-25", "hora": "1:30 p. m.",
        "cancha": "ILUSION NORANJA", "torneo": "BABY FUTBOL", "partido": "PERDEDOR 1 VS PERDEDOR 2",
        "categoria": "TERCER PUESTO", "es_cuadra": True, "municipio": "CERETÉ",
        "arbitro_principal": "KEINER MARTRINEZ", "asistente_1": "DANIEL ALVAREZ", "asistente_2": "LANDER MARTINEZ", "emergente": "CRISTIAN BERRIO"
    },
    {
        "item": 104, "fecha": "SABADO 25 JULIO", "fecha_iso": "2026-07-25", "hora": "3:00 p. m.",
        "cancha": "ILUSION NORANJA", "torneo": "BABY FUTBOL", "partido": "GANADOR 1 VS GANADOR 2",
        "categoria": "FINAL", "es_cuadra": True, "municipio": "CERETÉ",
        "arbitro_principal": "CRISTIAN BERRIO", "asistente_1": "LANDER MARTINEZ", "asistente_2": "DANIEL ALVAREZ", "emergente": "KEINER MARTRINEZ"
    }
]

@app.on_event("startup")
def seed_designaciones():
    models.Base.metadata.create_all(bind=database.engine)
    
    # Executing auto-migration directly on connection before ORM query
    with database.engine.connect() as conn:
        try:
            conn.execute(text("ALTER TABLE designaciones ADD COLUMN IF NOT EXISTS municipio VARCHAR(50) DEFAULT 'MONTERÍA';"))
            conn.execute(text("ALTER TABLE designaciones ADD COLUMN IF NOT EXISTS estado VARCHAR(30) DEFAULT 'PROGRAMADO';"))
            conn.commit()
        except Exception as ex:
            print("Auto-migración municipio/estado:", ex)

    db = database.SessionLocal()
    try:
        count = db.query(models.Designacion).count()
        if count == 0:
            for d in INITIAL_DESIGNACIONES:
                des = models.Designacion(**d)
                db.add(des)
            db.commit()
    finally:
        db.close()

@app.get("/api/v1/designaciones/health")
def health_check():
    return {"status": "ok", "service": "Designaciones Service COARC"}

@app.get("/api/v1/designaciones/", response_model=List[schemas.DesignacionResponse])
def list_designaciones(
    fecha_iso: Optional[str] = Query(None),
    cancha: Optional[str] = Query(None),
    torneo: Optional[str] = Query(None),
    arbitro: Optional[str] = Query(None),
    db: Session = Depends(database.get_db)
):
    query = db.query(models.Designacion)
    if fecha_iso:
        query = query.filter(models.Designacion.fecha_iso == fecha_iso)
    if cancha:
        query = query.filter(models.Designacion.cancha.ilike(f"%{cancha}%"))
    if torneo:
        query = query.filter(models.Designacion.torneo.ilike(f"%{torneo}%"))
    if arbitro:
        arb_upper = arbitro.upper()
        query = query.filter(
            (models.Designacion.arbitro_principal.ilike(f"%{arb_upper}%")) |
            (models.Designacion.asistente_1.ilike(f"%{arb_upper}%")) |
            (models.Designacion.asistente_2.ilike(f"%{arb_upper}%")) |
            (models.Designacion.emergente.ilike(f"%{arb_upper}%"))
        )
    return query.order_by(models.Designacion.item.asc(), models.Designacion.hora.asc()).all()

@app.post("/api/v1/designaciones/", response_model=schemas.DesignacionResponse, status_code=status.HTTP_201_CREATED)
def create_designacion(designacion_in: schemas.DesignacionCreate, db: Session = Depends(database.get_db)):
    if not designacion_in.item:
        max_item = db.query(models.Designacion).filter(models.Designacion.fecha_iso == designacion_in.fecha_iso).count()
        designacion_in.item = max_item + 1
        
    new_des = models.Designacion(**designacion_in.dict())
    db.add(new_des)
    db.commit()
    db.refresh(new_des)
    return new_des

@app.put("/api/v1/designaciones/{designacion_id}", response_model=schemas.DesignacionResponse)
def update_designacion(designacion_id: int, designacion_in: schemas.DesignacionUpdate, db: Session = Depends(database.get_db)):
    db_des = db.query(models.Designacion).filter(models.Designacion.id == designacion_id).first()
    if not db_des:
        raise HTTPException(status_code=404, detail="Designación no encontrada.")
    
    update_data = designacion_in.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_des, key, value)
        
    db.commit()
    db.refresh(db_des)
    return db_des

@app.delete("/api/v1/designaciones/{designacion_id}")
def delete_designacion(designacion_id: int, db: Session = Depends(database.get_db)):
    db_des = db.query(models.Designacion).filter(models.Designacion.id == designacion_id).first()
    if not db_des:
        raise HTTPException(status_code=404, detail="Designación no encontrada.")
    db.delete(db_des)
    db.commit()
    return {"message": "Designación eliminada exitosamente."}

@app.get("/api/v1/designaciones/stats/arbitros", response_model=List[schemas.ArbitroStatsResponse])
def get_arbitros_stats(fecha_iso: Optional[str] = Query(None), db: Session = Depends(database.get_db)):
    query = db.query(models.Designacion)
    if fecha_iso:
        query = query.filter(models.Designacion.fecha_iso == fecha_iso)
    designaciones = query.all()

    stats_map = {}
    for d in designaciones:
        roles = [
            (d.arbitro_principal, "principal"),
            (d.asistente_1, "asistente_1"),
            (d.asistente_2, "asistente_2"),
            (d.emergente, "emergente")
        ]
        for name, role_key in roles:
            if not name:
                continue
            name_upper = name.strip().upper()
            if name_upper not in stats_map:
                stats_map[name_upper] = {
                    "nombre": name_upper,
                    "total_partidos": 0,
                    "como_principal": 0,
                    "como_asistente_1": 0,
                    "como_asistente_2": 0,
                    "como_emergente": 0,
                    "detalles_partidos": []
                }
            
            stats_map[name_upper]["total_partidos"] += 1
            stats_map[name_upper][f"como_{role_key}"] += 1
            stats_map[name_upper]["detalles_partidos"].append({
                "id": d.id,
                "hora": d.hora,
                "cancha": d.cancha,
                "torneo": d.torneo,
                "categoria": d.categoria,
                "partido": d.partido,
                "rol": role_key.replace("_", " ").title()
            })

    result = list(stats_map.values())
    result.sort(key=lambda x: x["total_partidos"], reverse=True)
    return result
