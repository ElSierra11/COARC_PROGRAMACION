from sqlalchemy import Column, Integer, String, Boolean, DateTime
from sqlalchemy.sql import func
from app.database import Base

class Arbitro(Base):
    __tablename__ = "arbitros"

    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String(100), unique=True, index=True, nullable=False)
    documento = Column(String(30), nullable=True)
    telefono = Column(String(30), nullable=True)
    categoria_principal = Column(String(50), default="General", nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
