from fastapi import APIRouter, HTTPException
from app.database import get_db

router = APIRouter()

@router.get("/markets")
async def get_markets_with_stock():
    try:
        supabase = get_db()
        result = supabase.table("puestos_venta")\
            .select("""
                id,
                vendedora_id,
                nombre_puesto,
                sector,
                nro_puesto,
                calificacion_promedio,
                esta_abierto,
                mercados (
                    nombre,
                    direccion,
                    latitud,
                    longitud
                ),
                stock_vendedora (
                    precio_actual,
                    disponible,
                    productos_mercado (
                        id,
                        nombre_producto,
                        unidad_medida
                    )
                )
            """)\
            .execute()
        
        print(f"Total de puestos: {len(result.data) if result.data else 0}")
        if result.data:
            for puesto in result.data[:2]:
                if isinstance(puesto, dict):
                    stock_vendedora = puesto.get("stock_vendedora", [])
                    stock_count = len(stock_vendedora) if isinstance(stock_vendedora, list) else 0
                    nombre_puesto = puesto.get('nombre_puesto', 'N/A')
                    print(f"   - {nombre_puesto}: {stock_count} productos en stock")
            
        return result.data
    except Exception as e:
        print(f"\nError en el GET de mercados relacionales: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))