-- Catálogos generales en PDF, editables desde /admin/catalogos (antes eran
-- 3 archivos fijos en el código). La miniatura (`portada_url`) se genera
-- automáticamente en el navegador al subir el PDF — no hace falta crearla
-- a mano.
create table catalogos (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  descripcion text not null,
  archivo_url text not null,
  portada_url text,
  orden int not null default 0
);

alter table catalogos enable row level security;

create policy "lectura pública de catalogos" on catalogos
  for select using (true);

create policy "admins escriben catalogos" on catalogos
  for all
  using (public.es_admin())
  with check (public.es_admin());

-- Semilla con los 3 catálogos ya subidos manualmente (mismos archivos que
-- ya están en public/catalogos/), para no dejar la página vacía.
insert into catalogos (nombre, descripcion, archivo_url, portada_url, orden) values
('Accesorios', 'Accesorios tuning, decoración e interior y confort.', '/catalogos/catalogo-accesorios.pdf', '/catalogos/portada-accesorios.webp', 0),
('Equipamiento', 'Equipamiento exterior, auxilio vehicular y remolque.', '/catalogos/catalogo-equipamiento.pdf', '/catalogos/portada-equipamiento.webp', 1),
('Barras, Parrillas y Porta Equipajes', 'Línea completa de barras transversales, parrillas y porta equipajes.', '/catalogos/catalogo-barras-parrillas.pdf', '/catalogos/portada-barras-parrillas.webp', 2);
