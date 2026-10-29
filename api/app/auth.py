"""Reconocer al usuario a partir de su sesión de Supabase.

La app móvil inicia sesión directamente con Supabase Auth y recibe un token
(JWT). Cuando llama a este backend, lo manda en el encabezado
`Authorization: Bearer <token>`. Aquí NO validamos el token a mano: se lo
preguntamos a Supabase (`GET /auth/v1/user`). Así funciona igual sin importar
cómo firme los tokens tu proyecto y no hay que guardar ningún secreto de JWT.
"""

from dataclasses import dataclass
from uuid import UUID

import httpx
from fastapi import Depends, HTTPException, Request, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from app.config import Settings, get_settings

_bearer = HTTPBearer(auto_error=False)


def get_http_client(request: Request) -> httpx.AsyncClient:
    """Cliente HTTP compartido (se crea al arrancar la app, ver main.py)."""
    return request.app.state.http


@dataclass(frozen=True)
class CurrentUser:
    id: str
    email: str | None
    # Token del usuario: se reutiliza para consultar la base de datos
    # "como ese usuario", de modo que RLS limite los datos a los suyos.
    token: str


def _no_autenticado() -> HTTPException:
    return HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Sesión no válida o expirada",
        headers={"WWW-Authenticate": "Bearer"},
    )


async def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(_bearer),
    http: httpx.AsyncClient = Depends(get_http_client),
    settings: Settings = Depends(get_settings),
) -> CurrentUser:
    if credentials is None:
        raise _no_autenticado()

    try:
        response = await http.get(
            f"{settings.supabase_url}/auth/v1/user",
            headers={
                "apikey": settings.supabase_anon_key,
                "Authorization": f"Bearer {credentials.credentials}",
            },
        )
    except httpx.HTTPError:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="No se pudo contactar al servicio de autenticación",
        )

    if response.status_code in (401, 403):
        raise _no_autenticado()
    if response.status_code != 200:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Respuesta inesperada del servicio de autenticación",
        )

    try:
        data = response.json()
        user_id = str(UUID(data["id"]))  # valida que sea un UUID real
    except (ValueError, KeyError, TypeError):
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Respuesta inesperada del servicio de autenticación",
        )

    return CurrentUser(id=user_id, email=data.get("email"), token=credentials.credentials)
