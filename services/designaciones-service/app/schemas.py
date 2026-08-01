from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class DesignacionBase(BaseModel):
    item: Optional[int] = None
    fecha: str
    fecha_iso: str
    hora: str
    cancha: str
    torneo: str
    municipio: Optional[str] = "MONTERÍA"
    partido: Optional[str] = None
    categoria: str
    es_cuadra: Optional[bool] = False
    arbitro_principal: str
    asistente_1: Optional[str] = None
    asistente_2: Optional[str] = None
    emergente: Optional[str] = None
    estado: Optional[str] = "PROGRAMADO"
    notas: Optional[str] = None

class DesignacionCreate(DesignacionBase):
    pass

class DesignacionUpdate(BaseModel):
    item: Optional[int] = None
    fecha: Optional[str] = None
    fecha_iso: Optional[str] = None
    hora: Optional[str] = None
    cancha: Optional[str] = None
    torneo: Optional[str] = None
    municipio: Optional[str] = None
    partido: Optional[str] = None
    categoria: Optional[str] = None
    es_cuadra: Optional[bool] = None
    arbitro_principal: Optional[str] = None
    asistente_1: Optional[str] = None
    asistente_2: Optional[str] = None
    emergente: Optional[str] = None
    estado: Optional[str] = None
    notas: Optional[str] = None

class DesignacionResponse(DesignacionBase):
    id: int
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class ArbitroStatsResponse(BaseModel):
    nombre: str
    total_partidos: int
    como_principal: int
    como_asistente_1: int
    como_asistente_2: int
    como_emergente: int
    detalles_partidos: List[dict]
