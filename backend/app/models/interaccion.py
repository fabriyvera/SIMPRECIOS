"""
Modelos Pydantic — Sprint 4: Interacción con los Puestos
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
# Tabla: calificaciones
# ─────────────────────────────────────────────

class CalificarRequest(BaseModel):
    usuario_id: UUID4
    estrellas: int = Field(..., ge=1, le=5, description="Calificación de 1 a 5 estrellas")
    comentario: Optional[str] = Field(None, max_length=500)

class CalificarResponse(BaseModel):
    mensaje: str
    rating_id: str
    nuevo_promedio: float
    total_calificaciones: int


# ─────────────────────────────────────────────
# HU-15 │ Verificar transparencia
# Tabla: stock_vendedora + precios_referenciales
# ─────────────────────────────────────────────

class VerificarPrecioRequest(BaseModel):
    usuario_id: UUID4
    producto_id: int
    precio_pagado: float = Field(..., gt=0, description="Precio que el usuario pagó en el puesto")
    es_correcto: bool = Field(..., description="¿El precio pagado coincide con el publicado?")

class VerificarPrecioResponse(BaseModel):
    mensaje: str
    precio_publicado: float
    precio_pagado: float
    diferencia_porcentaje: float
    indicador_transparencia: float   # promedio de verificaciones del puesto (0-100%)
    es_sobreprecio: bool             # True si excede el 10% del precio publicado


# ─────────────────────────────────────────────
# HU-16 │ Denunciar sobreprecio
# Tablas: denuncias_sobreprecio
# ─────────────────────────────────────────────

class DenunciarRequest(BaseModel):
    usuario_id: UUID4
    producto_id: int
    precio_cobrado: float = Field(..., gt=0, description="Precio que le cobraron")
    motivo: str = Field(..., min_length=5, max_length=200, description="Descripción del sobreprecio")
    url_evidencia: Optional[str] = Field(None, description="URL de foto como evidencia (opcional)")

class DenunciarResponse(BaseModel):
    mensaje: str
    denuncia_id: str
    diferencia_detectada: float      # diferencia en Bs. vs precio de referencia
    porcentaje_exceso: float         # % que supera el precio de referencia
    alerta_generada: bool            # True si supera el 10% (RN-02)


# ─────────────────────────────────────────────
# HU-17 │ Agendar favoritos
# Tabla: puestos_favoritos
# ─────────────────────────────────────────────

class FavoritoResponse(BaseModel):
    puesto_id: str
    nombre_puesto: str
    mercado: str
    rating_promedio: float
    es_favorito: bool

class AgregarFavoritoRequest(BaseModel):
    usuario_id: UUID4

class AgregarFavoritoResponse(BaseModel):
    mensaje: str
    favorito_id: str

class EliminarFavoritoResponse(BaseModel):
    mensaje: str

class ListaFavoritosResponse(BaseModel):
    total: int
    favoritos: list[FavoritoResponse]
