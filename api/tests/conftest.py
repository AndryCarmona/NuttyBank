import os

# Variables mínimas para que Settings cargue sin necesitar un .env real.
os.environ.setdefault("SUPABASE_URL", "https://proyecto-de-prueba.supabase.co")
os.environ.setdefault("SUPABASE_ANON_KEY", "anon-key-de-prueba")
os.environ.setdefault("ALLOWED_ORIGINS", "http://localhost:8081")
