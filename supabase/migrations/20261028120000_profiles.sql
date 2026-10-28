-- ============================================================================
-- NuttyBank · Perfiles de usuario (base del login)
-- ============================================================================
-- Supabase Auth guarda correo y contraseña en auth.users. Esta tabla guarda los
-- datos propios de la app, uno por usuario, y se crea sola al registrarse.
-- ============================================================================

-- ---------- Utilidad: mantener updated_at -----------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------- Tabla de perfiles ----------------------------------------------
create table public.profiles (
  -- Mismo id que el usuario de Auth (relación 1 a 1). Si se borra la cuenta,
  -- se borra el perfil en cascada.
  id          uuid primary key references auth.users (id) on delete cascade,
  username    text not null check (char_length(username) between 3 and 30),
  phone       text check (char_length(phone) <= 20),
  birth_date  date check (birth_date <= current_date),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- No pueden existir "Marlene" y "marlene" a la vez.
create unique index profiles_username_lower_key on public.profiles (lower(username));

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- ---------- Seguridad (RLS) -------------------------------------------------
-- Cada usuario solo ve y edita SU perfil. No hay política de INSERT ni DELETE
-- para el cliente: el perfil nace del trigger de abajo y se borra con la cuenta.
-- (select auth.uid()) se evalúa una vez por consulta, no una vez por fila.
alter table public.profiles enable row level security;

create policy "profiles: select propio" on public.profiles
  for select to authenticated
  using (id = (select auth.uid()));

create policy "profiles: update propio" on public.profiles
  for update to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

-- ---------- Alta automática del perfil al registrarse -----------------------
-- Se ejecuta cada vez que se crea un usuario en auth.users. Toma username,
-- phone y birth_date de raw_user_meta_data (lo que la app envía en
-- supabase.auth.signUp({ options: { data: {...} } })).
-- El registro NUNCA debe fallar por un dato opcional mal formado, por eso los
-- valores dudosos se descartan en lugar de lanzar error.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer          -- corre con permisos del dueño para poder insertar en profiles
set search_path = ''
as $$
declare
  v_username text;
  v_birth    date;
begin
  -- Usuario: el que mande la app o, si no hay, lo que va antes del @ del correo.
  v_username := left(
    coalesce(
      nullif(trim(new.raw_user_meta_data ->> 'username'), ''),
      split_part(coalesce(new.email, ''), '@', 1)
    ),
    24
  );

  -- Si es muy corto o ya está tomado, se le agrega un sufijo derivado del id.
  if char_length(v_username) < 3
     or exists (select 1 from public.profiles p where lower(p.username) = lower(v_username)) then
    v_username := left(v_username, 20) || '_' || substr(replace(new.id::text, '-', ''), 1, 6);
  end if;

  -- Fecha de nacimiento: si no es una fecha válida (o es futura), se ignora.
  begin
    v_birth := nullif(new.raw_user_meta_data ->> 'birth_date', '')::date;
    if v_birth > current_date then v_birth := null; end if;
  exception when others then
    v_birth := null;
  end;

  insert into public.profiles (id, username, phone, birth_date)
  values (
    new.id,
    v_username,
    left(nullif(trim(new.raw_user_meta_data ->> 'phone'), ''), 20),
    v_birth
  );

  return new;
end;
$$;

-- Solo la debe disparar el trigger; nadie puede llamarla por la API.
revoke execute on function public.handle_new_user() from public, anon, authenticated;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();