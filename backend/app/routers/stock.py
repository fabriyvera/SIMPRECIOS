# app/routers/stock.py
from fastapi import APIRouter, HTTPException
from app.database import get_db

router = APIRouter()

# ... (deja los endpoints que ya tengas escritos aquí arriba intactos)

@router.get("/markets") # Como en main.py tiene prefix="/api/stock", esto será /api/stock/markets
async def get_markets_with_stock():
    try:
        supabase = get_db()
        
        # Consulta relacional profunda a Supabase
        result = supabase.table("puestos_venta")\
            .select("""
                id,
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
        
        print(f"📊 Total de puestos: {len(result.data) if result.data else 0}")
        if result.data:
            for puesto in result.data[:2]:  # Log de los primeros 2 puestos
                stock_count = len(puesto.get("stock_vendedora", []) or [])
                print(f"   - {puesto.get('nombre_puesto')}: {stock_count} productos en stock")
            
        return result.data
    except Exception as e:
        print(f"\n🚨 Error en el GET de mercados relacionales: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/debug")
async def debug_stock():
    """Endpoint de debug para ver qué hay en las tablas"""
    try:
        supabase = get_db()
        
        # Verificar puestos_venta
        puestos = supabase.table("puestos_venta").select("id, nombre_puesto").execute()
        print(f"✅ Puestos: {len(puestos.data or [])}")
        
        # Verificar stock_vendedora
        stock = supabase.table("stock_vendedora").select("id, puesto_id, producto_id, precio_actual").execute()
        print(f"✅ Stock: {len(stock.data or [])}")
        
        # Verificar productos_mercado
        productos = supabase.table("productos_mercado").select("id, nombre_producto").execute()
        print(f"✅ Productos: {len(productos.data or [])}")
        
        return {
            "puestos_count": len(puestos.data or []),
            "stock_count": len(stock.data or []),
            "productos_count": len(productos.data or []),
            "puestos_sample": puestos.data[:2] if puestos.data else [],
            "stock_sample": stock.data[:3] if stock.data else [],
            "productos_sample": productos.data[:3] if productos.data else [],
        }
    except Exception as e:
        print(f"🚨 Error en debug: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))