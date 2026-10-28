# 🐿️ NuttyBank

App móvil de educación y gestión financiera para jóvenes en México. Combina lecciones con minijuegos, registro de gastos e ingresos por tarjeta, planes de ahorro con proyecciones y un asistente con IA (**Nutty**) que responde con los datos reales del usuario.

> Proyecto para la **Feria Mexicana de Ciencias e Ingenierías (FEMECI)** · Facultad de Ciencias de la Computación, BUAP.

## ¿Qué hace?

- **Aprende**: lecciones cortas y quizzes guiados por Nutty, con progreso por módulo.
- **Controla**: gastos e ingresos por tarjeta y categoría, saldo y gráficas.
- **Ahorra**: metas de ahorro con proyección de cuántos meses faltan para alcanzarlas.
- **Pregunta**: Nutty responde dudas sobre tus finanzas con cifras reales, no con respuestas genéricas.

## Stack

| Pieza | Función en la app |
|---|---|
| React Native + Expo (TypeScript) | Interfaz móvil para iOS y Android |
| Expo Router | Navegación entre pantallas |
| TanStack Query | Consulta y caché de datos del backend |
| Supabase Auth | Registro, login y recuperación de contraseña |
| Supabase (PostgreSQL + RLS) | Datos del usuario; cada quien solo accede a lo suyo |
| Vistas SQL | Gasto por categoría y proyecciones de ahorro |
| FastAPI (Python) | Lógica del servidor y orquestación del asistente |
| Gemini API (function calling) | Nutty: interpreta la pregunta y explica los resultados |
| Render | Hosting del backend |
| EAS Build | Generación de la app instalable |

## Estructura del repositorio

```
NuttyBank/
├── mobile/              # App React Native + Expo
├── api/                 # Backend FastAPI
├── supabase/            # Base de datos como código
│   └── migrations/      # Cambios de esquema (tablas, RLS, vistas) en SQL
├── docs/                # Plan del proyecto, mockup y decisiones
├── .gitignore
└── README.md
```

## Requisitos

- Node.js (LTS) y npm
- Python 3.11 o superior
- Cuenta de [Supabase](https://supabase.com) y [CLI de Supabase](https://supabase.com/docs/guides/cli)
- API key de [Google AI Studio](https://aistudio.google.com) (Gemini)
- Expo Go o un development build en tu teléfono

## Cómo correr el proyecto

> Las carpetas `mobile/` y `api/` se irán llenando con los primeros Pull Requests. Estos son los comandos que se usarán.

### 1. Base de datos (Supabase)

```bash
supabase login
supabase link --project-ref <ID_DEL_PROYECTO>
supabase db push        # aplica las migraciones de supabase/migrations
```

### 2. Backend (`api/`)

```bash
cd api
python -m venv .venv
source .venv/bin/activate        # Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env             # y completa los valores
uvicorn app.main:app --reload
```

Documentación interactiva en `http://localhost:8000/docs`.

### 3. App móvil (`mobile/`)

```bash
cd mobile
npm install
cp .env.example .env             # y completa los valores
npx expo start
```

## Variables de entorno

Cada carpeta tiene su `.env` (ignorado por Git) y un `.env.example` con los nombres de las variables.

**`mobile/.env.example`**

```
EXPO_PUBLIC_SUPABASE_URL=
EXPO_PUBLIC_SUPABASE_ANON_KEY=
EXPO_PUBLIC_API_URL=
```

**`api/.env.example`**: ver el archivo en `api/`.

> ⚠️ Este repositorio es **público**. Nunca subas `.env`, llaves `service_role`, la API key de Gemini ni ningún secreto. Las variables `EXPO_PUBLIC_*` viajan dentro de la app: solo van valores públicos.

## Flujo de trabajo

Trabajamos con **ramas por feature** y Pull Requests. `main` siempre debe funcionar y no se hacen commits directos a ella.

```bash
git switch main && git pull                 # 1. parte de main actualizado
git switch -c feature/registro-gastos       # 2. crea tu rama
git add . && git commit -m "feat: formulario para añadir gasto"
git push -u origin feature/registro-gastos  # 3. súbela y abre un Pull Request
```

1. Abre un Pull Request hacia `main`.
2. Otra persona del equipo lo revisa.
3. Se hace merge y se borra la rama.

**Reglas**

- Ramas cortas: una feature pequeña por rama.
- Nombres: `feature/...`, `fix/...`, `chore/...`, `docs/...`.
- Commits con [Conventional Commits](https://www.conventionalcommits.org/es/): `feat:`, `fix:`, `docs:`, `chore:`.
- Trae los cambios de `main` a tu rama antes de abrir el PR.
- Los cambios de esquema de base de datos van en PRs propios y se mergean primero.
- Evita que dos personas editen los mismos archivos al mismo tiempo.

## Equipo

| Integrante | Rol |
|---|---|
| Andry Sebastian Carmona Velasco | Líder / Full Stack |
| Marlene Beristain Ruiz | Full Stack |
| María Fernanda Flores Ramos | Full Stack |

Metodología: Scrum.

## Estado

- [ ] Estructura del monorepo
- [ ] Autenticación (registro, login, recuperar contraseña)
- [ ] Registro de gastos e ingresos
- [ ] Home con saldo y gráficas
- [ ] Lecciones y quizzes con progreso
- [ ] Asistente Nutty con datos reales
- [ ] Metas de ahorro y proyección
- [ ] Despliegue (Render + build con EAS)
