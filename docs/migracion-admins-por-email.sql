-- Migración: la tabla `admins` pasa de manejarse por `user_id` a manejarse
-- por `email`. Motivo: con `user_id` era imposible autorizar a alguien como
-- admin antes de que existiera su fila en `auth.users` (es decir, antes de
-- que esa persona iniciara sesión con Google al menos una vez) — el panel
-- de admin no podía "invitar" a nadie, solo yo (por chat) podía correr el
-- SQL después de que la persona ya hubiera entrado una vez. Con `email` se
-- puede pre-autorizar a cualquier correo desde el propio panel, y en cuanto
-- esa persona inicia sesión con Google usando ese correo, ya tiene acceso.
--
-- Correr todo este script una sola vez, en el SQL Editor de Supabase.

-- 1) Recrear la tabla admins
drop policy if exists "un admin ve su propia fila" on admins;
drop table if exists admins cascade;

create table admins (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  creado_en timestamptz not null default now()
);

alter table admins enable row level security;

-- Cualquier admin ve la lista completa (la necesita el panel de gestión de admins).
create policy "admins ven la lista de admins" on admins for select
  using (exists (select 1 from admins a2 where lower(a2.email) = lower(auth.email())));

-- Cualquier admin puede agregar o quitar otros admins.
create policy "admins agregan admins" on admins for insert
  with check (exists (select 1 from admins a2 where lower(a2.email) = lower(auth.email())));

create policy "admins quitan admins" on admins for delete
  using (exists (select 1 from admins a2 where lower(a2.email) = lower(auth.email())));

-- 2) Alta del primer admin (vos) — reemplazá el correo si hiciera falta.
insert into admins (email) values ('salazar.atalayaj@gmail.com');

-- 3) Actualizar las políticas de escritura de categorías/productos/carrusel
-- para comparar por correo en vez de user_id.
drop policy if exists "admins escriben categorias" on categorias;
create policy "admins escriben categorias" on categorias for all
  using (exists (select 1 from admins where lower(email) = lower(auth.email())))
  with check (exists (select 1 from admins where lower(email) = lower(auth.email())));

drop policy if exists "admins escriben productos" on productos;
create policy "admins escriben productos" on productos for all
  using (exists (select 1 from admins where lower(email) = lower(auth.email())))
  with check (exists (select 1 from admins where lower(email) = lower(auth.email())));

drop policy if exists "admins escriben carousel_slides" on carousel_slides;
create policy "admins escriben carousel_slides" on carousel_slides for all
  using (exists (select 1 from admins where lower(email) = lower(auth.email())))
  with check (exists (select 1 from admins where lower(email) = lower(auth.email())));

-- 4) Actualizar las políticas de Storage (subir/borrar imágenes) del mismo modo.
drop policy if exists "admins suben imagenes" on storage.objects;
create policy "admins suben imagenes"
  on storage.objects for insert
  with check (
    bucket_id = 'imagenes'
    and exists (select 1 from admins where lower(email) = lower(auth.email()))
  );

drop policy if exists "admins borran imagenes" on storage.objects;
create policy "admins borran imagenes"
  on storage.objects for delete
  using (
    bucket_id = 'imagenes'
    and exists (select 1 from admins where lower(email) = lower(auth.email()))
  );
