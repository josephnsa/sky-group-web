-- Libro de Reclamaciones Virtual: registro de reclamos en Supabase, en vez
-- del backend por Google Apps Script planteado originalmente. La ley
-- peruana (Ley N° 29571, D.S. N° 011-2011-PCM) exige que el reclamo quede
-- registrado y que se le entregue un código de seguimiento al cliente al
-- instante — no exige ningún medio de almacenamiento específico ni que se
-- avise a ninguna entidad (INDECOPI solo interviene después, y por
-- iniciativa propia del cliente si no queda conforme con la respuesta).
--
-- Correr esto una sola vez, en el SQL Editor de Supabase.

create table reclamos (
  id uuid primary key default gen_random_uuid(),
  -- Generado del lado del cliente antes de insertar (no por la base de
  -- datos) — así el formulario puede mostrarle el código al cliente de
  -- inmediato sin necesitar leer de vuelta la fila recién creada (un
  -- usuario anónimo no tiene permiso de SELECT sobre reclamos ajenos).
  codigo text not null unique,
  tipo text not null,                 -- 'reclamo' | 'queja'
  nombre text not null,
  documento text not null,
  domicilio text not null,
  telefono text not null,
  correo text not null,
  apoderado text,                     -- solo si el consumidor es menor de edad
  tipo_bien text not null,            -- 'producto' | 'servicio'
  descripcion_bien text not null,
  monto numeric,
  detalle text not null,
  pedido text not null,               -- qué pide el consumidor como solución
  estado text not null default 'pendiente', -- 'pendiente' | 'atendido', lo cambia el admin
  creado_en timestamptz not null default now()
);

alter table reclamos enable row level security;

-- Cualquier visitante puede registrar un reclamo — es un formulario
-- público del sitio, no requiere haber iniciado sesión.
create policy "cualquiera registra un reclamo" on reclamos for insert
  with check (true);

-- Solo un admin puede ver la lista completa (privacidad: un cliente no
-- debería poder leer los reclamos de otros clientes).
create policy "admins ven los reclamos" on reclamos for select
  using (public.es_admin());

-- Solo un admin puede cambiar el estado (marcar como atendido).
create policy "admins actualizan reclamos" on reclamos for update
  using (public.es_admin())
  with check (public.es_admin());
