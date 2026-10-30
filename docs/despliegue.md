# Despliegue del backend (Render)

El backend (`api/`) se publica en [Render](https://render.com) con el archivo `render.yaml` de la raíz.

## Primera vez
1. En Render: **New → Blueprint**, conecta el repo `NuttyBank` y elige la rama `main`.
2. Render pide los secretos (no se guardan en el repo):
   - `SUPABASE_URL`: la URL del proyecto, sin `/rest/v1/` al final.
   - `SUPABASE_ANON_KEY`: la llave pública (anon / publishable). **Nunca** la `service_role`.
3. Cuando termine el despliegue, abre `https://<tu-servicio>.onrender.com/health`: debe responder `{"status":"ok"}`.
4. En `mobile/.env` pon `EXPO_PUBLIC_API_URL=https://<tu-servicio>.onrender.com` y reinicia Expo con `npx expo start -c`.

## Cada cambio
Con `autoDeployTrigger: commit`, cada merge a `main` que toque `api/` se despliega solo.

## Plan gratuito: lo que hay que saber
- Se duerme tras 15 minutos sin tráfico y tarda cerca de 1 minuto en despertar. Para evitarlo hay dos capas
  (ver "Mantener el servidor despierto" abajo).
- 750 horas gratuitas al mes por cuenta: alcanza para un solo servicio encendido todo el mes.
- El disco es temporal: no se guardan archivos en el servidor (los datos viven en Supabase).

## Mantener el servidor despierto
`/health` no usa la base de datos ni pide sesión, así que es barato pedirlo seguido.

1. **Principal: monitor externo (UptimeRobot, gratis).** Crear cuenta en uptimerobot.com → *Add New Monitor* →
   tipo *HTTP(s)*, nombre `NuttyBank API`, URL `https://nuttybank.onrender.com/health`, intervalo **5 minutos**.
   Si el monitor llega a marcar la API como caída, avisa por correo.
2. **Respaldo: GitHub Actions** (`.github/workflows/mantener-activo.yml`). Pide `/health` cada 5 minutos y reintenta
   mientras el servidor despierta. GitHub no garantiza la hora exacta de las ejecuciones programadas (pueden
   retrasarse), y en repos públicos pausa los workflows programados tras 60 días sin actividad en el repo
   (se reactivan desde la pestaña *Actions*). Si el backend cambia de URL, se define la variable de Actions `API_URL`.

Un servicio encendido todo el mes (≈744 h) cabe en las 750 h gratuitas, pero no sobra margen para un segundo
servicio gratuito en la misma cuenta.

## Nutty (asistente con Gemini)
En Render → Environment agrega:
- `GEMINI_API_KEY`: la llave de Google AI Studio. Solo existe en el servidor; la app móvil nunca la ve.
- `GEMINI_MODEL` (opcional): si no lo pones se usa `gemini-3.5-flash-lite`. Si Google cambia o retira el
  modelo, se corrige aquí sin tocar código.

Guarda y Render reinicia el servicio. Si Nutty falla, mira **Logs** en Render: cada error de Gemini queda
registrado con su código y motivo (sin el contenido de las conversaciones ni la llave).

Cada usuario puede mandar hasta 15 mensajes por minuto.
