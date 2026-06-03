from fastapi import APIRouter, Depends, Query
from supabase import Client
from app.database import get_authed_db, get_db
from app.dependencies import get_current_user
from app.models.interaccion import (
    CalificarRequest, CalificarResponse,
    VerificarPrecioRequest, VerificarPrecioResponse,
    DenunciarRequest, DenunciarResponse,
    AgregarFavoritoResponse,
    EliminarFavoritoResponse, ListaFavoritosResponse,
    ListaCalificacionesResponse,
    ListaInteraccionesResponse,
    ListaInteraccionesPuestoResponse,
)
from app.services import interaccion_service as service
from typing import Optional

router = APIRouter(prefix="/interaccion", tags=["Interacción con los Puestos"])

@router.post("/puestos/{puesto_id}/calificar", response_model=CalificarResponse)
async def calificar_puesto(
    puesto_id: str,
    data: CalificarRequest,
    current_user: dict = Depends(get_current_user)
):
    supabase = get_authed_db(current_user["token"])
    return await service.calificar_puesto(puesto_id, data, supabase, current_user["id"])

@router.post("/puestos/{puesto_id}/verificar-precio", response_model=VerificarPrecioResponse)
async def verificar_transparencia(
    puesto_id: str,
    data: VerificarPrecioRequest,
    current_user: dict = Depends(get_current_user)
):
    supabase = get_authed_db(current_user["token"])
    return await service.verificar_transparencia(puesto_id, data, supabase, current_user["id"])

@router.post("/puestos/{puesto_id}/denunciar", response_model=DenunciarResponse)
async def denunciar_sobreprecio(
    puesto_id: str,
    data: DenunciarRequest,
    current_user: dict = Depends(get_current_user)
):
    supabase = get_authed_db(current_user["token"])
    return await service.denunciar_sobreprecio(puesto_id, data, supabase, current_user["id"])

@router.post("/favoritos/{puesto_id}", response_model=AgregarFavoritoResponse)
async def agregar_favorito(
    puesto_id: str,
    current_user: dict = Depends(get_current_user)
):
    supabase = get_authed_db(current_user["token"])
    return await service.agregar_favorito(puesto_id, supabase, current_user["id"])

@router.delete("/favoritos/{puesto_id}", response_model=EliminarFavoritoResponse)
async def eliminar_favorito(
    puesto_id: str,
    current_user: dict = Depends(get_current_user)
):
    supabase = get_authed_db(current_user["token"])
    return await service.eliminar_favorito(puesto_id, supabase, current_user["id"])

@router.get("/favoritos", response_model=ListaFavoritosResponse)
async def listar_favoritos(
    current_user: dict = Depends(get_current_user)
):
    supabase = get_authed_db(current_user["token"])
    return await service.listar_favoritos(supabase, current_user["id"])

@router.get("/calificaciones", response_model=ListaCalificacionesResponse)
async def obtener_calificaciones(
    current_user: dict = Depends(get_current_user)
):
    supabase = get_authed_db(current_user["token"])
    return await service.obtener_calificaciones_usuario(supabase, current_user["id"])

@router.get("/puestos/{puesto_id}/interacciones", response_model=ListaInteraccionesPuestoResponse)
async def obtener_interacciones_puesto(
    puesto_id: int,
    limite: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    tipo: Optional[str] = Query(None, pattern="^(calificacion|denuncia)$"),
    supabase: Client = Depends(get_db),
):
    """
    Endpoint para obtener todas las interacciones (calificaciones + denuncias)
    de un puesto específico desde la vista unificada.
    
    **Parámetros de query:**
    - `limite`: Número de registros por página (default: 50, máx: 100)
    - `offset`: Para paginación (default: 0)
    - `tipo`: Filtrar por tipo de interacción ('calificacion' o 'denuncia')
    
    **Respuesta:**
    - `puesto_id`: ID del puesto
    - `total_calificaciones`: Cantidad total de calificaciones
    - `promedio_estrellas`: Promedio de calificación del puesto
    - `total_denuncias`: Cantidad total de denuncias
    - `denuncias_pendientes`: Denuncias aún no revisadas
    - `interacciones`: Array paginado de interacciones (calificaciones + denuncias)
    """
    return await service.obtener_interacciones_puesto(
        puesto_id=puesto_id,
        supabase=supabase,
        limite=limite,
        offset=offset,
        tipo_filtro=tipo,
    )


@router.get("/usuario/interacciones", response_model=ListaInteraccionesResponse)
async def obtener_mis_interacciones(
    current_user: dict = Depends(get_current_user)
):
    supabase = get_authed_db(current_user["token"])
    return await service.obtener_interacciones_usuario(supabase, current_user["id"])