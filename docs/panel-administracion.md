# Panel de administración (mantenedor)

Permite, sin tocar código: cambiar las imágenes del carrusel de Home, y agregar/editar/
borrar categorías y productos del catálogo. Usa el mismo proyecto de Supabase ya
configurado para el login (ver [supabase-autenticacion.md](supabase-autenticacion.md)).

## 1. Crear las tablas y los permisos

En el dashboard de Supabase → **SQL Editor** → pegar y correr esto **una sola vez**:

```sql
create table categorias (
  slug text primary key,
  nombre text not null,
  foto_url text,
  orden int not null default 0
);

create table productos (
  sku text primary key,
  categoria_slug text not null references categorias(slug) on delete restrict,
  subcategoria text not null,
  nombre text not null,
  marca text not null,
  precio numeric, -- opcional: la mayoría de productos se cotiza por WhatsApp, sin precio cargado
  precio_anterior numeric,
  imagen text,
  descripcion text not null,
  destacado boolean not null default false,
  compatibilidad jsonb,
  especificaciones jsonb,
  creado_en timestamptz not null default now()
);

create table carousel_slides (
  id uuid primary key default gen_random_uuid(),
  imagen_url text not null,
  titulo text,
  enlace text,
  orden int not null default 0,
  activo boolean not null default true
);

-- admins se maneja por CORREO, no por user_id — así se puede pre-autorizar
-- a alguien como admin antes de que haya iniciado sesión alguna vez (con
-- user_id era imposible, esa fila recién existe después del primer login).
-- El panel /admin/administradores permite agregar/quitar admins sin tocar
-- SQL una vez que ya existe el primer admin (ver paso 3 más abajo).
create table admins (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  creado_en timestamptz not null default now()
);

alter table categorias enable row level security;
alter table productos enable row level security;
alter table carousel_slides enable row level security;
alter table admins enable row level security;

create policy "lectura publica de categorias" on categorias for select using (true);
create policy "lectura publica de productos" on productos for select using (true);
create policy "lectura publica de carousel_slides" on carousel_slides for select using (true);

create policy "admins escriben categorias" on categorias for all
  using (exists (select 1 from admins where lower(email) = lower(auth.email())))
  with check (exists (select 1 from admins where lower(email) = lower(auth.email())));
create policy "admins escriben productos" on productos for all
  using (exists (select 1 from admins where lower(email) = lower(auth.email())))
  with check (exists (select 1 from admins where lower(email) = lower(auth.email())));
create policy "admins escriben carousel_slides" on carousel_slides for all
  using (exists (select 1 from admins where lower(email) = lower(auth.email())))
  with check (exists (select 1 from admins where lower(email) = lower(auth.email())));

create policy "admins ven la lista de admins" on admins for select
  using (exists (select 1 from admins a2 where lower(a2.email) = lower(auth.email())));
create policy "admins agregan admins" on admins for insert
  with check (exists (select 1 from admins a2 where lower(a2.email) = lower(auth.email())));
create policy "admins quitan admins" on admins for delete
  using (exists (select 1 from admins a2 where lower(a2.email) = lower(auth.email())));
```

## 2. Crear el bucket de imágenes

Dashboard → **Storage** → **New bucket**:

- Nombre: `imagenes`
- Marcar **Public bucket**: sí (para que las fotos se vean en la web sin login)

Después, en el bucket `imagenes` → **Policies** → agregar (o vía SQL Editor):

```sql
create policy "lectura publica de imagenes"
  on storage.objects for select
  using (bucket_id = 'imagenes');

create policy "admins suben imagenes"
  on storage.objects for insert
  with check (
    bucket_id = 'imagenes'
    and exists (select 1 from admins where lower(email) = lower(auth.email()))
  );

create policy "admins borran imagenes"
  on storage.objects for delete
  using (
    bucket_id = 'imagenes'
    and exists (select 1 from admins where lower(email) = lower(auth.email()))
  );
```

## 3. Marcarte como el primer administrador

Una sola vez, por SQL Editor (reemplazando el correo):

```sql
insert into admins (email) values ('TU-CORREO-DE-GOOGLE@gmail.com');
```

Cualquier admin agregado *después* de este ya no necesita SQL — se hace desde el
propio panel, en **/admin/administradores** (agregar por correo, no hace falta que esa
persona haya iniciado sesión antes; en cuanto entre con Google usando ese correo, ya
tiene acceso).

## 4. Migrar el catálogo actual (una sola vez)

El catálogo de ejemplo que ya está en `src/data/catalog.ts` (11 categorías, 25 productos)
se copia a Supabase para que el sitio no quede vacío al cambiar de fuente de datos.
Correr en el SQL Editor:

```sql
-- (ver el bloque completo en el mensaje donde se entregó este plan — 11 categorías
-- + 25 productos con sus SKU, precios, descripciones, compatibilidad y ficha técnica
-- reales tal como estaban en catalog.ts)
```

## Cómo funciona después de esto

- El sitio (`src/data/catalog.ts`) lee categorías y productos desde Supabase en vez del
  array fijo de antes — el resto del sitio (catálogo, fichas de producto, filtros, carrito)
  no cambia en nada.
- El carrusel de Home usa las filas de `carousel_slides` (además de las diapositivas
  automáticas por categoría, que siguen igual).
- `/admin` — panel protegido: sin sesión pide iniciar sesión con Google; con sesión pero
  sin fila en `admins`, avisa que no tiene acceso; siendo admin, muestra las 3 secciones.
- La seguridad real la hacen las políticas de arriba (RLS) — aunque alguien manipule el
  navegador, Supabase rechaza cualquier escritura de quien no esté en `admins`.

## Nota sobre ver los cambios en producción

Mientras el sitio corre en `npm run dev`, los cambios del admin se ven al instante
(recargando la página). El día que el sitio esté publicado (deploy real, todavía
pendiente), como es un sitio 100% estático, un cambio hecho en el panel va a necesitar
un **rebuild** del sitio para reflejarse — se resuelve con un botón "Publicar cambios
ahora" contra el deploy hook de Cloudflare Pages, mismo mecanismo ya previsto desde el
inicio del proyecto para cuando el catálogo viniera de un Google Sheet. Se arma cuando
el sitio se despliegue.
