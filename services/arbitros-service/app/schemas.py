from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class ArbitroBase(BaseModel):
    nombre: str
    documento: Optional[str] = None
    telefono: Optional[str] = None
    categoria_principal: Optional[str] = "General"
    is_active: Optional[bool] = True

class ArbitroCreate(ArbitroBase):
    pass

class ArbitroUpdate(BaseModel):
    nombre: Optional[str] = None
    documento: Optional[str] = None
    telefono: Optional[str] = None
    categoria_principal: Optional[str] = None
    is_active: Optional[bool] = None

class ArbitroResponse(ArbitroBase):
    id: int
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True
