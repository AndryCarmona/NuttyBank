"""Pruebas de /me con Supabase simulado (no se hace ninguna llamada real a internet)."""

import httpx
import pytest
from fastapi.testclient import TestClient

from app.auth import get_http_client
from app.main import app

USER_ID = "7cc06446-fe78-419b-b3ce-4350b7e84ae1"
OTHER_ID = "11111111-1111-1111-1111-111111111111"


class FakeSupabase:
    """Simula los dos endpoints de Supabase que usa el backend y registra las llamadas."""

    def __init__(self):
        self.requests: list[httpx.Request] = []
        self.auth_status_for: dict[str, int] = {}  # token -> status forzado
        self.network_down = False

    def handler(self, request: httpx.Request) -> httpx.Response:
        self.requests.append(request)
        if self.network_down:
            raise httpx.ConnectError("sin red", request=request)

        token = request.headers.get("authorization", "").removeprefix("Bearer ")

        if request.url.path == "/auth/v1/user":
            forced = self.auth_status_for.get(token)
            if forced:
                return httpx.Response(forced, json={"msg": "error simulado"})
            if token == "token-bueno":
                return httpx.Response(200, json={"id": USER_ID, "email": "alice@x.com"})
            if token == "token-sin-perfil":
                return httpx.Response(200, json={"id": OTHER_ID, "email": "nuevo@x.com"})
            if token == "token-id-raro":
                return httpx.Response(200, json={"id": "no-es-un-uuid"})
            return httpx.Response(401, json={"msg": "invalid JWT"})

        if request.url.path == "/rest/v1/profiles":
            if request.url.params.get("id") == f"eq.{USER_ID}":
                return httpx.Response(
                    200,
                    json=[{"username": "alice", "phone": None, "birth_date": "2000-05-01"}],
                )
            return httpx.Response(200, json=[])

        return httpx.Response(404)


@pytest.fixture
def supabase():
    return FakeSupabase()


@pytest.fixture
def client(supabase):
    http = httpx.AsyncClient(transport=httpx.MockTransport(supabase.handler))
    app.dependency_overrides[get_http_client] = lambda: http
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()


def auth(token: str) -> dict[str, str]:
    return {"Authorization": f"Bearer {token}"}


def test_health_no_necesita_sesion(client):
    assert client.get("/health").json() == {"status": "ok"}


def test_me_sin_token_da_401(client):
    response = client.get("/me")
    assert response.status_code == 401
    assert response.headers["www-authenticate"] == "Bearer"


def test_me_con_esquema_incorrecto_da_401(client):
    assert client.get("/me", headers={"Authorization": "Basic abc"}).status_code == 401


def test_me_con_token_invalido_da_401(client):
    assert client.get("/me", headers=auth("token-falso")).status_code == 401


def test_me_con_token_expirado_403_de_supabase_da_401(client, supabase):
    supabase.auth_status_for["caducado"] = 403
    assert client.get("/me", headers=auth("caducado")).status_code == 401


def test_me_con_token_valido_devuelve_el_perfil(client):
    response = client.get("/me", headers=auth("token-bueno"))
    assert response.status_code == 200
    assert response.json() == {
        "id": USER_ID,
        "email": "alice@x.com",
        "username": "alice",
        "phone": None,
        "birth_date": "2000-05-01",
    }


def test_me_consulta_la_base_con_el_token_del_usuario(client, supabase):
    """Clave de seguridad: la consulta a profiles usa el token del usuario, así RLS aplica."""
    client.get("/me", headers=auth("token-bueno"))
    perfil = next(r for r in supabase.requests if r.url.path == "/rest/v1/profiles")
    assert perfil.headers["authorization"] == "Bearer token-bueno"
    assert perfil.headers["apikey"] == "anon-key-de-prueba"


def test_me_sin_perfil_da_404(client):
    assert client.get("/me", headers=auth("token-sin-perfil")).status_code == 404


def test_me_con_supabase_caido_da_503(client, supabase):
    supabase.network_down = True
    assert client.get("/me", headers=auth("token-bueno")).status_code == 503


def test_me_con_error_5xx_de_supabase_da_502(client, supabase):
    supabase.auth_status_for["token-bueno"] = 500
    assert client.get("/me", headers=auth("token-bueno")).status_code == 502


def test_me_con_id_que_no_es_uuid_da_502(client):
    assert client.get("/me", headers=auth("token-id-raro")).status_code == 502


def test_cors_permite_el_origen_configurado(client):
    response = client.options(
        "/me",
        headers={
            "Origin": "http://localhost:8081",
            "Access-Control-Request-Method": "GET",
            "Access-Control-Request-Headers": "authorization",
        },
    )
    assert response.status_code == 200
    assert response.headers["access-control-allow-origin"] == "http://localhost:8081"


def test_cors_rechaza_otros_origenes(client):
    response = client.options(
        "/me",
        headers={"Origin": "https://sitio-malo.com", "Access-Control-Request-Method": "GET"},
    )
    assert "access-control-allow-origin" not in response.headers
