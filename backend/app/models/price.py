from pydantic import BaseModel

class PriceUpdateDTO(BaseModel):
    puesto_id: int
    producto_id: int
    precio_actual: float