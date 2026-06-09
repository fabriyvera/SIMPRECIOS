from fastapi import APIRouter, Query, Depends, HTTPException
from typing import List, Optional
import math

from app.dependencies import get_supabase_client
from app.services.geolocation_service import calculate_distance
from app.models.stall import StallWithDistance

router = APIRouter(
    prefix="/stalls",
    tags=["Stalls"],
)

@router.get("/", response_model=List[StallWithDistance])
async def get_all_stalls(
    lat: Optional[float] = Query(None, description="Latitud del usuario para calcular y ordenar por distancia."),
    lng: Optional[float] = Query(None, description="Longitud del usuario para calcular y ordenar por distancia."),
    db=Depends(get_supabase_client),
):
    """
    Obtiene una lista de todos los puestos de venta (stalls).

    - Si se proporcionan `lat` y `lng`, calcula la distancia en KM a cada puesto y ordena la lista por cercanía.
    """
    try:
        # La consulta usa alias para mapear los nombres de la BD (español)
        # a los campos del modelo Pydantic (inglés).
        query = db.table("puestos_venta").select(
            "id, nombre_puesto, calificacion_promedio, "
            "mercado:mercados(nombre, lat:latitud, lng:longitud)"
        )
        response = query.execute()

        if not response.data:
            return []

        processed_stalls: List[StallWithDistance] = []
        for stall_data in response.data:
            stall = StallWithDistance.parse_obj(stall_data)

            # Solo calcular distancia si se provee la ubicación del usuario
            # y el puesto (a través de su mercado) tiene coordenadas válidas.
            if lat is not None and lng is not None and stall.mercado and stall.mercado.lat is not None and stall.mercado.lng is not None:
                distance = calculate_distance(lat, lng, stall.mercado.lat, stall.mercado.lng)
                stall.distancia_km = round(distance, 2)

            processed_stalls.append(stall)

        if lat is not None and lng is not None:
            # Ordenar por distancia, los que no tienen distancia van al final.
            processed_stalls.sort(key=lambda p: p.distancia_km if p.distancia_km is not None else math.inf)

        return processed_stalls
    except Exception as e:
        # Idealmente, aquí se usaría un logger en lugar de print.
        print(f"Error fetching stalls: {e}")
        raise HTTPException(status_code=500, detail="An internal server error occurred while fetching the stalls.")