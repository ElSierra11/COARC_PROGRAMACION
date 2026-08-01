from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text
from sqlalchemy.sql import func
from app.database import Base

class Designacion(Base):
    __tablename__ = "designaciones"

    id = Column(Integer, primary_key=True, index=True)
    item = Column(Integer, nullable=True)
    fecha = Column(String(100), nullable=False) # ej: SABADO 01 AGOSTO
    fecha_iso = Column(String(20), index=True, nullable=False) # ej: 2026-08-01
    hora = Column(String(30), nullable=False) # ej: 8:00 a. m.
    cancha = Column(String(100), index=True, nullable=False) # ej: VALLEGRANDE
    torneo = Column(String(100), index=True, nullable=False) # ej: VALORES
    municipio = Column(String(50), index=True, default="MONTERÍA", nullable=False) # ej: MONTERÍA, CERETÉ
    partido = Column(String(255), nullable=True) # ej: LEICY SANTOS VS AREA CHICA
    categoria = Column(String(50), nullable=False) # ej: 2018
    
    es_cuadra = Column(Boolean, default=False) # True si incluye terna de 4 árbitros
    arbitro_principal = Column(String(100), index=True, nullable=False)
    asistente_1 = Column(String(100), nullable=True)
    asistente_2 = Column(String(100), nullable=True)
    emergente = Column(String(100), nullable=True)
    
    estado = Column(String(30), default="PROGRAMADO", nullable=False) # PROGRAMADO, CONFIRMADO, EN_JUEGO, FINALIZADO
    notas = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
