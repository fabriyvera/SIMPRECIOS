"""
Router — Sprint 4: Interacción con los Puestos (con RLS y autenticación JWT local)
Base path: /interaccion

HU-14 │ POST   /interaccion/puestos/{puesto_id}/calificar
HU-15 │ POST   /interaccion/puestos/{puesto_id}/verificar-precio
HU-16 │ POST   /interaccion/puestos/{puesto_id}/denunciar
HU-17 │ POST   /interaccion/favoritos/{puesto_id}
HU-17 │ DELETE /interaccion/favoritos/{puesto_id}
HU-17 │ GET    /interaccion/favoritos
"""

from fastapi import APIRouter, Depends
from supabase import Client
from app.database import get_db
from app.dependencies import get_current_user
from app.models.interaccion import (
    CalificarRequest, CalificarResponse,
    VerificarPrecioRequest, VerificarPrecioResponse,
    DenunciarRequest, DenunciarResponse,
    AgregarFavoritoResponse,
    EliminarFavoritoResponse, ListaFavoritosResponse,
    ListaCalificacionesResponse,
    ListaInteraccionesResponse,
)
from app.services import interaccion_service as service

router = APIRouter(prefix="/interaccion", tags=["Interacción con los Puestos"])


# ─────────────────────────────────────────────
# HU-14 │ Calificar la atención
# ─────────────────────────────────────────────
@router.post("/puestos/{puesto_id}/calificar", response_model=CalificarResponse)
async def calificar_puesto(
    puesto_id: str,
    data: CalificarRequest,
    supabase: Client = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    return await service.calificar_puesto(puesto_id, data, supabase, current_user["id"])


# ─────────────────────────────────────────────
# HU-15 │ Verificar transparencia
# ─────────────────────────────────────────────
@router.post("/puestos/{puesto_id}/verificar-precio", response_model=VerificarPrecioResponse)
async def verificar_transparencia(
    puesto_id: str,
    data: VerificarPrecioRequest,
    supabase: Client = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    return await service.verificar_transparencia(puesto_id, data, supabase, current_user["id"])


# ─────────────────────────────────────────────
# HU-16 │ Denunciar sobreprecio
# ─────────────────────────────────────────────
@router.post("/puestos/{puesto_id}/denunciar", response_model=DenunciarResponse)
async def denunciar_sobreprecio(
    puesto_id: str,
    data: DenunciarRequest,
    supabase: Client = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    return await service.denunciar_sobreprecio(puesto_id, data, supabase, current_user["id"])


# ─────────────────────────────────────────────
# HU-17 │ Agregar favorito
# ─────────────────────────────────────────────
@router.post("/favoritos/{puesto_id}", response_model=AgregarFavoritoResponse)
async def agregar_favorito(
    puesto_id: str,
    supabase: Client = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    return await service.agregar_favorito(puesto_id, supabase, current_user["id"])


# ─────────────────────────────────────────────
# HU-17 │ Eliminar favorito
# ─────────────────────────────────────────────
@router.delete("/favoritos/{puesto_id}", response_model=EliminarFavoritoResponse)
async def eliminar_favorito(
    puesto_id: str,
    supabase: Client = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    return await service.eliminar_favorito(puesto_id, supabase, current_user["id"])


# ─────────────────────────────────────────────
# HU-17 │ Listar favoritos
# ─────────────────────────────────────────────
@router.get("/favoritos", response_model=ListaFavoritosResponse)
async def listar_favoritos(
    supabase: Client = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    return await service.listar_favoritos(supabase, current_user["id"])


# ─────────────────────────────────────────────
# Obtener calificaciones del usuario autenticado
# ─────────────────────────────────────────────
@router.get("/calificaciones", response_model=ListaCalificacionesResponse)
async def obtener_calificaciones(
    supabase: Client = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    return await service.obtener_calificaciones_usuario(supabase, current_user["id"])


# ─────────────────────────────────────────────
# Interacciones de un puesto (comentarios)
# ─────────────────────────────────────────────
@router.get("/puestos/{puesto_id}/interacciones", response_model=ListaInteraccionesResponse)
async def obtener_interacciones_puesto(
    puesto_id: str,
    supabase: Client = Depends(get_db),
    # No se necesita usuario autenticado para ver comentarios,
    # pero igual usamos get_db (anon key) y no requerimos token
):
    return await service.obtener_interacciones_puesto(puesto_id, supabase)


# ─────────────────────────────────────────────
# Interacciones del usuario autenticado
# ─────────────────────────────────────────────
@router.get("/usuario/interacciones", response_model=ListaInteraccionesResponse)
async def obtener_mis_interacciones(
    supabase: Client = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    return await service.obtener_interacciones_usuario(supabase, current_user["id"])