"""
Modelos Pydantic — Sprint 4: Interacción con los Puestos (con RLS)
HU-14: Calificar la atención
HU-15: Verificar transparencia
HU-16: Denunciar sobreprecio
HU-17: Agendar favoritos
"""

from pydantic import BaseModel, Field, UUID4
from typing import Optional
from datetime import datetime


# ─────────────────────────────────────────────
# HU-14 │ Calificar la atención
# ─────────────────────────────────────────────

class CalificarRequest(BaseModel):
    usuario_id: Optional[UUID4] = Field(None, description="Opcional: se obtiene del token")
    estrellas: int = Field(..., ge=1, le=5, description="Calificación de 1 a 5 estrellas")
    comentario: Optional[str] = Field(None, max_length=500)

class CalificarResponse(BaseModel):
    mensaje: str
    rating_id: str
    nuevo_promedio: float
    total_calificaciones: int


# ─────────────────────────────────────────────
# HU-15 │ Verificar transparencia
# ─────────────────────────────────────────────

class VerificarPrecioRequest(BaseModel):
    usuario_id: Optional[UUID4] = None
    producto_id: int
    precio_pagado: float = Field(..., gt=0, description="Precio que el usuario pagó en el puesto")
    es_correcto: bool = Field(..., description="¿El precio pagado coincide con el publicado?")

class VerificarPrecioResponse(BaseModel):
    mensaje: str
    precio_publicado: float
    precio_pagado: float
    diferencia_porcentaje: float
    indicador_transparencia: float
    es_sobreprecio: bool


# ─────────────────────────────────────────────
# HU-16 │ Denunciar sobreprecio
# ─────────────────────────────────────────────

class DenunciarRequest(BaseModel):
    usuario_id: Optional[UUID4] = None
    producto_id: int
    precio_cobrado: float = Field(..., gt=0)
    motivo: str = Field(..., min_length=5, max_length=200)
    url_evidencia: Optional[str] = None

class DenunciarResponse(BaseModel):
    mensaje: str
    denuncia_id: str
    diferencia_detectada: float
    porcentaje_exceso: float
    alerta_generada: bool


# ─────────────────────────────────────────────
# HU-17 │ Agendar favoritos
# ─────────────────────────────────────────────

class FavoritoResponse(BaseModel):
    puesto_id: str
    nombre_puesto: str
    mercado: str
    rating_promedio: float
    es_favorito: bool

class AgregarFavoritoRequest(BaseModel):
    usuario_id: Optional[UUID4] = None

class AgregarFavoritoResponse(BaseModel):
    mensaje: str
    favorito_id: str

class EliminarFavoritoResponse(BaseModel):
    mensaje: str

class ListaFavoritosResponse(BaseModel):
    total: int
    favoritos: list[FavoritoResponse]


# ─────────────────────────────────────────────
# Calificaciones del usuario
# ─────────────────────────────────────────────

class CalificacionUsuarioResponse(BaseModel):
    puesto_id: int
    nombre_puesto: str
    estrellas: int
    comentario: Optional[str]
    fecha_registro: datetime

class ListaCalificacionesResponse(BaseModel):
    total: int
    calificaciones: list[CalificacionUsuarioResponse]


# ─────────────────────────────────────────────
# Interacciones (vista unificada)
# ─────────────────────────────────────────────

class InteraccionResponse(BaseModel):
    tipo: str
    interaccion_id: int
    puesto_id: int
    usuario_id: Optional[str]
    puntuacion: Optional[int]
    texto: Optional[str]
    fecha: datetime
    precio_detectado: Optional[float]
    estado: Optional[str]

class ListaInteraccionesResponse(BaseModel):
    total: int
    interacciones: list[InteraccionResponse]


# ─────────────────────────────────────────────
# Interacciones Unificadas (Nueva versión mejorada)
# ─────────────────────────────────────────────

class ListaInteraccionesPuestoResponse(BaseModel):
    """Respuesta con todas las interacciones de un puesto + estadísticas"""
    puesto_id: int
    total_calificaciones: int
    promedio_estrellas: float
    total_denuncias: int
    denuncias_pendientes: int
    interacciones: list[InteraccionResponse]