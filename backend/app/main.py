from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import interaccion, auth
from app.routers import prices, stock 

app = FastAPI(
    title="SIMPRECIOS API",
    description="Sistema de Monitoreo de Precios en Mercados — La Paz, Bolivia",
    version="1.0.1",
)

# CORS: permite que el frontend Next.js llame al backend desde desarrollo local, Vercel y AWS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",           # Desarrollo local
        "https://simprecios.vercel.app",   # Producción en Vercel
        "http://3.141.164.208",            # Frontend en AWS (sin puerto)
        "http://3.141.164.208:3000",       # Frontend en AWS con puerto 3000
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(prices.router, prefix="/api/prices", tags=["Precios"])
app.include_router(stock.router, prefix="/api/stock", tags=["Inventario"])
app.include_router(interaccion.router, prefix="/api")   


@app.get("/", tags=["Health"])
def root():
    return {"status": "ok", "proyecto": "SIMPRECIOS", "version": "1.0.0"}
