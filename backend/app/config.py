from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    SUPABASE_URL: str
    SUPABASE_SERVICE_KEY: str   # Service role key (bypass RLS) — solo en backend

    class Config:
        env_file = ".env"


settings = Settings()
