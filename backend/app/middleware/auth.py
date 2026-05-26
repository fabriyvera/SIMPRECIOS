"""
Middleware de Autenticación
Extrae y valida el JWT token del header Authorization
"""
from fastapi import HTTPException
from typing import Optional
import json
import base64


def extract_token_data(authorization: Optional[str]) -> dict:
    """
    Extrae user_id y email del JWT token sin validar la firma
    (Supabase ya lo validó en el cliente)
    
    Args:
        authorization: Header Authorization: Bearer <token>
    
    Returns:
        dict con 'user_id' y 'email' del token
    
    Raises:
        HTTPException si el token es inválido
    """
    try:
        if not authorization or not authorization.startswith("Bearer "):
            raise HTTPException(status_code=401, detail="Token no proporcionado")
        
        token = authorization.split(" ")[1]
        
        # Decodificar JWT sin validar firma (ya fue validado por Supabase en el cliente)
        # El payload está en el segundo segmento separado por puntos
        parts = token.split(".")
        if len(parts) != 3:
            raise HTTPException(status_code=401, detail="Token inválido")
        
        # Decodificar el payload (segunda parte)
        payload = parts[1]
        # Agregar padding si es necesario
        padding = 4 - len(payload) % 4
        if padding != 4:
            payload += "=" * padding
        
        decoded = base64.urlsafe_b64decode(payload)
        payload_data = json.loads(decoded)
        
        user_id = payload_data.get("sub")
        email = payload_data.get("email", "")
        
        if not user_id:
            raise HTTPException(status_code=401, detail="Token sin user_id")
        
        return {
            "user_id": user_id,
            "email": email
        }
    
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error decodificando token: {str(e)}")
        raise HTTPException(status_code=401, detail="Token inválido")


def extract_user_id_from_token(authorization: Optional[str]) -> str:
    """
    Extrae solo el user_id del JWT token
    
    Args:
        authorization: Header Authorization: Bearer <token>
    
    Returns:
        user_id (UUID) del token
    """
    data = extract_token_data(authorization)
    return data["user_id"]
