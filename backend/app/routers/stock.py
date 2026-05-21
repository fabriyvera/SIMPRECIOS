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
            .select("id, nombre_puesto, stock_vendedora(precio_actual, disponible, productos_mercado(id, nombre_producto))")\
            .execute()
            
        return result.data
    except Exception as e:
        print(f"\n🚨 Error en el GET de mercados relacionales: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))