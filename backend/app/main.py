from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import interaccion

app = FastAPI(
    title="SIMPRECIOS API",
    description="Sistema de Monitoreo de Precios en Mercados — La Paz, Bolivia",
    version="1.0.1",
)

# CORS: permite que el frontend Next.js en localhost llame al backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "https://simprecios.vercel.app"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Routers por Sprint ─────────────────────────────────────
app.include_router(interaccion.router)   # Sprint 4


@app.get("/", tags=["Health"])
def root():
    return {"status": "ok", "proyecto": "SIMPRECIOS", "version": "1.0.0"}
