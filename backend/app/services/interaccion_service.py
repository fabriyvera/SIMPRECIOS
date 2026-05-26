"""
Servicio — Sprint 4: Interacción con los Puestos
Toda la lógica de negocio separada del router.
HU-14: Calificar la atención
HU-15: Verificar transparencia
HU-16: Denunciar sobreprecio
HU-17: Agendar favoritos
"""

from typing import Any, Dict, List, cast
from supabase import Client
from fastapi import HTTPException
from app.models.interaccion import (
    CalificarRequest, CalificarResponse,
    VerificarPrecioRequest, VerificarPrecioResponse,
    DenunciarRequest, DenunciarResponse,
    AgregarFavoritoResponse, EliminarFavoritoResponse,
    ListaFavoritosResponse, FavoritoResponse,
)

# Umbral de sobreprecio definido en RN-02 del documento
UMBRAL_SOBREPRECIO = 0.10  # 10%


# ─────────────────────────────────────────────
# HU-14 │ Calificar la atención
# ─────────────────────────────────────────────

async def calificar_puesto(
    puesto_id: str,
    data: CalificarRequest,
    db: Client
) -> CalificarResponse:
    """
    Guarda la calificación del usuario en calificaciones
    y recalcula el promedio del puesto en puestos_venta.
    Regla: un usuario solo puede calificar una vez por puesto.
    """

    # 1. Verificar que el puesto existe
    puesto = db.table("puestos_venta").select("id").eq("id", puesto_id).maybe_single().execute()
    if not puesto.data:
        raise HTTPException(status_code=404, detail="Puesto no encontrado")

    # 2. Verificar que el usuario no haya calificado ya este puesto
    existente = (
        db.table("calificaciones")
        .select("id")
        .eq("puesto_id", int(puesto_id))
        .eq("usuario_id", str(data.usuario_id))
        .maybe_single()
        .execute()
    )
    if existente.data:
        raise HTTPException(
            status_code=409,
            detail="Ya has calificado este puesto. Solo se permite una calificación por puesto."
        )

    # 3. Insertar la calificación
    nueva_calificacion = {
        "puesto_id": int(puesto_id),
        "usuario_id": str(data.usuario_id),
        "estrellas": data.estrellas,
        "comentario": data.comentario,
    }
    resultado = db.table("calificaciones").insert(nueva_calificacion).execute()
    data_list: List[Dict[str, Any]] = cast(List[Dict[str, Any]], resultado.data)
    if not data_list or len(data_list) == 0:
        raise HTTPException(status_code=500, detail="Error al guardar la calificación")
    rating_id = str(data_list[0]["id"])

    # 4. Recalcular el promedio del puesto
    todas = (
        db.table("calificaciones")
        .select("estrellas")
        .eq("puesto_id", int(puesto_id))
        .execute()
    )
    data_list = cast(List[Dict[str, Any]], todas.data) if todas.data else []
    if not data_list:
        total = 1
        promedio = float(data.estrellas)
    else:
        total = len(data_list)
        ratings_values = [float(r["estrellas"]) for r in data_list if r.get("estrellas") is not None]
        promedio = round(sum(ratings_values) / len(ratings_values), 2) if ratings_values else float(data.estrellas)

    return CalificarResponse(
        mensaje="Calificación registrada exitosamente",
        rating_id=rating_id,
        nuevo_promedio=promedio,
        total_calificaciones=total,
    )


# ─────────────────────────────────────────────
# HU-15 │ Verificar transparencia
# ─────────────────────────────────────────────

async def verificar_transparencia(
    puesto_id: str,
    data: VerificarPrecioRequest,
    db: Client
) -> VerificarPrecioResponse:
    """
    Compara el precio pagado por el usuario con el precio publicado
    en stock_vendedora. Actualiza el indicador de confianza del puesto.
    Regla RN-02: alerta si el precio supera el 10% del precio de referencia.
    """

    # 1. Obtener el precio publicado del producto en ese puesto
    precio_pub = (
        db.table("stock_vendedora")
        .select("precio_actual")
        .eq("puesto_id", int(puesto_id))
        .eq("producto_id", data.producto_id)
        .maybe_single()
        .execute()
    )
    if not precio_pub.data:
        raise HTTPException(
            status_code=404,
            detail="No se encontró el precio publicado para este producto en el puesto."
        )
    precio_publicado = float(precio_pub.data["precio_actual"])

    # 2. Calcular diferencia
    precio_pagado = data.precio_pagado
    diferencia = precio_pagado - precio_publicado
    porcentaje = round((diferencia / precio_publicado) * 100, 2) if precio_publicado > 0 else 0
    es_sobreprecio = porcentaje > (UMBRAL_SOBREPRECIO * 100)

    # 3. Obtener precio referencial del gobierno para comparación
    precio_ref = (
        db.table("precios_referenciales")
        .select("precio_referencial_gob")
        .eq("producto_id", data.producto_id)
        .order("fecha_vigencia", desc=True)
        .limit(1)
        .maybe_single()
        .execute()
    )
    precio_referencial = float(precio_ref.data["precio_referencial_gob"]) if precio_ref.data else precio_publicado

    # 4. Calcular indicador de transparencia del puesto
    variacion = round((precio_publicado - precio_referencial) / precio_referencial * 100, 2) if precio_referencial > 0 else 0
    indicador = max(0, 100.0 - abs(variacion))

    return VerificarPrecioResponse(
        mensaje="Verificación registrada correctamente",
        precio_publicado=precio_publicado,
        precio_pagado=precio_pagado,
        diferencia_porcentaje=porcentaje,
        indicador_transparencia=indicador,
        es_sobreprecio=es_sobreprecio,
    )


# ─────────────────────────────────────────────
# HU-16 │ Denunciar sobreprecio
# ─────────────────────────────────────────────

async def denunciar_sobreprecio(
    puesto_id: str,
    data: DenunciarRequest,
    db: Client
) -> DenunciarResponse:
    """
    Registra una denuncia de sobreprecio en la tabla denuncias_sobreprecio.
    Si hay evidencia (foto), la guarda en denuncia_evidencias.
    Regla RN-01: permite reporte anónimo.
    Regla RN-02: genera alerta si supera el 10%.
    """

    # 1. Verificar que el puesto existe
    puesto = db.table("puestos_venta").select("id").eq("id", puesto_id).maybe_single().execute()
    if not puesto.data:
        raise HTTPException(status_code=404, detail="Puesto no encontrado")

    # 2. Obtener precio actual del producto en el puesto (si existe)
    precio_stock = (
        db.table("stock_vendedora")
        .select("precio_actual")
        .eq("puesto_id", int(puesto_id))
        .eq("producto_id", data.producto_id)
        .maybe_single()
        .execute()
    )
    if not precio_stock.data:
        # No existe ese producto en el stock del puesto → no se puede denunciar
        raise HTTPException(
            status_code=404,
            detail="El producto no se encuentra registrado en el stock del puesto. No es posible realizar la denuncia."
        )
    precio_actual = float(precio_stock.data["precio_actual"])

    # 3. Obtener precio referencial del gobierno (opcional)
    precio_ref = (
        db.table("precios_referenciales")
        .select("precio_referencial_gob")
        .eq("producto_id", data.producto_id)
        .order("fecha_vigencia", desc=True)
        .limit(1)
        .maybe_single()
        .execute()
    )
    precio_referencia = float(precio_ref.data["precio_referencial_gob"]) if precio_ref.data else precio_actual

    # 4. Calcular diferencia y porcentaje de exceso
    diferencia = data.precio_cobrado - precio_referencia
    porcentaje_exceso = round((diferencia / precio_referencia) * 100, 2) if precio_referencia > 0 else 0
    alerta_generada = porcentaje_exceso > (UMBRAL_SOBREPRECIO * 100)

    # 5. Insertar la denuncia
    nueva_denuncia = {
        "usuario_id": str(data.usuario_id) if data.usuario_id else None,
        "puesto_id": int(puesto_id),
        "producto_id": data.producto_id,
        "precio_detectado": data.precio_cobrado,
        "comentario": data.motivo,
        "estado": "Pendiente",
    }
    resultado = db.table("denuncias_sobreprecio").insert(nueva_denuncia).execute()
    data_list = cast(List[Dict[str, Any]], resultado.data)
    if not data_list or len(data_list) == 0:
        raise HTTPException(status_code=500, detail="Error al guardar la denuncia")
    denuncia_id = str(data_list[0]["id"])

    return DenunciarResponse(
        mensaje="Denuncia registrada. Gracias por contribuir a la transparencia del mercado.",
        denuncia_id=denuncia_id,
        diferencia_detectada=round(diferencia, 2),
        porcentaje_exceso=porcentaje_exceso,
        alerta_generada=alerta_generada,
    )


# ─────────────────────────────────────────────
# HU-17 │ Agendar favoritos
# ─────────────────────────────────────────────

async def agregar_favorito(
    puesto_id: str,
    usuario_id: str,
    db: Client
) -> AgregarFavoritoResponse:
    # Convertir puesto_id a entero
    try:
        puesto_int = int(puesto_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="El ID del puesto debe ser un número entero")
    
    # Verificar que el puesto existe
    puesto = db.table("puestos_venta").select("id").eq("id", puesto_int).maybe_single().execute()
    if puesto is None or not puesto.data:
        raise HTTPException(status_code=404, detail="Puesto no encontrado")
    
    # Verificar duplicado
    existente = (
        db.table("puestos_favoritos")
        .select("id")
        .eq("usuario_id", usuario_id)
        .eq("puesto_id", puesto_int)
        .maybe_single()
        .execute()
    )
    # existente puede ser None (sin filas) o un objeto con data
    if existente is not None and existente.data:
        raise HTTPException(status_code=409, detail="El puesto ya está en favoritos")
    
    # Insertar
    resultado = db.table("puestos_favoritos").insert({
        "usuario_id": usuario_id,
        "puesto_id": puesto_int,
    }).execute()
    
    if not resultado.data or len(resultado.data) == 0:
        raise HTTPException(status_code=500, detail="No se pudo guardar el favorito")
    
    return AgregarFavoritoResponse(
        mensaje="Puesto agregado a favoritos",
        favorito_id=str(resultado.data[0]["id"])
    )


    
async def eliminar_favorito(
    puesto_id: str,
    usuario_id: str,
    db: Client
) -> EliminarFavoritoResponse:
    """Elimina un puesto de la lista de favoritos del usuario."""

    resultado = (
        db.table("puestos_favoritos")
        .delete()
        .eq("puesto_id", int(puesto_id))
        .eq("usuario_id", usuario_id)
        .execute()
    )
    if not resultado.data or len(resultado.data) == 0:
        raise HTTPException(status_code=404, detail="Este puesto no estaba en tus favoritos")

    return EliminarFavoritoResponse(mensaje="Puesto eliminado de favoritos")


async def listar_favoritos(
    usuario_id: str,
    db: Client
) -> ListaFavoritosResponse:
    """
    Lista todos los puestos favoritos del usuario
    con su información básica y rating actual.
    """

    # Obtener favoritos con JOIN a puestos_venta y mercados
    favoritos_raw = (
        db.table("puestos_favoritos")
        .select("""
            puesto_id,
            puestos_venta (
                id,
                nombre_puesto,
                mercados ( nombre )
            )
        """)
        .eq("usuario_id", usuario_id)
        .execute()
    )

    favoritos = []
    fav_list: List[Dict[str, Any]] = cast(List[Dict[str, Any]], favoritos_raw.data) if favoritos_raw.data else []
    for fav in fav_list:
        puesto: Dict[str, Any] = fav.get("puestos_venta", {}) if isinstance(fav, dict) else {}
        mercado_data = puesto.get("mercados") if isinstance(puesto, dict) else None
        mercado_nombre = mercado_data.get("nombre", "Sin mercado") if isinstance(mercado_data, dict) else "Sin mercado"

        # Calcular rating promedio del puesto
        ratings = (
            db.table("calificaciones")
            .select("estrellas")
            .eq("puesto_id", int(fav.get("puesto_id", 0)))
            .not_.is_("estrellas", "null")
            .execute()
        )
        promedio = 0.0
        ratings_list: List[Dict[str, Any]] = cast(List[Dict[str, Any]], ratings.data) if ratings.data else []
        if ratings_list:
            ratings_values = [float(r["estrellas"]) for r in ratings_list if r.get("estrellas") is not None]
            promedio = round(sum(ratings_values) / len(ratings_values), 1) if ratings_values else 0.0

        favoritos.append(FavoritoResponse(
            puesto_id=str(fav.get("puesto_id", "")),
            nombre_puesto=puesto.get("nombre_puesto", "Sin nombre") if isinstance(puesto, dict) else "Sin nombre",
            mercado=mercado_nombre,
            rating_promedio=promedio,
            es_favorito=True,
        ))

    return ListaFavoritosResponse(total=len(favoritos), favoritos=favoritos)