from contextlib import asynccontextmanager

import httpx
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import get_settings
from app.routers import me


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Un solo cliente HTTP para toda la app (reutiliza conexiones).
    async with httpx.AsyncClient(timeout=httpx.Timeout(5.0)) as client:
        app.state.http = client
        yield


def create_app() -> FastAPI:
    settings = get_settings()
    app = FastAPI(title="NuttyBank API", lifespan=lifespan)

    # La autenticación va por encabezado Bearer (no por cookies), así que no se
    # permiten credenciales de navegador.
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,
        allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE"],
        allow_headers=["Authorization", "Content-Type"],
    )

    @app.get("/health")
    def health():
        return {"status": "ok"}

    app.include_router(me.router)
    return app


app = create_app()
