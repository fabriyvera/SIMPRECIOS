"""
Pydantic Models for Stalls (Puestos de Venta)
"""

from pydantic import BaseModel, Field
from typing import Optional


class Market(BaseModel):
    """Represents the basic information of a market."""
    nombre: str
    lat: float
    lng: float

    class Config:
        orm_mode = True


class Stall(BaseModel):
    """Represents a single stall with its associated market."""
    id: int
    nombre: str = Field(..., alias="nombre_puesto")
    rating_promedio: Optional[float] = Field(None, alias="calificacion_promedio")
    mercado: Market

    class Config:
        orm_mode = True
        allow_population_by_field_name = True

class StallWithDistance(Stall):
    """Extends the Stall model to include the distance from the user."""
    distancia_km: Optional[float] = None