"""Pruebas de POST /chat con Supabase y Gemini simulados (no se llama a internet)."""

import json

import httpx
import pytest
from fastapi.testclient import TestClient

from app.auth import get_http_client
from app.config import Settings, get_settings
from app.main import app
from app.routers import chat as chat_module

USER_ID = "7cc06446-fe78-419b-b3ce-4350b7e84ae1"
OTRO_ID = "11111111-1111-1111-1111-111111111111"
LLAVE = "llave-secreta-de-prueba"


def settings_con(llave: str = LLAVE, modelo: str = "modelo-de-prueba") -> Settings:
    return Settings(
        supabase_url="https://proyecto-de-prueba.supabase.co",
        supabase_anon_key="anon-key-de-prueba",
        gemini_api_key=llave,
        gemini_model=modelo,
    )


class FakeGoogle:
    """Simula Supabase (solo la validación de sesión) y Gemini, y registra las llamadas a Gemini."""

    def __init__(self):
        self.gemini_calls: list[httpx.Request] = []
        self.gemini_status = 200
        self.gemini_json: dict = {"candidates": [{"content": {"parts": [{"text": "¡Hola! Soy Nutty."}]}}]}
        self.gemini_error: Exception | None = None

    def handler(self, request: httpx.Request) -> httpx.Response:
        if request.url.path == "/auth/v1/user":
            token = request.headers.get("authorization", "").removeprefix("Bearer ")
            if token == "token-bueno":
                return httpx.Response(200, json={"id": USER_ID, "email": "alice@x.com"})
            if token == "token-otro":
                return httpx.Response(200, json={"id": OTRO_ID, "email": "bob@x.com"})
            return httpx.Response(401, json={"msg": "invalid JWT"})

        if request.url.host == "generativelanguage.googleapis.com":
            self.gemini_calls.append(request)
            if self.gemini_error:
                raise self.gemini_error
            return httpx.Response(self.gemini_status, json=self.gemini_json)

        return httpx.Response(404)

    @property
    def sent(self) -> dict:
        return json.loads(self.gemini_calls[-1].content)


@pytest.fixture(autouse=True)
def limpiar_limite():
    chat_module._recent.clear()
    yield
    chat_module._recent.clear()


@pytest.fixture
def google():
    return FakeGoogle()


@pytest.fixture
def client(google):
    http = httpx.AsyncClient(transport=httpx.MockTransport(google.handler))
    app.dependency_overrides[get_http_client] = lambda: http
    app.dependency_overrides[get_settings] = settings_con
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()


def auth(token: str = "token-bueno") -> dict[str, str]:
    return {"Authorization": f"Bearer {token}"}


def pregunta(texto: str = "¿Cómo empiezo a ahorrar?") -> dict:
    return {"messages": [{"role": "user", "content": texto}]}


def test_sin_sesion_da_401_y_no_llama_a_gemini(client, google):
    assert client.post("/chat", json=pregunta()).status_code == 401
    assert client.post("/chat", json=pregunta(), headers=auth("token-malo")).status_code == 401
    assert google.gemini_calls == []


def test_responde_con_el_texto_de_gemini(client, google):
    response = client.post("/chat", json=pregunta(), headers=auth())
    assert response.status_code == 200
    assert response.json() == {"reply": "¡Hola! Soy Nutty."}


def test_manda_a_gemini_el_modelo_la_llave_y_las_instrucciones_de_nutty(client, google):
    client.post("/chat", json=pregunta(), headers=auth())
    request = google.gemini_calls[-1]
    assert request.url.path == "/v1beta/models/modelo-de-prueba:generateContent"
    assert request.headers["x-goog-api-key"] == LLAVE
    assert LLAVE not in str(request.url)  # la llave va en el encabezado, no en la URL
    sent = google.sent
    assert "Nutty" in sent["systemInstruction"]["parts"][0]["text"]
    assert sent["generationConfig"]["maxOutputTokens"] > 0
    assert {s["category"] for s in sent["safetySettings"]} >= {"HARM_CATEGORY_DANGEROUS_CONTENT"}


def test_traduce_el_historial_a_los_roles_de_gemini(client, google):
    body = {
        "messages": [
            {"role": "assistant", "content": "¡Hola! Soy Nutty."},  # saludo inicial: se descarta
            {"role": "user", "content": "¿Qué es el interés?"},
            {"role": "assistant", "content": "Es el costo de usar dinero."},
            {"role": "user", "content": "Dame un ejemplo."},
        ]
    }
    assert client.post("/chat", json=body, headers=auth()).status_code == 200
    contents = google.sent["contents"]
    assert [c["role"] for c in contents] == ["user", "model", "user"]
    assert contents[0]["parts"][0]["text"] == "¿Qué es el interés?"


def test_no_manda_a_gemini_datos_del_usuario_fuera_del_chat(client, google):
    client.post("/chat", json=pregunta("Hola"), headers=auth())
    enviado = google.gemini_calls[-1].content.decode()
    assert "alice@x.com" not in enviado and USER_ID not in enviado and "token-bueno" not in enviado


def test_sin_llave_configurada_da_503(client, google):
    app.dependency_overrides[get_settings] = lambda: settings_con(llave="")
    response = client.post("/chat", json=pregunta(), headers=auth())
    assert response.status_code == 503
    assert google.gemini_calls == []


@pytest.mark.parametrize(
    "body",
    [
        {"messages": []},
        {"messages": [{"role": "user", "content": ""}]},
        {"messages": [{"role": "user", "content": "   "}]},
        {"messages": [{"role": "user", "content": "x" * 1001}]},
        {"messages": [{"role": "sistema", "content": "hola"}]},
        {"messages": [{"role": "user", "content": "hola"}] * 21},
        {},
    ],
)
def test_peticiones_invalidas_dan_422_sin_llamar_a_gemini(client, google, body):
    assert client.post("/chat", json=body, headers=auth()).status_code == 422
    assert google.gemini_calls == []


def test_el_ultimo_mensaje_debe_ser_del_usuario(client, google):
    body = {"messages": [{"role": "user", "content": "hola"}, {"role": "assistant", "content": "hola"}]}
    assert client.post("/chat", json=body, headers=auth()).status_code == 422
    solo_nutty = {"messages": [{"role": "assistant", "content": "hola"}]}
    assert client.post("/chat", json=solo_nutty, headers=auth()).status_code == 422
    assert google.gemini_calls == []


@pytest.mark.parametrize("codigo_gemini, esperado", [(400, 502), (403, 502), (404, 502), (500, 502), (429, 503)])
def test_errores_de_gemini_no_filtran_detalles(client, google, codigo_gemini, esperado):
    google.gemini_status = codigo_gemini
    google.gemini_json = {"error": {"message": f"API key not valid: {LLAVE}"}}
    response = client.post("/chat", json=pregunta(), headers=auth())
    assert response.status_code == esperado
    assert LLAVE not in response.text and "API key" not in response.text


def test_tiempo_agotado_da_504(client, google):
    google.gemini_error = httpx.ReadTimeout("lento")
    assert client.post("/chat", json=pregunta(), headers=auth()).status_code == 504


def test_red_caida_da_503(client, google):
    google.gemini_error = httpx.ConnectError("sin red")
    assert client.post("/chat", json=pregunta(), headers=auth()).status_code == 503


def test_pregunta_bloqueada_por_seguridad_recibe_una_respuesta_amable(client, google):
    google.gemini_json = {"promptFeedback": {"blockReason": "SAFETY"}}
    response = client.post("/chat", json=pregunta(), headers=auth())
    assert response.status_code == 200
    assert response.json()["reply"] == chat_module.BLOCKED_REPLY


def test_respuesta_sin_texto_da_502(client, google):
    google.gemini_json = {"candidates": [{"content": {"parts": []}, "finishReason": "OTHER"}]}
    assert client.post("/chat", json=pregunta(), headers=auth()).status_code == 502


def test_ignora_las_partes_de_pensamiento_del_modelo(client, google):
    google.gemini_json = {
        "candidates": [
            {"content": {"parts": [{"text": "razonamiento interno", "thought": True}, {"text": "Ahorra el 10%."}]}}
        ]
    }
    assert client.post("/chat", json=pregunta(), headers=auth()).json() == {"reply": "Ahorra el 10%."}


def test_limite_de_mensajes_por_minuto_es_por_usuario(client, google):
    for _ in range(chat_module.RATE_LIMIT):
        assert client.post("/chat", json=pregunta(), headers=auth()).status_code == 200
    excedido = client.post("/chat", json=pregunta(), headers=auth())
    assert excedido.status_code == 429
    assert len(google.gemini_calls) == chat_module.RATE_LIMIT  # el excedente no llegó a Gemini
    # Otro usuario no se ve afectado.
    assert client.post("/chat", json=pregunta(), headers=auth("token-otro")).status_code == 200


def test_modelo_vacio_en_el_env_usa_el_modelo_por_defecto():
    s = Settings(supabase_url="https://x.supabase.co", supabase_anon_key="a", gemini_model="  ")
    assert s.gemini_model == "gemini-3.5-flash-lite"
