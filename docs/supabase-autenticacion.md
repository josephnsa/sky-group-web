# Supabase + Login con Google

## Para qué se usa

- **Login con Google**: los clientes inician sesión con su cuenta de Google (sin
  crear una contraseña nueva para el sitio).
- **Carrito por cuenta**: el carrito de un cliente logueado se guarda ligado a su
  usuario (hoy vive solo en `localStorage`, se pierde si cambia de navegador/celular).
- **Panel de administración**: base para gestionar datos del negocio desde un
  panel separado, protegido por login.

## Cuentas y proyectos involucrados

| Servicio | Nombre / identificador | Dueño |
|---|---|---|
| Proyecto de Supabase | `SkyWebInformativa` | cuenta de Supabase del negocio |
| Proyecto de Google Cloud | `avid-equator-401700` | cuenta de Google del negocio |
| Cliente OAuth de Google | `Sky-group` (tipo: Aplicación web) | dentro del proyecto de Google Cloud de arriba |

## Datos de conexión (no sensibles — ya están en `.env`, ignorado por git)

- **Project URL de Supabase**: `https://qnhdbvppaxnrutsutoyn.supabase.co`
- **Publishable key (anon)**: ver `.env` → `PUBLIC_SUPABASE_ANON_KEY`. Esta clave
  está diseñada para vivir en el navegador (frontend), no es secreta.
- **Google OAuth Client ID**: `1097737812004-7v4tg8kb23fmem1hddjdteldvbnsls7u.apps.googleusercontent.com`
  (este ID no es secreto — viaja en las URLs del flujo de login, cualquiera puede
  verlo inspeccionando la red del navegador).
- **Callback URL registrada en Google Cloud**: `https://qnhdbvppaxnrutsutoyn.supabase.co/auth/v1/callback`
- **Orígenes JavaScript autorizados**: `http://localhost:4321` (agregar el dominio
  real, ej. `https://sky.com.pe`, el día que el sitio esté publicado).

## Lo que NO está en este documento ni en el repositorio (a propósito)

- **Client Secret de Google** (`GOCSPX-...`): guardado únicamente dentro de
  Supabase (Authentication → Sign In / Providers → Google). Nunca debe pegarse
  en código ni en un archivo del repo.
- **`service_role` key de Supabase**: da acceso total sin restricciones a la base
  de datos. No se usa en este proyecto (el frontend usa solo la `anon` key).
- **Contraseña de la base de datos Postgres** (la que se define al crear el
  proyecto): tampoco se usa desde el código — solo haría falta para una conexión
  directa a Postgres, que este proyecto no necesita.
- El archivo `client_secret_...json` que Google Cloud ofrece descargar: se usó
  una sola vez para copiar el Client ID/Secret a Supabase y luego se debe borrar
  de la carpeta del proyecto (no se necesita guardarlo, esos mismos datos siempre
  se pueden volver a ver/regenerar desde Google Cloud Console).

## Estado actual

- [x] Proyecto de Supabase creado
- [x] Cliente OAuth de Google creado (tipo Aplicación web)
- [x] Callback URL registrada en Google Cloud
- [x] Client ID + Client Secret pegados en Supabase → Providers → Google, proveedor activado
- [x] `@supabase/supabase-js` instalado, cliente creado en `src/lib/supabase.ts`
- [x] Botón "Iniciar sesión con Google" en el sitio (Header, `src/components/AuthButton.tsx`)
- [x] Código de persistencia del carrito ligada al usuario (`src/lib/cart-sync.ts`)
- [ ] **Pendiente: crear la tabla `carritos` en Supabase** (ver abajo) — sin esto,
      el código de sincronización falla silenciosamente porque la tabla no existe
- [ ] Panel de administración

## Crear la tabla del carrito (paso manual, una sola vez)

En el dashboard de Supabase → **SQL Editor** → pegar y ejecutar:

```sql
create table if not exists carritos (
  user_id uuid primary key references auth.users(id) on delete cascade,
  items jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table carritos enable row level security;

create policy "cada usuario ve su propio carrito"
  on carritos for select
  using (auth.uid() = user_id);

create policy "cada usuario inserta su propio carrito"
  on carritos for insert
  with check (auth.uid() = user_id);

create policy "cada usuario actualiza su propio carrito"
  on carritos for update
  using (auth.uid() = user_id);

-- Mantiene updated_at al día en cada escritura, sin tocarlo desde el código.
create or replace function actualizar_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger carritos_updated_at
  before update on carritos
  for each row execute function actualizar_updated_at();
```

Row Level Security (RLS) es lo que impide que un usuario pueda leer o escribir
el carrito de otro usuario usando la `anon` key — sin las políticas de arriba,
por defecto Supabase bloquea todo acceso a la tabla desde el frontend.

## Cómo funciona la sincronización (`src/lib/cart-sync.ts`)

- El carrito sigue viviendo en `localStorage` como hasta ahora (funciona igual
  sin estar logueado).
- Al iniciar sesión, se trae el carrito guardado en Supabase (si existe) y se
  **fusiona por cantidad máxima** con el carrito local de ese navegador — así no
  se pierden productos de ningún lado, y fusionar el mismo estado dos veces no
  duplica cantidades.
- Cualquier cambio al carrito mientras hay sesión iniciada (agregar, quitar,
  cambiar cantidad) se guarda automáticamente en Supabase.
- Sin sesión iniciada, no se escribe nada en Supabase — el carrito es 100%
  local, como siempre.

## Archivos relevantes

- `.env` — URL + anon key (no se sube a git, ver `.gitignore`)
- `src/lib/supabase.ts` — cliente de Supabase compartido por todo el sitio
- `src/components/AuthButton.tsx` — botón de login/logout en el Header
- `src/lib/cart-sync.ts` — fusión y guardado del carrito por usuario
- `src/components/CartView.tsx` — tras "Enviar pedido por WhatsApp", pregunta si
  vaciar el carrito o mantenerlo
