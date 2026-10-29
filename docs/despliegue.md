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
- Se duerme tras 15 minutos sin tráfico y tarda cerca de 1 minuto en despertar. Para evitarlo, un monitor externo
  (por ejemplo UptimeRobot o cron-job.org) que pida `/health` cada 5-10 minutos lo mantiene despierto.
- 750 horas gratuitas al mes por cuenta: alcanza para un solo servicio encendido todo el mes.
- El disco es temporal: no se guardan archivos en el servidor (los datos viven en Supabase).

## Variables que se agregarán después
`GEMINI_API_KEY` y `GEMINI_MODEL` (asistente Nutty). Se agregan a mano en Render → Environment.
