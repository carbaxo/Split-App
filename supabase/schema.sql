-- =============================================================================
-- Split App — esquema inicial de Supabase
-- Ejecútalo en: Supabase Dashboard -> SQL Editor -> New query -> Run
-- =============================================================================

-- Tabla de ejemplo para validar el guardado de datos por usuario.
-- Cuando definamos el modelo real de la app (gastos, grupos, etc.),
-- sustituiremos / ampliaremos esto.
create table if not exists public.items (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users (id) on delete cascade,
  title       text not null,
  created_at  timestamptz not null default now()
);

-- Índice para consultar rápido por usuario.
create index if not exists items_user_id_idx on public.items (user_id);

-- -----------------------------------------------------------------------------
-- Row Level Security: cada usuario solo ve y modifica SUS propios datos.
-- -----------------------------------------------------------------------------
alter table public.items enable row level security;

drop policy if exists "items_select_own" on public.items;
create policy "items_select_own"
  on public.items for select
  using (auth.uid() = user_id);

drop policy if exists "items_insert_own" on public.items;
create policy "items_insert_own"
  on public.items for insert
  with check (auth.uid() = user_id);

drop policy if exists "items_update_own" on public.items;
create policy "items_update_own"
  on public.items for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "items_delete_own" on public.items;
create policy "items_delete_own"
  on public.items for delete
  using (auth.uid() = user_id);
