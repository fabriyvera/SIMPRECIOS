from supabase import create_client, Client
from app.config import settings

def get_db() -> Client:
    return create_client(settings.SUPABASE_URL, settings.SUPABASE_ANON_KEY)

def get_authed_db(token: str) -> Client:
    client = create_client(settings.SUPABASE_URL, settings.SUPABASE_ANON_KEY)
    client.auth.set_session(access_token=token, refresh_token="")
    return client