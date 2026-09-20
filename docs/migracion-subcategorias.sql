-- Convierte "subcategoría" de texto libre en `productos` (riesgo real de
-- typos creando duplicados invisibles, ej. "Faros LED" vs "Faros Led") a una
-- tabla real por categoría, mismo patrón que `categorias`. El campo
-- `productos.subcategoria` sigue siendo texto (no se migra a una relación
-- por id, para no tocar ni arriesgar los productos ya cargados) — esta
-- tabla nueva sirve para que el panel de admin ofrezca un desplegable con
-- las subcategorías reales de cada categoría en vez de un campo libre.
create table subcategorias (
  id uuid primary key default gen_random_uuid(),
  categoria_slug text not null references categorias(slug) on delete cascade,
  nombre text not null,
  orden int not null default 0,
  unique (categoria_slug, nombre)
);

alter table subcategorias enable row level security;

create policy "lectura pública de subcategorias" on subcategorias
  for select using (true);

create policy "admins escriben subcategorias" on subcategorias
  for all
  using (public.es_admin())
  with check (public.es_admin());

-- Seed: las 30 subcategorías reales que ya usan los productos actuales, para
-- que el desplegable del admin arranque completo en vez de vacío.
insert into subcategorias (categoria_slug, nombre, orden) values
('iluminacion', 'Faros LED', 0),
('iluminacion', 'Barras LED', 1),
('iluminacion', 'Accesorios de Iluminación', 2),
('iluminacion', 'Iluminación Decorativa', 3),
('accesorios-tuning-y-decoracion', 'Extintor Deportivo', 0),
('accesorios-tuning-y-decoracion', 'Llaveros', 1),
('accesorios-tuning-y-decoracion', 'Porta Placas', 2),
('auxilio-vehicular', 'Cables para Batería', 0),
('auxilio-vehicular', 'Compresora de Aire', 1),
('auxilio-vehicular', 'Gata Hidráulica', 2),
('auxilio-vehicular', 'Kit de Emergencia', 3),
('remolque', 'Bola de Remolque', 0),
('remolque', 'Correa de Remolque', 1),
('remolque', 'Faja de Remolque', 2),
('mantenimiento-y-herramientas', 'Pulidor Recargable', 0),
('mantenimiento-y-herramientas', 'Pistola de Limpieza', 1),
('mantenimiento-y-herramientas', 'Cinta Adhesiva', 2),
('mantenimiento-y-herramientas', 'Cinta Antideslizante', 3),
('equipamiento-exterior', 'Barras Transversales', 0),
('equipamiento-exterior', 'Parrillas', 1),
('equipamiento-exterior', 'Porta Bicicletas', 2),
('para-trabajo-y-negocio', 'Carrito Porta Herramientas', 0),
('para-trabajo-y-negocio', 'Lámpara de Trabajo', 1),
('molduras-y-protectores', 'Protectores de Pisadera', 0),
('molduras-y-protectores', 'Topes de Puerta', 1),
('seguros', 'Seguro de Ruedas', 0),
('seguros', 'Tuercas de Aluminio', 1),
('interior-y-confort', 'Forros de Timón', 0),
('interior-y-confort', 'Cobertores', 1),
('interior-y-confort', 'Respaldares Ergonómicos', 2);
