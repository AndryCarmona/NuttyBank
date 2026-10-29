"""POST /chat: conversación con Nutty, el asistente de educación financiera.

La app manda el historial de la conversación y este endpoint se lo pasa a Gemini junto con
las instrucciones de Nutty. La llave de Gemini vive solo en el servidor. Solo responde a
usuarios con sesión iniciada y limita cuántos mensajes puede mandar cada uno por minuto.
"""

import logging
import time
from collections import defaultdict, deque
from typing import Literal

import httpx
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field, field_validator

from app.auth import CurrentUser, get_current_user, get_http_client
from app.config import Settings, get_settings

logger = logging.getLogger("nuttybank.chat")
router = APIRouter(tags=["chat"])

GEMINI_URL = "https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent"
GEMINI_TIMEOUT_SECONDS = 30.0

MAX_MESSAGES = 20  # mensajes de historial que se aceptan (los demás se rechazan)
MAX_CHARS = 1000  # largo máximo de cada mensaje
RATE_LIMIT = 15  # mensajes por usuario...
RATE_WINDOW_SECONDS = 60  # ...cada minuto

SYSTEM_PROMPT = """\
Eres Nutty, una ardilla amigable que enseña educación financiera a jóvenes de México dentro de la app NuttyBank.

Cómo hablas:
- Español de México, tono cercano, claro y paciente. Si usas un término técnico, explícalo con palabras simples.
- Respuestas breves: unas 120 palabras como máximo, salvo que te pidan más detalle.
- Usa ejemplos con pesos mexicanos (MXN) y situaciones de la vida diaria de un joven.
- Texto plano, sin Markdown: nada de asteriscos, almohadillas ni tablas. Para listas usa guiones simples y pocas líneas.

De qué hablas: ahorro, presupuesto, ingresos y gastos, metas, tarjetas de débito y crédito, deudas, intereses, inflación y buenos hábitos con el dinero.

Tus límites:
- No eres asesor financiero, fiscal ni legal. No recomiendes productos, bancos, inversiones ni criptomonedas concretas, y nunca prometas rendimientos. Si te lo piden, explica los conceptos en general y sugiere hablar con un profesional.
- Puede que hables con menores de edad: nada de contenido para adultos ni temas peligrosos.
- Nunca pidas ni repitas contraseñas, NIP, CVV o números completos de tarjeta. Si el usuario los escribe, dile con amabilidad que no los comparta.
- Si la pregunta no tiene que ver con dinero o finanzas personales, redirige con cariño a esos temas.
- Si no sabes algo o no estás seguro, dilo con honestidad.
"""

BLOCKED_REPLY = (
    "Eso no es algo con lo que te pueda ayudar. Mejor cuéntame, ¿qué te gustaría "
    "aprender sobre ahorro, presupuesto o tus gastos?"
)

# Historial reciente de peticiones por usuario (en memoria: vale por instancia del servidor).
_recent: dict[str, deque[float]] = defaultdict(deque)


class ChatMessage(BaseModel):
    role: Literal["user", "assistant"]
    content: str = Field(min_length=1, max_length=MAX_CHARS)

    @field_validator("content")
    @classmethod
    def _sin_espacios_sobrantes(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("El mensaje está vacío")
        return value


class ChatRequest(BaseModel):
    messages: list[ChatMessage] = Field(min_length=1, max_length=MAX_MESSAGES)


class ChatResponse(BaseModel):
    reply: str


def _check_rate_limit(user_id: str) -> None:
    now = time.monotonic()
    window = _recent[user_id]
    while window and now - window[0] > RATE_WINDOW_SECONDS:
        window.popleft()
    if len(window) >= RATE_LIMIT:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Estás escribiendo muy rápido. Espera un momento e inténtalo de nuevo.",
        )
    window.append(now)


def _to_gemini_contents(messages: list[ChatMessage]) -> list[dict]:
    # Gemini espera que la conversación empiece con un mensaje del usuario y llama "model" a Nutty.
    while messages and messages[0].role != "user":
        messages = messages[1:]
    return [
        {"role": "user" if m.role == "user" else "model", "parts": [{"text": m.content}]}
        for m in messages
    ]


def _extract_reply(data: dict) -> str | None:
    """Saca el texto de la respuesta de Gemini; None si no hay texto aprovechable."""
    candidates = data.get("candidates") or []
    if not candidates:
        return BLOCKED_REPLY if (data.get("promptFeedback") or {}).get("blockReason") else None
    candidate = candidates[0]
    parts = (candidate.get("content") or {}).get("parts") or []
    # Los modelos con "razonamiento" pueden traer partes de pensamiento: no se muestran.
    text = "".join(p.get("text", "") for p in parts if not p.get("thought")).strip()
    if text:
        return text
    return BLOCKED_REPLY if candidate.get("finishReason") in ("SAFETY", "PROHIBITED_CONTENT", "BLOCKLIST") else None


@router.post("/chat", response_model=ChatResponse)
async def chat(
    body: ChatRequest,
    user: CurrentUser = Depends(get_current_user),
    http: httpx.AsyncClient = Depends(get_http_client),
    settings: Settings = Depends(get_settings),
) -> ChatResponse:
    if not settings.gemini_api_key:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Nutty todavía no está configurado en el servidor.",
        )

    contents = _to_gemini_contents(body.messages)
    if not contents:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail="La conversación debe incluir un mensaje tuyo.",
        )
    if body.messages[-1].role != "user":
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail="El último mensaje debe ser tuyo.",
        )

    _check_rate_limit(user.id)

    payload = {
        "systemInstruction": {"parts": [{"text": SYSTEM_PROMPT}]},
        "contents": contents,
        "generationConfig": {"maxOutputTokens": 1024, "temperature": 0.7},
        "safetySettings": [
            {"category": category, "threshold": "BLOCK_MEDIUM_AND_ABOVE"}
            for category in (
                "HARM_CATEGORY_HARASSMENT",
                "HARM_CATEGORY_HATE_SPEECH",
                "HARM_CATEGORY_SEXUALLY_EXPLICIT",
                "HARM_CATEGORY_DANGEROUS_CONTENT",
            )
        ],
    }

    try:
        response = await http.post(
            GEMINI_URL.format(model=settings.gemini_model),
            json=payload,
            headers={"x-goog-api-key": settings.gemini_api_key},
            timeout=GEMINI_TIMEOUT_SECONDS,
        )
    except httpx.TimeoutException:
        raise HTTPException(
            status_code=status.HTTP_504_GATEWAY_TIMEOUT,
            detail="Nutty tardó demasiado en responder. Inténtalo de nuevo.",
        )
    except httpx.HTTPError:
        logger.exception("No se pudo contactar a Gemini")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Nutty no está disponible por ahora.",
        )

    if response.status_code == 429:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Nutty está muy ocupado. Inténtalo de nuevo en un minuto.",
        )
    if response.status_code != 200:
        # Se registra el motivo para revisarlo en los logs de Render (sin el contenido del chat ni la llave).
        try:
            reason = response.json().get("error", {}).get("message", "")[:300]
        except ValueError:
            reason = ""
        logger.error("Gemini respondió %s con el modelo %s: %s", response.status_code, settings.gemini_model, reason)
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Nutty no está disponible por ahora.",
        )

    try:
        reply = _extract_reply(response.json())
    except ValueError:
        reply = None
    if reply is None:
        logger.error("Gemini respondió sin texto utilizable (modelo %s)", settings.gemini_model)
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Nutty no pudo responder esta vez. Inténtalo de nuevo.",
        )
    return ChatResponse(reply=reply)
