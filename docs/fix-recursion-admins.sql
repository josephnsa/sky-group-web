-- Arregla "infinite recursion detected in policy for relation admins".
--
-- Causa: la política de RLS en `admins` (creada en
-- migracion-admins-por-email.sql) hace `exists (select 1 from admins
-- a2 where ...)` — esa subconsulta vuelve a leer `admins`, lo que
-- dispara la MISMA política de nuevo, y así indefinidamente. Es un
-- problema clásico de Postgres/Supabase cuando una tabla se revisa a
-- sí misma dentro de su propia política de RLS.
--
-- Solución estándar: mover el chequeo "¿sos admin?" a una función
-- `security definer` — corre con privilegios que saltan la RLS de
-- `admins` al consultarla desde ADENTRO de la función (rompe el
-- ciclo), sin abrir ningún hueco: la función solo devuelve true/false,
-- nadie puede usarla para leer filas ajenas.
--
-- Correr esto una sola vez, en el SQL Editor de Supabase (después de
-- haber corrido ya migracion-admins-por-email.sql).

create or replace function public.es_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from admins where lower(email) = lower(auth.email())
  );
$$;

drop policy if exists "admins ven la lista de admins" on admins;
create policy "admins ven la lista de admins" on admins for select
  using (public.es_admin());

drop policy if exists "admins agregan admins" on admins;
create policy "admins agregan admins" on admins for insert
  with check (public.es_admin());

drop policy if exists "admins quitan admins" on admins;
create policy "admins quitan admins" on admins for delete
  using (public.es_admin());

drop policy if exists "admins escriben categorias" on categorias;
create policy "admins escriben categorias" on categorias for all
  using (public.es_admin())
  with check (public.es_admin());

drop policy if exists "admins escriben productos" on productos;
create policy "admins escriben productos" on productos for all
  using (public.es_admin())
  with check (public.es_admin());

drop policy if exists "admins escriben carousel_slides" on carousel_slides;
create policy "admins escriben carousel_slides" on carousel_slides for all
  using (public.es_admin())
  with check (public.es_admin());

drop policy if exists "admins suben imagenes" on storage.objects;
create policy "admins suben imagenes"
  on storage.objects for insert
  with check (bucket_id = 'imagenes' and public.es_admin());

drop policy if exists "admins borran imagenes" on storage.objects;
create policy "admins borran imagenes"
  on storage.objects for delete
  using (bucket_id = 'imagenes' and public.es_admin());
