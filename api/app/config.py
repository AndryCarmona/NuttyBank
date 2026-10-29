"""Configuración del backend, leída de variables de entorno (o del archivo api/.env)."""

from functools import lru_cache

from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    # Se ignoran las variables del .env que este módulo todavía no usa
    # (GEMINI_API_KEY, SUPABASE_SERVICE_ROLE_KEY, ...).
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    supabase_url: str
    # Llave pública (anon / publishable). La misma que va en la app móvil.
    supabase_anon_key: str
    # Orígenes permitidos por CORS, separados por coma.
    allowed_origins: str = "http://localhost:8081"
    # Asistente Nutty (Gemini). La llave NUNCA va en la app móvil: solo aquí, en el servidor.
    gemini_api_key: str = ""
    gemini_model: str = "gemini-3.5-flash-lite"

    @field_validator("gemini_api_key")
    @classmethod
    def _llave_sin_espacios(cls, value: str) -> str:
        return value.strip()

    @field_validator("gemini_model")
    @classmethod
    def _modelo_por_defecto(cls, value: str) -> str:
        # Un `GEMINI_MODEL=` vacío en el .env no debe anular el valor por defecto.
        return value.strip() or "gemini-3.5-flash-lite"

    @field_validator("supabase_url")
    @classmethod
    def _sin_diagonal_final(cls, value: str) -> str:
        return value.rstrip("/")

    @property
    def cors_origins(self) -> list[str]:
        return [o.strip() for o in self.allowed_origins.split(",") if o.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()
