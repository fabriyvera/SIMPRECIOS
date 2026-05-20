"""
Router — Sprint 4: Interacción con los Puestos
Base path: /interaccion

HU-14 │ POST   /interaccion/puestos/{puesto_id}/calificar
HU-15 │ POST   /interaccion/puestos/{puesto_id}/verificar-precio
HU-16 │ POST   /interaccion/puestos/{puesto_id}/denunciar
HU-17 │ POST   /interaccion/favoritos/{puesto_id}
HU-17 │ DELETE /interaccion/favoritos/{puesto_id}
HU-17 │ GET    /interaccion/favoritos
"""

from fastapi import APIRouter, Depends, Query
from supabase import Client
from app.database import get_db
from app.models.interaccion import (
    CalificarRequest, CalificarResponse,
    VerificarPrecioRequest, VerificarPrecioResponse,
    DenunciarRequest, DenunciarResponse,
    AgregarFavoritoRequest, AgregarFavoritoResponse,
    EliminarFavoritoResponse, ListaFavoritosResponse,
)
from app.services import interaccion_service as service

router = APIRouter(prefix="/interaccion", tags=["Interacción con los Puestos"])


# ─────────────────────────────────────────────
# HU-14 │ Calificar la atención
# ─────────────────────────────────────────────

@router.post(
    "/puestos/{puesto_id}/calificar",
    response_model=CalificarResponse,
    summary="HU-14 | Calificar la atención de un puesto",
    description="""
    Permite al usuario asignar una calificación de 1 a 5 estrellas a un puesto.
    - Un usuario solo puede calificar una vez por puesto.
    - Se recalcula automáticamente el promedio del puesto.
    """,
)
async def calificar_puesto(
    puesto_id: str,
    data: CalificarRequest,
    db: Client = Depends(get_db),
):
    return await service.calificar_puesto(puesto_id, data, db)


# ─────────────────────────────────────────────
# HU-15 │ Verificar transparencia
# ─────────────────────────────────────────────

@router.post(
    "/puestos/{puesto_id}/verificar-precio",
    response_model=VerificarPrecioResponse,
    summary="HU-15 | Verificar si el precio cobrado coincide con el publicado",
    description="""
    El usuario indica el precio que pagó y el sistema lo compara con el precio
    publicado en la plataforma.
    - Regla RN-02: genera alerta si el precio supera el 10% del precio de referencia.
    - Actualiza el indicador de transparencia del puesto.
    """,
)
async def verificar_transparencia(
    puesto_id: str,
    data: VerificarPrecioRequest,
    db: Client = Depends(get_db),
):
    return await service.verificar_transparencia(puesto_id, data, db)


# ─────────────────────────────────────────────
# HU-16 │ Denunciar sobreprecio
# ─────────────────────────────────────────────

@router.post(
    "/puestos/{puesto_id}/denunciar",
    response_model=DenunciarResponse,
    summary="HU-16 | Denunciar cobro excesivo en un puesto",
    description="""
    Registra una denuncia ciudadana de sobreprecio.
    - Regla RN-01: permite denuncia con foto como evidencia.
    - Regla RN-02: genera alerta automática si el exceso supera el 10%.
    - El estado de la denuncia queda registrado para revisión de la Intendencia.
    """,
)
async def denunciar_sobreprecio(
    puesto_id: str,
    data: DenunciarRequest,
    db: Client = Depends(get_db),
):
    return await service.denunciar_sobreprecio(puesto_id, data, db)


# ─────────────────────────────────────────────
# HU-17 │ Agendar favoritos — Agregar
# ─────────────────────────────────────────────

@router.post(
    "/favoritos/{puesto_id}",
    response_model=AgregarFavoritoResponse,
    summary="HU-17 | Agregar un puesto a favoritos",
    description="Guarda un puesto en la lista personal de favoritos del usuario.",
)
async def agregar_favorito(
    puesto_id: str,
    data: AgregarFavoritoRequest,
    db: Client = Depends(get_db),
):
    return await service.agregar_favorito(puesto_id, str(data.usuario_id), db)


# ─────────────────────────────────────────────
# HU-17 │ Agendar favoritos — Eliminar
# ─────────────────────────────────────────────

@router.delete(
    "/favoritos/{puesto_id}",
    response_model=EliminarFavoritoResponse,
    summary="HU-17 | Eliminar un puesto de favoritos",
    description="Elimina un puesto de la lista de favoritos del usuario.",
)
async def eliminar_favorito(
    puesto_id: str,
    usuario_id: str = Query(..., description="ID del usuario autenticado"),
    db: Client = Depends(get_db),
):
    return await service.eliminar_favorito(puesto_id, usuario_id, db)


# ─────────────────────────────────────────────
# HU-17 │ Agendar favoritos — Listar
# ─────────────────────────────────────────────

@router.get(
    "/favoritos",
    response_model=ListaFavoritosResponse,
    summary="HU-17 | Listar puestos favoritos del usuario",
    description="""
    Devuelve todos los puestos guardados como favoritos por el usuario,
    incluyendo su nombre, mercado y calificación promedio actual.
    """,
)
async def listar_favoritos(
    usuario_id: str = Query(..., description="ID del usuario autenticado"),
    db: Client = Depends(get_db),
):
    return await service.listar_favoritos(usuario_id, db)
