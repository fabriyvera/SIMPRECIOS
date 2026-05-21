# app/routers/prices.py
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from app.database import get_db

router = APIRouter()

class PriceUpdatePayload(BaseModel):
    puesto_id: int
    producto_id: int
    precio_actual: float
    nombre_producto: str

@router.put("/update")
async def update_or_insert_price(payload: PriceUpdatePayload):
    try:
        supabase = get_db()
        
        # 🎯 CASO 1: SI EL ID ES 0, ES UN PRODUCTO NUEVO -> INSERT RELACIONAL
        if payload.producto_id == 0:
            # A. Insertamos en el catálogo maestro usando la columna real 'subcategoria_id'
            nuevo_prod = supabase.table("productos_mercado").insert({
                "nombre_producto": payload.nombre_producto,
                "subcategoria_id": 3,  # 🌟 Sincronizado con el ID 3 de tu captura (Verduras/Hortalizas)
                "unidad_medida": "kg"   # Añadimos la unidad por defecto que se ve en tu tabla
            }).execute()
            
            # Validamos que Supabase haya devuelto los datos del nuevo registro
            if not nuevo_prod.data:
                raise HTTPException(status_code=500, detail="No se pudo crear el producto maestro en Supabase")
                
            nuevo_id_maestro = nuevo_prod.data[0]["id"]
            
            # B. Enlazamos el nuevo ID maestro con el stock y precio de la vendedora
            resultado = supabase.table("stock_vendedora").insert({
                "puesto_id": payload.puesto_id,
                "producto_id": nuevo_id_maestro,
                "precio_actual": payload.precio_actual,
                "disponible": True
            }).execute()
            
            return {
                "status": "success", 
                "message": "Producto registrado y enlazado correctamente en Supabase", 
                "producto_id": nuevo_id_maestro
            }
            
        # 🎯 CASO 2: SI EL ID YA EXISTE -> HACEMOS EL UPDATE QUE YA FUNCIONA
        else:
            resultado = supabase.table("stock_vendedora").update({
                "precio_actual": payload.precio_actual
            }).eq("puesto_id", payload.puesto_id).eq("producto_id", payload.producto_id).execute()
            
            return {
                "status": "success", 
                "message": "Precio actualizado correctamente", 
                "producto_id": payload.producto_id
            }
            
    except Exception as e:
        print(f"🚨 Error interno en la base de datos: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))