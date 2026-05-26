"""
Servicio de Autenticación
Obtiene información del perfil del usuario desde Supabase
"""
from fastapi import HTTPException
from supabase import Client
from app.models.user import UserProfileResponse


async def get_user_profile(user_id: str, db: Client) -> UserProfileResponse:
    """
    Obtiene el perfil del usuario autenticado de la tabla profiles.
    
    Args:
        user_id: UUID del usuario desde el JWT token
        db: Cliente de Supabase (con servicio role key para bypass RLS)
    
    Returns:
        UserProfileResponse con rol, nombre, etc.
    
    Raises:
        HTTPException 404 si el usuario no existe
    """
    try:
        # Consultar perfil del usuario
        response = db.table("profiles").select("*").eq("id", user_id).single().execute()
        
        if not response.data:
            raise HTTPException(
                status_code=404,
                detail="Perfil de usuario no encontrado"
            )
        
        profile = response.data
        
        return UserProfileResponse(
            id=profile["id"],
            nombre_completo=profile.get("nombre_completo", ""),
            rol=profile.get("rol", "Comprador"),
            es_verificado=profile.get("es_verificado", False)
        )
    
    except Exception as e:
        print(f"Error obteniendo perfil: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="Error al obtener el perfil del usuario"
        )


async def create_default_profile(user_id: str, email: str, db: Client) -> UserProfileResponse:
    """
    Crea un perfil por defecto para un usuario nuevo.
    
    Args:
        user_id: UUID del usuario
        email: Email del usuario
        db: Cliente de Supabase
    
    Returns:
        UserProfileResponse del perfil creado
    """
    try:
        new_profile = {
            "id": user_id,
            "nombre_completo": email.split("@")[0],
            "rol": "Comprador",
            "es_verificado": False,
        }
        
        response = db.table("profiles").insert(new_profile).execute()
        
        if response.data:
            return UserProfileResponse(
                id=response.data[0]["id"],
                nombre_completo=response.data[0]["nombre_completo"],
                rol=response.data[0]["rol"],
                es_verificado=response.data[0]["es_verificado"]
            )
        else:
            raise HTTPException(
                status_code=500,
                detail="Error creando perfil por defecto"
            )
    
    except Exception as e:
        print(f"Error creando perfil: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="Error al crear el perfil del usuario"
        )
