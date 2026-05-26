"""
Router de Autenticación
Endpoints para obtener información del usuario autenticado
"""
from fastapi import APIRouter, Depends, HTTPException, Header
from typing import Optional
from app.database import get_db
from app.services.auth_service import get_user_profile, create_default_profile
from app.models.user import UserProfileResponse
from app.middleware.auth import extract_user_id_from_token, extract_token_data

router = APIRouter(prefix="/api/auth", tags=["Autenticación"])


@router.get("/profile", response_model=UserProfileResponse)
async def get_profile(
    authorization: Optional[str] = Header(None),
    db = Depends(get_db)
) -> UserProfileResponse:
    """
    Obtiene el perfil del usuario autenticado.
    
    Requiere: JWT token en header `Authorization: Bearer <token>`
    
    Retorna:
        - id: UUID del usuario
        - nombre_completo: Nombre del perfil
        - rol: 'Vendedora' o 'Comprador'
        - es_verificado: Si es verificado
    
    Ejemplos:
        - GET /api/auth/profile
        - Headers: Authorization: Bearer eyJhbGc...
    """
    try:
        # Extraer user_id del JWT token
        user_id = extract_user_id_from_token(authorization)
        
        # Obtener perfil del usuario
        profile = await get_user_profile(user_id, db)
        return profile
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error en endpoint /profile: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="Error al obtener el perfil"
        )


@router.post("/profile/create", response_model=UserProfileResponse)
async def create_profile(
    authorization: Optional[str] = Header(None),
    db = Depends(get_db)
) -> UserProfileResponse:
    """
    Crea un perfil por defecto para un usuario nuevo.
    
    Se usa cuando un usuario inicia sesión por primera vez.
    El perfil se crea con rol 'Comprador' por defecto.
    
    Requiere: JWT token en header `Authorization: Bearer <token>`
    
    Retorna:
        - Perfil creado con rol 'Comprador'
    """
    try:
        # Extraer user_id y email del JWT token
        token_data = extract_token_data(authorization)
        user_id = token_data["user_id"]
        email = token_data["email"]
        
        # Crear perfil por defecto
        profile = await create_default_profile(user_id, email, db)
        return profile
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error en endpoint /profile/create: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="Error al crear el perfil"
        )
