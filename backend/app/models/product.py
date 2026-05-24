from pydantic import BaseModel

class StockToggleDTO(BaseModel):
    puesto_id: int
    producto_id: int
    disponible: bool