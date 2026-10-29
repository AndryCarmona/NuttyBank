"""GET /me: devuelve el perfil del usuario con sesión iniciada."""

from datetime import date

import httpx
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel

from app.auth import CurrentUser, get_current_user, get_http_client
from app.config import Settings, get_settings

router = APIRouter(tags=["me"])


class MeResponse(BaseModel):
    id: str
    email: str | None
    username: str
    phone: str | None
    birth_date: date | None


@router.get("/me", response_model=MeResponse)
async def read_me(
    user: CurrentUser = Depends(get_current_user),
    http: httpx.AsyncClient = Depends(get_http_client),
    settings: Settings = Depends(get_settings),
) -> MeResponse:
    # La consulta usa el token DEL USUARIO (no la llave de servicio): la base de
    # datos aplica RLS y solo puede devolver su propio perfil.
    try:
        response = await http.get(
            f"{settings.supabase_url}/rest/v1/profiles",
            params={
                "select": "username,phone,birth_date",
                "id": f"eq.{user.id}",
                "limit": "1",
            },
            headers={
                "apikey": settings.supabase_anon_key,
                "Authorization": f"Bearer {user.token}",
            },
        )
    except httpx.HTTPError:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="No se pudo contactar a la base de datos",
        )

    if response.status_code != 200:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Respuesta inesperada de la base de datos",
        )

    rows = response.json()
    if not rows:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Perfil no encontrado")

    return MeResponse(id=user.id, email=user.email, **rows[0])
