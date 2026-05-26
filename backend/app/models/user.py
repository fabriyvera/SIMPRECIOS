"""
Modelos de Usuario y Autenticación
"""
from pydantic import BaseModel


class UserProfileResponse(BaseModel):
    """Respuesta con perfil del usuario autenticado"""
    id: str
    nombre_completo: str
    rol: str  # 'Vendedora' | 'Comprador'
    es_verificado: bool

    class Config:
        from_attributes = True


class ErrorResponse(BaseModel):
    """Respuesta de error"""
    error: str
    message: str
