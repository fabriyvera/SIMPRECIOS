from supabase import create_client, Client
from app.config import settings

def get_db() -> Client:
    # Service key: bypasea RLS, el backend controla el acceso
    return create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_KEY)