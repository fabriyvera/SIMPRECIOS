from fastapi import Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from supabase import create_client
from app.config import settings

security = HTTPBearer()

def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    token = credentials.credentials
    try:
        # Supabase valida el token por nosotros
        client = create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_KEY)
        user = client.auth.get_user(token)
        if not user or not user.user:
            raise HTTPException(status_code=401, detail="Token inválido")
        return {
            "id": user.user.id,
            "email": user.user.email,
            "role": "authenticated",
            "token": token,
        }
    except Exception as e:
        raise HTTPException(status_code=401, detail=f"No autenticado: {str(e)}")